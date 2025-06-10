import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import questsData from '@/assets/data/quests.json';
import { Distance10km, Distance1km, Distance3km, Distance5km, DistanceOver10km } from '@/components/distance-icons';
import { darkForeColour, lightForeColour, questIconColours } from '@/constants/Colors';
import { Quest } from '@/types/quest';
import { UserProfile } from '@/types/userProfile';
import { castJSONToQuest } from '@/utils/questUtils';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDvNMLXtTOiaIJCyyh8TIHz6JUvpjoVwos';

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
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const metricsCalculated = useRef(false);
  const circlesCalculated = useRef(false);
  const calculationInProgress = useRef(false);
  const [mapTouchTimestamp, setMapTouchTimestamp] = useState(0);
  const [legendWasToggled, setLegendWasToggled] = useState(false);

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

  const iconSize = 20;

  return (
    <SafeAreaView style={styles.container}>
      {/* map with enclosing circles + center markers */}
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={() => {
          const now = Date.now();
          setMapTouchTimestamp(now);
          
          // Only close quest info - we'll handle legend separately
          setSelectedQuest(null);
        }}
      >
        {/* Draw quest markers with color based on radius */}
        {questCircles.map((circle, idx) =>
          quests[idx].locations.length > 0 && (
            <React.Fragment key={`circle-${idx}`}>
              <Marker
                key={`center-${idx}`}
                coordinate={circle.center}
                title={quests[idx].name || `Quest ${idx + 1} Center`}
                pinColor={getMarkerColorByRadius(circle.radius)}
                onPress={(e) => {
                  // Stop event from reaching the map
                  e.stopPropagation();
                  setSelectedQuest(idx);
                }}
              />
            </React.Fragment>
          )
        )}
      </MapView>

      {/* mode selector - moved below map in component order but above in visual stack */}
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

      {/* results overlay for selected quest */}
      {selectedQuest !== null && metrics[selectedQuest] && (
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Text style={[styles.infoText, styles.infoTitle]}>
              {quests[selectedQuest].name || `Quest ${selectedQuest + 1}`}
            </Text>
            <TouchableOpacity 
              onPress={() => setSelectedQuest(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          {metrics[selectedQuest].distance != null && (
            <Text style={styles.infoText}>
              Estimated distance: {(metrics[selectedQuest].distance / 1000).toFixed(2)} km
            </Text>
          )}
          
          {metrics[selectedQuest].price > 0 && (
            <Text style={styles.infoText}>
              Estimated fare: {metrics[selectedQuest].price.toFixed(2)} {metrics[selectedQuest].currency}
            </Text>
          )}
          
          {metrics[selectedQuest].duration > 0 && (
            <Text style={styles.infoText}>
              Estimated duration: {(metrics[selectedQuest].duration / 60).toFixed(0)} min
            </Text>
          )}
        </View>
      )}

      {/* Use a separate View as event blocker when legend is expanded */}
      {isLegendExpanded && (
        <View
          style={styles.fullScreenOverlay}
          onTouchStart={() => {
            // When touch starts on overlay, immediately close legend
            setLegendWasToggled(true);
            setIsLegendExpanded(false);
            
            // Clear the flag after a short delay 
            setTimeout(() => setLegendWasToggled(false), 300);
          }}
        />
      )}
    
      {/* Color Legend - completely separate component */}
      {isLegendExpanded ? (
        // Expanded view
        <View
          style={[styles.legendContainer, styles.expandedLegend, {height: 167}]}
        >
          <View style={[styles.keyHeader, {top: 0}]}>
            <Text style={styles.legendButtonText}>Key:</Text>
          </View>
          <View style={[styles.keyBody, {bottom: 0}]}>
            {/* Legend content rows */}
            <View style={styles.legendRow}>
              <Distance1km width={iconSize} height={iconSize} style={styles.iconMargin} />
              <Text style={styles.legendText}>1km</Text>
            </View>
            <View style={styles.legendRow}>
              <Distance3km width={iconSize} height={iconSize} style={styles.iconMargin} />
              <Text style={styles.legendText}>3km</Text>
            </View>
            <View style={styles.legendRow}>
              <Distance5km width={iconSize} height={iconSize} style={styles.iconMargin} />
              <Text style={styles.legendText}>5km</Text>
            </View>
            <View style={styles.legendRow}>
              <Distance10km width={iconSize} height={iconSize} style={styles.iconMargin} />
              <Text style={styles.legendText}>10km</Text>
            </View>
            <View style={styles.legendRow}>
              <DistanceOver10km width={iconSize} height={iconSize} style={styles.iconMargin} />
              <Text style={styles.legendText}>{">10km"}</Text>
            </View>
          </View>
        </View>
      ) : (
        // Collapsed view as a separate component
        <TouchableOpacity
          style={[styles.legendContainer, {width: 80, height: 30}]}
          onPress={() => {
            setLegendWasToggled(true);
            setIsLegendExpanded(true);
            
            // Clear the flag after a short delay
            setTimeout(() => setLegendWasToggled(false), 300);
          }}
        >
          <View style={styles.keyHeader}>
            <Text style={styles.legendButtonText}>Key:</Text>
          </View>
        </TouchableOpacity>
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
    backgroundColor: '#0E2435',
    zIndex: 5,
  },
  pickerContainer: {
    position: 'absolute',
    top: 40, // Increase top position to be below safe area
    left: 8,
    zIndex: 20,
    backgroundColor: lightForeColour,
    borderRadius: 10,
    width: 140, // Add explicit width
    height: 55, // Add explicit height
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: '100%',
  },
  infoBox: {
    position: 'absolute',
    top: 40,
    left: '50%',
    width: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 10,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  infoText: { color: lightForeColour, fontSize: 14, fontFamily: 'DarkerGrotesqueRegular' },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
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
});