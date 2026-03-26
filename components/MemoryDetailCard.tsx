import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  FlatList,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { X, Calendar, Pencil, Trash2 } from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

export type MemoryPhoto = { url: string; alt?: string };
export type MemoryDetail = {
  id: string | number;
  headline: string;
  details: string;
  date: string;
  photos: MemoryPhoto[];
  userId?: string; // creator's user_id
};

export function MemoryDetailCard({
  memory,
  initialImageIndex = 0,
  onClose,
  currentUserId,
  onEdit,
  onDelete,
}: {
  memory: MemoryDetail;
  initialImageIndex?: number;
  onClose: () => void;
  currentUserId?: string;
  onEdit?: (memory: MemoryDetail) => void;
  onDelete?: (memoryId: string) => void;
}) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [index, setIndex] = useState(
    Math.min(initialImageIndex, Math.max(0, (memory.photos?.length || 1) - 1))
  );
  const windowWidth = Dimensions.get("window").width;
  const [carouselWidth, setCarouselWidth] = useState<number>(0);
  const listRef = useRef<FlatList<MemoryPhoto>>(null);

  const photos = useMemo(() => memory.photos || [], [memory.photos]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (carouselWidth > 0) {
      const page = Math.round(e.nativeEvent.contentOffset.x / carouselWidth);
      if (page !== index) setIndex(page);
    }
  };

  const formattedDate = useMemo(() => {
    const d = new Date(memory.date);
    if (isNaN(d.getTime())) return memory.date;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }, [memory.date]);

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colorCard }]}>
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeBtn,
              { backgroundColor: theme.colorCard + "E6" },
            ]}
          >
            <X size={18} color={theme.colorForeground} />
          </TouchableOpacity>

          <View
            style={[styles.carouselBox, { backgroundColor: theme.colorMuted }]}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w && w !== carouselWidth) setCarouselWidth(w);
            }}
          >
            {carouselWidth > 0 && (
              <FlatList
                ref={listRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScrollEnd}
                data={
                  photos.length > 0 ? photos : ([{ url: "" }] as MemoryPhoto[])
                }
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item }) => (
                  <View
                    style={{
                      width: carouselWidth,
                      height: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {item.url ? (
                      <Image
                        source={{ uri: item.url }}
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                        recyclingKey={item.url}
                      />
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: theme.colorMuted,
                        }}
                      />
                    )}
                  </View>
                )}
                initialScrollIndex={index}
                getItemLayout={(_, i) => ({
                  length: carouselWidth,
                  offset: carouselWidth * i,
                  index: i,
                })}
                snapToInterval={carouselWidth}
                snapToAlignment="center"
                decelerationRate="fast"
              />
            )}

            {photos.length > 1 && (
              <View style={styles.indicators}>
                {photos.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === index ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.content}>
            <Text style={[styles.headline, { color: theme.colorForeground }]}>
              {memory.headline}
            </Text>
            <View style={styles.dateRow}>
              <Calendar size={14} color={theme.colorMutedForeground} />
              <Text
                style={[styles.dateText, { color: theme.colorMutedForeground }]}
              >
                {formattedDate}
              </Text>
            </View>
            <Text
              style={[styles.details, { color: theme.colorMutedForeground }]}
            >
              {memory.details}
            </Text>
            <View style={styles.actionRow}>
              {currentUserId && memory.userId === currentUserId && onEdit && (
                <TouchableOpacity
                  onPress={() => onEdit(memory)}
                  style={[styles.actionBtn, { backgroundColor: theme.colorSecondary }]}
                >
                  <Pencil size={14} color={theme.colorForeground} />
                  <Text style={[styles.actionBtnText, { color: theme.colorForeground }]}>
                    {t("memory.edit")}
                  </Text>
                </TouchableOpacity>
              )}
              {currentUserId && memory.userId === currentUserId && onDelete && (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      t("memory.deleteConfirm"),
                      t("memory.deleteConfirmMessage"),
                      [
                        { text: t("common.cancel"), style: "cancel" },
                        {
                          text: t("memory.delete"),
                          style: "destructive",
                          onPress: () => onDelete(String(memory.id)),
                        },
                      ]
                    );
                  }}
                  style={[styles.actionBtn, { backgroundColor: theme.colorDestructive }]}
                >
                  <Trash2 size={14} color={theme.colorDestructiveForeground} />
                  <Text style={[styles.actionBtnText, { color: theme.colorDestructiveForeground }]}>
                    {t("memory.delete")}
                  </Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={onClose}
                style={[styles.primaryBtn, { backgroundColor: theme.colorPrimary }]}
              >
                <Text style={[styles.primaryBtnText, { color: theme.colorPrimaryForeground }]}>
                  {t("common.close")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselBox: {
    width: "100%",
    aspectRatio: 1,
  },
  indicators: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6 as any,
  },
  dot: { height: 6, borderRadius: 3 },
  dotInactive: { width: 6, backgroundColor: "rgba(255,255,255,0.45)" },
  dotActive: { width: 24, backgroundColor: "rgba(255,255,255,0.9)" },
  content: { padding: 16 },
  headline: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6 as any,
    marginBottom: 8,
  },
  dateText: { fontSize: 13 },
  details: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8 as any,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6 as any,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    minHeight: 44,
  },
  actionBtnText: { fontSize: 14, fontWeight: "600" },
  primaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    minHeight: 44,
  },
  primaryBtnText: { fontSize: 14, fontWeight: "600" },
});
