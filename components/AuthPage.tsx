import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

export function AuthPage({ onRegistered }: { onRegistered: () => void }) {
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [avatar, setAvatar] = useState<string>("");

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled) {
      // Only support one image for avatar
      const first =
        result.assets && result.assets.length > 0
          ? result.assets[0]
          : undefined;
      setAvatar(first?.uri || "");
    }
  };

  const isFormValid = Boolean(name.trim() && slogan.trim() && avatar);

  const handleSubmit = async () => {
    if (!isFormValid) return;
    // Generate a simple uuid v4 (without extra deps)
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
    try {
      const profile = {
        uuid,
        name: name.trim(),
        slogan: slogan.trim(),
        avatar,
      };
      const { api } = await import("../app/api");
      await api.upsertUser(profile);
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      await AsyncStorage.setItem("user:uuid", uuid);
      await AsyncStorage.setItem("user:profile", JSON.stringify(profile));
      onRegistered();
    } catch {}
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignItems: "center", marginTop: 80, marginBottom: 12 }}>
          <Image
            source={require("../assets/app-logo.png")}
            style={{ width: 108, height: 108, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome to MomentCount</Text>
          <Text style={styles.subtitle}>
            Create your profile to start sharing moments
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>
            Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            style={styles.input}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>
            Slogan <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            value={slogan}
            onChangeText={setSlogan}
            placeholder="What's your motto?"
            style={styles.input}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>
            Avatar <Text style={styles.required}>*</Text>
          </Text>
          {!!avatar && (
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
            </View>
          )}
          <TouchableOpacity onPress={handlePickAvatar} style={styles.uploadBox}>
            <Text style={styles.uploadText}>Tap to upload avatar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          You can change these details later in settings
        </Text>

        <TouchableOpacity
          style={[styles.submitBtn, !isFormValid && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={!isFormValid}
        >
          <Text style={styles.submitText}>Get Started</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#F97316" },
  subtitle: { fontSize: 12, color: "#64748B", marginTop: 4 },
  block: { marginTop: 12 },
  label: { fontSize: 12, color: "#64748B", marginBottom: 6 },
  required: { color: "#DC2626" },
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
  avatar: { width: 96, height: 96, borderRadius: 48 },
  uploadBox: {
    height: 56,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED33",
  },
  uploadText: { fontSize: 13, color: "#64748B" },
  hint: { marginTop: 12, fontSize: 12, color: "#94A3B8", textAlign: "center" },
  submitBtn: {
    marginTop: 12,
    backgroundColor: "#F97316",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: { color: "#FFFFFF", fontWeight: "700" },
});
