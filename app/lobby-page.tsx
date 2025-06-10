import { Colors, darkBackColour, darkForeColour, lightBackColour, lightForeColour } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import SettingsSvg from '@/assets/svg/settings-icon.svg';
import DayIcon from '../assets/svg/day-icon.svg';
import DayNightIcon from '../assets/svg/day-night-icon.svg';
import HomeTabIcon from '../assets/svg/home-tab-icon.svg';
import ListTabIcon from '../assets/svg/list-tab-icon.svg';
import MapTabIcon from '../assets/svg/map-tab-icon.svg';
import NightDayIcon from '../assets/svg/night-day-icon.svg';
import NightNightIcon from '../assets/svg/night-night-icon.svg';
import SliderSvg from '../assets/svg/slider.svg';


export default function LobbyPage() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [daynight, setDaynight] = useState<'day' | 'night'>('day');
  // Remove: const [nightIcon, setNightIcon] = useState(() => NightDayIcon);

  // Animated value for DayIcon position
  const dayAnim = useState(new Animated.Value(0))[0]; // 0 for left (day), 1 for right (night)
  // Track which icon to show inside the animated view
  const [animatedIcon, setAnimatedIcon] = useState<'day' | 'night'>('day');

  const [questText, setQuestText] = useState<string>('');

  useEffect(() => {
    AsyncStorage.getItem('chosenQuest').then(json => {
      if (json) {
        try {
          const quest = JSON.parse(json);
          setQuestText(quest.name || '');
        } catch {}
      }
    });
  }, []);

  useEffect(() => {
    // Animate position, then update icon after animation
    Animated.timing(dayAnim, {
      toValue: daynight === 'day' ? 0 : 1,
      duration: 350,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease),
    }).start(() => {
      setAnimatedIcon(daynight);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daynight]);

  const CharWidths = [useState<number[]>([]), useState<number[]>([])];

  const playernoText = '234567';
  const playernoOffset = {x: 20.4, y: 3.9}; // Adjust this value to change the spacing of the characters

  // index of digit to cover
  const [coverIdx, setCoverIdx] = useState<number>(0);

  // interpolate: 11deg at ends, 0deg at center
  const getDigitRotation = (i: number, len: number) => {
    const t = i / (len - 1);
    const endAngle = 11;
    return (1 - Math.abs(t - 0.5) * 2) * 0 + (Math.abs(t - 0.5) * 2) * endAngle;
  };

  // Handler to update width for each character
  const handleCharLayout = (index: number, event: any, i: number) => {
    const width = event.nativeEvent.layout.width;
    CharWidths[index][1](prev => {
      const updated = [...prev];
      updated[i] = width;
      return updated;
    });
  };

  // Animated values for shrinking effect
  const singleAnim = useState(new Animated.Value(1))[0];
  const multiAnim = useState(new Animated.Value(1))[0];
  const questAnim = useState(new Animated.Value(1))[0];

  // Helper for press in/out
  const handlePressIn = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 0.92, useNativeDriver: true }).start();
  };
  const handlePressOut = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
  };

  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const tab_icon_diameter = 48;

  return (
    <>
      <View style={[styles.tabBackground, {top: 0, height: 81, backgroundColor: daynight === 'day' ? darkForeColour : darkBackColour}]} />
      <Image
        source={daynight === 'day' ? require('../assets/images/lobby-background.png') : require('../assets/images/lobby-background-night.png')}
        style={[styles.container, { width, height }]}
        resizeMode="contain"
      />

      <TouchableOpacity onPress={() => console.log('Settings pressed')} style={{ position: 'absolute', top: 30, right: 8, zIndex: 10 }}>
        {/*subtend the settings icon in a circle*/}
        <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: daynight === 'day' ? lightBackColour : darkForeColour, justifyContent: 'center', alignItems: 'center' }}>
          <SettingsSvg width={70} height={70} fill={lightForeColour} />
        </View>
      </TouchableOpacity>

      {/* Animated quest name */}
      <Pressable
        onPressIn={() => handlePressIn(questAnim)}
        onPressOut={() => handlePressOut(questAnim)}
        style={{ position: 'absolute', left: 50, top: 162 }}
      >
        <Animated.Text
          style={{
            fontSize: 21.5,
            color: '#000000',
            fontFamily: 'DarkerGrotesqueExtraBold',
            transform: [
              { rotate: '-4.12deg' },
              { scale: questAnim }
            ],
            textAlign: 'center',
          }}
        >
          {questText.toUpperCase()}
        </Animated.Text>
      </Pressable>
      
      {/* Animated SINGLE */}
      <Pressable
        onPressIn={() => handlePressIn(singleAnim)}
        onPressOut={() => handlePressOut(singleAnim)}
        onPress={() => router.push('/game-page')}
        style={[styles.questTextContainer, {top: 317.5, left: 79}]}
      >
        <Animated.Text
          style={{
            fontSize: 25,
            color: '#000000',
            fontFamily: 'DarkerGrotesqueExtraBold',
            transform: [{ scale: singleAnim }],
            textAlign: 'center',
            paddingVertical: 0,
          }}
        >
          SINGLE
        </Animated.Text>
        <Animated.Text
          style={{
            fontSize: 25,
            color: '#000000',
            fontFamily: 'DarkerGrotesqueExtraBold',
            transform: [{ scale: singleAnim }],
            position: 'absolute',
            textAlign: 'center',
            paddingVertical: 22.5,
          }}
        >
          PLAYER
        </Animated.Text>
      </Pressable>

      <Pressable
        onPressIn={() => handlePressIn(multiAnim)}
        onPressOut={() => handlePressOut(multiAnim)}
        //onPress={() => router.push('/')}
        style={[styles.multiplayerTextContainer, {top: 482, left: 83-10}]}
      >
        <Animated.Text
          style={{
            fontSize: 30,
            color: '#F5F5F5',
            fontFamily: 'DarkerGrotesqueExtraBold',
            transform: [{ rotate: '11.79deg' }, { scale: multiAnim }],
            position: 'absolute',
            paddingVertical: 6,
            paddingHorizontal: 12,
          }}
        >
          MULTI
        </Animated.Text>
        <Animated.Text
          style={{
            fontSize: 30,
            color: '#F5F5F5',
            fontFamily: 'DarkerGrotesqueExtraBold',
            transform: [{ rotate: '11.79deg' }, { scale: multiAnim }],
            position: 'absolute',
            paddingVertical: 30,
          }}
        >
          PLAYER
        </Animated.Text>
      </Pressable>
      
      {/* Diagonal playerno text */}
      <View style={styles.playernoTextContainer} pointerEvents="box-none">
        {playernoText.split('').map((char, i) => {
          const left = i * playernoOffset.x;
          const top  = i * playernoOffset.y;
          const rot  = getDigitRotation(i, playernoText.length);
        
          return (
            <React.Fragment key={i}>
              {i === coverIdx && (
                <Pressable 
                  onPress={() => {
                    setCoverIdx(i);//(prev) => (prev + 1) % playernoText.length);
                  }}
                  onLayout={(event) => handleCharLayout(0, event, i)}
                >
                  <SliderSvg
                    style={{
                      position: 'absolute',
                      left: left + i * 0.15 - 2,
                      top: top + i * Math.tan(11.79 * Math.PI / 180) * 0.15 + 7.8
                    }}
                  />
                  <Text
                    style={{
                      position: 'absolute',
                      left: left, 
                      top: top,
                      fontSize: 30,
                      color: '#F5F5F5',
                      fontFamily: 'DarkerGrotesqueExtraBold',
                      transform: [{ rotate: `${11.79}deg` }]
                    }}
                  >
                    {char}
                  </Text>
                </Pressable>
              )}
              {i !== coverIdx && (
                <Pressable
                  onPress={() => {
                    setCoverIdx(i);//(prev) => (prev + 1) % playernoText.length);
                  }}
                  onLayout={(event) => handleCharLayout(0, event, i)}
                >
                  <Text
                    style={{
                      position: 'absolute',
                      left: left, 
                      top: top,
                      fontSize: 30,
                      color: darkForeColour,
                      fontFamily: 'DarkerGrotesqueExtraBold',
                      transform: [{ rotate: `${11.79}deg` }]
                    }}
                  >
                    {char}
                  </Text>
                </Pressable>
              )}
            </React.Fragment>
          );
        })}
      </View>
      
      {/* Day/night toggle */}
      <Pressable
        onPress={() => {
          setDaynight(prev => prev === 'day' ? 'night' : 'day');
        }}
        style={{
          position: 'absolute',
          bottom: 130 + 8,
          width: 90,
          height: 40,
          right: 8,
          zIndex: 10,
          borderRadius: 20,
          backgroundColor: daynight === 'day' ? darkForeColour : lightBackColour
        }}
      >
        {/* Night icons (static) */}
        {daynight === 'day' ? 
          <>
          <View style={{position: 'absolute', right: 0, bottom: 0, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', zIndex: 11}}>
            <NightDayIcon width={30} height={30}/>
          </View>
          <View style={{position: 'absolute', left: 0, bottom: 0, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', zIndex: 11}}>
            <DayNightIcon width={30} height={30}/>
          </View>
          </>
          :
          <>
          <View style={{position: 'absolute', left: 0, bottom: 0, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', zIndex: 11}}>
            <DayIcon width={30} height={30}/>
          </View>
          <View style={{position: 'absolute', right: 0, bottom: 0, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', zIndex: 11}}>
            <NightNightIcon width={30} height={30}/>
          </View>
          </>
        }
        {/* Animated Day/Night Icon */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: dayAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 50]
            }),
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#EF9CA5',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 12,
          }}
        >
          {animatedIcon === 'day'
            ? <DayIcon width={30} height={30} />
            : <NightNightIcon width={30} height={30} />}
        </Animated.View>
      </Pressable>

      <View style={[styles.tabBackground, {bottom: 0, height: 130, backgroundColor: daynight === 'day' ? darkForeColour : darkBackColour}]} />

      {/* bottom tab bar */}
      <View style={styles.tabBar}>
        <Pressable onPress={() => router.push('/list')} style={styles.tabItem}>
          <ListTabIcon width={tab_icon_diameter} height={tab_icon_diameter} fill={tintColor} />
        </Pressable>
        <Pressable onPress={() => router.push('/home-page')} style={styles.tabItem}>
          <HomeTabIcon width={tab_icon_diameter} height={tab_icon_diameter} fill={tintColor} />
        </Pressable>
        <Pressable onPress={() => router.push('/explore')} style={styles.tabItem}>
          <MapTabIcon  width={tab_icon_diameter} height={tab_icon_diameter} fill={tintColor} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightBackColour, // match the background color of the SVG
  },
  tabBackground: {
    position: 'absolute',
    width: '100%',
    zIndex: 5,
  },
  playernoTextContainer: {
    position: 'absolute',
    left: 59.7, // Adjust starting position as needed
    top: 539.9, // Adjust starting position as needed
    width: 300, // Adjust as needed
    height: 300, // Adjust as needed
    zIndex: 10,
    pointerEvents: 'none',
  },
  multiplayerTextContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  questTextContainer: {
    position: 'absolute', 
    fontSize: 25, 
    color: '#000000', 
    fontFamily: 'DarkerGrotesqueExtraBold'
  },
  tabBar: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    height: 48 + 59,           // icon + padding
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    zIndex: 10,
    overflow: 'visible',
  },
  tabItem: {
    overflow: 'visible',
  },
});