import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Image, FlatList } from "react-native";
import { api } from "../app/api";
type Memory = { id: string; image: string; date: string };

// Format date to yyyy-mm-dd
function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
}

export function MemoriesSection() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api
      .getMemories()
      .then((data) => {
        if (!mounted) return;
        const mapped: Memory[] = (data || [])
          .slice(0, 4)
          .map((m) => ({
            id: String((m as any).id),
            image: (m as any).photos?.[0] || "",
            date: (m as any).date || "",
          }))
          .filter((m) => !!m.image);
        setMemories(mapped);
      })
      .catch((e: any) => setError(String(e?.message || e)))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const renderItem = ({ item }: { item: Memory }) => (
    <View style={styles.item}>
      <View style={styles.card}>
        <Image
          source={{ uri: item.image }}
          style={styles.photo}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.date}>{formatDate(item.date)}</Text>
    </View>
  );

  return (
    <FlatList
      data={memories}
      keyExtractor={(m) => String(m.id)}
      renderItem={renderItem}
      numColumns={2}
      columnWrapperStyle={styles.row}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  item: {
    width: "48%",
  },
  card: {
    position: "relative",
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 3,
    height: undefined,
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
});
