import ChooseSvg from '@/assets/svg/choose-text.svg';
import { QUEST_SVG_COMPONENTS } from '@/types/quest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Svg, { Circle } from 'react-native-svg';

import SettingsSvg from '@/assets/svg/settings-icon.svg';

import questsData from '@/assets/data/quests.json';
import { Distance10km, Distance1km, Distance3km, Distance5km, DistanceOver10km } from '@/components/distance-icons';
import { darkForeColour, lightForeColour, questColours, questColoursDark, questIconColours } from '@/constants/Colors';
import { Quest } from '@/types/quest';
import { UserProfile } from '@/types/userProfile';
import { castJSONToQuest } from '@/utils/questUtils';

const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE'; // Replace with your actual API key

// Calculate center point and radius of the smallest circle containing all locations
const calculateEnclosingCircle = (locations) => {
  if (!locations || locations.length === 0) {
    return { center: { latitude: 0, longitude: 0 }, radius: 0 };
  }

  // Calculate center (average of all points)
  const center = locations.reduce(
    (sum, loc) => ({
      latitude: sum.latitude + loc.latitude,
      longitude: sum.longitude + loc.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  center.latitude /= locations.length;
  center.longitude /= locations.length;

  // Find radius (distance to farthest point)
  const radius = locations.reduce((maxDist, loc) => {
    // Approximate distance calculation using Haversine formula
    const R = 6371e3; // Earth radius in meters
    const φ1 = center.latitude * Math.PI / 180;
    const φ2 = loc.latitude * Math.PI / 180;
    const Δφ = (loc.latitude - center.latitude) * Math.PI / 180;
    const Δλ = (loc.longitude - center.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.max(maxDist, distance);
  }, 0);

  return { center, radius };
};

// Function to get marker color based on radius
const getMarkerColorByRadius = (radius) => {
  // Round to nearest kilometer
  const radiusInKm = Math.round(radius / 1000);
  
  if (radiusInKm <= 1) return questIconColours[0]; // 1km: white
  if (radiusInKm <= 3) return questIconColours[1]; // 3km: gold
  if (radiusInKm <= 5) return questIconColours[2]; // 5km: orange
  if (radiusInKm <= 10) return questIconColours[3]; // 10km: pink
  if (radiusInKm > 10) return questIconColours[4]; // >10km: purple
  return '#000000'; // Default: black (fallback)
};

export default function ExploreScreen() {
   const mapRef = useRef<MapView>(null);
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
   const [questCircles, setQuestCircles] = useState([]);
   const [quests] = useState(() => 
     questsData.map(castJSONToQuest).filter((q): q is Quest => q !== null)
   );
   const [selectedQuest, setSelectedQuest] = useState<number | null>(null);
   const [overlayPos, setOverlayPos] = useState<{ x: number; y: number } | null>(null);
   const [questIdx, setQuestIdx] = useState<number | null>(null);
   const [isLegendExpanded, setIsLegendExpanded] = useState(false);
   const metricsCalculated = useRef(false);
   const circlesCalculated = useRef(false);
   const calculationInProgress = useRef(false);
   const iconSize = 20;
   const collapsedY = 167-30;
   const expandedY = 0; // Move up by 130px (height of tab bar)
   const position = useRef(new Animated.Value(collapsedY)).current;
   const markerRefs = useRef<Record<number, Marker | null>>({});
   const router = useRouter();
   const pressAnim = useRef(new Animated.Value(0)).current;

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

   // Calculate enclosing circles and metrics just once on load
   useEffect(() => {
     if (metricsCalculated.current || !quests.length) return;
     
     console.log("Calculating metrics (one time only)");
     metricsCalculated.current = true;
     
     // Step 1: Calculate circles (keep this for visualization)
     const circles = quests.map(q => calculateEnclosingCircle(q.locations));
     
     // Log the radii of all circles
     circles.forEach((circle, idx) => {
       console.log(`Quest ${idx + 1} (${quests[idx].name}) - radius: ${circle.radius.toFixed(2)} meters, color: ${getMarkerColorByRadius(circle.radius)}`);
     });
     
     setQuestCircles(circles);
     
     // Step 2: Calculate metrics between consecutive stops (using old algorithm)
     Promise.all(
       quests.map((q, qi) => {
         const locs = q.locations;
         
         if (locs.length < 2) {
           return Promise.resolve({ distance: null, price: 0, currency: '', duration: 0 });
         }
         
         // Fetch each segment between consecutive stops
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
     .then(results => {
       console.log("Setting metrics (one time only)");
       setMetrics(results);
     })
     .catch(console.error);
   }, []); // Empty dependency array - run only once on mount

   // Transport mode change handler (manual recalculation)
   const handleTransportModeChange = (value) => {
     setTransportMode(value);
     
     if (!questCircles.length) return;
     
     console.log(`Manually recalculating for ${value} mode`);
     // Recalculate metrics with new transport mode (using consecutive stops)
     Promise.all(
       quests.map((q, qi) => {
         const locs = q.locations;
         
         if (locs.length < 2) {
           return Promise.resolve({ distance: null, price: 0, currency: '', duration: 0 });
         }
         
         // Fetch each segment between consecutive stops
         const segmentPromises = locs.slice(1).map((l, i) => {
           const o = locs[i];
           return fetch(
             `https://maps.googleapis.com/maps/api/distancematrix/json?` +
             `origins=${o.latitude},${o.longitude}` +
             `&destinations=${l.latitude},${l.longitude}` +
             `&mode=${value}` +
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
             value === 'transit'
               ? segments.reduce((sum, s) => sum + s.fare, 0)
               : 0;
           const curr =
             value === 'transit' && segments.length
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
   };

   const toggleLegend = () => {
     const toValue = isLegendExpanded ? collapsedY : expandedY;
     console.log(`Toggling legend to ${isLegendExpanded ? 'collapsed' : 'expanded'} position: ${toValue}`);
     Animated.timing(position, {
       toValue,
       duration: 300,
       useNativeDriver: true,
     }).start();
     setIsLegendExpanded(!isLegendExpanded);
   };


   const QuestIconSvg = selectedQuest !== null
     ? QUEST_SVG_COMPONENTS[quests[selectedQuest].questIconSvgPath]
     : null;

   // reposition overlay after drag ends
   const handleRegionChangeComplete = async (newRegion) => {
     setRegion(newRegion);
     if (questIdx != null && mapRef.current) {
       const { x, y } = await mapRef.current.pointForCoordinate(
         questCircles[questIdx].center
       );
       setOverlayPos({ x, y });
     }
   };

  const onMarkerPress = (idx, coord) => {
    setQuestIdx(idx);        // will trigger effect to set overlayPos
  };

   // move positioning logic into effect triggered by questIdx
   useEffect(() => {
     if (questIdx != null && mapRef.current) {
       mapRef.current.pointForCoordinate(questCircles[questIdx].center)
         .then(({ x, y }) => setOverlayPos({ x, y }))
         .catch(() => {});
     }
   }, [questIdx]);

   return (
     <SafeAreaView style={styles.container}>
       {/* full-width top bar with picker + settings + results */}
       <View style={styles.topBar}>
         {/* picker + settings */}
         <View style={styles.pickerContainer}>
           <Picker
             selectedValue={transportMode}
             onValueChange={handleTransportModeChange}
             style={styles.picker}
           >
             <Picker.Item label="Driving" value="driving" />
             <Picker.Item label="Walking" value="walking" />
             <Picker.Item label="Bicycling" value="bicycling" />
             <Picker.Item label="Transit" value="transit" />
           </Picker>
         </View>
         {/* results moved into topBar */}
         {questIdx !== null && metrics[questIdx] && (
           <View style={styles.topBarInfo}>
             {metrics[questIdx].distance != null && (
               <Text style={styles.infoTextTopBar}>
                 {(metrics[questIdx].distance / 1000).toFixed(2)} km
               </Text>
             )}
             {metrics[questIdx].price > 0 && (
               <Text style={styles.infoTextTopBar}>
                 {metrics[questIdx].price.toFixed(2)} {metrics[questIdx].currency}
               </Text>
             )}
             {metrics[questIdx].duration > 0 && (
               <Text style={styles.infoTextTopBar}>
                 {(metrics[questIdx].duration / 60).toFixed(0)} min
               </Text>
             )}
           </View>
         )}

         <TouchableOpacity onPress={() => console.log('Settings pressed')} style={styles.settingsButton}>
           <SettingsSvg width={70} height={70} fill={lightForeColour} />
         </TouchableOpacity>
       </View>

       {/* map with enclosing circles + center markers */}
       <MapView
         ref={mapRef}
         style={styles.map}
         initialRegion={region}
         onRegionChangeComplete={handleRegionChangeComplete}
         onPress={() => {
           //setQuestIdx(null);
           setOverlayPos(null);
         }}
         // clear selection only when user pans on map
         onPanDrag={() => { console.log("nulling"); setQuestIdx(null); setOverlayPos(null); }}
       >
         {/* Draw quest markers with color based on radius */}
         {questCircles.map((circle, idx) =>
           quests[idx].locations.length > 0 && (
             <Marker
               ref={ref => { markerRefs.current[idx] = ref }}
               key={idx}
               coordinate={circle.center}
               pinColor={getMarkerColorByRadius(circle.radius)}
               onPress={e => { e.stopPropagation(); onMarkerPress(idx, circle.center); }}
             />
           )
         )}
       </MapView>

       {/* Color Legend - completely separate component */}
       <TouchableOpacity
         style={{ backgroundColor: '#FFFFFF', position: 'absolute', height: 297, bottom: -0.5, right: 0, zIndex: 5 }}
         activeOpacity={0.7}
         onPress={() => { console.log('pressed'); toggleLegend(); }}
       >
         <Animated.View
           pointerEvents="box-none"
           style={[
             styles.legendContainer,
             styles.expandedLegend,
             {
               height: 167,
               transform: [{ translateY: position }],
             },
           ]}
         >
           <View style={[styles.keyHeader, { top: 0 }]} pointerEvents="box-none">
             <Text style={styles.legendButtonText} pointerEvents="box-none">Key:</Text>
           </View>
           <View style={[styles.keyBody, { bottom: 0 }]} pointerEvents="box-none">
             <View style={styles.legendRow} pointerEvents="box-none">
               <Distance1km width={iconSize} height={iconSize} style={styles.iconMargin} pointerEvents="box-none" />
               <Text style={styles.legendText} pointerEvents="box-none">1km</Text>
             </View>
             <View style={styles.legendRow} pointerEvents="box-none">
               <Distance3km width={iconSize} height={iconSize} style={styles.iconMargin} pointerEvents="box-none" />
               <Text style={styles.legendText} pointerEvents="box-none">3km</Text>
             </View>
             <View style={styles.legendRow} pointerEvents="box-none">
               <Distance5km width={iconSize} height={iconSize} style={styles.iconMargin} pointerEvents="box-none" />
               <Text style={styles.legendText} pointerEvents="box-none">5km</Text>
             </View>
             <View style={styles.legendRow} pointerEvents="box-none">
               <Distance10km width={iconSize} height={iconSize} style={styles.iconMargin} pointerEvents="box-none" />
               <Text style={styles.legendText} pointerEvents="box-none">10km</Text>
             </View>
             <View style={styles.legendRow} pointerEvents="box-none">
               <DistanceOver10km width={iconSize} height={iconSize} style={styles.iconMargin} pointerEvents="box-none" />
               <Text style={styles.legendText} pointerEvents="box-none">{">10km"}</Text>
             </View>
           </View>
         </Animated.View>
       </TouchableOpacity>

       {/* custom overlay */}
       {overlayPos != null && questIdx != null && (
         <View
           style={[
             styles.infoBox,
             {
               position: 'absolute',
               left: overlayPos.x - 90,
               top: overlayPos.y - 155,    // 5px higher
             }
           ]}
         >
           {/* mini launch */}
           <View style={styles.miniLaunchContainer}>
              <Svg width={40} height={45} viewBox="0 0 100 100">
                <Circle cx={50} cy={55} r={50} fill={questColoursDark[questIdx]} />
              </Svg>
              <Animated.View style={[styles.miniIconContainer, { transform: [{ translateY: pressAnim }] }]}>
                <Svg width={40} height={45} viewBox="0 0 100 100">
                  <Circle cx={50} cy={50} r={50} fill={questColours[questIdx]} />
                </Svg>
                <View style={[styles.miniIconContainer, {top: 8}]}>
                {(() => {
                  const Icon = QUEST_SVG_COMPONENTS[quests[questIdx].questIconSvgPath];
                  return <Icon width={25} height={25} fill={lightForeColour} />;
                })()}
                </View>
             </Animated.View>
             <TouchableOpacity
               onPress={async () => {
                 if (questIdx != null) {
                   await AsyncStorage.setItem('chosenQuest', JSON.stringify(quests[questIdx]));
                 }
                 router.push('/lobby-page');
               }}
               onPressIn={() => Animated.spring(pressAnim, { toValue: 5, useNativeDriver: true }).start()}
               onPressOut={() => Animated.spring(pressAnim, { toValue: 0, useNativeDriver: true }).start()}
               style={[styles.miniChooseContainer, { top: 18 }]}
               activeOpacity={0.8}
             >
               <Animated.View style={{ transform: [{ translateY: pressAnim }] }}>
                 <ChooseSvg width={30} height={30} fill={lightForeColour} />
               </Animated.View>
             </TouchableOpacity>
           </View>
           <View style={styles.infoHeader}>
             <Text style={styles.infoTitle}>{quests[questIdx].name}</Text>
           </View>
           {/* pointer triangle */}
           <View style={styles.calloutTriangle} />
         </View>
       )}

       <View style={styles.tabBackground} />
     </SafeAreaView>
   );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353636', // This is the gray color seen above the map
  },
  map: {
    flex: 1,
    // Remove marginTop to eliminate gray space
    // marginTop: Dimensions.get('window').height * 0.1,
  },
  tabBackground: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 130,
    backgroundColor: darkForeColour,
    zIndex: 5,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 105,
    backgroundColor: darkForeColour,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    zIndex: 30,
  },
  pickerContainer: {
    backgroundColor: lightForeColour,
    borderRadius: 10,
    width: '50%',
    height: 55,
    bottom: -40,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: '100%',
  },
  settingsButton: {
    padding: 0,
    bottom: -30,
  },

  topBarInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    bottom: -35,
  },
  infoTextTopBar: {
    color: lightForeColour,
    fontSize: 12,
    marginTop: 4,
  },

  legendContainer: {
    position: 'absolute',
    bottom: 130,
    right: 0,
    borderRadius: 8,
    zIndex: 15,
  },
  expandedLegend: {
    width: 90,
  },
  legendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendButtonText: {
    color: darkForeColour,
    fontFamily: 'DarkerGrotesqueExtraBold',
    fontSize: 25,
    alignSelf: 'center',
    top: -5,
    height: 35,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    paddingHorizontal: 4,
  },
  keyHeader: {
    position: 'absolute',
    right: 0,
    backgroundColor: lightForeColour,
    width: '100%',
    height: 30,
    borderTopLeftRadius: 10
  },
  keyBody: {
    position: 'absolute',
    width: '100%',
    backgroundColor: '#1B3140',
  },
  iconMargin: {
    marginRight: 4,
  },
  legendText: {
    color: lightForeColour,
    fontFamily: 'DarkerGrotesqueExtraBold',
    fontSize: 20,
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 14, // Below legend, above everything else
  },
  infoBox: {
    position: 'absolute',
    bottom: 130,
    backgroundColor: lightForeColour,
    borderRadius: 10,
    padding: 10,
    width: 180,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  miniLaunchContainer: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  miniIconContainer: {
    position: 'absolute',
    alignSelf: 'center',
    marginBottom: 4,
  },
  miniChooseContainer: {
    position: 'absolute',
    alignSelf: 'center',
    marginBottom: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoTitle: {
    color: darkForeColour,
    fontFamily: 'DarkerGrotesqueExtraBold',
    fontSize: 18,
  },
  infoBody: {
    marginTop: 10,
  },
  infoText: {
    color: lightForeColour,
    fontSize: 14,
    marginBottom: 4,
  },
  calloutTriangle: {
    position: 'absolute',
    top: 100,                   // match new overlay shift
    alignSelf: 'center',
    marginLeft: 0,      // half of triangle width
    width: 0,
    height: 0,
    borderLeftWidth: 15,        // larger triangle
    borderRightWidth: 15,
    borderTopWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: lightForeColour,  // same as infoBox background
  },
});