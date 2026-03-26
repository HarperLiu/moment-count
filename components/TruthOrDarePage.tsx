import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { IntensitySlider } from "./IntensitySlider";
import { ArrowLeft, Settings2, Flame } from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";
import { api, TodType } from "../app/api";
import { SpinWheelWithRef, SpinWheelHandle, GameMode, SpinResult, QuestionCategory } from "./SpinWheel";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF",
  "#FF78C4", "#A66CFF", "#FFB26B", "#54BAB9",
  "#F94C10", "#C3FF99", "#FFF56D", "#FF74B1",
];
const STATIC_CONFETTI_COUNT = 50;

// Seeded random for deterministic layout (avoids re-randomizing on re-render)
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateConfettiPieces() {
  const pieces = [];
  for (let i = 0; i < STATIC_CONFETTI_COUNT; i++) {
    pieces.push({
      key: i,
      left: seededRandom(i * 7 + 1) * SCREEN_WIDTH,
      top: seededRandom(i * 13 + 3) * SCREEN_HEIGHT * 1.5,
      width: 5 + seededRandom(i * 11 + 5) * 7,
      isCircle: seededRandom(i * 17 + 7) > 0.5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotation: `${seededRandom(i * 23 + 11) * 360}deg`,
      opacity: 0.15 + seededRandom(i * 29 + 13) * 0.2,
    });
  }
  return pieces;
}

function StaticConfettiBackground() {
  const pieces = useMemo(() => generateConfettiPieces(), []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p) => (
        <View
          key={p.key}
          style={{
            position: "absolute",
            left: p.left,
            top: p.top,
            width: p.width,
            height: p.isCircle ? p.width : p.width * 2.5,
            borderRadius: p.isCircle ? p.width / 2 : 2,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: [{ rotate: p.rotation }],
          }}
        />
      ))}
    </View>
  );
}

interface TruthOrDarePageProps {
  onBack: () => void;
  onManageQuestions: () => void;
  userId: string;
  linkKey: string | null;
  linkedUser: string | null;
  linkedUserProfile: { name?: string; uuid?: string } | null;
}

const FALLBACK_QUESTIONS: Record<string, Record<TodType, string[]>> = {
  en: {
    truth: [
      "What is the most embarrassing thing you've done in front of your partner?",
      "What is one secret you haven't told your partner yet?",
      "What was your first impression of your partner?",
      "What is your most irrational fear?",
      "If you could change one thing about your relationship, what would it be?",
    ],
    dare: [
      "Give your partner a 30-second massage",
      "Do your best impression of your partner",
      "Send a funny selfie to your best friend right now",
      "Speak in an accent for the next 3 rounds",
      "Let your partner post anything on your social media",
    ],
  },
  zh: {
    truth: [
      "你在对方面前做过最尴尬的事是什么？",
      "有没有什么秘密还没告诉过对方？",
      "你对对方的第一印象是什么？",
      "你最不理性的恐惧是什么？",
      "如果可以改变你们关系中的一件事，你会改变什么？",
    ],
    dare: [
      "给对方做30秒的按摩",
      "模仿对方的样子",
      "现在就给你最好的朋友发一张搞笑自拍",
      "用方言说一段话",
      "让对方在你的社交媒体上随便发一条动态",
    ],
  },
};

