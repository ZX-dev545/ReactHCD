import { AVATAR_SVG_PATHS } from '@/constants/Avatars';
import { UserProfile } from '@/types/userProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TextStyle, View } from 'react-native';
import defaultProfile from '../assets/data/user-profiles.json';
import LogoSvg from '../assets/svg/logo.svg';
import WelcomeText from '../assets/svg/welcome-text.svg';
import { fromJsonToUserProfile, toProfileMap } from '../utils/profileUtils';

const citySource = require('../assets/images/citystraight.png');

const HEADER_HEIGHT = 56;  // <-- new constant for stack header height
const HEADER_PADDING = 16;
const ERRLBL_HEIGHT = 15; // height of error label

// add TextStyle annotation:
const baseErrorLabel: TextStyle = {
  color: 'red',
  height: ERRLBL_HEIGHT,
  fontSize: 10,
  textAlign: 'center',
};

// define the shape of each profile entry (without name)
type ProfileMap = Record<string, Omit<UserProfile, 'name'>>;

export default function SigninPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [nameError, setNameError] = useState('');
  const [cityError, setCityError] = useState('');

  const handleNext = async () => {
    setNameError(''); setCityError('');
    let bad = false;
    if (!name.trim())    { setNameError('Name required');    bad = true; }
    if (!city.trim())    { setCityError('City required');    bad = true; }
    if (bad) return;

    // load or fall back to defaults
    const json = await AsyncStorage.getItem('userProfiles');
    let profiles: ProfileMap;
    console.log("Loaded user profiles from storage:", json);
    if (json && json !== null) {
      profiles = JSON.parse(json) as ProfileMap;
      console.log("Parsed user profiles:", profiles);
    } else {
      // seed from single default profile
      console.log("No user profiles found, using default profile");
      console.log("default profile:", defaultProfile);
      profiles = toProfileMap(fromJsonToUserProfile(defaultProfile) as UserProfile);
      console.log("stringify default profile:", JSON.stringify(profiles));
    }

    await AsyncStorage.setItem('userProfiles', JSON.stringify(profiles));

    const key = name.trim();
    let current: UserProfile;

    if (!profiles[key]) {
      // new profile
      console.log("Creating new user profile for:", key);
      current = {
        name: key,
        city: city.trim(),
        avatarSvgPath: AVATAR_SVG_PATHS['pigeon'],
        accessories: [],
        quests: [] // <-- add default quest(s) here
      };
      profiles[key] = toProfileMap(current)[key];
      await AsyncStorage.removeItem('userProfiles'); // clear any previous
      await AsyncStorage.setItem('userProfiles', JSON.stringify(profiles));
    } else {
      // existing one
      current = { name: key, ...profiles[key] };
    }
    console.log("Current user profile:", current);

    // store currentUser for Home page
    await AsyncStorage.removeItem('currentUser'); // clear any previous
    await AsyncStorage.setItem('currentUser', JSON.stringify(current));

    router.push('/home-page');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LogoSvg style={styles.logo} />
      <WelcomeText style={styles.welcomeText} />
      
      <View style={[styles.textEntry, styles.nameEntry]}>
        <Text style={styles.label}>Name:</Text>
        <TextInput style={styles.inputField} value={name} onChangeText={setName} />
      </View>
      {nameError ? <Text style={styles.nameError}>{nameError}</Text> : null}

      <View style={[styles.textEntry, styles.cityEntry]}>
        <Text style={styles.label}>City:</Text>
        <TextInput style={styles.inputField} value={city} onChangeText={setCity} />
      </View>
      {cityError ? <Text style={styles.cityError}>{cityError}</Text> : null}

      <Pressable style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Next</Text>
      </Pressable>

      <Image source={citySource} style={styles.cityImage} resizeMode="cover" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#68B0BA',
    paddingTop: HEADER_HEIGHT + HEADER_PADDING,  // push content below header
  },
  logo: {
    position: 'absolute',
    top: HEADER_HEIGHT + 0,    // was 40
    left: 16,
  },
  welcomeText: {
    position: 'absolute',
    top: HEADER_HEIGHT + HEADER_PADDING + 86,    // was 96
    left: '50%',        // centre horizontally
    transform: [{ translateX: -113 }], // adjust by half of svg width (251/2)
  },
  textEntry: {
    width: 250,
    height: 51,
    borderRadius: 25,
    backgroundColor: 'rgba(251, 243, 211, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  nameEntry: {
    position: 'absolute',
    top: HEADER_HEIGHT + HEADER_PADDING + 191,   // was 191
    left: '50%',
    transform: [{ translateX: -125 }], // half of 250
  },
  cityEntry: {
    position: 'absolute',
    top: HEADER_HEIGHT + HEADER_PADDING + ERRLBL_HEIGHT + 276,   // was 276
    left: '50%',
    transform: [{ translateX: -125 }],
  },
  button: {
    position: 'absolute',
    top: HEADER_HEIGHT + HEADER_PADDING + 2*ERRLBL_HEIGHT + 369 - 30,   // was 369
    left: '50%',                                 // centre base
    transform: [{ translateX: 35 }],             // shift so right edge = 50% +125
    width: 90,
    height: 41,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 243, 211, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'DarkerGrotesqueExtraBold',
    fontSize: 24,
    color: '#264156',
    marginTop: -3,  // lift text slightly for baseline alignment
    textAlign: 'center',
  },
  cityImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 259,
  },
  label: {
    fontFamily: 'DarkerGrotesqueExtraBold',
    fontSize: 24,
    color: '#264156',
    width: 60,        // make all labels same width so inputs align
    marginTop: -3,    // lift label slightly for baseline alignment
  },
  inputField: {
    flex: 1,
    fontSize: 24,
    marginLeft: 5,
    fontFamily: 'DarkerGrotesqueExtraBold',
  },
  nameError: {
    ...baseErrorLabel,
    position: 'absolute',
    top: HEADER_HEIGHT + HEADER_PADDING + 191 + 51,
    left: '50%',
    transform: [{ translateX: -125 }],
    width: 250,
  },
  cityError: {
    ...baseErrorLabel,
    position: 'absolute',
    top: HEADER_HEIGHT + HEADER_PADDING + ERRLBL_HEIGHT + 276 + 51,
    left: '50%',
    transform: [{ translateX: -125 }],
    width: 250,
  },
});