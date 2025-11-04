import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Calendar, Sun, MapPin } from "lucide-react-native";

export function InfoCards() {
  const daysTogether = useMemo(() => {
    const startDate = new Date("2025-09-03").getTime();
    const today = Date.now();
    return Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  }, []);

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
          <Sun size={20} color="#111827" />
          <View style={styles.cardCol}>
            <Text style={styles.metric}>
              <Text style={styles.metricStrong}>27</Text> ℃
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
