import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { Platform, View, TouchableNativeFeedback } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const content = (
    <View style={[props.style, { overflow: 'visible' }]}>
      {props.children}
    </View>
  );

  if (Platform.OS === 'android') {
    return (
      <TouchableNativeFeedback
        useForeground
        background={TouchableNativeFeedback.Ripple('rgba(0,0,0,0.3)', true, 150)}
        onPress={props.onPress}
        onPressIn={(ev) => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          props.onPressIn?.(ev);
        }}>
        {content}
      </TouchableNativeFeedback>
    );
  }

  return (
    <PlatformPressable
      {...props}
      style={[props.style, { overflow: 'visible' }]}
      onPressIn={(ev) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        props.onPressIn?.(ev);
      }}>
      {props.children}
    </PlatformPressable>
  );
}
