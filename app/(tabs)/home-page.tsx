import { AVATAR_ACCESSORY_SVG_COMPONENTS, AVATAR_SVG_COMPONENTS } from '@/constants/Avatars'; // drop AVATAR_SVG_PATHS
import { darkForeColour, lightForeColour } from '@/constants/Colors';
import { Quest, QUEST_SVG_COMPONENTS } from '@/types/quest';
import { UserProfile } from '@/types/userProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Line, Svg } from 'react-native-svg';
import questsData from '../../assets/data/quests.json'; // add this
import LogoSvg from '../../assets/svg/logo.svg';
import { castJSONToUserProfile } from '../../utils/profileUtils';
import { castJSONToQuest } from '../../utils/questUtils';

import SettingsSvg from '@/assets/svg/settings-icon.svg';


export default function HomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  const [currentUser, setCurrentUser] = useState<UserProfile | undefined>(undefined);
  console.log('HOMESCREEN HomeScreen rendered with currentUser:', currentUser);

  const [logoWidth, setLogoWidth] = useState(0);
  const [accessories, setAccessories] = useState(false);

  const [questProgress, setQuestProgress] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('currentUser').then(json => {
      if (json) {
        const parsed = castJSONToUserProfile(JSON.parse(json));
        if (parsed) setCurrentUser(parsed);
      }
    });

  }, []);

  useEffect(() => {
    console.log('HOMESCREEN useEffect for questProgress running');
    AsyncStorage.getItem('gameProgress').then(str => {
      console.log('HOMESCREEN questProgress loaded from storage:', str);
      if (str) {
        const progress = parseFloat(str);
        if (!isNaN(progress)) {
          setQuestProgress(progress);
          console.log('HOMESCREEN questProgress loaded:', progress);
        } else {
          console.warn('HOMESCREEN Invalid questProgress value:', str);
        }
      }
    });
  }, []);
  

  // reset visibility on returning to this tab
  useEffect(() => {
    if (isFocused) setVisible(true);
  }, [isFocused]);

  // reset visibility on tab press (even if already focused)
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      setVisible(true);
    });
    return unsubscribe;
  }, [navigation]);

  let avatarKey: string = currentUser?.avatarSvgPath
    ? currentUser.avatarSvgPath.replace('-avatar.svg', '')
    : 'pigeon'; // fallback to .avatar if .avatarSvgPath missing

  // Use type assertion to avoid TS7053 error
  const AvatarComponent = (AVATAR_SVG_COMPONENTS as Record<string, React.FC<any>>)[avatarKey] || AVATAR_SVG_COMPONENTS['pigeon'];
  const accessoriesKeys: string[] = currentUser?.accessories ? currentUser.accessories.map(a => a.svgPath) : [];
  const AccessoryComponents = accessoriesKeys.map(key => AVATAR_ACCESSORY_SVG_COMPONENTS[key]);


  //if currentUser is Hamish, add 'The Bloomin\' Plague' to the quests
  useEffect(() => {
    if (currentUser?.name === 'Hamish' && (!currentUser.quests || !currentUser.quests.includes("The Bloomin' Plague"))) {
      console.log('HOMESCREEN adding quest for HAMISH');
      const updatedUser = {
        ...currentUser,
        quests: [...(currentUser.quests || []), "The Bloomin' Plague"],
        avatarSvgPath: 'raccoon-avatar.svg', // ensure Hamish has his own avatar
      };
      setCurrentUser(updatedUser);
       avatarKey = 'racoon'; // update avatarKey to match new avatar
      AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
      console.log('HOMESCREEN updated currentUser:', currentUser);
    }
  }, [currentUser]);

  const allQuests: Quest[] = questsData
    .map(castJSONToQuest)
    .filter((q): q is Quest => q !== null);

  // Only show quests the user has in their list
  const userQuestNames = currentUser?.quests ?? [];
  const quests: Quest[] = allQuests.filter(q => userQuestNames.includes(q.name));

  return (
    <SafeAreaView style={styles.container}>
      {/* always show logo and measure its width */}
      <LogoSvg
        style={styles.logo}
        onLayout={e => setLogoWidth(e.nativeEvent.layout.width)}
      />
      <TouchableOpacity onPress={() => console.log('Settings pressed')} style={{ position: 'absolute', top: 30, right: 8 }}>
        <SettingsSvg width={70} height={70} fill={lightForeColour} />
      </TouchableOpacity>

      {/* show outline rectangle when main content is hidden */}
      { !visible && (
        <>
          <View style={[styles.avatarViewOutline, { left: logoWidth - 191 }]}>
            <View style={styles.avatarView}>
              <AvatarComponent
                width="191"
                height="191"
                preserveAspectRatio="xMidYMid meet"
              />
            </View>
          </View>
          {/* Add colored circles below the avatarViewOutline */}
          <View style={styles.coloredCirclesContainer}>
            { [
                '#FBF3D3', //
                '#EF9CA5', // 
                '#B64400', // 
                '#264156', // 
                '#FBCF44', // 
              ].map((color, idx) => (
                <View
                  key={color}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: color,
                  }}
                />
              )) }
          </View>
          <View style={[styles.avatarSelectionPanel, {
            left: logoWidth + 30,
            width: Dimensions.get('window').width - logoWidth - 40,
            height: Object.keys(accessories ? AVATAR_ACCESSORY_SVG_COMPONENTS : AVATAR_SVG_COMPONENTS).length * (Dimensions.get('window').width - logoWidth - 50) + 30,
          }]}
          >
            {Object.entries(accessories ? AVATAR_ACCESSORY_SVG_COMPONENTS : AVATAR_SVG_COMPONENTS).map(([avatarKey, Avatar]) => (
              <Pressable
                key={avatarKey}
                onPress={() => {
                  if (currentUser) {
                    const newUser = { ...currentUser, avatarSvgPath: `${avatarKey}-avatar.svg`, accessories: [] };
                    if (accessories) { 
                      newUser.accessories = accessoriesKeys.map(key => ({
                        svgPath: key,
                        position: { x: 0, y: 0 } // default position
                      }));
                    }
                    setCurrentUser(newUser);
                    AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
                  }
                  setVisible(true); // show main content after selection
                }}
                style={styles.avatarSelectItem}
              >
                <View style={[styles.avatarSquare, { 
                  width: Dimensions.get('window').width - logoWidth - 50, 
                  height: Dimensions.get('window').width - logoWidth - 50
                  }]}>
                  <Avatar
                    width={Dimensions.get('window').width - logoWidth - 50}
                    height={Dimensions.get('window').width - logoWidth - 50}
                    preserveAspectRatio="xMidYMid meet"
                  />
                </View>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => setAccessories(!accessories)}
            style={styles.accessoriesButton}
          >
            <Text style={styles.accessoriesText}>
              {accessories ? "Avatars" : "Accessories"} 
            </Text>
          </Pressable>
        </>
      )}

      {/* hide only main content */}
      {visible && (
        <>
          <Pressable onPress={() => setVisible(false)} style={styles.avatar_container}>
            <Svg width="191" height="191" viewBox="0 0 191 191" fill="none">
              <Circle cx="95.5" cy="95.5" r="95.5" fill={lightForeColour} />
              {/* display user avatar centered */}
              <AvatarComponent
                alignSelf="center"
                width="191"
                height="191"
                preserveAspectRatio="xMidYMid meet"
              />
            </Svg>
          </Pressable>
          <Text style={styles.outside_label}>Current Quests</Text>

          <View style={styles.buttonsContainer}>
            {quests.map((quest, idx) => {
              const fileName = quest.questIconSvgPath;
              const IconComponent = QUEST_SVG_COMPONENTS[fileName];
              return (
                <Pressable
                  key={idx}
                  style={[styles.buttonBase, idx > 0 && { marginTop: 8 }]}
                  onPress={async () => {
                    await AsyncStorage.setItem('chosenQuest', JSON.stringify(quest));
                    router.push('/lobby-page');
                  }}
                >
                  <View style={styles.questIconContainer}>
                    <Svg style={styles.questIconBase} width="35" height="35">
                      <Circle cx="17.5" cy="17.5" r="17.5" fill={quest.questColour} />
                    </Svg>
                    <IconComponent
                      width={20}
                      height={20}
                      style={styles.questIconInner}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </View>
                  <View style={styles.textWrapper}>
                    <Text style={styles.label}>{quest.name}</Text>
                    <View style={styles.lineWrapper}>
                      <Svg style={styles.questLineSvg} width="171" height="12" overflow="visible">
                        {/* base line */}
                        <Line
                          x1="4" y1="6" x2="167" y2="6"
                          stroke={darkForeColour} strokeWidth="7" strokeLinecap="round"
                        />
                        {/* progress overlay */}
                        <Line
                          x1="4" y1="6"
                          x2={4 + (questProgress) * (167 - 4)}
                          y2="6"
                          stroke={quest.questColour} strokeWidth="7" strokeLinecap="round"
                        />
                      </Svg>
                      <Text style={styles.percentLabel}>%</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {/* always show city background */}
      <Image
        source={require('../../assets/images/citystraight.png')}
        resizeMode="cover"
        style={styles.cityImage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#68B0BA',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24, // push content below status bar
  },
  logo: {
    position: 'absolute',
    top: 40, // push logo further below status bar
    left: 16,
  },
  cityImage: {
    width: '100%',
    height: 259,
    position: 'absolute',
    bottom: 0, // move it behind the tab bar
    left: 0,           // anchor at left edge
  },

  outside_label: {
    fontFamily: 'DarkerGrotesqueExtraBold',
    textAlign: 'center',
    fontSize: 24,
    color: lightForeColour,
    width: 180,
    height: 36,
    left: '50%',
    position: 'absolute',
    top: 98 + 191, // position below logo
    transform: [{ translateX: -90 }], // center horizontally
  },

  buttonBase: {
    width: 260,
    height: 51,
    borderRadius: 25,
    backgroundColor: lightForeColour,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  questIconBase: {
    // circle dimensions
    width: 35,
    height: 35,
  },
  label: {
    fontFamily: 'DarkerGrotesqueExtraBold',
    fontSize: 24,
    color: darkForeColour,
    width: 200,
    marginTop: -8,
  },
  // new wrappers
  textWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginLeft: 10,
  },
  questLineSvg: {
    marginTop: 0,
    overflow: 'visible',
  },
  lineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentLabel: {
    fontFamily: 'DarkerGrotesqueExtraBold',
    fontSize: 12,           // match SVG height
    lineHeight: 12,
    color: darkForeColour,
    marginLeft: 4,
  },

  avatar_container: {
    position: 'absolute',
    top: 98, // push avatar below status bar
    right: '50%', // align to right edge
    transform: [{ translateX: 95.5 }], // shift right by half of width
  },
  buttonsContainer: {
    position: 'absolute',
    top: 98 + 191 + 36,
    left: '50%',
    transform: [{ translateX: -130 }],
  },
  questIconContainer: {
    width: 35,
    height: 35,
    marginLeft: -10,    // shift container so circle edge aligns
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  questIconInner: {
    position: 'absolute', // center icon over circle
  },

  avatarViewOutline: {
    width: 191+20,
    height: 191+20,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: darkForeColour,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 98,
    left: '10%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarView: {
    width: 191,
    height: 191,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: lightForeColour,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSelectionPanel: {
    position: 'absolute',
    top: 98,
    borderRadius: 10,
    backgroundColor: darkForeColour,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSelectItem: {
    margin: 4,
  },
  avatarSquare: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: lightForeColour,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessoriesButton: {
    position: 'absolute',
    top: 98+191+20+10 + 40+20,
    left: 191+20+16-120,
    width: 120,
    height: 41,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 243, 211, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessoriesText: {
    fontFamily: 'DarkerGrotesqueExtraBold',
    fontSize: 24,
    color: '#264156',
    marginTop: -3,  // lift text slightly for baseline alignment
    textAlign: 'center',
  },

  coloredCirclesContainer: {
    position: 'absolute',
    top: 98 + 191 + 20 + 10, // top of avatarViewOutline + height + 10px
    left: 16,
    width: 191 + 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none', // so it doesn't block touches
  },
});