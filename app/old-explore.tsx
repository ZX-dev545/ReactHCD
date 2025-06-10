import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import questsData from '@/assets/data/quests.json';
import { Quest } from '@/types/quest';
import { UserProfile } from '@/types/userProfile';
import { castJSONToQuest } from '@/utils/questUtils';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDvNMLXtTOiaIJCyyh8TIHz6JUvpjoVwos';

export default function ExploreScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [region, setRegion] = useState({
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [transportMode, setTransportMode] = useState<
    'driving' | 'walking' | 'bicycling' | 'transit'
  >('transit');
  const [metrics, setMetrics] = useState<
    { distance: number | null; price: number; currency: string; duration: number }[]
  >([]);

  useEffect(() => {
    AsyncStorage.getItem('currentUser').then((json) => {
      if (json) {
        const parsed = JSON.parse(json) as UserProfile;
        setUserProfile(parsed);
        if (parsed.city) {
          fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              parsed.city
            )}&key=${GOOGLE_MAPS_API_KEY}`
          )
            .then((r) => r.json())
            .then((d) => {
              if (d.results?.length) {
                const loc = d.results[0].geometry.location;
                setRegion({
                  latitude: loc.lat,
                  longitude: loc.lng,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                });
              }
            });
        }
      }
    });
  }, []);

  // load quests
  const quests: Quest[] = questsData
    .map(castJSONToQuest)
    .filter((q): q is Quest => q !== null);

  // compute distances & fares for each quest whenever transportMode changes
  useEffect(() => {
    Promise.all(
      quests.map((q, qi) => {
        const locs = q.locations;
        if (locs.length < 2)
          return Promise.resolve({ distance: null, price: 0, currency: '' });
        // fetch each segment between consecutive stops
        const segmentPromises = locs.slice(1).map((l, i) => {
          const o = locs[i];
          return fetch(
            `https://maps.googleapis.com/maps/api/distancematrix/json?` +
              `origins=${o.latitude},${o.longitude}` +
              `&destinations=${l.latitude},${l.longitude}` +
              `&mode=${transportMode}` +
              `&key=${GOOGLE_MAPS_API_KEY}`
          )
            .then((r) => r.json())
            .then((data) => {
              const el = data.rows?.[0]?.elements?.[0] || {};
              console.log(
                `Quest ${qi + 1} - segment ${i + 1} names: ${o.name} to ${l.name}, ` +
                `distance: ${el.distance?.value || 0} m, fare: ${el.fare?.value || 0} ${el.fare?.currency || 'GBP'}, ` +
                `duration: ${el.duration?.value || 0} seconds`
              );
              return {
                distance: el.distance?.value || 0,
                fare: el.fare?.value || 0,
                currency: el.fare?.currency || 'GBP',
                duration: el.duration?.value || 0,
              };
            });
        });
        return Promise.all(segmentPromises).then((segments) => {
          const totalMeters = segments.reduce((sum, s) => sum + s.distance, 0);
          const totalFare =
            transportMode === 'transit'
              ? segments.reduce((sum, s) => sum + s.fare, 0)
              : 0;
          const curr =
            transportMode === 'transit' && segments.length
              ? segments[0].currency
              : '';
          const totalDuration =
            segments.reduce((sum, s) => sum + s.duration, 0);
          return { distance: totalMeters, price: totalFare, currency: curr, duration: totalDuration };
        });
      })
    )
      .then(setMetrics)
      .catch(console.error);
  }, [transportMode]);

  return (
    <SafeAreaView style={styles.container}>
      {/* mode selector */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={transportMode}
          onValueChange={(val) => setTransportMode(val as any)}
        >
          <Picker.Item label="Driving" value="driving" />
          <Picker.Item label="Walking" value="walking" />
          <Picker.Item label="Bicycling" value="bicycling" />
          <Picker.Item label="Transit" value="transit" />
        </Picker>
      </View>

      {/* map + markers */}
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {quests
          .filter((q) => q.locations.length > 0)
          .map((q, qi) => (
            <Marker
              key={qi}
              coordinate={{
                latitude: q.locations[0].latitude,
                longitude: q.locations[0].longitude,
              }}
              title={q.locations[0].name}
            />
          ))}
      </MapView>

      {/* results overlay for each quest */}
      {metrics.map((m, idx) => (
        <View key={idx} style={styles.infoBox}>
          {m.distance != null && (
            <Text style={styles.infoText}>
              Quest {idx + 1} Estimated distance: {(m.distance / 1000).toFixed(2)} km
            </Text>
          )}
          {m.price > 0 && (
            <Text style={styles.infoText}>
              Quest {idx + 1} Estimated fare: {m.price.toFixed(2)} {m.currency}
            </Text>
          )}
          {m.duration > 0 && (
            <Text style={styles.infoText}>
              Quest {idx + 1} Estimated duration: {(m.duration / 60).toFixed(0)} min
            </Text>
          )}
        </View>
      ))}

      <View style={styles.tabBackground} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353636',
  },
  map: {
    flex: 1,
    marginTop: Dimensions.get('window').height * 0.1,
  },
  tabBackground: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 130,
    backgroundColor: '#0E2435',
    zIndex: 5,
  },
  pickerContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 20,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  infoBox: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 10,
  },
  infoText: { color: '#fff', fontSize: 14 },
});
