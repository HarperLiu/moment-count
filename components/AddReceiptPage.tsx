import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { ActivityIndicator } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { api } from "../app/api";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { ArrowLeft, Image as ImageIcon, Clock, X } from "lucide-react-native";

export function AddReceiptPage({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: (receipt: {
    title: string;
    details: string;
    photos: string[];
    timeCost: { hours: number; minutes: number };
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");
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

  const handleSave = async () => {
    if (!(title.trim() || details.trim() || photos.length > 0)) return;
    if (saving) return;
    const uploaded: string[] = [];
    try {
      setSaving(true);
      for (const uri of photos) {
        try {
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
        } catch {
          uploaded.push(uri);
        }
      }
      onSave({
        title,
        details,
        photos: uploaded,
        timeCost: {
          hours: parseInt(hours, 10),
          minutes: parseInt(minutes, 10),
        },
      });
      onBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Receipt</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Receipt Name</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your receipt a name..."
            style={styles.input}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Time to Cook</Text>
          <View style={styles.pickerRow}>
            <View style={styles.pickerCol}>
              <View style={styles.pickerHeader}>
                <Clock size={16} color="#94A3B8" />
                <Text style={styles.pickerHeaderText}>Hours</Text>
              </View>
              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={hours}
                  onValueChange={(v) => setHours(String(v))}
                >
                  {Array.from({ length: 11 }).map((_, i) => (
                    <Picker.Item key={i} label={`${i}`} value={String(i)} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.pickerCol}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerHeaderText}>Minutes</Text>
              </View>
              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={minutes}
                  onValueChange={(v) => setMinutes(String(v))}
                >
                  {["0", "15", "30", "45"].map((m) => (
                    <Picker.Item key={m} label={m} value={m} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Instructions</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Write the cooking instructions..."
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
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickImages}>
            <ImageIcon size={28} color="#94A3B8" />
            <Text style={styles.uploadText}>Tap to add photos</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>Share your favorite receipts together</Text>

        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveBtn,
            (!(title.trim() || details.trim() || photos.length > 0) ||
              saving) && {
              opacity: 0.5,
            },
          ]}
          disabled={
            !(title.trim() || details.trim() || photos.length > 0) || saving
          }
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {saving && <ActivityIndicator size="small" color="#FFFFFF" />}
            <Text style={styles.saveBtnText}>Save Receipt</Text>
          </View>
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
    justifyContent: "space-between",
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
  saveBtn: {
    marginTop: 12,
    backgroundColor: "#F97316",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700" },

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

  pickerRow: { flexDirection: "row", gap: 12 as any },
  pickerCol: { flex: 1 },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6 as any,
    marginBottom: 6,
  },
  pickerHeaderText: { fontSize: 12, color: "#64748B" },
  pickerBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
    borderRadius: 12,
  },

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
});
