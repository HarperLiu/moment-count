import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  X,
} from "lucide-react-native";
import { api } from "../app/api";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

function getTomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function AddCapsulePage({
  onBack,
  userId,
  linkedUser,
  linkKey,
}: {
  onBack: () => void;
  userId: string;
  linkedUser: string;
  linkKey: string;
}) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [unlockDate, setUnlockDate] = useState<Date>(getTomorrow());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && !saving;

  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      selectionLimit: 10 - photos.length,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, 10));
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (event.type === "set" && selectedDate) {
        const tomorrow = getTomorrow();
        setUnlockDate(selectedDate < tomorrow ? tomorrow : selectedDate);
      }
    } else {
      if (selectedDate) {
        const tomorrow = getTomorrow();
        setUnlockDate(selectedDate < tomorrow ? tomorrow : selectedDate);
      }
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      // Upload photos
      const uploaded: string[] = [];
      for (const uri of photos) {
        if (uri.startsWith("http://") || uri.startsWith("https://")) {
          uploaded.push(uri);
          continue;
        }
        try {
          const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1280 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          const base64 =
            manipulated.base64 ||
            (await FileSystem.readAsStringAsync(uri, { encoding: "base64" as any }));
          const name = uri.split("/").pop() || `photo_${Date.now()}.jpg`;
          const { url } = await api.uploadBase64Image({
            filename: name,
            base64,
            contentType: "image/jpeg",
          });
          uploaded.push(url);
        } catch (err) {
          console.error("Photo upload failed:", err);
        }
      }

      await api.createCapsule({
        title: title.trim(),
        details: details.trim() || undefined,
        photos: uploaded.length > 0 ? uploaded : undefined,
        unlockAt: unlockDate.toISOString(),
        creatorId: userId,
        recipientId: linkedUser,
        linkKey,
      });
      onBack();
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.message || "Failed to create capsule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colorBackground }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <ArrowLeft size={20} color={theme.colorForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colorForeground }]}>
            {t("capsule.create")}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Title */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.label, { color: theme.colorMutedForeground }]}>
            {t("capsule.titleField")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.colorForeground,
                backgroundColor: theme.colorMuted,
                borderColor: theme.colorBorder,
              },
            ]}
            placeholder={t("capsule.titlePlaceholder")}
            placeholderTextColor={theme.colorMutedForeground}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Details */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.label, { color: theme.colorMutedForeground }]}>
            {t("capsule.detailsField")}
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                color: theme.colorForeground,
                backgroundColor: theme.colorMuted,
                borderColor: theme.colorBorder,
              },
            ]}
            placeholder={t("capsule.detailsPlaceholder")}
            placeholderTextColor={theme.colorMutedForeground}
            value={details}
            onChangeText={setDetails}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Unlock Date */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.label, { color: theme.colorMutedForeground }]}>
            {t("capsule.unlockDate")}
          </Text>
          <TouchableOpacity
            style={[
              styles.dateBtn,
              { backgroundColor: theme.colorMuted, borderColor: theme.colorBorder },
            ]}
            onPress={() => setShowPicker(true)}
          >
            <CalendarIcon size={16} color={theme.colorMutedForeground} />
            <Text style={[styles.dateBtnText, { color: theme.colorForeground }]}>
              {formatDate(unlockDate)}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.hint, { color: theme.colorMutedForeground }]}>
            {t("capsule.unlockDateHint")}
          </Text>
        </View>

        {/* Date picker */}
        {Platform.OS === "ios" ? (
          <Modal visible={showPicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.colorCard }]}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={{ color: theme.colorPrimary, fontSize: 16 }}>
                      {t("common.cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={{ color: theme.colorPrimary, fontSize: 16, fontWeight: "600" }}>
                      {t("common.save")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={unlockDate}
                  mode="date"
                  display="spinner"
                  minimumDate={getTomorrow()}
                  onChange={handleDateChange}
                />
              </View>
            </View>
          </Modal>
        ) : (
          showPicker && (
            <DateTimePicker
              value={unlockDate}
              mode="date"
              display="default"
              minimumDate={getTomorrow()}
              onChange={handleDateChange}
            />
          )
        )}

        {/* Photos */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.label, { color: theme.colorMutedForeground }]}>
            {t("capsule.addPhotos")} ({photos.length}/10)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
            {photos.map((uri, i) => (
              <View key={i} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoImg} contentFit="cover" />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => handleRemovePhoto(i)}
                >
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 10 && (
              <TouchableOpacity
                style={[styles.addPhotoBtn, { backgroundColor: theme.colorMuted, borderColor: theme.colorBorder }]}
                onPress={handlePickImages}
              >
                <ImageIcon size={20} color={theme.colorMutedForeground} />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: canSave ? theme.colorPrimary : theme.colorMuted },
          ]}
          onPress={handleSave}
          disabled={!canSave}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.saveBtnText, { color: canSave ? "#fff" : theme.colorMutedForeground }]}>
              {t("capsule.create")}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  fieldBlock: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  input: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateBtnText: { fontSize: 15 },
  hint: { fontSize: 11, marginTop: 4 },
  photoRow: { marginTop: 4 },
  photoThumb: { width: 72, height: 72, borderRadius: 8, marginRight: 8, overflow: "hidden" },
  photoImg: { width: "100%", height: "100%" },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoBtn: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
