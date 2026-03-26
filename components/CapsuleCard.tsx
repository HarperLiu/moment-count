import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Hourglass, ChevronRight } from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";
import { api, Capsule } from "../app/api";

interface CapsuleCardProps {
  onPress: () => void;
  userId: string | null;
  linkKey: string | null;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${m}-${day}`;
  } catch {
    return "";
  }
}

export function CapsuleCard({ onPress, userId, linkKey }: CapsuleCardProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [readyCount, setReadyCount] = useState(0);
  const [nextUnlock, setNextUnlock] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !linkKey) return;
    (async () => {
      try {
        const capsules = await api.getCapsules(userId, linkKey);
        const now = new Date();
        const received = capsules.filter((c) => c.recipientId === userId);

        // Count capsules ready to open
        const ready = received.filter(
          (c) => !c.openedAt && !c.destroyed && new Date(c.unlockAt) <= now
        );
        setReadyCount(ready.length);

        // Find next upcoming unlock
        const sealed = received.filter(
          (c) => !c.openedAt && !c.destroyed && new Date(c.unlockAt) > now
        );
        if (sealed.length > 0) {
          sealed.sort((a, b) => new Date(a.unlockAt).getTime() - new Date(b.unlockAt).getTime());
          setNextUnlock(sealed[0].unlockAt);
        }
      } catch {
        // silent
      }
    })();
  }, [userId, linkKey]);

  const subtitle = readyCount > 0
    ? t("capsule.readyToOpen").replace("{count}", String(readyCount))
    : nextUnlock
      ? t("capsule.nextUnlock").replace("{date}", formatDate(nextUnlock))
      : t("capsule.noCapsules");

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colorCard, borderColor: theme.colorBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colorPrimary + "15" }]}>
          <Hourglass size={20} color={theme.colorPrimary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.title, { color: theme.colorForeground }]}>
            {t("capsule.title")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colorMutedForeground }]}>
            {subtitle}
          </Text>
        </View>
        <ChevronRight size={18} color={theme.colorMutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15, fontWeight: "600" },
  subtitle: { fontSize: 12, marginTop: 2 },
});
