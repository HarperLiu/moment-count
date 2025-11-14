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
import { Clock, Plus } from "lucide-react-native";
import { api } from "../app/api";
import { ReceiptDetailCard } from "./ReceiptDetailCard";
import { useTheme } from "../styles/useTheme";

type Receipt = {
  id: string;
  name: string;
  description: string;
  timeCost: string;
  image: string;
};

interface ReceiptItemsProps {
  onAddReceipt?: () => void;
  onDataLoad?: (hasData: boolean) => void;
}

// Format time cost: if hours is 0, only show minutes
function formatTimeCost(hours: number, minutes: number): string {
  if (hours === 0) {
    return `${minutes} min`;
  }
  return `${hours} h ${minutes} min`;
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

export function ReceiptItems({ onAddReceipt, onDataLoad }: ReceiptItemsProps) {
  const theme = useTheme();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Receipt | null>(null);

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

        const data = await api.getReceipts(userId);
        if (!mounted) return;
        const mapped: Receipt[] = (data || []).slice(0, 3).map((r) => ({
          id: String((r as any).id),
          name: (r as any).title || "",
          description: (r as any).details || "",
          timeCost: formatTimeCost(
            (r as any).timeCost?.hours || 0,
            (r as any).timeCost?.minutes || 0
          ),
          image: (r as any).photos?.[0] || "",
        }));
        setReceipts(mapped);
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

  const renderItem = ({ item, index }: { item: Receipt; index: number }) => (
    <Pressable
      onPress={() => setSelected(item)}
      style={[
        styles.row,
        index !== receipts.length - 1 && [
          styles.rowBorder,
          { borderBottomColor: theme.colorBorder },
        ],
      ]}
    >
      <View style={styles.flex1}>
        <Text style={[styles.name, { color: theme.colorForeground }]}>
          {item.name}
        </Text>
        <Text
          style={[styles.desc, { color: theme.colorMutedForeground }]}
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {item.description}
        </Text>
        <View style={styles.timeRow}>
          <Clock size={14} color={theme.colorForeground} />
          <Text style={[styles.timeText, { color: theme.colorForeground }]}>
            {item.timeCost}
          </Text>
        </View>
      </View>
      <View>
        <Image
          source={{ uri: item.image }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={item.image}
        />
      </View>
    </Pressable>
  );

  if (loading) {
    // Receipt skeleton: 3 rows, each row has title, description, time, and image
    return (
      <>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ marginBottom: i !== 3 ? 16 : 0 }}>
            <View style={[styles.row, i !== 3 && styles.rowBorder]}>
              <View style={styles.flex1}>
                <SkeletonBox
                  width={140}
                  height={16}
                  style={{ marginBottom: 4, borderRadius: 4 }}
                />
                <SkeletonBox
                  width="100%"
                  height={13}
                  style={{ marginBottom: 4, borderRadius: 4 }}
                />
                <SkeletonBox
                  width="85%"
                  height={13}
                  style={{ marginBottom: 8, borderRadius: 4 }}
                />
                <View style={styles.timeRow}>
                  <SkeletonBox
                    width={14}
                    height={14}
                    style={{ borderRadius: 7 }}
                  />
                  <SkeletonBox
                    width={60}
                    height={13}
                    style={{ marginLeft: 4, borderRadius: 4 }}
                  />
                </View>
              </View>
              <View>
                <SkeletonBox
                  width={96}
                  height={96}
                  style={{ borderRadius: 16 }}
                />
              </View>
            </View>
          </View>
        ))}
      </>
    );
  }

  // Show empty state when not loading and no receipts
  if (!loading && receipts.length === 0) {
    return (
      <>
        <TouchableOpacity
          style={styles.emptyRow}
          onPress={onAddReceipt}
          activeOpacity={0.7}
        >
          <View style={styles.emptyTextContainer}>
            <Text style={styles.emptyTitle}>Add your first receipt</Text>
            <Text style={styles.emptyDescription}>
              Start building your receipt collection
            </Text>
          </View>
          <View style={styles.emptyImagePlaceholder}>
            <Plus size={24} color="#94A3B8" />
          </View>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <>
      <FlatList
        data={receipts}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        scrollEnabled={false}
      />
      {selected && (
        <ReceiptDetailCard
          receipt={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  emptyRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 12 as any,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  emptyTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 13,
    color: "#94A3B8",
  },
  emptyImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: 12 as any,
    paddingBottom: 16,
    alignItems: "flex-start",
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  flex1: { flex: 1, minHeight: 96, justifyContent: "space-between" },
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
    marginRight: 4,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 as any },
  timeText: { marginLeft: 4, fontSize: 13, color: "#111827" },
  cover: { width: 96, height: 96, borderRadius: 16 },
});
