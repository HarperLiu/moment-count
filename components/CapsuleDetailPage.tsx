import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Dimensions,
  Animated,
  Easing,
  TouchableOpacity,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { Image } from "expo-image";
import { api } from "../app/api";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Content reveal animation ──────────────────────────────────
function RevealContent({ children }: { children: React.ReactNode }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Main component ────────────────────────────────────────────
export function CapsuleDetailPage({
  onBack,
  capsuleId,
  userId,
}: {
  onBack: () => void;
  capsuleId: string;
  userId: string;
}) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<{
    title: string;
    details: string | null;
    photos: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const destroyedRef = useRef(false);

  // Open the capsule on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.openCapsule(capsuleId, userId);
        if (mounted) {
          setContent(data);
          setLoading(false);
        }
      } catch (e: any) {
        if (mounted) {
          setError(e?.message || "Failed to open capsule");
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [capsuleId, userId]);

  // Destroy on leave or app background
  const destroyCapsule = useCallback(async () => {
    if (destroyedRef.current) return;
    destroyedRef.current = true;
    try {
      await api.destroyCapsule(capsuleId, userId);
    } catch {
      // Best effort
    }
  }, [capsuleId, userId]);

  useEffect(() => {
    return () => { destroyCapsule(); };
  }, [destroyCapsule]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "background" || nextState === "inactive") {
        destroyCapsule();
        onBack();
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [destroyCapsule, onBack]);

  const handleBack = () => {
    destroyCapsule();
    onBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colorBackground }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colorPrimary} />
          <Text style={[styles.loadingText, { color: theme.colorMutedForeground }]}>
            {t("capsule.viewing")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colorBackground }]}>
        <View style={[styles.header, { borderBottomColor: theme.colorBorder }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={22} color={theme.colorForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colorForeground }]}>
            {t("capsule.title")}
          </Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.colorForeground }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!content) return null;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colorBackground }]}>
      {/* Header with back button */}
      <View style={[styles.header, { borderBottomColor: theme.colorBorder }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.colorForeground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colorForeground }]}>
          {t("capsule.title")}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <RevealContent>
          {/* Destroyed hint */}
          <View style={[styles.hintBanner, { backgroundColor: theme.colorPrimary + "15" }]}>
            <Text style={[styles.hintText, { color: theme.colorPrimary }]}>
              {t("capsule.destroyedHint")}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colorForeground }]}>
            {content.title}
          </Text>

          {/* Details */}
          {content.details && (
            <Text style={[styles.details, { color: theme.colorForeground }]}>
              {content.details}
            </Text>
          )}

          {/* Photos */}
          {content.photos.length > 0 && (
            <View style={styles.photosSection}>
              <Text style={[styles.photosLabel, { color: theme.colorMutedForeground }]}>
                {t("capsule.photos")}
              </Text>
              {content.photos.map((url, i) => (
                <Image
                  key={i}
                  source={{ uri: url }}
                  style={styles.photo}
                  contentFit="cover"
                />
              ))}
            </View>
          )}
        </RevealContent>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 15 },
  content: { padding: 20, paddingBottom: 60 },
  hintBanner: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  hintText: { fontSize: 13, fontWeight: "500" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  details: { fontSize: 16, lineHeight: 24, marginBottom: 20 },
  photosSection: { marginTop: 8 },
  photosLabel: { fontSize: 13, fontWeight: "500", marginBottom: 10 },
  photo: {
    width: SCREEN_WIDTH - 40,
    height: (SCREEN_WIDTH - 40) * 0.75,
    borderRadius: 12,
    marginBottom: 12,
  },
});
