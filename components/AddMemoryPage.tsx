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
} from "react-native";
import { Image } from "expo-image";
import { ActivityIndicator } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { api } from "../app/api";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  X,
} from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";

// Format date to yyyy-mm-dd
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AddMemoryPage({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: (memory: {
    title: string;
    details: string;
    photos: string[];
    date: Date;
  }) => void;
}) {
  const { theme } = useThemeContext();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      selectionLimit: 10,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (event.type === "set" && selectedDate) {
        setDate(selectedDate);
      }
    } else {
      // iOS: 只更新临时日期，不关闭选择器
      if (selectedDate) {
        setDate(selectedDate);
      }
    }
  };

  const handleConfirmDate = () => {
    setShowPicker(false);
  };

  const handleCancelDate = () => {
    setShowPicker(false);
  };

  const handleSave = async () => {
    if (!(title.trim() || details.trim() || photos.length > 0)) return;
    if (saving) return;
    const uploaded: string[] = [];
    try {
      setSaving(true);
      for (const uri of photos) {
        try {
          // Resize & compress to reduce payload (avoid 413 on serverless)
          const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1280 } }],
            {
              compress: 0.7,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          );
          const base64 =
            manipulated.base64 ||
            (await FileSystem.readAsStringAsync(uri, {
              encoding: "base64" as any,
            }));
          const name = uri.split("/").pop() || `photo_${Date.now()}.jpg`;
          const { url } = await api.uploadBase64Image({
            filename: name,
            base64,
            contentType: "image/jpeg",
          });
          uploaded.push(url);
        } catch (error) {
          console.error(error);
        }
      }
      onSave({ title, details, photos: uploaded, date });
      onBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorBackground }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <ArrowLeft size={20} color={theme.colorForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colorForeground }]}>
            New Memory
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.label, { color: theme.colorMutedForeground }]}>
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your memory a title..."
            style={[
              styles.input,
              {
                backgroundColor: theme.colorCard,
                borderColor: theme.colorBorder,
                color: theme.colorForeground,
              },
            ]}
            placeholderTextColor={theme.colorMutedForeground}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.label, { color: theme.colorMutedForeground }]}>
            Date
          </Text>
          <TouchableOpacity
            style={[
              styles.inputRow,
              {
                backgroundColor: theme.colorCard,
                borderColor: theme.colorBorder,
              },
            ]}
            onPress={() => setShowPicker(true)}
          >
            <Text style={[styles.inputText, { color: theme.colorForeground }]}>
              {formatDate(date)}
            </Text>
            <CalendarIcon size={16} color={theme.colorMutedForeground} />
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <Modal
              visible={showPicker}
              transparent={true}
              animationType="fade"
              onRequestClose={handleCancelDate}
            >
              <View style={styles.datePickerModal}>
                <TouchableOpacity
                  style={styles.datePickerBackdrop}
                  activeOpacity={1}
                  onPress={handleCancelDate}
                />
                <View
                  style={[
                    styles.datePickerContainer,
                    { backgroundColor: theme.colorCard },
                  ]}
                >
                  <View
                    style={[
                      styles.datePickerHeader,
                      { borderBottomColor: theme.colorBorder },
                    ]}
                  >
                    <TouchableOpacity onPress={handleCancelDate}>
                      <Text
                        style={[
                          styles.datePickerCancelText,
                          { color: theme.colorMutedForeground },
                        ]}
                      >
                        取消
                      </Text>
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.datePickerTitle,
                        { color: theme.colorForeground },
                      ]}
                    >
                      选择日期
                    </Text>
                    <TouchableOpacity onPress={handleConfirmDate}>
                      <Text style={styles.datePickerConfirmText}>确认</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                </View>
              </View>
            </Modal>
          )}

          {showPicker && Platform.OS === "android" && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.label, { color: theme.colorMutedForeground }]}>
            Details
          </Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Write about this special moment..."
            style={[
              styles.input,
              {
                height: 120,
                textAlignVertical: "top",
                backgroundColor: theme.colorCard,
                borderColor: theme.colorBorder,
                color: theme.colorForeground,
              },
            ]}
            placeholderTextColor={theme.colorMutedForeground}
            multiline
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.label, { color: theme.colorMutedForeground }]}>
            Photos
          </Text>
          {photos.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 8 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 8 as any,
                  paddingBottom: 4,
                }}
              >
                {photos.map((uri, idx) => (
                  <View key={idx} style={styles.thumbBox}>
                    <Image
                      source={{ uri }}
                      style={styles.thumb}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                    <TouchableOpacity
                      onPress={() => handleRemovePhoto(idx)}
                      style={styles.thumbRemove}
                    >
                      <X size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          <TouchableOpacity
            style={[
              styles.uploadBox,
              {
                borderColor: theme.colorBorder,
                backgroundColor: theme.colorSecondary,
              },
            ]}
            onPress={handlePickImages}
          >
            <ImageIcon size={28} color={theme.colorMutedForeground} />
            <Text
              style={[styles.uploadText, { color: theme.colorMutedForeground }]}
            >
              Tap to add photos
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.hint, { color: theme.colorMutedForeground }]}>
          Capture and preserve your special moments together
        </Text>

        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!(title.trim() || details.trim() || photos.length > 0) ||
              saving) && {
              opacity: 0.5,
            },
          ]}
          onPress={handleSave}
          disabled={
            !(title.trim() || details.trim() || photos.length > 0) || saving
          }
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {saving && <ActivityIndicator size="small" color="#FFFFFF" />}
            <Text style={styles.saveBtnText}>Save Memory</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12 as any,
    marginBottom: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  fieldBlock: { marginTop: 12 },
  label: { fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: { fontSize: 14 },
  uploadBox: {
    height: 96,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4 as any,
  },
  uploadText: { fontSize: 13 },
  thumbBox: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    position: "relative",
  },
  thumb: { width: "100%", height: "100%" },
  thumbRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#000000B3",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { marginTop: 8, fontSize: 12, textAlign: "center" },
  saveBtn: {
    marginTop: 12,
    backgroundColor: "#F97316",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700" },
  datePickerModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  datePickerBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  datePickerContainer: {
    borderRadius: 16,
    paddingBottom: 20,
    width: "100%",
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerCancelText: {
    fontSize: 16,
  },
  datePickerConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F97316",
  },
});
