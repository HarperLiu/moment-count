import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { ArrowLeft, Plus, Clock } from "lucide-react-native";
import { api } from "../app/api";
import { useThemeContext } from "../styles/ThemeContext";
import { ReceiptDetailCard } from "./ReceiptDetailCard";

type Receipt = {
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

function ReceiptCard({ receipt, theme }: { receipt: Receipt; theme: any }) {
  return (
    <View
      style={[
        styles.row,
        styles.rowBorder,
        { borderBottomColor: theme.colorBorder },
      ]}
    >
      <View style={styles.flex1}>
        <Text style={[styles.name, { color: theme.colorForeground }]}>
          {receipt.name}
        </Text>
        <Text
          style={[styles.desc, { color: theme.colorMutedForeground }]}
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {receipt.description}
        </Text>
        <View style={styles.timeRow}>
          <Clock size={14} color={theme.colorForeground} />
          <Text style={[styles.timeText, { color: theme.colorForeground }]}>
            {receipt.timeCost}
          </Text>
        </View>
      </View>
      <View>
        <Image
          source={{ uri: receipt.image }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={receipt.image}
        />
      </View>
    </View>
  );
}

export function CookingReceiptListPage({
  onBack,
  onAddReceipt,
}: {
  onBack: () => void;
  onAddReceipt: () => void;
}) {
  const { theme } = useThemeContext();
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
        const mapped: Receipt[] = (data || []).map((r) => ({
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
      } catch (e: any) {
        if (mounted) setError(String(e?.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorBackground }]}
    >
      <ScrollView stickyHeaderIndices={[0]}>
        <View
          style={[
            styles.stickyHeader,
            {
              backgroundColor: theme.colorBackground,
              borderBottomColor: theme.colorBorder,
            },
          ]}
        >
          <View style={styles.stickyRow}>
            <View style={styles.leftGroup}>
              <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={20} color={theme.colorForeground} />
              </TouchableOpacity>
              <Text
                style={[styles.pageTitle, { color: theme.colorForeground }]}
              >
                Cooking Receipt
              </Text>
            </View>
            <TouchableOpacity onPress={onAddReceipt} style={styles.iconBtn}>
              <Plus size={20} color={theme.colorForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.feed}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F97316" />
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.colorMutedForeground },
                ]}
              >
                Loading receipts...
              </Text>
            </View>
          )}
          {!!error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {!loading && !error && (
            <>
              <FlatList
                data={receipts}
                keyExtractor={(r) => String(r.id)}
                renderItem={({ item, index }) => (
                  <View
                    style={{
                      marginBottom: index === receipts.length - 1 ? 0 : 16,
                    }}
                  >
                    <Pressable onPress={() => setSelected(item)}>
                      <ReceiptCard receipt={item} theme={theme} />
                    </Pressable>
                  </View>
                )}
                scrollEnabled={false}
              />
              {selected && (
                <ReceiptDetailCard
                  receipt={selected}
                  onClose={() => setSelected(null)}
                />
              )}
              <View style={styles.endRow}>
                <View
                  style={[
                    styles.endLine,
                    { backgroundColor: theme.colorBorder },
                  ]}
                />
                <Text
                  style={[
                    styles.endText,
                    { color: theme.colorMutedForeground },
                  ]}
                >
                  More is coming
                </Text>
                <View
                  style={[
                    styles.endLine,
                    { backgroundColor: theme.colorBorder },
                  ]}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  stickyHeader: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftGroup: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "700",
  },
  feed: { paddingHorizontal: 20, paddingVertical: 16 },

  row: { flexDirection: "row", alignItems: "flex-start" },
  rowBorder: {
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flex1: { flex: 1, minHeight: 96, justifyContent: "space-between" },
  name: { marginBottom: 4, fontSize: 16, fontWeight: "700" },
  desc: { fontSize: 13, marginBottom: 8, marginRight: 4 },
  timeRow: { flexDirection: "row", alignItems: "center" },
  timeText: { marginLeft: 4, fontSize: 13 },
  cover: { width: 96, height: 96, borderRadius: 16 },

  endRow: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  endLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  endText: { fontSize: 13, marginHorizontal: 12 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
  },
});

// removed legacy styles from placeholder implementation
