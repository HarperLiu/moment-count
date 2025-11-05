import React, { useEffect, useMemo, useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, Animated } from "react-native";
import { Image } from "expo-image";
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

// Skeleton component with shimmer effect
function SkeletonBox({
  width,
  height,
  style,
}: {
  width?: number | string;
  height: number;
  style?: any;
}) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width || "100%",
          height,
          backgroundColor: "#E5E7EB",
          borderRadius: 8,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function MemoriesSection() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const skeletonData = useMemo(
    () =>
      Array.from({ length: 4 }).map(
        (_, i) => ({ id: `sk-${i}` } as unknown as Memory)
      ),
    []
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api
      .getMemories()
      .then((data) => {
        if (!mounted) return;
        const mapped: Memory[] = (data || [])
          .map((m) => ({
            id: String((m as any).id),
            image: (m as any).photos?.[0] || "",
            date: (m as any).date || "",
          }))
          .filter((m) => !!m.image)
          .sort((a, b) => {
            const ta = new Date(a.date).getTime() || 0;
            const tb = new Date(b.date).getTime() || 0;
            return tb - ta;
          })
          .slice(0, 4);
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
        {loading ? (
          <SkeletonBox width="100%" height={150} style={{ borderRadius: 16 }} />
        ) : (
          <Image
            source={{ uri: item.image }}
            style={styles.photo}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={item.image}
          />
        )}
      </View>
      {loading ? (
        <SkeletonBox
          width={60}
          height={12}
          style={{ marginTop: 8, alignSelf: "center", borderRadius: 4 }}
        />
      ) : (
        <Text style={styles.date}>{formatDate(item.date)}</Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={loading ? skeletonData : memories}
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
    aspectRatio: 1,
    height: undefined,
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
});
