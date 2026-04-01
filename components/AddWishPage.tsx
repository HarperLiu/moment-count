import React, { useState } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ArrowLeft, Star, Camera } from "lucide-react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { api, Wish, WishCategory } from "../app/api";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

const CATEGORIES: { key: WishCategory; labelKey: string }[] = [
  { key: "travel", labelKey: "wish.categoryTravel" },
  { key: "food", labelKey: "wish.categoryFood" },
  { key: "gift", labelKey: "wish.categoryGift" },
  { key: "experience", labelKey: "wish.categoryExperience" },
  { key: "goal", labelKey: "wish.categoryGoal" },
  { key: "other", labelKey: "wish.categoryOther" },
];

interface AddWishPageProps {
  onBack: () => void;
  userId: string;
  linkKey: string;
  editData?: Wish | null;
}

export function AddWishPage({
  onBack,
  userId,
  linkKey,
  editData,
}: AddWishPageProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const isEdit = !!editData;

  const [title, setTitle] = useState(editData?.title ?? "");
  const [note, setNote] = useState(editData?.note ?? "");
  const [category, setCategory] = useState<WishCategory>(
    (editData?.category as WishCategory) ?? "other"
  );
  const [priority, setPriority] = useState(editData?.priority ?? 1);
  const [coverImage, setCoverImage] = useState<string | null>(
    editData?.coverImage ?? null
  );
  const [submitting, setSubmitting] = useState(false);

  const canSave = title.trim().length > 0;

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1280 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        const base64 = manipulated.base64 ||
          await FileSystem.readAsStringAsync(manipulated.uri, { encoding: "base64" as any });
        const { url } = await api.uploadBase64Image({
          filename: `wish-cover-${Date.now()}.jpg`,
          base64,
          contentType: "image/jpeg",
        });
        setCoverImage(url);
      } catch {
        // Fallback to local URI
        setCoverImage(asset.uri);
      }
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      if (isEdit && editData) {
        await api.updateWish(editData.id, {
          title: title.trim(),
          note: note.trim() || undefined,
          coverImage: coverImage || undefined,
          category,
          priority,
          userId,
        });
      } else {
        await api.createWish({
          title: title.trim(),
          note: note.trim() || undefined,
          coverImage: coverImage || undefined,
          category,
          priority,
          creatorId: userId,
          linkKey,
        });
      }
      onBack();
    } catch (err) {
      Alert.alert(t("common.error"), String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: 1, label: t("wish.priorityLow") },
    { value: 2, label: t("wish.priorityMedium") },
    { value: 3, label: t("wish.priorityHigh") },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colorBackground }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
            <ArrowLeft size={22} color={theme.colorForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colorForeground }]}>
            {isEdit ? t("wish.editTitle") : t("wish.addTitle")}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave || submitting}
            style={styles.headerBtn}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={theme.colorPrimary} />
            ) : (
              <Text
                style={{
                  color: canSave ? theme.colorPrimary : theme.colorMutedForeground,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {t("common.save")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Image */}
          <TouchableOpacity
            onPress={handlePickImage}
            style={[
              styles.coverPicker,
              {
                backgroundColor: theme.colorInputBackground,
                borderColor: theme.colorBorder,
              },
            ]}
          >
            {coverImage ? (
              <Image
                source={{ uri: coverImage }}
                style={styles.coverPreview}
                contentFit="cover"
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Camera size={28} color={theme.colorMutedForeground} />
              </View>
            )}
          </TouchableOpacity>

          {/* Title */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("wish.titlePlaceholder")}
            placeholderTextColor={theme.colorMutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: theme.colorInputBackground,
                color: theme.colorForeground,
                borderColor: theme.colorBorder,
              },
            ]}
            maxLength={100}
          />

          {/* Note */}
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t("wish.notePlaceholder")}
            placeholderTextColor={theme.colorMutedForeground}
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.colorInputBackground,
                color: theme.colorForeground,
                borderColor: theme.colorBorder,
              },
            ]}
            multiline
            numberOfLines={4}
          />

          {/* Category */}
          <Text
            style={[styles.sectionLabel, { color: theme.colorForeground }]}
          >
            {t("wish.category")}
          </Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map(({ key, labelKey }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setCategory(key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      category === key ? theme.colorPrimary : theme.colorCard,
                    borderColor:
                      category === key
                        ? theme.colorPrimary
                        : theme.colorBorder,
                  },
                ]}
              >
                <Text
                  style={{
                    color: category === key ? "#fff" : theme.colorForeground,
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  {t(labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority */}
          <Text
            style={[styles.sectionLabel, { color: theme.colorForeground }]}
          >
            {t("wish.priority")}
          </Text>
          <View style={styles.priorityRow}>
            {priorityOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setPriority(opt.value)}
                style={[
                  styles.priorityOption,
                  {
                    backgroundColor:
                      priority === opt.value
                        ? theme.colorPrimary
                        : theme.colorCard,
                    borderColor:
                      priority === opt.value
                        ? theme.colorPrimary
                        : theme.colorBorder,
                  },
                ]}
              >
                <View style={{ flexDirection: "row", gap: 2, marginBottom: 4 }}>
                  {[1, 2, 3].map((i) => (
                    <Star
                      key={i}
                      size={12}
                      color={
                        i <= opt.value
                          ? priority === opt.value
                            ? "#fff"
                            : "#FFB800"
                          : priority === opt.value
                          ? "rgba(255,255,255,0.3)"
                          : theme.colorBorder
                      }
                      fill={
                        i <= opt.value
                          ? priority === opt.value
                            ? "#fff"
                            : "#FFB800"
                          : "transparent"
                      }
                    />
                  ))}
                </View>
                <Text
                  style={{
                    color:
                      priority === opt.value
                        ? "#fff"
                        : theme.colorForeground,
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    minWidth: 44,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  formContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  coverPicker: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 16,
  },
  coverPreview: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
