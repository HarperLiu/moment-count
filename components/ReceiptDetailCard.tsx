import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Image } from "expo-image";
import { X, Clock } from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";

export type ReceiptForCard = {
  id: string | number;
  name: string;
  description: string;
  timeCost: string;
  image: string;
};

export function ReceiptDetailCard({
  receipt,
  onClose,
}: {
  receipt: ReceiptForCard;
  onClose: () => void;
}) {
  const { theme } = useThemeContext();

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
        <View
          style={[styles.cardWrapper, { backgroundColor: theme.colorCard }]}
        >
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
            style={[styles.imageBox, { backgroundColor: theme.colorMuted }]}
          >
            <Image
              source={{ uri: receipt.image }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              recyclingKey={receipt.image}
            />
          </View>

          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.colorForeground }]}>
              {receipt.name}
            </Text>

            <View style={styles.timeRow}>
              <Clock size={14} color={theme.colorMutedForeground} />
              <Text
                style={[styles.timeText, { color: theme.colorMutedForeground }]}
              >
                {receipt.timeCost}
              </Text>
            </View>

            <Text style={[styles.desc, { color: theme.colorMutedForeground }]}>
              {receipt.description}
            </Text>

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
  imageBox: { width: "100%", height: 200 },
  image: { width: "100%", height: "100%" },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6 as any,
    marginBottom: 8,
  },
  timeText: { fontSize: 13 },
  desc: {
    fontSize: 14,
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
