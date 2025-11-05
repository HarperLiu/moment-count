import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, FlatList } from "react-native";
import { Clock } from "lucide-react-native";
import { api } from "../app/api";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  timeCost: string;
  image: string;
};

// Format time cost: if hours is 0, only show minutes
function formatTimeCost(hours: number, minutes: number): string {
  if (hours === 0) {
    return `${minutes} min`;
  }
  return `${hours} h ${minutes} min`;
}

export function MenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api
      .getRecipes()
      .then((data) => {
        if (!mounted) return;
        const mapped: MenuItem[] = (data || []).slice(0, 5).map((r) => ({
          id: String((r as any).id),
          name: (r as any).title || "",
          description: (r as any).details || "",
          timeCost: formatTimeCost(
            (r as any).timeCost?.hours || 0,
            (r as any).timeCost?.minutes || 0
          ),
          image: (r as any).photos?.[0] || "",
        }));
        setMenuItems(mapped);
      })
      .catch((e: any) => setError(String(e?.message || e)))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const renderItem = ({ item, index }: { item: MenuItem; index: number }) => (
    <View
      style={[styles.row, index !== menuItems.length - 1 && styles.rowBorder]}
    >
      <View style={styles.flex1}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.timeRow}>
          <Clock size={14} color="#111827" />
          <Text style={styles.timeText}>{item.timeCost}</Text>
        </View>
      </View>
      <View>
        <Image source={{ uri: item.image }} style={styles.cover} />
      </View>
    </View>
  );

  return (
    <FlatList
      data={menuItems}
      keyExtractor={(i) => String(i.id)}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12 as any,
    paddingBottom: 16,
    alignItems: "center",
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  flex1: { flex: 1 },
  name: {
    marginBottom: 4,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  desc: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 as any },
  timeText: { marginLeft: 4, fontSize: 13, color: "#111827" },
  cover: { width: 96, height: 96, borderRadius: 16 },
});
