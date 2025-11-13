import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Plus } from "lucide-react-native";
import { api } from "../app/api";
import { MemoryDetailCard, MemoryDetail } from "./MemoryDetailCard";
type Memory = MemoryDetail & { image: string };

interface MemoriesSectionProps {
  onAddMemory?: () => void;
  onDataLoad?: (hasData: boolean) => void;
}

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

export function MemoriesSection({
  onAddMemory,
  onDataLoad,
}: MemoriesSectionProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Memory | null>(null);
  const skeletonData = useMemo(
    () =>
      Array.from({ length: 4 }).map(
        (_, i) => ({ id: `sk-${i}` } as unknown as Memory)
      ),
    []
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Get user UUID
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
          };
        const userId = (await AsyncStorage.getItem("user:uuid")) || "";

        const data = await api.getMemories(userId);
        if (!mounted) return;
        const mapped: Memory[] = (data || [])
          .map((m) => ({
            id: String((m as any).id),
            image: (m as any).photos?.[0] || "",
            date: (m as any).date || "",
            headline: (m as any).title || "",
            details: (m as any).details || "",
            photos: ((m as any).photos || []).map((p: string) => ({ url: p })),
          }))
          .filter((m) => !!m.image)
          .sort((a, b) => {
            const ta = new Date(a.date).getTime() || 0;
            const tb = new Date(b.date).getTime() || 0;
            return tb - ta;
          })
          .slice(0, 4);
        setMemories(mapped);
        onDataLoad?.(mapped.length > 0);
      } catch (e: any) {
        if (mounted) {
          setError(String(e?.message || e));
          onDataLoad?.(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [onDataLoad]);

  const renderItem = ({ item }: { item: Memory }) => (
    <View style={styles.item}>
      <Pressable style={styles.card} onPress={() => setSelected(item)}>
        {loading ? (
          <SkeletonBox width="100%" height={120} style={{ borderRadius: 16 }} />
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
      </Pressable>
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

  // Show empty state when not loading and no memories
  if (!loading && memories.length === 0) {
    return (
      <>
        <View style={styles.row}>
          <View style={styles.item}>
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={onAddMemory}
              activeOpacity={0.7}
            >
              <View style={styles.emptyContent}>
                <Plus size={32} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Add your memory</Text>
                <Text style={styles.emptyDescription}>
                  Capture special moments
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.item} />
        </View>
      </>
    );
  }

  return (
    <>
      <FlatList
        data={loading ? skeletonData : memories}
        keyExtractor={(m) => String(m.id)}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
      />
      {selected && (
        <MemoryDetailCard memory={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    aspectRatio: 4 / 3,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    padding: 8,
  },
  emptyContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 0,
    flexDirection: "row",
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
