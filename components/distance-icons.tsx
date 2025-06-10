import React from 'react';
import { SvgProps } from 'react-native-svg';

// Import SVG files
import { default as Km10Icon, default as KmOver10Icon } from '@/assets/svg/10km-icon.svg';
import Km1Icon from '@/assets/svg/1km-icon.svg';
import Km3Icon from '@/assets/svg/3km-icon.svg';
import Km5Icon from '@/assets/svg/5km-icon.svg';

export const Distance1km = (props: SvgProps) => {
  return <Km1Icon {...props} />;
};

export const Distance3km = (props: SvgProps) => {
  return <Km3Icon {...props} />;
};

export const Distance5km = (props: SvgProps) => {
  return <Km5Icon {...props} />;
};

export const Distance10km = (props: SvgProps) => {
  return <Km10Icon {...props} />;
};

export const DistanceOver10km = (props: SvgProps) => {
  return <KmOver10Icon {...props} />;
};
