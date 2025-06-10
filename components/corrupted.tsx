import { correctColour, darkForeColour, incorrectColour } from '@/constants/Colors';
import { UserProfile } from '@/types/userProfile';
import { castJSONToUserProfile } from '@/utils/profileUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, PanResponder, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import CorrectIcon from '../assets/svg/game/guess-correct-icon.svg';
import IncorrectIcon from '../assets/svg/game/guess-incorrect-icon.svg';
import NullIcon from '../assets/svg/game/guess-null-icon.svg';
import StaticSvg from '../assets/svg/game/static.svg';
import WindowSvg from '../assets/svg/game/window.svg';


function shuffleArray<T>(array: T[]): T[] {
  // Fisher-Yates shuffle
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const GRID_SIZE = 6;
const PIECES = GRID_SIZE * GRID_SIZE;
const IMAGE_SIZE = 321+8; // px

function DraggableTile({
  pieceIdx,
  onSwap,
  tileSize,
  imageTransform,
  index,
}: {
  pieceIdx: number;
  onSwap: (from: number, to: number) => void;
  tileSize: number;
  imageTransform: any;
  index: number;
}) {
  // Calculate the grid position
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  
  // Position for this tile
  const posX = col * tileSize;
  const posY = row * tileSize;

  // Use regular state to track position instead of Animated values
  // This avoids the React insertion effect warning
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Keep debug state but don't display it
  const [debugInfo, setDebugInfo] = useState({ x: 0, y: 0 });
  
  // Handle manual drag updates
  const handlePanResponderMove = (_, gestureState) => {
    setDragPosition({
      x: gestureState.dx,
      y: gestureState.dy
    });
    setDebugInfo({
      x: gestureState.dx,
      y: gestureState.dy
    });
  };
  
  // Move the function inside the component
  const detectSwapTarget = (gestureState: any) => {
    const pieceSize = IMAGE_SIZE / GRID_SIZE;
    
    // Get absolute position
    const absoluteX = posX + gestureState.dx;
    const absoluteY = posY + gestureState.dy;
    
    // Center of the dragged tile
    const centerX = absoluteX + pieceSize/2;
    const centerY = absoluteY + pieceSize/2;
    
    // Remove console.logs
    
    // Find which tile's area we're over by converting drag position to grid position
    const targetCol = Math.floor(centerX / pieceSize);
    const targetRow = Math.floor(centerY / pieceSize);
    
    const boundedCol = Math.max(0, Math.min(targetCol, GRID_SIZE-1));
    const boundedRow = Math.max(0, Math.min(targetRow, GRID_SIZE-1));
    
    const targetIdx = boundedRow * GRID_SIZE + boundedCol;
    
    return targetIdx;
  };
  
  const ANIMATION_DURATION = 800;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        // Remove console.log
      },
      onPanResponderMove: handlePanResponderMove,
      onPanResponderRelease: (_, gestureState) => {
        const target = detectSwapTarget(gestureState);
        onSwap(index, target);
        
        setDragPosition({ x: 0, y: 0 });
        
        setTimeout(() => {
          setIsDragging(false);
        }, ANIMATION_DURATION);
      },
    })
  ).current;

  const tileStyle = {
    width: tileSize,
    height: tileSize,
    position: 'absolute' as const,
    overflow: 'hidden' as const,
    left: posX + dragPosition.x,
    top: posY + dragPosition.y,
    zIndex: isDragging ? 100 : 1,
    transition: isDragging ? '' : `left ${ANIMATION_DURATION}ms, top ${ANIMATION_DURATION}ms`,
  };

  return (
    <View
      {...panResponder.panHandlers}
      style={tileStyle}
    >
      <Image
        source={require('../assets/images/uncorrupted.png')}
        style={imageTransform(pieceIdx)}
        resizeMode="cover"
      />
    </View>
  );
}

