import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { MessageCircleQuestion, ChevronRight } from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";
import { api } from "../app/api";

interface DailyQACardProps {
  onPress?: () => void;
  linkKey: string | null;
  userId: string | null;
}

export type CategoryKey = "memories" | "dreams" | "preferences" | "hypotheticals" | "deep";

type QuestionData = {
  questionId: string;
  question: string;
  category: string;
  myAnswer: string | null;
  partnerAnswer: string | null;
  bothAnswered: boolean;
};

export function DailyQACard({ onPress, linkKey, userId }: DailyQACardProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [data, setData] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!linkKey || !userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api.getDailyQuestion(linkKey, userId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [linkKey, userId]);

  const categoryLabel = data ? t(`dailyQA.categories.${data.category}`) : "";

  // Parse bilingual question — format: "English\nChinese"
  const questionText = (() => {
    if (!data) return "";
    const lines = data.question.split("\n");
    if (lines.length < 2) return data.question;
    const isZh = t("dailyQA.title") === "每日问答";
    return isZh ? lines[1] : lines[0];
  })();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colorCard, borderColor: theme.colorBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <MessageCircleQuestion size={20} color={theme.colorPrimary} />
        <Text style={[styles.title, { color: theme.colorForeground }]}>
          {t("dailyQA.title")}
        </Text>
        <ChevronRight
          size={16}
          color={theme.colorMutedForeground}
          style={styles.chevron}
        />
      </View>

      <View style={[styles.questionContainer, { backgroundColor: theme.colorCard }]}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colorPrimary} />
        ) : !linkKey || !userId ? (
          <Text style={[styles.notLinkedText, { color: theme.colorMutedForeground }]}>
            {t("dailyQA.notLinked")}
          </Text>
        ) : data ? (
          <>
            <View style={styles.questionRow}>
              <View style={[styles.categoryTag, { backgroundColor: theme.colorPrimary + "15" }]}>
                <Text style={[styles.categoryLabel, { color: theme.colorPrimary }]}>
                  {categoryLabel}
                </Text>
              </View>
              <Text
                style={[styles.questionText, { color: theme.colorForeground }]}
                numberOfLines={2}
              >
                {questionText}
              </Text>
            </View>
            {data.bothAnswered && data.partnerAnswer ? (
              <View style={[styles.partnerAnswerContainer, { borderTopColor: theme.colorBorder }]}>
                <Text style={[styles.partnerAnswerLabel, { color: theme.colorPrimary }]}>
                  {t("dailyQA.partnerAnswer")}
                </Text>
                <Text
                  style={[styles.partnerAnswerText, { color: theme.colorForeground }]}
                  numberOfLines={2}
                >
                  {data.partnerAnswer}
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  chevron: {
    marginLeft: "auto",
  },
  questionContainer: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  categoryTag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    flex: 1,
  },
  notLinkedText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 4,
  },
  partnerAnswerContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  partnerAnswerLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  partnerAnswerText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
