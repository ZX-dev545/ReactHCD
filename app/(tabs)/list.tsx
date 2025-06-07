import React from 'react';
import { SafeAreaView, StyleSheet, Image } from 'react-native';
import LogoSvg from '../../assets/svg/logo.svg';

export default function ListScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LogoSvg style={styles.logo} />
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
});
