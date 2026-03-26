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
  Alert,
} from "react-native";
import { IntensitySlider } from "./IntensitySlider";
import { ArrowLeft, Plus, Trash2, X, Flame } from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";
import { api, CustomQuestion, TodType } from "../app/api";

interface ManageQuestionsPageProps {
  onBack: () => void;
  userId: string;
  linkKey: string | null;
}

const FIRE_COUNT = 5;

export function ManageQuestionsPage({
  onBack,
  userId,
  linkKey,
}: ManageQuestionsPageProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();

  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState<TodType>("truth");
  const [newIntensity, setNewIntensity] = useState(50);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | TodType>("all");

  const loadQuestions = useCallback(async () => {
    if (!linkKey) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getCustomQuestions(linkKey);
      setQuestions(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [linkKey]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleAdd = async () => {
    if (!newContent.trim() || !linkKey || submitting) return;
    setSubmitting(true);
    try {
      await api.createCustomQuestion({
        type: newType,
        content: newContent.trim(),
        intensity: newIntensity,
        creatorId: userId,
        linkKey,
      });
      setNewContent("");
      setShowAddForm(false);
      await loadQuestions();
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.message || "Failed to add question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (questionId: string) => {
    Alert.alert(t("truthOrDare.deleteConfirm"), "", [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteCustomQuestion(questionId, userId);
            await loadQuestions();
          } catch {
            // ignore
          }
        },
      },
    ]);
  };

  const filteredQuestions =
    filter === "all" ? questions : questions.filter((q) => q.type === filter);

  const truthColor = "#4D96FF";
  const dareColor = "#FFD93D";
  const dareBadgeText = "#B8960A";

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorBackground }]}
    >
      <ScrollView stickyHeaderIndices={[0]}>
        {/* Header */}
        <View
          style={[
            styles.stickyHeader,
            {
              backgroundColor: theme.colorBackground,
              borderBottomColor: theme.colorBorder,
            },
          ]}
        >
          <View style={styles.stickyRow}>
            <View style={styles.leftGroup}>
              <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={20} color={theme.colorForeground} />
              </TouchableOpacity>
              <Text
                style={[styles.pageTitle, { color: theme.colorForeground }]}
              >
                {t("truthOrDare.manageQuestions")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddForm(!showAddForm)}
              style={styles.iconBtn}
            >
              {showAddForm ? (
                <X size={20} color={theme.colorForeground} />
              ) : (
                <Plus size={20} color={theme.colorForeground} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Add form */}
          {showAddForm && (
            <View
              style={[styles.addCard, { backgroundColor: theme.colorCard }]}
            >
              <Text
                style={[
                  styles.addTitle,
                  { color: theme.colorForeground },
                ]}
              >
                {t("truthOrDare.addQuestion")}
              </Text>

              {/* Type selector */}
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.colorMutedForeground },
                ]}
              >
                {t("truthOrDare.type")}
              </Text>
              <View
                style={[
                  styles.segmentedControl,
                  { backgroundColor: theme.colorSecondary },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.segment,
                    newType === "truth" && {
                      backgroundColor: truthColor,
                    },
                  ]}
                  onPress={() => setNewType("truth")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          newType === "truth"
                            ? "#fff"
                            : theme.colorMutedForeground,
                      },
                    ]}
                  >
                    {t("truthOrDare.truth")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segment,
                    newType === "dare" && {
                      backgroundColor: dareColor,
                    },
                  ]}
                  onPress={() => setNewType("dare")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          newType === "dare"
                            ? "#333"
                            : theme.colorMutedForeground,
                      },
                    ]}
                  >
                    {t("truthOrDare.dare")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Intensity slider */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colorMutedForeground, marginTop: 0 },
                  ]}
                >
                  {t("truthOrDare.intensityLevel")}
                </Text>
                <View style={{ flexDirection: "row", gap: 2 }}>
                  {Array.from({ length: FIRE_COUNT }, (_, i) => {
                    const lit = i < Math.ceil((newIntensity / 100) * FIRE_COUNT);
                    return (
                      <Flame
                        key={i}
                        size={18}
                        color={lit ? "#FF6B35" : theme.colorMutedForeground + "40"}
                        fill={lit ? "#FF6B35" : "transparent"}
                      />
                    );
                  })}
                </View>
              </View>
              <IntensitySlider
                value={newIntensity}
                onValueChange={setNewIntensity}
                trackColor={theme.colorSecondary}
                fillColor={theme.colorPrimary}
                thumbColor={theme.colorPrimary}
                thumbBorderColor={theme.colorBackground}
              />

              {/* Content input */}
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.colorMutedForeground },
                ]}
              >
                {t("truthOrDare.content")}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colorInputBackground,
                    color: theme.colorForeground,
                    borderColor: theme.colorBorder,
                  },
                ]}
                placeholder={t("truthOrDare.questionPlaceholder")}
                placeholderTextColor={theme.colorMutedForeground}
                value={newContent}
                onChangeText={setNewContent}
                multiline
                textAlignVertical="top"
              />

              {/* Submit */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: theme.colorPrimary,
                    opacity: newContent.trim() && !submitting ? 1 : 0.5,
                  },
                ]}
                onPress={handleAdd}
                disabled={!newContent.trim() || submitting}
                activeOpacity={0.7}
              >
                {submitting ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colorPrimaryForeground}
                  />
                ) : (
                  <Text
                    style={[
                      styles.submitBtnText,
                      { color: theme.colorPrimaryForeground },
                    ]}
                  >
                    {t("truthOrDare.addQuestion")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Filter tabs */}
          <View
            style={[
              styles.filterRow,
              { backgroundColor: theme.colorSecondary, borderRadius: 10 },
            ]}
          >
            {(["all", "truth", "dare"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterTab,
                  filter === f && {
                    backgroundColor: theme.colorPrimary,
                  },
                ]}
                onPress={() => setFilter(f)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    {
                      color:
                        filter === f
                          ? theme.colorPrimaryForeground
                          : theme.colorMutedForeground,
                    },
                  ]}
                >
                  {f === "all"
                    ? t("common.all")
                    : f === "truth"
                      ? t("truthOrDare.truth")
                      : t("truthOrDare.dare")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Questions list */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color={theme.colorPrimary}
              style={{ paddingVertical: 40 }}
            />
          ) : filteredQuestions.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                { color: theme.colorMutedForeground },
              ]}
            >
              {t("truthOrDare.noQuestions")}
            </Text>
          ) : (
            filteredQuestions.map((q) => (
              <View
                key={q.id}
                style={[
                  styles.questionItem,
                  { backgroundColor: theme.colorCard },
                ]}
              >
                <View style={styles.questionItemHeader}>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          q.type === "truth"
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
                            q.type === "truth" ? truthColor : dareBadgeText,
                        },
                      ]}
                    >
                      {q.type === "truth"
                        ? t("truthOrDare.truth")
                        : t("truthOrDare.dare")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.intensityBadge,
                      { backgroundColor: theme.colorSecondary, flexDirection: "row", gap: 1 },
                    ]}
                  >
                    {Array.from({ length: FIRE_COUNT }, (_, i) => {
                      const lit = i < Math.ceil((q.intensity / 100) * FIRE_COUNT);
                      return (
                        <Flame
                          key={i}
                          size={12}
                          color={lit ? "#FF6B35" : theme.colorMutedForeground + "40"}
                          fill={lit ? "#FF6B35" : "transparent"}
                        />
                      );
                    })}
                  </View>
                  {q.creatorId === userId && (
                    <TouchableOpacity
                      onPress={() => handleDelete(q.id)}
                      style={styles.deleteBtn}
                    >
                      <Trash2
                        size={16}
                        color={theme.colorDestructive}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <Text
                  style={[
                    styles.questionItemText,
                    { color: theme.colorForeground },
                  ]}
                >
                  {q.content}
                </Text>
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  stickyHeader: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftGroup: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  addCard: {
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  addTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },
  textInput: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
  },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    padding: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 30,
  },
  questionItem: {
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  questionItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  intensityBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  intensityBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  deleteBtn: {
    marginLeft: "auto",
    padding: 4,
  },
  questionItemText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
