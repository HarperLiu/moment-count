import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Image } from "expo-image";
import { X, Clock } from "lucide-react-native";

export type RecipeForCard = {
  id: string | number;
  name: string;
  description: string;
  timeCost: string;
  image: string;
};

export function RecipeDetailCard({
  recipe,
  onClose,
}: {
  recipe: RecipeForCard;
  onClose: () => void;
}) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={onClose}
        />
        <View style={styles.cardWrapper}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={18} color="#111827" />
          </TouchableOpacity>

          <View style={styles.imageBox}>
            <Image
              source={{ uri: recipe.image }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              recyclingKey={recipe.image}
            />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{recipe.name}</Text>

            <View style={styles.timeRow}>
              <Clock size={14} color="#475569" />
              <Text style={styles.timeText}>{recipe.timeCost}</Text>
            </View>

            <Text style={styles.desc}>{recipe.description}</Text>

            <View style={styles.actions}>
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
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  cardWrapper: {
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
  imageBox: { width: "100%", height: 200, backgroundColor: "#E5E7EB" },
  image: { width: "100%", height: "100%" },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6 as any,
    marginBottom: 8,
  },
  timeText: { fontSize: 13, color: "#475569" },
  desc: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end" },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#0F172A",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});
