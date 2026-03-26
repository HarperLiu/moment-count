import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Easing,
  Dimensions,
} from "react-native";
import {
  ArrowLeft,
  Plus,
  Hourglass,
  Lock,
  Trash2,
} from "lucide-react-native";
import { api, Capsule } from "../app/api";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type CapsuleStatus = "sealed" | "ready" | "opened" | "destroyed";

function getCapsuleStatus(capsule: Capsule, userId: string): CapsuleStatus {
  if (capsule.destroyed) return "destroyed";
  if (capsule.openedAt) return "opened";
  const isRecipient = capsule.recipientId === userId;
  if (isRecipient && new Date() >= new Date(capsule.unlockAt)) return "ready";
  return "sealed";
}

function getDaysUntilUnlock(unlockAt: string): number {
  const now = new Date();
  const unlock = new Date(unlockAt);
  const diff = unlock.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return dateStr;
  }
}

// ─── Pulsing dot ───────────────────────────────────────────────
function PulsingDot({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, opacity: anim }}
    />
  );
}

// ─── Confetti particle ─────────────────────────────────────────
const CONFETTI_COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF",
  "#FF78C4", "#A66CFF", "#FFB26B", "#54BAB9",
  "#F94C10", "#C3FF99", "#FFF56D", "#FF74B1",
];
const CONFETTI_COUNT = 70;

