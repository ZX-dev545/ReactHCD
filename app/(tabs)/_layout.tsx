import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import ListTabIcon from '../../assets/svg/list-tab-icon.svg';
import HomeTabIcon from '../../assets/svg/home-tab-icon.svg';
import MapTabIcon from '../../assets/svg/map-tab-icon.svg';

import { HapticTab } from '@/components/HapticTab';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tab_icon_diameter = 48; // size of the tab icons in pixels

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          height: tab_icon_diameter + 59, // 52px icon + 16px padding
          backgroundColor: 'transparent', // fully clear
          borderTopWidth: 0,
          elevation: 0, // remove Android shadow
          zIndex: 10, // sit above image
          overflow: 'visible', // allow ripple to shine through
        },
        tabBarItemStyle: {
          overflow: 'visible', // ensure each tab can overflow
        },
        tabBarShowLabel: false, // hide titles
      }}>
      <Tabs.Screen
        name="list"
        options={{
          tabBarIcon: ({ color }) => (
            <ListTabIcon width={tab_icon_diameter} height={tab_icon_diameter} fill={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <HomeTabIcon width={tab_icon_diameter} height={tab_icon_diameter} fill={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color }) => (
            <MapTabIcon width={tab_icon_diameter} height={tab_icon_diameter} fill={color} />
          ),
        }}
      />
    </Tabs>
  );
}