export default function Corrupted({ onComplete }: { onComplete: () => void }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pieces, setPieces] = useState<number[]>(() => shuffleArray([...Array(PIECES).keys()]));
  const [completed, setCompleted] = useState(false);
  const [guessCorrect, setGuessCorrect] = useState(false);
  const answer = "Barbican Conservatory, London, UK";
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  // Modify the grid container style with position adjustments
  const gridContainerStyle = {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    //position: 'relative' as const,
    // Add these properties to adjust position:
    //marginTop: 50, // Adjust this value to move container down
    //marginLeft: 0, // Adjust this value to move container right
    // Or use the following for absolute positioning:
    position: 'absolute' as const,
    top: 92, // Adjust as needed
    left: 18.5, // Adjust as needed
  };

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
        setGuessCorrect(true);
      } else if (replacedReply?.startsWith('no')) setResult(replacedReply);
      else setResult('Could not determine.');
    } catch (e) {
      setResult('Error checking location.');
    }
    setLoading(false);
  }

  // Check for puzzle completion
  useEffect(() => {
    if (!completed && pieces.every((v, i) => v === i)) {
      setCompleted(true);
    }
  }, [pieces, completed]);

  // Call onComplete only if both puzzle and guess are correct
  useEffect(() => {
    if (completed && guessCorrect) {
      onComplete();
    }
  }, [completed, guessCorrect, onComplete]);

  // Helper to get the crop for a given piece index
  function getTileStyle(pieceIdx: number) {
    const pieceSize = IMAGE_SIZE / GRID_SIZE;
    const srcRow = Math.floor(pieceIdx / GRID_SIZE);
    const srcCol = pieceIdx % GRID_SIZE;
    return {
      width: pieceSize,
      height: pieceSize,
      overflow: 'hidden' as const,
    };
  }

  function getImageTransform(pieceIdx: number) {
    const pieceSize = IMAGE_SIZE / GRID_SIZE;
    const srcRow = Math.floor(pieceIdx / GRID_SIZE);
    const srcCol = pieceIdx % GRID_SIZE;
    
    // Calculate the precise image position to show only this piece's portion
    return {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      position: 'absolute' as const,
      left: -srcCol * pieceSize,
      top: -srcRow * pieceSize,
    };
  }

  // Custom swap on drag end
  function handleDragEnd(to: number) {
    if (dragFrom === null || dragFrom === to) {
      setDragFrom(null);
      return;
    }
    const newPieces = [...pieces];
    [newPieces[dragFrom], newPieces[to]] = [newPieces[to], newPieces[dragFrom]];
    setPieces(newPieces);
    setDragFrom(null);
  }

  // Called when user releases tile
  function handleSwap(fromIdx: number, maybeToIdx: number) {
    if (maybeToIdx === fromIdx) return;
    setPieces(prev => {
      const updated = [...prev];
      [updated[fromIdx], updated[maybeToIdx]] = [updated[maybeToIdx], updated[fromIdx]];
      return updated;
    });
  }

  // Keep debug mode functionality, but don't render the debug button
  const [debugMode, setDebugMode] = useState(false);
  
  return (
    <>
      <View
        style={{
          width: '101.5%',
          height: 460,
          overflow: 'hidden',
          marginTop: 100,
          position: 'relative',
          justifyContent: 'center', // This centers the grid container
          alignItems: 'center',     // This centers the grid container
        }}
      >
        <WindowSvg
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
        
        {/* Draggable grid for corrupted pieces */}
        <View style={gridContainerStyle}>
          {pieces.map((pIdx, i) => (
            <DraggableTile
              key={`pos${i}-val${pIdx}`} // Use both position and value in key to force re-render
              pieceIdx={pIdx}
              index={i}
              onSwap={handleSwap}
              tileSize={IMAGE_SIZE / GRID_SIZE}
              imageTransform={getImageTransform}
            />
          ))}
        </View>

        {/* ...existing overlays... */}
        <StaticSvg
          width="100%"
          height="100%"
          viewBox="0 0 339 339"
          pointerEvents='none'
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', bottom: 11, left: 0, zIndex: 11 }}
        />
      </View>
      {/* ...existing KeyboardAvoidingView and input/result UI... */}
      
      {/* Hide debug button completely (was already conditionally rendered) */}

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