function ConfettiPiece({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const startX = SCREEN_WIDTH * 0.5 + (Math.random() - 0.5) * 60;
  const endX = startX + (Math.random() - 0.5) * SCREEN_WIDTH * 1.2;
  const endY = SCREEN_HEIGHT * 0.3 + Math.random() * SCREEN_HEIGHT * 0.7;
  const size = 6 + Math.random() * 8;
  const isCircle = Math.random() > 0.5;
  const duration = 1200 + Math.random() * 800;
  const delay = Math.random() * 300;
  const rotateEnd = 360 + Math.random() * 720;

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [startX, endX] });
  const translateY = progress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [SCREEN_HEIGHT * 0.45, SCREEN_HEIGHT * 0.45 - 120 - Math.random() * 100, endY],
  });
  const opacity = progress.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${rotateEnd}deg`] });
  const scale = progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0.6] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: size,
        height: isCircle ? size : size * 2.5,
        borderRadius: isCircle ? size / 2 : 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }, { scale }],
      }}
    />
  );
}

// ─── Capsule open animation overlay (transparent bg) ───────────
function CapsuleOpenOverlay({ onFinished, themeColor }: { onFinished: () => void; themeColor: string }) {
  const capsuleScale = useRef(new Animated.Value(0)).current;
  const capsuleShake = useRef(new Animated.Value(0)).current;
  const capsuleSplit = useRef(new Animated.Value(0)).current;
  const capsuleOpacity = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const [phase, setPhase] = useState<"enter" | "shake" | "burst" | "done">("enter");

  useEffect(() => {
    // Fade in semi-transparent backdrop
    Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Phase 1: capsule appears
    Animated.spring(capsuleScale, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start(() => {
      setPhase("shake");

      // Phase 2: shake
      const shakes = Array.from({ length: 8 }, (_, i) => {
        const amp = 3 + i * 1.5;
        return Animated.sequence([
          Animated.timing(capsuleShake, { toValue: amp, duration: 50 - i * 3, useNativeDriver: true }),
          Animated.timing(capsuleShake, { toValue: -amp, duration: 50 - i * 3, useNativeDriver: true }),
        ]);
      });

      Animated.timing(glowOpacity, { toValue: 0.8, duration: 600, useNativeDriver: true }).start();

      Animated.sequence(shakes).start(() => {
        capsuleShake.setValue(0);
        setPhase("burst");

        // Phase 3: burst
        Animated.parallel([
          Animated.timing(capsuleScale, {
            toValue: 1.5, duration: 300, easing: Easing.out(Easing.back(2)), useNativeDriver: true,
          }),
          Animated.timing(capsuleSplit, {
            toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
          }),
          Animated.timing(capsuleOpacity, {
            toValue: 0, duration: 500, delay: 200, useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0, duration: 600, delay: 300, useNativeDriver: true,
          }),
        ]).start(() => {
          setPhase("done");
          // Let confetti play then fade out
          setTimeout(() => {
            Animated.timing(bgOpacity, {
              toValue: 0, duration: 300, useNativeDriver: true,
            }).start(() => onFinished());
          }, 600);
        });
      });
    });
  }, []);

  const leftHalfX = capsuleSplit.interpolate({ inputRange: [0, 1], outputRange: [0, -45] });
  const rightHalfX = capsuleSplit.interpolate({ inputRange: [0, 1], outputRange: [0, 45] });
  const leftRotate = capsuleSplit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-12deg"] });
  const rightRotate = capsuleSplit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "12deg"] });

  return (
    <Animated.View style={[animStyles.overlay, { opacity: bgOpacity }]} pointerEvents="auto">
      {/* Semi-transparent backdrop */}
      <View style={animStyles.backdrop} />

      {/* Glow ring */}
      <Animated.View
        style={[
          animStyles.glowRing,
          { opacity: glowOpacity, borderColor: themeColor, transform: [{ scale: capsuleScale }] },
        ]}
      />

      {/* Capsule body — horizontal */}
      <Animated.View
        style={[
          animStyles.capsuleWrap,
          { opacity: capsuleOpacity, transform: [{ scale: capsuleScale }, { translateX: capsuleShake }] },
        ]}
      >
        {/* Left half */}
        <Animated.View
          style={[
            animStyles.capsuleLeft,
            { backgroundColor: themeColor, transform: [{ translateX: leftHalfX }, { rotate: leftRotate }] },
          ]}
        >
          <View style={animStyles.capsuleShine} />
        </Animated.View>
        {/* Right half */}
        <Animated.View
          style={[
            animStyles.capsuleRight,
            { backgroundColor: themeColor + "CC", transform: [{ translateX: rightHalfX }, { rotate: rightRotate }] },
          ]}
        >
          <View style={animStyles.capsuleBand} />
        </Animated.View>
      </Animated.View>

      {/* Confetti */}
      {(phase === "burst" || phase === "done") &&
        Array.from({ length: CONFETTI_COUNT }, (_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
    </Animated.View>
  );
}

// ─── Main component ────────────────────────────────────────────
export function CapsuleListPage({
  onBack,
  onAddCapsule,
  onOpenCapsule,
  userId,
  linkKey,
  linkedUser,
}: {
  onBack: () => void;
  onAddCapsule: () => void;
  onOpenCapsule: (capsuleId: string) => void;
  userId: string;
  linkKey: string | null;
  linkedUser: string | null;
}) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingCapsuleId, setOpeningCapsuleId] = useState<string | null>(null);

  const loadCapsules = useCallback(async () => {
    if (!userId || !linkKey) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const list = await api.getCapsules(userId, linkKey);
      setCapsules(list);
    } catch (e) {
      console.warn("Failed to load capsules:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, linkKey]);

  useEffect(() => {
    loadCapsules();
  }, [loadCapsules]);

  const myCreated = capsules.filter((c) => c.creatorId === userId);
  const received = capsules.filter((c) => c.recipientId === userId);

  const handleDelete = (capsule: Capsule) => {
    Alert.alert(t("capsule.delete"), t("capsule.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("capsule.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteCapsule(capsule.id, userId);
            setCapsules((prev) => prev.filter((c) => c.id !== capsule.id));
          } catch (e: any) {
            Alert.alert(t("common.error"), e?.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  const handleTapReceived = (capsule: Capsule) => {
    const status = getCapsuleStatus(capsule, userId);
    if (status === "sealed") {
      Alert.alert("", t("capsule.notYet"));
      return;
    }
    if (status === "ready") {
      Alert.alert("", t("capsule.confirmOpen"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("capsule.openNow"),
          onPress: () => setOpeningCapsuleId(capsule.id),
        },
      ]);
      return;
    }
  };

  const handleAnimationFinished = () => {
    const id = openingCapsuleId;
    setOpeningCapsuleId(null);
    if (id) onOpenCapsule(id);
  };

  const renderStatusBadge = (capsule: Capsule) => {
    const status = getCapsuleStatus(capsule, userId);

    let label: string;
    let bgColor: string;
    let textColor: string;

    switch (status) {
      case "sealed":
        label = t("capsule.sealed");
        bgColor = theme.colorMuted;
        textColor = theme.colorMutedForeground;
        break;
      case "ready":
        label = t("capsule.openNow");
        bgColor = theme.colorPrimary + "20";
        textColor = theme.colorPrimary;
        break;
      case "opened":
        label = t("capsule.opened");
        bgColor = "#10b98120";
        textColor = "#10b981";
        break;
      case "destroyed":
        label = t("capsule.destroyed");
        bgColor = theme.colorMuted;
        textColor = theme.colorMutedForeground;
        break;
    }

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };

  const renderCreatedCard = (capsule: Capsule) => {
    const canDelete = !capsule.openedAt;

    return (
      <View
        key={capsule.id}
        style={[styles.card, { backgroundColor: theme.colorCard, borderColor: theme.colorBorder }]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.colorForeground }]} numberOfLines={1}>
              {capsule.title}
            </Text>
            <Text style={[styles.cardDate, { color: theme.colorMutedForeground }]}>
              {t("capsule.unlockDate")}: {formatDate(capsule.unlockAt)}
            </Text>
          </View>
          {renderStatusBadge(capsule)}
        </View>

        {capsule.details && (
          <Text style={[styles.cardDetails, { color: theme.colorMutedForeground }]} numberOfLines={2}>
            {capsule.details}
          </Text>
        )}

        {canDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(capsule)}>
            <Trash2 size={14} color={theme.colorMutedForeground} />
            <Text style={[styles.deleteBtnText, { color: theme.colorMutedForeground }]}>
              {t("capsule.delete")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderReceivedCard = (capsule: Capsule) => {
    const status = getCapsuleStatus(capsule, userId);
    const daysLeft = getDaysUntilUnlock(capsule.unlockAt);

    return (
      <TouchableOpacity
        key={capsule.id}
        style={[styles.card, { backgroundColor: theme.colorCard, borderColor: theme.colorBorder }]}
        onPress={() => handleTapReceived(capsule)}
        activeOpacity={status === "destroyed" || status === "opened" ? 1 : 0.7}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.colorForeground }]} numberOfLines={1}>
              {capsule.title}
            </Text>
            {status === "sealed" && (
              <Text style={[styles.cardDate, { color: theme.colorMutedForeground }]}>
                {daysLeft === 1
                  ? t("capsule.opensInOneDay")
                  : t("capsule.opensIn").replace("{days}", String(daysLeft))}
              </Text>
            )}
          </View>

          <View style={styles.cardStatusArea}>
            {status === "sealed" && <Lock size={16} color={theme.colorMutedForeground} />}
            {status === "ready" && <PulsingDot color={theme.colorPrimary} />}
            {status === "ready" && renderStatusBadge(capsule)}
            {status === "opened" && renderStatusBadge(capsule)}
            {status === "destroyed" && renderStatusBadge(capsule)}
          </View>
        </View>

        {(status === "destroyed" || status === "opened") && (
          <Text style={[styles.cardDetails, { color: theme.colorMutedForeground, fontStyle: "italic" }]}>
            {t("capsule.capsuleOpened")}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colorBackground }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colorBorder }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.colorForeground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colorForeground }]}>
          {t("capsule.title")}
        </Text>
        {linkedUser ? (
          <TouchableOpacity onPress={onAddCapsule} style={styles.addBtn}>
            <Plus size={22} color={theme.colorPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 30 }} />
        )}
      </View>

      {!linkedUser ? (
        <View style={styles.emptyState}>
          <Hourglass size={40} color={theme.colorMutedForeground} strokeWidth={1} />
          <Text style={[styles.emptyTitle, { color: theme.colorForeground }]}>
            {t("capsule.noCapsulesYet")}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colorMutedForeground }]}>
            {t("capsule.notLinked")}
          </Text>
        </View>
      ) : (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={theme.colorPrimary} />
          </View>
        )}

        {!loading && capsules.length === 0 && (
          <View style={styles.emptyState}>
            <Hourglass size={40} color={theme.colorMutedForeground} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: theme.colorForeground }]}>
              {t("capsule.noCapsulesYet")}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colorMutedForeground }]}>
              {t("capsule.createFirst")}
            </Text>
          </View>
        )}

        {!loading && myCreated.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colorForeground }]}>
              {t("capsule.myCreated")}
            </Text>
            {myCreated.map(renderCreatedCard)}
          </View>
        )}

        {!loading && received.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colorForeground }]}>
              {t("capsule.received")}
            </Text>
            {received.map(renderReceivedCard)}
          </View>
        )}
      </ScrollView>
      )}

      {/* Opening animation overlay */}
      {openingCapsuleId && (
        <CapsuleOpenOverlay
          onFinished={handleAnimationFinished}
          themeColor={theme.colorPrimary}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Animation styles ──────────────────────────────────────────
const animStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  glowRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
  },
  capsuleWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  capsuleLeft: {
    width: 60,
    height: 80,
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    overflow: "hidden",
    marginRight: -1,
  },
  capsuleShine: {
    position: "absolute",
    top: 14,
    left: 10,
    width: 14,
    height: 22,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  capsuleRight: {
    width: 60,
    height: 80,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    overflow: "hidden",
  },
  capsuleBand: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});

// ─── List styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  addBtn: { padding: 4 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 10 },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 15, fontWeight: "600" },
  cardDate: { fontSize: 12, marginTop: 2 },
  cardDetails: { fontSize: 13, marginTop: 8, lineHeight: 18 },
  cardStatusArea: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  deleteBtnText: { fontSize: 12 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  emptySubtitle: { fontSize: 14 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  createBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
