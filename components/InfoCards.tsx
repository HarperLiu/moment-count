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

export function InfoCards() {
  const [tempC, setTempC] = useState<number | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const daysTogether = useMemo(() => {
    const startDate = new Date("2025-09-03").getTime();
    const today = Date.now();
    return Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
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
        // Open-Meteo current weather API (no API key required)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`;
        const resp = await fetch(url);
        const json = await resp.json();
        const value = json?.current?.temperature_2m;
        if (mounted && typeof value === "number") setTempC(value);
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
              <Text style={styles.metricStrong}>17</Text> KMs
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
