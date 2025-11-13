import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { MapPin } from "lucide-react-native";
import { api } from "../app/api";

export function MapComponent() {
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [otherLocation, setOtherLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (mounted) {
            setError("Location permission denied");
            setLoading(false);
          }
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;

        if (mounted) {
          setMyLocation({ lat, lon });
        }

        // Get user ID and linked user
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
          };
        const cachedUuid =
          (await AsyncStorage.getItem("user:uuid")) || "anonymous";
        const linkedUser = await AsyncStorage.getItem("user:linkedUser");

        // Only fetch other location if there's a linked user
        if (linkedUser && linkedUser.trim()) {
          const other = await api
            .getOtherLocation(cachedUuid)
            .catch(() => null);

          const isValidLocation =
            other &&
            typeof other.lat === "number" &&
            typeof other.lon === "number" &&
            isFinite(other.lat) &&
            isFinite(other.lon) &&
            other.lat !== 0 &&
            other.lon !== 0;

          if (mounted && isValidLocation) {
            setOtherLocation({ lat: other.lat, lon: other.lon });
          }
        }
      } catch (e: any) {
        if (mounted) {
          setError(String(e?.message || e));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#F97316" />
      </View>
    );
  }

  if (error || !myLocation) {
    return (
      <View style={styles.container}>
        <MapPin size={20} color="#94A3B8" />
        <Text style={styles.errorText}>Map unavailable</Text>
      </View>
    );
  }

  // Calculate region to show both markers
  const region = (() => {
    if (otherLocation) {
      const minLat = Math.min(myLocation.lat, otherLocation.lat);
      const maxLat = Math.max(myLocation.lat, otherLocation.lat);
      const minLon = Math.min(myLocation.lon, otherLocation.lon);
      const maxLon = Math.max(myLocation.lon, otherLocation.lon);

      const latDelta = Math.max((maxLat - minLat) * 1.5, 0.05);
      const lonDelta = Math.max((maxLon - minLon) * 1.5, 0.05);

      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLon + maxLon) / 2,
        latitudeDelta: latDelta,
        longitudeDelta: lonDelta,
      };
    }

    // Only my location
    return {
      latitude: myLocation.lat,
      longitude: myLocation.lon,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  })();

  // Custom marker component
  const CustomMarker = ({ color }: { color: string }) => (
    <MapPin size={32} color={"#FFFFFF"} fill={color} strokeWidth={2.5} />
  );

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {/* My Location Marker */}
        <Marker
          coordinate={{
            latitude: myLocation.lat,
            longitude: myLocation.lon,
          }}
          title="You"
          anchor={{ x: 0.5, y: 1 }}
        >
          <CustomMarker color="#007AFF" />
        </Marker>

        {/* Other Location Marker */}
        {otherLocation && (
          <Marker
            coordinate={{
              latitude: otherLocation.lat,
              longitude: otherLocation.lon,
            }}
            title="Partner"
            anchor={{ x: 0.5, y: 1 }}
          >
            <CustomMarker color="#FF5E5E" />
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  errorText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 8,
  },
});
