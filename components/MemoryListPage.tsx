import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { ArrowLeft, Plus } from "lucide-react-native";
import { api } from "../app/api";

type MemoryPhoto = { url: string; alt: string };
type MemoryEntry = {
  id: string;
  headline: string;
  details: string;
  date: string;
  photos: MemoryPhoto[];
};

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

function HeadlineAndDetails({
  headline,
  details,
  date,
}: {
  headline: string;
  details: string;
  date: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.headlineRow}>
        <Text style={styles.cardTitle}>{headline}</Text>
        <Text style={styles.cardDate}>{formatDate(date)}</Text>
      </View>
      <Text style={styles.cardDetails}>{details}</Text>
    </View>
  );
}

function PhotoGrid({ photos }: { photos: MemoryPhoto[] }) {
  return (
    <View style={styles.grid2}>
      {photos.map((p, i) => (
        <View key={i} style={styles.gridItem}>
          <Image
            source={{ uri: p.url }}
            style={styles.gridPhoto}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={p.url}
          />
        </View>
      ))}
    </View>
  );
}

function MemoryCard({ memory }: { memory: MemoryEntry }) {
  return (
    <View style={styles.card}>
      <HeadlineAndDetails
        headline={memory.headline}
        details={memory.details}
        date={memory.date}
      />
      <PhotoGrid photos={memory.photos} />
    </View>
  );
}

export function MemoryListPage({
  onBack,
  onAddMemory,
}: {
  onBack: () => void;
  onAddMemory: () => void;
}) {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
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
        const mapped: MemoryEntry[] = (data || [])
          .map((m) => ({
            id: String((m as any).id),
            headline: (m as any).title || "",
            details: (m as any).details || "",
            date: (m as any).date || "",
            photos: ((m as any).photos || []).map((p: string) => ({
              url: p,
              alt: "",
            })),
          }))
          .sort((a, b) => {
            const ta = new Date(a.date).getTime() || 0;
            const tb = new Date(b.date).getTime() || 0;
            return tb - ta;
          });
        setMemories(mapped);
      })
      .catch((e: any) => setError(String(e?.message || e)))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView stickyHeaderIndices={[0]}>
        <View style={styles.stickyHeader}>
          <View style={styles.stickyRow}>
            <View style={styles.leftGroup}>
              <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={20} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.pageTitle}>Memory</Text>
            </View>
            <TouchableOpacity onPress={onAddMemory} style={styles.iconBtn}>
              <Plus size={20} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.feed}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F97316" />
              <Text style={styles.loadingText}>Loading memories...</Text>
            </View>
          )}
          {!!error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {!loading && !error && (
            <>
              {memories.map((m) => (
                <View key={m.id} style={{ marginBottom: 16 }}>
                  <MemoryCard memory={m} />
                </View>
              ))}
              <View style={styles.endRow}>
                <View style={styles.endLine} />
                <Text style={styles.endText}>More is coming</Text>
                <View style={styles.endLine} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  stickyHeader: {
    backgroundColor: "#F8FAFC",
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
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
    color: "#111827",
  },
  feed: { paddingHorizontal: 20, paddingVertical: 16 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 12,
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardDate: { fontSize: 12, color: "#94A3B8" },
  cardDetails: { fontSize: 14, color: "#475569", lineHeight: 20 },

  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 12 as any },
  gridItem: { width: "48%", borderRadius: 12, overflow: "hidden" },
  gridPhoto: { width: "100%", aspectRatio: 1, backgroundColor: "#E5E7EB" },

  endRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12 as any,
    marginVertical: 12,
  },
  endLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
  },
  endText: { fontSize: 13, color: "#94A3B8" },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
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
