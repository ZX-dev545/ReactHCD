import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import InitialPageSvg from '../assets/svg/initial-page.svg';


export default function InitialPage() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push('/signin-page')}
    >
      <InitialPageSvg
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid slice"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#264156', // match the background color of the SVG
  },
});