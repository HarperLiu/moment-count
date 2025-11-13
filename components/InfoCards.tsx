import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  CalendarHeart,
  Sun,
  CloudSun,
  Cloud,
  Snowflake,
  ThermometerSun,
} from "lucide-react-native";
import * as Location from "expo-location";
import { api } from "../app/api";
import { MapComponent } from "./MapComponent";

interface InfoCardsProps {
  relationshipStartDate: Date | null;
}

export function InfoCards({ relationshipStartDate }: InfoCardsProps) {
  const [tempC, setTempC] = useState<number | null>(null);

  const daysTogether = useMemo(() => {
    // If no relationship start date is set, return 0
    if (!relationshipStartDate) {
      return 0;
    }

    // Calculate whole-day difference between today and relationship start date
    const now = new Date();
    const startUTC = Date.UTC(
      relationshipStartDate.getFullYear(),
      relationshipStartDate.getMonth(),
      relationshipStartDate.getDate()
    );
    const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((nowUTC - startUTC) / (1000 * 60 * 60 * 24));

    // Return 0 if the start date is in the future
    return diffDays >= 0 ? diffDays : 0;
  }, [relationshipStartDate]);

  const formatStartDate = (date: Date | null): string => {
    if (!date) return "--";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `Since ${year}-${month}-${day}`;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;

        // Read cached uuid from AsyncStorage
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
          };
        const cachedUuid =
          (await AsyncStorage.getItem("user:uuid")) || "anonymous";

        // Open-Meteo current weather API (no API key required)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`;
        const resp = await fetch(url);
        const json = await resp.json();
        const value = json?.current?.temperature_2m;
        if (mounted && typeof value === "number") setTempC(value);

        // Upload my location
        await api
          .postMyLocation({ lat, lon, userId: cachedUuid })
          .catch(() => {});
      } catch (e: any) {
        // Silent fail for weather/location errors
        console.error("Weather fetch error:", e);
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

  const getWeatherDescription = (): string => {
    const t = tempC ?? 20;
    if (t <= 5) return "A snowy day";
    if (t <= 12) return "A cloudy day";
    if (t <= 28) return "A partly cloudy day";
    if (t > 32) return "A hot day";
    return "A sunny day";
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Left Column: Countdown and Weather */}
        <View style={styles.leftColumn}>
          {/* Countdown Card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <CalendarHeart size={20} color="#111827" />
              <View style={styles.cardCol}>
                <Text style={styles.metric}>
                  <Text style={styles.metricStrong}>{daysTogether}</Text>{" "}
                  {daysTogether === 1 ? "day" : "days"}
                </Text>
              </View>
            </View>
            <Text style={styles.dateText}>
              {formatStartDate(relationshipStartDate)}
            </Text>
          </View>

          {/* Weather Card */}
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
            <Text
              style={styles.weatherDescription}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {getWeatherDescription()}
            </Text>
          </View>
        </View>

        {/* Right Column: Map */}
        <View style={styles.rightColumn}>
          <MapComponent />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  leftColumn: {
    flex: 1,
    gap: 12,
    height: 160,
  },
  rightColumn: {
    flex: 2,
    height: 160,
  },
  card: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    justifyContent: "center",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardCol: {
    marginLeft: 8,
  },
  metric: {
    color: "#374151",
    fontSize: 14,
  },
  metricStrong: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 16,
  },
  dateText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
    textAlign: "center",
  },
  weatherDescription: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
    textAlign: "center",
  },
});
