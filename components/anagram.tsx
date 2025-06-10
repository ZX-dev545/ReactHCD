import { correctColour, darkForeColour, incorrectColour } from '@/constants/Colors';
import { UserProfile } from '@/types/userProfile';
import { castJSONToUserProfile } from '@/utils/profileUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import AnagramSvg from '../assets/svg/game/anagram.svg';
import CorrectIcon from '../assets/svg/game/guess-correct-icon.svg';
import IncorrectIcon from '../assets/svg/game/guess-incorrect-icon.svg';
import NullIcon from '../assets/svg/game/guess-null-icon.svg';


export default function Anagram({ onComplete }: { onComplete: () => void }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const answer = "Horniman Gardens, London, UK";
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  function setInputDebug(input: string) {
    console.log('Debug input set:', input);
    setInput(input);
    if (input.trim()) {
      checkLocation(input);
    } else {
      setResult(null);
    }
  }

  useEffect(() => {
    AsyncStorage.getItem('currentUser').then(json => {
      if (json) {
        const parsed = castJSONToUserProfile(JSON.parse(json));
        if (parsed) setCurrentUser(parsed);
      }
    });

  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      if (input.trim()) {
        checkLocation();
      }
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [input, currentUser]);

  // OpenAI location check
  async function checkLocation(guess?: string) {
    setLoading(true);
    setResult(null);
    try {
      const prompt = `Is the following guess trying to describe the correct place? Bear in mind that the person is in ${currentUser?.city},
       and they don't necessarily know the exact location, but they are trying to guess it. It is only correct if it is roughly less than a minutes walk from the exact location.
       Be mindful the the user may make spelling/pronunciation errors, in this case the user is still correct.
       You must begin your replay with "yes" or "no", and followed by your reasoning as to why the location isn't close enough or if the location is even real. 
       Do not use unnecessary whitespace. Only use simple sentences. Keep it concise. You have 30 tokens to reply.
      \n\nLocation guessed: ${guess ?? input}\nCorrect Location: ${answer}`;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer KEY', // <-- Replace with your API key
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 30,//30 for debugging, 3 for production
        }),
      });
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim().toLowerCase();
      //replace any mention of the answer with 'the correct location'
      let replacedReply = reply;
      if (reply) {
        const regex = new RegExp("sydenham hill wood", 'gi');
        replacedReply = reply.replace(regex, '<answer>');
      }
      console.log('input:', guess ?? input);
      console.log('OpenAI reply (replaced):', replacedReply);
      if (replacedReply?.startsWith('yes')) {
        setResult('Correct!');
        onComplete();
      } else if (replacedReply?.startsWith('no')) setResult(replacedReply);
      else setResult('Could not determine.');
    } catch (e) {
      setResult('Error checking location.');
    }
    setLoading(false);
  }

  return (
    <>
      <View style={{ position: 'absolute', top: 100, width: '100%', zIndex: 0 }}>
        <AnagramSvg width='100%' preserveAspectRatio='MidXMidY' />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={-80}
        style={{ flex: 1, zIndex: 1 }}
      >
        <View style={styles.entrySection}>
          <Text style={{
            position: 'absolute',
            bottom: 70,
            alignSelf: 'center',
            fontSize: 24,
            fontWeight: 'bold',
            color: keyboardVisible ? darkForeColour : 'white',
            textAlign: 'center',
            fontFamily: 'DarkerGrotesqueBold',
          }}>
            Enter Location Here:
          </Text>
          <View style={styles.entryBoxBase}>  
            <TextInput
              style={styles.entryBox}
              value={input}
              onChangeText={setInputDebug}
              placeholder="..."
              
            />
            <View>
              { (!result || !input) && <NullIcon/> }
              { input && result && result === 'Correct!' &&  <CorrectIcon /> }
              { input && result && result !== 'Correct!' && <IncorrectIcon /> }
            </View>
          </View>
        </View>
        {loading && <ActivityIndicator style={{ top: 500 }} />}
        {result && (
          <View
            style={{
              position: 'absolute',
              top: 715,
              left: 20,
              right: 20,
              alignItems: 'center',
              // width will be the same as entryBoxBase (left:20, right:20)
            }}
          >
            <Text
              style={{
                color: result === 'Correct!' ? correctColour : incorrectColour,
                fontFamily: 'DarkerGrotesqueBold',
                fontSize: 14,
                textAlign: 'center',
                width: '100%',
              }}
            >
              {result}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  entrySection: {
    position: 'absolute', 
    left: 20, 
    right: 20, 
    height: 60,
    bottom: 90, 
  },
  entryBoxBase: { 
    position: 'absolute', 
    width: '100%',
    height: '100%',
    backgroundColor: darkForeColour, 
    borderRadius: 10,
    padding: 6,
    flexDirection: 'row', // ensure children fill horizontally
    alignItems: 'center', // vertical centering
  },
  entryBox: { 
    flex: 1, // fill the parent horizontally
    backgroundColor: 'white', 
    fontFamily: 'DarkerGrotesqueBold',
    fontSize: 25,
    borderRadius: 10,
    marginLeft: 8, // 30px shy of the right edge of entryBoxBase
  }
});