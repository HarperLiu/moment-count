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
import { MemoryDetailCard } from "./MemoryDetailCard";
import { useThemeContext } from "../styles/ThemeContext";

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
  theme,
}: {
  headline: string;
  details: string;
  date: string;
  theme: any;
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.headlineRow}>
        <Text style={[styles.cardTitle, { color: theme.colorForeground }]}>
          {headline}
        </Text>
        <Text style={[styles.cardDate, { color: theme.colorMutedForeground }]}>
          {formatDate(date)}
        </Text>
      </View>
      <Text style={[styles.cardDetails, { color: theme.colorMutedForeground }]}>
        {details}
      </Text>
    </View>
  );
}

function PhotoGrid({
  photos,
  onPhotoPress,
}: {
  photos: MemoryPhoto[];
  onPhotoPress?: (index: number) => void;
}) {
  return (
    <View style={styles.grid2}>
      {photos.map((p, i) => (
        <TouchableOpacity
          key={i}
          style={styles.gridItem}
          onPress={() => onPhotoPress?.(i)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: p.url }}
            style={styles.gridPhoto}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={p.url}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MemoryCard({
  memory,
  onPress,
  onPhotoPress,
  theme,
}: {
  memory: MemoryEntry;
  onPress: () => void;
  onPhotoPress?: (index: number) => void;
  theme: any;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colorCard, borderColor: theme.colorBorder },
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <HeadlineAndDetails
          headline={memory.headline}
          details={memory.details}
          date={memory.date}
          theme={theme}
        />
      </TouchableOpacity>
      <PhotoGrid photos={memory.photos} onPhotoPress={onPhotoPress} />
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
  const { theme } = useThemeContext();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MemoryEntry | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

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
                Memory
              </Text>
            </View>
            <TouchableOpacity onPress={onAddMemory} style={styles.iconBtn}>
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
                Loading memories...
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
              {memories.map((m) => (
                <View key={m.id} style={{ marginBottom: 16 }}>
                  <MemoryCard
                    memory={m}
                    onPress={() => {
                      setSelected(m);
                      setSelectedImageIndex(0);
                    }}
                    onPhotoPress={(index) => {
                      setSelected(m);
                      setSelectedImageIndex(index);
                    }}
                    theme={theme}
                  />
                </View>
              ))}
              {selected && (
                <MemoryDetailCard
                  memory={selected}
                  initialImageIndex={selectedImageIndex}
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

  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
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
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardDate: { fontSize: 12 },
  cardDetails: { fontSize: 14, lineHeight: 20 },

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
  },
  endText: { fontSize: 13 },
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
