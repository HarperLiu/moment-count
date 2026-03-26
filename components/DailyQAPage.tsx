import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import {
  ArrowLeft,
  RefreshCw,
  MessageCircleQuestion,
  Send,
  Pencil,
  Check,
  X,
} from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";
import { api } from "../app/api";
import type { CategoryKey } from "./DailyQACard";

interface DailyQAPageProps {
  onBack: () => void;
  user: { uuid: string; name: string } | null;
  linkedUser: string | null;
  linkKey: string | null;
}

type TodayData = {
  questionId: string;
  question: string;
  category: string;
  date: string;
  isCustom: boolean;
  myAnswer: string | null;
  partnerAnswer: string | null;
  bothAnswered: boolean;
  canReplace: boolean;
};

type HistoryEntry = {
  questionId: string;
  question: string;
  category: string;
  date: string;
  myAnswer: string | null;
  partnerAnswer: string | null;
  bothAnswered: boolean;
};

export function DailyQAPage({ onBack, user, linkedUser, linkKey }: DailyQAPageProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();

  const userId = user?.uuid ?? "";

  const [today, setToday] = useState<TodayData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState("");
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editQuestionText, setEditQuestionText] = useState("");

  const isZh = t("dailyQA.title") === "每日问答";

  const parseQuestion = (q: string) => {
    const lines = q.split("\n");
    if (lines.length < 2) return q;
    return isZh ? lines[1] : lines[0];
  };

  const loadData = useCallback(async () => {
    if (!linkKey || !userId) {
      setLoading(false);
      return;
    }
    try {
      const [todayResult, historyResult] = await Promise.all([
        api.getDailyQuestion(linkKey, userId),
        api.getDailyQuestionHistory(linkKey, userId),
      ]);
      setToday(todayResult);
      setHistory(historyResult);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [linkKey, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitAnswer = async () => {
    if (!answerText.trim() || !today || submitting) return;
    setSubmitting(true);
    try {
      await api.answerDailyQuestion({
        questionId: today.questionId,
        userId,
        answer: answerText.trim(),
      });
      setAnswerText("");
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditQuestion = () => {
    if (!today) return;
    setEditQuestionText(parseQuestion(today.question));
    setEditingQuestion(true);
  };

  const cancelEditQuestion = () => {
    setEditingQuestion(false);
    setEditQuestionText("");
  };

  const saveEditedQuestion = async () => {
    const trimmed = editQuestionText.trim();
    if (!trimmed || !linkKey || replacing) return;
    setReplacing(true);
    try {
      await api.replaceDailyQuestion({ linkKey, userId, customQuestion: trimmed });
      setEditingQuestion(false);
      setEditQuestionText("");
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to save question");
    } finally {
      setReplacing(false);
    }
  };

  const handleReplace = async (customQuestion?: string) => {
    if (!linkKey || replacing) return;
    setReplacing(true);
    setShowReplaceModal(false);
    setCustomQuestionText("");
    try {
      await api.replaceDailyQuestion({
        linkKey,
        userId,
        customQuestion: customQuestion || undefined,
      });
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to replace question");
    } finally {
      setReplacing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colorBackground }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colorPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!linkKey || !userId) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colorBackground }]}>
        <View style={[styles.header, { backgroundColor: theme.colorBackground, borderBottomColor: theme.colorBorder }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <ArrowLeft size={22} color={theme.colorForeground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colorForeground }]}>
              {t("dailyQA.title")}
            </Text>
            <View style={{ width: 30 }} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colorMutedForeground, fontSize: 15 }}>
            {t("dailyQA.notLinked")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colorBackground }]}>
      <ScrollView stickyHeaderIndices={[0]}>
        {/* Sticky Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: theme.colorBackground, borderBottomColor: theme.colorBorder },
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <ArrowLeft size={22} color={theme.colorForeground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colorForeground }]}>
              {t("dailyQA.title")}
            </Text>
            <View style={{ width: 30 }} />
          </View>
        </View>

        <View style={styles.content}>
          {today && (
            <>
              {/* Today's Question */}
              <View style={[styles.questionCard, { backgroundColor: theme.colorCard }]}>
                <View style={styles.questionHeader}>
                  <MessageCircleQuestion size={20} color={theme.colorPrimary} />
                  <Text style={[styles.todayLabel, { color: theme.colorMutedForeground }]}>
                    {t("dailyQA.today")}
                  </Text>
                </View>
                {editingQuestion ? (
                  <>
                    <TextInput
                      style={[
                        styles.editQuestionInput,
                        {
                          backgroundColor: theme.colorInputBackground,
                          color: theme.colorForeground,
                          borderColor: theme.colorBorder,
                        },
                      ]}
                      value={editQuestionText}
                      onChangeText={setEditQuestionText}
                      multiline
                      autoFocus
                    />
                    <View style={styles.editQuestionActions}>
                      <TouchableOpacity
                        style={[styles.editActionBtn, { backgroundColor: theme.colorSecondary }]}
                        onPress={cancelEditQuestion}
                        activeOpacity={0.7}
                      >
                        <X size={14} color={theme.colorMutedForeground} />
                        <Text style={[styles.editActionText, { color: theme.colorMutedForeground }]}>
                          {t("dailyQA.cancelEdit")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.editActionBtn,
                          {
                            backgroundColor: theme.colorPrimary,
                            opacity: editQuestionText.trim() && !replacing ? 1 : 0.5,
                          },
                        ]}
                        onPress={saveEditedQuestion}
                        activeOpacity={0.7}
                        disabled={!editQuestionText.trim() || replacing}
                      >
                        {replacing ? (
                          <ActivityIndicator size={14} color={theme.colorPrimaryForeground} />
                        ) : (
                          <Check size={14} color={theme.colorPrimaryForeground} />
                        )}
                        <Text style={[styles.editActionText, { color: theme.colorPrimaryForeground }]}>
                          {t("dailyQA.saveQuestion")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.questionRow}>
                      <View style={[styles.categoryBadge, { backgroundColor: theme.colorSecondary }]}>
                        <Text style={[styles.categoryText, { color: theme.colorPrimary }]}>
                          {t(`dailyQA.categories.${today.category}`)}
                        </Text>
                      </View>
                      <Text style={[styles.questionText, { color: theme.colorForeground }]}>
                        {parseQuestion(today.question)}
                      </Text>
                    </View>
                    {today.canReplace && (
                      <View style={styles.questionActionsRow}>
                        <TouchableOpacity
                          style={styles.changeBtn}
                          onPress={startEditQuestion}
                          activeOpacity={0.7}
                        >
                          <Pencil size={14} color={theme.colorMutedForeground} />
                          <Text style={[styles.changeBtnText, { color: theme.colorMutedForeground }]}>
                            {t("dailyQA.editQuestion")}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.changeBtn}
                          onPress={() => setShowReplaceModal(true)}
                          activeOpacity={0.7}
                          disabled={replacing}
                        >
                          {replacing ? (
                            <ActivityIndicator size={14} color={theme.colorMutedForeground} />
                          ) : (
                            <RefreshCw size={14} color={theme.colorMutedForeground} />
                          )}
                          <Text style={[styles.changeBtnText, { color: theme.colorMutedForeground }]}>
                            {t("dailyQA.changeQuestion")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* My Answer */}
              <View style={[styles.answerSection, { backgroundColor: theme.colorCard }]}>
                <Text style={[styles.sectionTitle, { color: theme.colorForeground }]}>
                  {t("dailyQA.yourAnswer")}
                </Text>
                {today.myAnswer ? (
                  <Text style={[styles.answerBody, { color: theme.colorForeground }]}>
                    {today.myAnswer}
                  </Text>
                ) : (
                  <>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.colorInputBackground,
                          color: theme.colorForeground,
                          borderColor: theme.colorBorder,
                        },
                      ]}
                      placeholder={t("dailyQA.answerPlaceholder")}
                      placeholderTextColor={theme.colorMutedForeground}
                      value={answerText}
                      onChangeText={setAnswerText}
                      multiline
                      textAlignVertical="top"
                    />
                    <View style={styles.submitRow}>
                      <TouchableOpacity
                        style={[
                          styles.submitBtn,
                          {
                            backgroundColor: theme.colorPrimary,
                            opacity: answerText.trim() && !submitting ? 1 : 0.5,
                          },
                        ]}
                        onPress={handleSubmitAnswer}
                        activeOpacity={0.7}
                        disabled={!answerText.trim() || submitting}
                      >
                        {submitting ? (
                          <ActivityIndicator size={14} color={theme.colorPrimaryForeground} />
                        ) : (
                          <Send size={14} color={theme.colorPrimaryForeground} />
                        )}
                        <Text style={[styles.submitBtnText, { color: theme.colorPrimaryForeground }]}>
                          {t("dailyQA.submitAnswer")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              {/* Partner's Answer */}
              <View style={[styles.answerSection, { backgroundColor: theme.colorCard }]}>
                <Text style={[styles.sectionTitle, { color: theme.colorForeground }]}>
                  {t("dailyQA.partnerAnswer")}
                  {linkedUser ? ` (${linkedUser})` : ""}
                </Text>
                {today.bothAnswered && today.partnerAnswer ? (
                  <Text style={[styles.answerBody, { color: theme.colorForeground }]}>
                    {today.partnerAnswer}
                  </Text>
                ) : (
                  <Text style={[styles.waitingText, { color: theme.colorMutedForeground }]}>
                    {t("dailyQA.waitingPartner")}
                  </Text>
                )}
              </View>
            </>
          )}

          {/* History */}
          <View style={styles.historySection}>
            <Text style={[styles.historyTitle, { color: theme.colorForeground }]}>
              {t("dailyQA.history")}
            </Text>

            {history.length === 0 ? (
              <Text style={[styles.noHistory, { color: theme.colorMutedForeground }]}>
                {t("dailyQA.noHistory")}
              </Text>
            ) : (
              history.map((entry) => (
                <View
                  key={entry.questionId}
                  style={[styles.historyCard, { backgroundColor: theme.colorCard }]}
                >
                  <Text style={[styles.historyDate, { color: theme.colorMutedForeground }]}>
                    {entry.date}
                  </Text>
                  <View style={styles.questionRowSmall}>
                    <View style={[styles.categoryBadgeSmall, { backgroundColor: theme.colorSecondary }]}>
                      <Text style={[styles.categoryTextSmall, { color: theme.colorPrimary }]}>
                        {t(`dailyQA.categories.${entry.category}`)}
                      </Text>
                    </View>
                    <Text style={[styles.historyQuestion, { color: theme.colorForeground }]}>
                      {parseQuestion(entry.question)}
                    </Text>
                  </View>
                  {entry.myAnswer ? (
                    <View style={styles.historyAnswer}>
                      <Text style={[styles.answerLabel, { color: theme.colorPrimary }]}>
                        {user?.name ?? t("dailyQA.yourAnswer")}
                      </Text>
                      <Text style={[styles.answerBodySmall, { color: theme.colorForeground }]}>
                        {entry.myAnswer}
                      </Text>
                    </View>
                  ) : null}
                  {entry.bothAnswered && entry.partnerAnswer ? (
                    <View style={styles.historyAnswer}>
                      <Text style={[styles.answerLabel, { color: theme.colorPrimary }]}>
                        {linkedUser ?? t("dailyQA.partnerAnswer")}
                      </Text>
                      <Text style={[styles.answerBodySmall, { color: theme.colorForeground }]}>
                        {entry.partnerAnswer}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Replace Question Modal */}
      <Modal visible={showReplaceModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colorCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colorForeground }]}>
                {t("dailyQA.replaceTitle")}
              </Text>
              <TouchableOpacity onPress={() => { setShowReplaceModal(false); setCustomQuestionText(""); }}>
                <X size={20} color={theme.colorMutedForeground} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: theme.colorSecondary }]}
              onPress={() => handleReplace()}
              activeOpacity={0.7}
            >
              <RefreshCw size={16} color={theme.colorPrimary} />
              <Text style={[styles.modalOptionText, { color: theme.colorPrimary }]}>
                {t("dailyQA.replaceAI")}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalDivider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colorBorder }]} />
              <Text style={[styles.dividerText, { color: theme.colorMutedForeground }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colorBorder }]} />
            </View>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.colorInputBackground,
                  color: theme.colorForeground,
                  borderColor: theme.colorBorder,
                },
              ]}
              placeholder={t("dailyQA.replaceCustomPlaceholder")}
              placeholderTextColor={theme.colorMutedForeground}
              value={customQuestionText}
              onChangeText={setCustomQuestionText}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.modalSubmitBtn,
                {
                  backgroundColor: theme.colorPrimary,
                  opacity: customQuestionText.trim() ? 1 : 0.5,
                },
              ]}
              onPress={() => handleReplace(customQuestionText.trim())}
              disabled={!customQuestionText.trim()}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalSubmitText, { color: theme.colorPrimaryForeground }]}>
                {t("dailyQA.replaceCustom")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  headerTitle: { fontSize: 17, fontWeight: "600"
  },
  content: {
    padding: 20,
    gap: 16,
  },
  questionCard: {
    borderRadius: 14,
    padding: 14,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  todayLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  categoryBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  categoryText: {
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
  editQuestionInput: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
  },
  editQuestionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 8,
  },
  editActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  editActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  questionActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 16,
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  changeBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },
  answerSection: {
    borderRadius: 14,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  textInput: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
  },
  submitRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  answerBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  waitingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  noHistory: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  historyCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  questionRowSmall: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  categoryBadgeSmall: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  categoryTextSmall: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  historyQuestion: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    flex: 1,
  },
  historyAnswer: {
    marginTop: 6,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  answerBodySmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 13,
  },
  modalInput: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
  },
  modalSubmitBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
