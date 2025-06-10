import React, { useEffect } from 'react';
import { Image, View } from 'react-native';

// Statically import all comic images
const comicImages = [
  require('../assets/images/comics/comic1.jpg'),
  require('../assets/images/comics/comic2.jpg'),
  require('../assets/images/comics/comic3.jpg'),
  require('../assets/images/comics/comic4.jpg'),
  require('../assets/images/comics/comic5.jpg'),
  require('../assets/images/comics/comic6.jpg'),
  require('../assets/images/comics/comic7.jpg'),
  require('../assets/images/comics/comic8.jpg'),
];

// Change getComic to a React component, not a function that calls onComplete immediately
export default function Comic({ num, onComplete }: { num: number; onComplete?: () => void }) {
  useEffect(() => {
    console.log(`Comic ${num + 1} loaded`);
    if (onComplete) onComplete();
    // Only run when num changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [num]);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Image source={comicImages[num]} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
    </View>
  );
}