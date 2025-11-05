import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  X,
} from "lucide-react-native";

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
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

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

  const handleSave = () => {
    if (title.trim() || details.trim() || photos.length > 0) {
      onSave({ title, details, photos, date });
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Memory</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your memory a title..."
            style={styles.input}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.inputText}>{formatDate(date)}</Text>
            <CalendarIcon size={16} color="#94A3B8" />
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(_, d) => {
                setShowPicker(Platform.OS === "ios");
                if (d) setDate(d);
              }}
            />
          )}
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Details</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Write about this special moment..."
            style={[styles.input, { height: 120, textAlignVertical: "top" }]}
            placeholderTextColor="#94A3B8"
            multiline
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Photos</Text>
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
                    <Image source={{ uri }} style={styles.thumb} />
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
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickImages}>
            <ImageIcon size={28} color="#94A3B8" />
            <Text style={styles.uploadText}>Tap to add photos</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Capture and preserve your special moments together
        </Text>

        <TouchableOpacity
          style={[
            styles.saveBtn,
            !(title.trim() || details.trim() || photos.length > 0) && {
              opacity: 0.5,
            },
          ]}
          onPress={handleSave}
          disabled={!(title.trim() || details.trim() || photos.length > 0)}
        >
          <Text style={styles.saveBtnText}>Save Memory</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  fieldBlock: { marginTop: 12 },
  label: { fontSize: 12, color: "#64748B", marginBottom: 6 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0F172A",
    fontSize: 14,
  },
  inputRow: {
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: { fontSize: 14, color: "#0F172A" },
  uploadBox: {
    height: 96,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED33",
    gap: 4 as any,
  },
  uploadText: { fontSize: 13, color: "#64748B" },
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
  hint: { marginTop: 8, fontSize: 12, color: "#94A3B8", textAlign: "center" },
  saveBtn: {
    marginTop: 12,
    backgroundColor: "#F97316",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700" },
});
