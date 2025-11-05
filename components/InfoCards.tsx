import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Calendar,
  Sun,
  MapPin,
  CloudSun,
  Cloud,
  Snowflake,
  ThermometerSun,
} from "lucide-react-native";
import * as Location from "expo-location";
import { api } from "../app/api";

export function InfoCards() {
  const [tempC, setTempC] = useState<number | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const daysTogether = useMemo(() => {
    // Calculate whole-day difference between today and 2025-09-03 (inclusive of date boundaries)
    const start = new Date("2025-09-03T00:00:00Z");
    const now = new Date();
    const startUTC = Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate()
    );
    const nowUTC = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    );
    const diffDays = Math.floor((nowUTC - startUTC) / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setWeatherError("Location denied");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;
        // Read cached uuid from AsyncStorage; fallback to 'anonymous'
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
          };
        const cachedUuid =
          (await AsyncStorage.getItem("user:uuid")) || "anonymous";
        const userId = cachedUuid;
        // Open-Meteo current weather API (no API key required)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`;
        const resp = await fetch(url);
        const json = await resp.json();
        const value = json?.current?.temperature_2m;
        if (mounted && typeof value === "number") setTempC(value);

        // Upload my location
        await api.postMyLocation({ lat, lon, userId }).catch(() => {});
        // Fetch other location from server
        const other = await api.getOtherLocation(userId).catch(() => ({
          lat: undefined as unknown as number,
          lon: undefined as unknown as number,
        }));
        if (
          mounted &&
          typeof other?.lat === "number" &&
          typeof other?.lon === "number"
        ) {
          // Haversine distance in km
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const R = 6371; // km
          const dLat = toRad(other.lat - lat);
          const dLon = toRad(other.lon - lon);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat)) *
              Math.cos(toRad(other.lat)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const d = R * c;
          setDistanceKm(d);
        }
      } catch (e: any) {
        if (mounted) setWeatherError(String(e?.message || e));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const WeatherIcon = (() => {
    const t = tempC ?? 20;
    if (t <= 5) return Snowflake;
    if (t <= 12) return Cloud;
    if (t <= 28) return CloudSun;
    if (t > 32) return ThermometerSun;
    return Sun;
  })();

  return (
    <View style={styles.row}>
      <View style={[styles.card, styles.cardSpacing]}>
        <View style={styles.cardRow}>
          <Calendar size={20} color="#111827" />
          <View style={styles.cardCol}>
            <Text style={styles.metric}>
              <Text style={styles.metricStrong}>{daysTogether}</Text> days
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, styles.cardSpacing]}>
        <View style={styles.cardRow}>
          <MapPin size={20} color="#111827" />
          <View style={styles.cardCol}>
            <Text style={styles.metric}>
              <Text style={styles.metricStrong}>
                {distanceKm != null ? Math.max(distanceKm, 0).toFixed(0) : "--"}
              </Text>{" "}
              Km
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <WeatherIcon size={20} color="#111827" />
          <View style={styles.cardCol}>
            <Text style={styles.metric}>
              <Text style={styles.metricStrong}>
                {tempC != null ? Math.round(tempC) : "--"}
              </Text>{" "}
              ℃
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  cardSpacing: { marginRight: 12 },
  card: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardCol: { marginLeft: 8 },
  metric: { color: "#374151" },
  metricStrong: { fontWeight: "600", color: "#111827" },
});
