import { lightBackColour } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Anagram from '@/components/anagram';
import Corrupted from '@/components/corrupted';
import Directions from '@/components/directions';
import Calendar from '../components/calendar';
import Comic from '../components/comic';
import Radius from '../components/radius';


export default function GamePage() {
  const [progress, setProgress] = React.useState(0);
  const [completed, setCompleted] = React.useState(false);
  const [isComic, setIsComic] = React.useState(false);
  const router = useRouter();

  // Store progress in AsyncStorage whenever it updates
  React.useEffect(() => {
    console.log('Saving progress:', progress / (elements.length - 1));
    // Save progress to ../assets/data/quests.json under a key for the current quest
    AsyncStorage.setItem('gameProgress', (progress / (elements.length - 1)).toString())
      .then(() => console.log('Progress saved successfully'))
      .catch((error) => console.error('Error saving progress:', error));

    AsyncStorage.getItem('gameProgress')
      .then((value) => {
        if (value !== null) {
          console.log('Loaded progress:', parseFloat(value));
        }
      });
    
  }, [progress]);

  // Assign comic numbers directly in the elements array
  const elements = [
    (props: any) => <Comic num={0} {...props} />,
    (props: any) => <Comic num={1} {...props} />,
    (props: any) => <Calendar {...props} />,
    (props: any) => <Comic num={2} {...props} />,
    (props: any) => <Directions {...props} />,
    (props: any) => <Comic num={4} {...props} />,
    (props: any) => <Corrupted {...props} />,
    (props: any) => <Comic num={5} {...props} />,
    (props: any) => <Anagram {...props} />,
    (props: any) => <Comic num={6} {...props} />,
    (props: any) => <Radius {...props} />,
    (props: any) => <Comic num={7} {...props} />,
  ];

  const bckgrnds = ['white', 'white', lightBackColour, 'white', 'white', 'white', lightBackColour, 'white', lightBackColour, 'white', lightBackColour, 'white'];

  const Elem = elements[progress];
  // Comics and text are always completed, minigames require completion
  const canAdvance = completed;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: bckgrnds[progress] }]}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            if (progress === elements.length - 1) {
              // If last element, return to home page
                router.push('/home-page');
              return;
            }
            if (!canAdvance) return;
            setProgress((p) => p + 1 === elements.length ? p : p + 1);
            setCompleted(false);
          }}
        >
          {Elem({ onComplete: () => setCompleted(true) })}
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
