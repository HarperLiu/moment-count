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
} from "react-native";
import { Image } from "expo-image";
import { X, Calendar } from "lucide-react-native";

export type MemoryPhoto = { url: string; alt?: string };
export type MemoryDetail = {
  id: string | number;
  headline: string;
  details: string;
  date: string;
  photos: MemoryPhoto[];
};

export function MemoryDetailCard({
  memory,
  initialImageIndex = 0,
  onClose,
}: {
  memory: MemoryDetail;
  initialImageIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(
    Math.min(initialImageIndex, Math.max(0, (memory.photos?.length || 1) - 1))
  );
  const windowWidth = Dimensions.get("window").width;
  const [carouselWidth, setCarouselWidth] = useState<number>(0);
  const listRef = useRef<FlatList<MemoryPhoto>>(null);

  const photos = useMemo(() => memory.photos || [], [memory.photos]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const w = carouselWidth || windowWidth;
    const page = Math.round(e.nativeEvent.contentOffset.x / w);
    if (page !== index) setIndex(page);
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
        <View style={styles.card}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={18} color="#111827" />
          </TouchableOpacity>

          <View
            style={styles.carouselBox}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w && w !== carouselWidth) setCarouselWidth(w);
            }}
          >
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
                <View style={{ width: carouselWidth || windowWidth }}>
                  {item.url ? (
                    <Image
                      source={{ uri: item.url }}
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#000",
                      }}
                      contentFit="contain"
                      transition={200}
                      cachePolicy="memory-disk"
                      recyclingKey={item.url}
                    />
                  ) : (
                    <View
                      style={{
                        width: carouselWidth || windowWidth,
                        height: "100%",
                        backgroundColor: "#E5E7EB",
                      }}
                    />
                  )}
                </View>
              )}
              initialScrollIndex={index}
              getItemLayout={(_, i) => ({
                length: carouselWidth || windowWidth,
                offset: (carouselWidth || windowWidth) * i,
                index: i,
              })}
              removeClippedSubviews
              decelerationRate="fast"
            />

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
            <Text style={styles.headline}>{memory.headline}</Text>
            <View style={styles.dateRow}>
              <Calendar size={14} color="#475569" />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            <Text style={styles.details}>{memory.details}</Text>
            <View style={{ alignItems: "flex-end" }}>
              <TouchableOpacity onPress={onClose} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Close</Text>
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  carouselBox: { width: "100%", height: 288, backgroundColor: "#E5E7EB" },
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
  dotInactive: { width: 6, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { width: 24, backgroundColor: "#FFFFFF" },
  content: { padding: 16 },
  headline: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6 as any,
    marginBottom: 8,
  },
  dateText: { fontSize: 13, color: "#475569" },
  details: { fontSize: 14, color: "#475569", lineHeight: 20, marginBottom: 16 },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F97316",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});