export function TruthOrDarePage({
  onBack,
  onManageQuestions,
  userId,
  linkKey,
}: TruthOrDarePageProps) {
  const { theme } = useThemeContext();
  const { t, language } = useLanguageContext();

  const [intensity, setIntensity] = useState(50);
  const [gameMode, setGameMode] = useState<GameMode>("truth-and-dare");
  const [currentResult, setCurrentResult] = useState<SpinResult | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const wheelRef = useRef<SpinWheelHandle>(null);

  const truthColor = "#4D96FF";
  const dareColor = "#FFD93D";
  const dareBadgeText = "#B8960A"; // darker yellow for text legibility

  const fetchQuestion = useCallback(
    async (type: TodType, category?: QuestionCategory) => {
      if (!linkKey) return null;
      setLoadingQuestion(true);
      try {
        const result = await api.generateTodQuestion(
          type,
          intensity,
          linkKey,
          userId,
          language,
          category
        );
        setLoadingQuestion(false);
        return result.content;
      } catch (err) {
        console.warn("ToD generate failed, using fallback:", err);
        setLoadingQuestion(false);
        const pool = (FALLBACK_QUESTIONS[language] || FALLBACK_QUESTIONS.en)[type];
        return pool[Math.floor(Math.random() * pool.length)];
      }
    },
    [linkKey, intensity, userId, language]
  );

  const showCard = useCallback(() => {
    cardAnim.setValue(0);
    Animated.spring(cardAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [cardAnim]);

  const handleSpinResult = useCallback(
    async (result: SpinResult) => {
      setCurrentResult(result);
      setCurrentQuestion(null);
      setLoadingQuestion(true);
      showCard();
      const question = await fetchQuestion(result.type, result.category);
      setCurrentQuestion(question);
    },
    [fetchQuestion, showCard]
  );

  const handleDismiss = useCallback(() => {
    setCurrentResult(null);
    setCurrentQuestion(null);
  }, []);

  const handleReroll = useCallback(async () => {
    if (!currentResult) return;
    const question = await fetchQuestion(currentResult.type, currentResult.category);
    setCurrentQuestion(question);
    showCard();
  }, [currentResult, fetchQuestion, showCard]);

  const handleSpinPress = useCallback(() => {
    if (currentResult) return;
    wheelRef.current?.spin();
  }, [currentResult]);

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });

  const gameModeOptions: { value: GameMode; label: string }[] = [
    { value: "truth-and-dare", label: t("truthOrDare.truthAndDare") },
    { value: "truth-only", label: t("truthOrDare.truthOnly") },
    { value: "dare-only", label: t("truthOrDare.dareOnly") },
  ];

  const FIRE_COUNT = 5;
  const litFires = Math.ceil((intensity / 100) * FIRE_COUNT);

  // Not linked guard
  if (!linkKey) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: theme.colorBackground }]}
      >
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
              {t("truthOrDare.title")}
            </Text>
            <View style={{ width: 30 }} />
          </View>
        </View>
        <View style={styles.centeredMessage}>
          <Text style={{ color: theme.colorMutedForeground, fontSize: 15 }}>
            {t("truthOrDare.notLinked")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorBackground }]}
    >
      <StaticConfettiBackground />
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
      >
        {/* Sticky header — same style as other secondary pages */}
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
              {t("truthOrDare.title")}
            </Text>
            <TouchableOpacity onPress={onManageQuestions} style={styles.backBtn}>
              <Settings2 size={20} color={theme.colorForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Wheel */}
          <SpinWheelWithRef
            ref={wheelRef}
            onResult={handleSpinResult}
            gameMode={gameMode}
            disabled={!!currentResult}
          />

          {/* SPIN NOW button — primary style */}
          <TouchableOpacity
            style={[
              styles.spinButton,
              {
                backgroundColor: theme.colorPrimary,
                opacity: currentResult ? 0.5 : 1,
              },
            ]}
            onPress={handleSpinPress}
            disabled={!!currentResult}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.spinButtonText,
                { color: theme.colorPrimaryForeground },
              ]}
            >
              {t("truthOrDare.spinNow")}
            </Text>
          </TouchableOpacity>

          {/* Question card */}
          {(currentResult || loadingQuestion) && (
            <Animated.View
              style={[
                styles.questionCard,
                {
                  backgroundColor: theme.colorCard,
                  borderColor: theme.colorBorder,
                  opacity: cardAnim,
                  transform: [{ translateY: cardTranslateY }],
                },
              ]}
            >
              {loadingQuestion ? (
                <ActivityIndicator size="small" color={theme.colorPrimary} />
              ) : currentResult ? (
                <>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          currentResult.type === "truth"
                            ? truthColor + "20"
                            : dareColor + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        {
                          color:
                            currentResult.type === "truth"
                              ? truthColor
                              : dareBadgeText,
                        },
                      ]}
                    >
                      {currentResult.type === "truth"
                        ? t("truthOrDare.truth")
                        : t("truthOrDare.dare")}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.questionText,
                      { color: theme.colorForeground },
                    ]}
                  >
                    {currentQuestion}
                  </Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: theme.colorPrimary },
                      ]}
                      onPress={handleDismiss}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: theme.colorPrimaryForeground },
                        ]}
                      >
                        {t("truthOrDare.done")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: theme.colorSecondary },
                      ]}
                      onPress={handleReroll}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: theme.colorMutedForeground },
                        ]}
                      >
                        {t("truthOrDare.newQuestion")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </Animated.View>
          )}

          {/* Game Type selector */}
          <View style={styles.controlSection}>
            <Text
              style={[
                styles.controlLabel,
                { color: theme.colorMutedForeground },
              ]}
            >
              {t("truthOrDare.gameType")}
            </Text>
            <View
              style={[
                styles.segmentedControl,
                { backgroundColor: theme.colorSecondary },
              ]}
            >
              {gameModeOptions.map((opt) => {
                const isSelected = gameMode === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.segment,
                      isSelected && { backgroundColor: theme.colorPrimary },
                    ]}
                    onPress={() => setGameMode(opt.value)}
                    activeOpacity={0.7}
                    disabled={!!currentResult}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        {
                          color: isSelected
                            ? theme.colorPrimaryForeground
                            : theme.colorMutedForeground,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Intensity Level — continuous slider 0–100 */}
          <View style={styles.controlSection}>
            <View style={styles.intensityHeader}>
              <Text
                style={[
                  styles.controlLabel,
                  { color: theme.colorMutedForeground },
                ]}
              >
                {t("truthOrDare.intensityLevel")}
              </Text>
              <View style={styles.fireIcons}>
                {Array.from({ length: FIRE_COUNT }, (_, i) => (
                  <Flame
                    key={i}
                    size={18}
                    color={
                      i < litFires
                        ? "#FF6B35"
                        : theme.colorMutedForeground + "40"
                    }
                    fill={i < litFires ? "#FF6B35" : "transparent"}
                  />
                ))}
              </View>
            </View>

            <IntensitySlider
              value={intensity}
              onValueChange={setIntensity}
              disabled={!!currentResult}
              trackColor={theme.colorSecondary}
              fillColor={theme.colorPrimary}
              thumbColor={theme.colorPrimary}
              thumbBorderColor={theme.colorBackground}
            />
          </View>

          <View style={{ height: 40 }} />
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
  centeredMessage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    gap: 12,
  },
  spinButton: {
    alignSelf: "stretch",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  spinButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  questionCard: {
    borderRadius: 14,
    padding: 14,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typeBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  controlSection: {
    gap: 8,
    marginTop: 4,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  intensityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fireIcons: {
    flexDirection: "row",
    gap: 2,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
