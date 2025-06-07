import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Image, Text, View, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import LogoSvg from '../assets/svg/logo.svg';
import WelcomeText from '../assets/svg/welcome-text.svg';
const citySource = require('../assets/images/citystraight.png');

export default function SigninPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const handleNext = () => {
    if (!name.trim() || !city.trim()) {
      Alert.alert('Error', 'Please enter both Name and City.');
      return;
    }
    router.push('/home-page');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LogoSvg style={styles.logo} />
      <WelcomeText style={styles.welcomeText} />
      <View style={styles.textEntry}>
        <Text style={styles.label}>Name:</Text>
        <TextInput style={styles.inputField} value={name} onChangeText={setName} />
      </View>
      <View style={[styles.textEntry, { marginTop: 16 }]}>
        <Text style={styles.label}>City:</Text>
        <TextInput style={styles.inputField} value={city} onChangeText={setCity} />
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
  },
  logo: {
    position: 'absolute',
    top: 40,
    left: 16,
  },
  cityImage: {
    width: '100%',
    height: 259,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  textEntry: {
    width: 250,
    height: 51,
    flexShrink: 0,
    borderRadius: 25,          // merged all corners
    backgroundColor: 'rgba(251, 243, 211, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  label: {
    fontFamily: 'DarkerGrotesqueExtraBold',
    fontSize: 24,
    color: '#264156',
  },
  inputField: {
    flex: 1,
    fontSize: 24,
    marginLeft: 16,
    fontFamily: 'DarkerGrotesqueExtraBold',
  },
  welcomeText: {
    position: 'absolute',
    top: 100,
    left: '50%',
    transform: [{ translateX: -75 }],
  },
  button: {
    width: 90,
    height: 41,
    position: 'absolute',
    left: 193,                 // X coordinate
    top: 369,                  // Y coordinate
    borderRadius: 20,          // merged all corners
    backgroundColor: 'rgba(251, 243, 211, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'DarkerGrotesqueExtraBold',
    fontSize: 24,
    color: '#264156',
  },
});