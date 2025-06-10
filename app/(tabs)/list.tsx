import questsData from '@/assets/data/quests.json';
import SettingsSvg from '@/assets/svg/settings-icon.svg';
import { lightForeColour, questColours, questColoursDark } from '@/constants/Colors';
import { QUEST_SVG_COMPONENTS, Quest } from '@/types/quest';
import { castJSONToQuest } from '@/utils/questUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Ellipse, Rect, Svg } from 'react-native-svg';
import ChooseSvg from '../../assets/svg/choose-text.svg';
import LeftBtnSvg from '../../assets/svg/left-button.svg';
import LogoSvg from '../../assets/svg/logo.svg';
import RightBtnSvg from '../../assets/svg/right-button.svg';

export default function ListScreen() {
  const [questno, setQuestno] = useState(0); // Use state for questno
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const [rotateDeg, setRotateDeg] = useState(0);
  const btnWidth  = Dimensions.get('window').width * 0.30625;
  const btnHeight = btnWidth + 5;
  const btnRadius = 49 * Dimensions.get('window').width / 320;
  const iconSize = btnRadius * 0.6;
  const router = useRouter();
  const pressAnim = useRef(new Animated.Value(0)).current;

  const quests: Quest[] = questsData
  .map(castJSONToQuest)
  .filter((q): q is Quest => q !== null);
  const quest = quests[questno];
  const QuestIconSvg = QUEST_SVG_COMPONENTS[quest.questIconSvgPath];
  
  // handler for next
  const goNext = () => {
    const newDeg = rotateDeg - 60;
    setRotateDeg(newDeg);
    Animated.timing(rotationAnim, { toValue: newDeg, duration: 300, useNativeDriver: true }).start();
    setQuestno(questno === quests.length - 1 ? questno : questno + 1);
  };
  // handler for prev
  const goPrev = () => {
    const newDeg = rotateDeg + 60;
    setRotateDeg(newDeg);
    Animated.timing(rotationAnim, { toValue: newDeg, duration: 300, useNativeDriver: true }).start();
    setQuestno(questno === 0 ? questno : questno - 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <>
      <LogoSvg style={styles.logo} />
      <TouchableOpacity onPress={() => console.log('Settings pressed')} style={{ position: 'absolute', top: 30, right: 8 }}>
        <SettingsSvg width={70} height={70} fill={lightForeColour} />
      </TouchableOpacity>
      <Svg
        style={styles.backgroundSvg}
        width="100%"
        height="540"
        viewBox="0 0 430 540"
        fill="none"
      >
        <Ellipse cx="50%" cy="108" rx="252" ry="118" fill="#0E2435"/>
        <Rect y="108" width="100%" height="490" fill="#0E2435"/>
      </Svg>
      <View style={{flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: '32.5%'}}>
        <Svg
            viewBox={`0 0 ${btnWidth} ${btnHeight}`}
            fill="none"
            style={[styles.launchButton, { width: btnWidth, height: btnHeight, position: 'absolute' }]}
        >
          <Circle cx={btnRadius} cy={btnRadius + 5} r={btnRadius} fill={questColoursDark[questno]} />
        </Svg>
        <Animated.View style={[styles.launchButton, { transform: [{ translateY: pressAnim }], zIndex: 3 }]}>
          <Svg
            viewBox={`0 0 ${btnWidth} ${btnHeight}`}
            fill="none"
            style={[styles.launchButton, { width: btnWidth, height: btnHeight, position: 'absolute' }]}
          >
            
            <Circle cx={btnRadius} cy={btnRadius} r={btnRadius} fill={questColours[questno]} />
          </Svg>
          <View style={[styles.questIconContainer, { width: iconSize, height: iconSize, top: btnRadius - iconSize / 2 }]}>
            <QuestIconSvg
              width={iconSize * 2}
              height={iconSize * 2}
              preserveAspectRatio="xMidYMid meet"
              fill={lightForeColour}
            />
          </View>
        </Animated.View>
        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.setItem('chosenQuest', JSON.stringify(quest));
            router.push('/lobby-page');
          }}
          onPressIn={() => Animated.spring(pressAnim, { toValue: 5, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(pressAnim, { toValue: 0, useNativeDriver: true }).start()}
          style={[styles.questIconContainer, { width: btnRadius * 2, height: btnRadius * 2, top: btnRadius * 0.55 }]}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ translateY: pressAnim }] }}>
            <ChooseSvg
              width={btnRadius * 1.6}
              height={btnRadius * 1.6}
              preserveAspectRatio="xMidYMid meet"
              fill={lightForeColour}
            />
          </Animated.View>
        </TouchableOpacity>
        
      </View>
      <Pressable onPress={goPrev} style={[styles.arrowButton, {left: 10}]}>
        <LeftBtnSvg/>
      </Pressable>
      <Pressable onPress={goNext} style={[styles.arrowButton, {right: 10}]}>
        <RightBtnSvg/>
      </Pressable>

      <Animated.Image
        source={require('../../assets/images/city-round.png')}
        resizeMode="contain"
        style={[
          styles.cityImage,
          {
            transform: [{
              rotate: rotationAnim.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg']
              })
            }]
          }
        ]}
      />

      {/** I want a big white rounded rectangle in the middle of the bottom half of the screen */}
      <View style={{ 
        position: 'absolute', 
        bottom: 130, 
        width: 250, 
        height: 250, 
        backgroundColor: lightForeColour, 
        borderRadius: 10,  
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 16, // Add padding for text
        zIndex: 5, // Ensure this is above the background and image
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0E2435', textAlign: 'center' }}>
          {quest.name}
        </Text>
        <Text style={{ fontSize: 14, color: '#0E2435', textAlign: 'center', marginTop: 8 }}>
          {quest.description}
        </Text>
      </View>
      </>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#68B0BA',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
  },
  logo: {
    position: 'absolute',
    top: 40,
    left: 16,
  },
  backgroundSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 1, // Ensure the background is behind other elements
  },

  cityImage: {
    position: 'absolute',
    bottom: '41%',
    alignSelf: 'center',
    width: '100%',
    aspectRatio: 1,
    zIndex: 0,
  },

  launchButton: {
    position: 'absolute',
    top: '32.5%',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2, // Ensure the button is above the background and image
  },
  questIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3, // Ensure the icon is above the button
  },

  arrowButton: {position: 'absolute', bottom: '52.5%', zIndex: 4}
});
