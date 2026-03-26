import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { ArrowLeft, Plus, ImagePlus } from "lucide-react-native";
import { api } from "../app/api";
import { MemoryDetailCard, MemoryDetail } from "./MemoryDetailCard";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

const PAGE_SIZE = 10;

type MemoryPhoto = { url: string; alt: string };
type MemoryEntry = {
  id: string;
  headline: string;
  details: string;
  date: string;
  photos: MemoryPhoto[];
  userId?: string; // creator's user_id
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
  theme,
}: {
  photos: MemoryPhoto[];
  onPhotoPress?: (index: number) => void;
  theme: any;
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
            style={[styles.gridPhoto, { backgroundColor: theme.colorMuted }]}
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
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: theme.colorCard, borderColor: theme.colorBorder, transform: [{ scale }] },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <HeadlineAndDetails
          headline={memory.headline}
          details={memory.details}
          date={memory.date}
          theme={theme}
        />
      </TouchableOpacity>
      <PhotoGrid photos={memory.photos} onPhotoPress={onPhotoPress} theme={theme} />
    </Animated.View>
  );
}

export function MemoryListPage({
  onBack,
  onAddMemory,
  onEditMemory,
  refreshKey,
  linkedUser,
}: {
  onBack: () => void;
  onAddMemory: () => void;
  onEditMemory?: (memory: {
    id: string;
    title: string;
    details: string;
    photos: string[];
    date: string;
  }) => void;
  refreshKey?: number;
  linkedUser: string | null;
}) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [allMemories, setAllMemories] = useState<MemoryEntry[]>([]);
  const [displayCount, setDisplayCount] = useState<number>(PAGE_SIZE);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MemoryEntry | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default as {
          getItem: (k: string) => Promise<string | null>;
        };
      const userId = (await AsyncStorage.getItem("user:uuid")) || "";
      setCurrentUserId(userId);

      const data = await api.getMemories(userId);
      const mapped: MemoryEntry[] = (data || [])
        .map((m) => ({
          id: String((m as any).id),
          headline: (m as any).title || "",
          details: (m as any).details || "",
          date: (m as any).date || "",
          userId: (m as any).user_id || "",
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
      setAllMemories(mapped);
      setDisplayCount(PAGE_SIZE);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories, refreshKey]);

  const handleDelete = async (memoryId: string) => {
    try {
      await api.deleteMemory(memoryId, { userId: currentUserId });
      setSelected(null);
      fetchMemories();
    } catch (e: any) {
      Alert.alert(t("common.error"), t("memory.deleteError"));
    }
  };

  const memories = useMemo(
    () => allMemories.slice(0, displayCount),
    [allMemories, displayCount]
  );
  const hasMore = displayCount < allMemories.length;

  const loadMore = () => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, allMemories.length));
  };

  const handleEdit = (memory: MemoryDetail) => {
    setSelected(null);
    if (onEditMemory) {
      onEditMemory({
        id: String(memory.id),
        title: memory.headline,
        details: memory.details,
        photos: memory.photos.map((p) => p.url),
        date: memory.date,
      });
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorBackground }]}
    >
      <ScrollView stickyHeaderIndices={[0]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colorBackground,
              borderBottomColor: theme.colorBorder,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <ArrowLeft size={22} color={theme.colorForeground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colorForeground }]}>
              {t("memory.title")}
            </Text>
            {linkedUser ? (
              <TouchableOpacity onPress={onAddMemory} style={styles.backBtn}>
                <Plus size={22} color={theme.colorForeground} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 30 }} />
            )}
          </View>
        </View>

        <View style={styles.feed}>
          {!linkedUser ? (
            <View style={styles.emptyState}>
              <ImagePlus size={40} color={theme.colorMutedForeground} />
              <Text style={[styles.emptyTitle, { color: theme.colorForeground }]}>
                {t("memory.empty")}
              </Text>
              <Text style={[styles.emptyDescription, { color: theme.colorMutedForeground }]}>
                {t("memory.notLinked")}
              </Text>
            </View>
          ) : (
          <>
          {loading && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={theme.colorPrimary} />
            </View>
          )}
          {!!error && (
            <View
              style={[
                styles.errorContainer,
                {
                  backgroundColor: theme.colorDestructive + "15",
                  borderColor: theme.colorDestructive + "40",
                },
              ]}
            >
              <Text style={[styles.errorText, { color: theme.colorDestructive }]}>
                {error}
              </Text>
            </View>
          )}
          {!loading && !error && allMemories.length === 0 && (
            <View style={styles.emptyState}>
              <ImagePlus size={40} color={theme.colorMutedForeground} />
              <Text style={[styles.emptyTitle, { color: theme.colorForeground }]}>
                {t("memory.empty")}
              </Text>
              <Text style={[styles.emptyDescription, { color: theme.colorMutedForeground }]}>
                {t("memory.emptyDesc")}
              </Text>
            </View>
          )}
          {!loading && !error && allMemories.length > 0 && (
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
                  currentUserId={currentUserId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
              {hasMore && (
                <TouchableOpacity
                  onPress={loadMore}
                  style={[
                    styles.loadMoreBtn,
                    { backgroundColor: theme.colorSecondary },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.loadMoreText,
                      { color: theme.colorPrimary },
                    ]}
                  >
                    {t("memory.seeMore")}
                  </Text>
                </TouchableOpacity>
              )}
              {!hasMore && (
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
                    {t("common.moreIsComing")}
                  </Text>
                  <View
                    style={[
                      styles.endLine,
                      { backgroundColor: theme.colorBorder },
                    ]}
                  />
                </View>
              )}
            </>
          )}
          </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  feed: { paddingHorizontal: 20, paddingVertical: 16 },

  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
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
  gridPhoto: { width: "100%", aspectRatio: 1 },

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
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed" as any,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyDescription: {
    fontSize: 14,
  },
  loadMoreBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
