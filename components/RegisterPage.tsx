import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  SafeAreaView,
} from "react-native";
import { ActivityIndicator } from "react-native";
import { StatusBar } from "./StatusBar";
import { Upload } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../styles/useTheme";

interface RegisterPageProps {
  onRegister: (data: {
    name: string;
    slogan: string;
    username: string;
    password: string;
  }) => void;
  onLoginClick: () => void;
}

export function RegisterPage({ onRegister, onLoginClick }: RegisterPageProps) {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAvatarUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!(name.trim() && password.trim())) return;
    if (submitting) return;
    try {
      setSubmitting(true);
      await Promise.resolve(
        onRegister({ name, slogan, username: avatar, password })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = name.trim() && password.trim();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#F1F5F9" }]}>
      <StatusBar />
      {/* iPhone Container */}
      <View
        style={[styles.phoneContainer, { backgroundColor: theme.colorCard }]}
      >
        {/* Dynamic Island / Notch */}
        <View style={styles.notch} />

        {/* Scrollable Content */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { backgroundColor: theme.colorBackground },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/app-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.headline, { color: "#F97316" }]}>
              Sign Up Now
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.colorMutedForeground }]}
            >
              Create your profile to start sharing moments
            </Text>
          </View>

          {/* Form Content */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, { color: theme.colorMutedForeground }]}
              >
                Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={theme.colorMutedForeground}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colorInputBackground,
                    borderColor: theme.colorBorder,
                    color: theme.colorForeground,
                  },
                ]}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, { color: theme.colorMutedForeground }]}
              >
                Password <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={theme.colorMutedForeground}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colorInputBackground,
                    borderColor: theme.colorBorder,
                    color: theme.colorForeground,
                  },
                ]}
              />
            </View>

            {/* Slogan Input */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, { color: theme.colorMutedForeground }]}
              >
                Slogan
              </Text>
              <TextInput
                value={slogan}
                onChangeText={setSlogan}
                placeholder="What's your motto?"
                placeholderTextColor={theme.colorMutedForeground}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colorInputBackground,
                    borderColor: theme.colorBorder,
                    color: theme.colorForeground,
                  },
                ]}
              />
            </View>

            {/* Avatar Upload */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, { color: theme.colorMutedForeground }]}
              >
                Avatar
              </Text>

              {avatar && (
                <View style={styles.avatarPreview}>
                  <Image
                    source={{ uri: avatar }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              <TouchableOpacity
                onPress={handleAvatarUpload}
                style={[
                  styles.uploadArea,
                  {
                    borderColor: theme.colorBorder,
                    backgroundColor: theme.colorInputBackground,
                  },
                ]}
              >
                <Upload size={24} color={theme.colorMutedForeground} />
                <Text
                  style={[
                    styles.uploadText,
                    { color: theme.colorMutedForeground },
                  ]}
                >
                  Tap to upload avatar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info Text */}
            <Text
              style={[styles.infoText, { color: theme.colorMutedForeground }]}
            >
              You can change these details later in settings
            </Text>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.submitBtn,
                { backgroundColor: "#F97316" },
                (!isFormValid || submitting) && styles.submitBtnDisabled,
              ]}
              disabled={!isFormValid || submitting}
            >
              <View style={styles.btnRow}>
                {submitting && (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
                <Text style={styles.submitBtnText}>
                  {submitting ? "Please wait..." : "Get Started"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text
                style={[
                  styles.loginText,
                  { color: theme.colorMutedForeground },
                ]}
              >
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={onLoginClick}>
                <Text style={[styles.loginLink, { color: "#F97316" }]}>
                  Log In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  phoneContainer: {
    position: "relative",
    width: "100%",
    maxWidth: 400,
    aspectRatio: 9 / 19.5,
    borderRadius: 48,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  notch: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -64,
    width: 128,
    height: 28,
    backgroundColor: "#000",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 20,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 96,
    paddingBottom: 32,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 96,
  },
  headline: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  form: {
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  required: {
    color: "#DC2626",
  },
  input: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 8,
  },
  avatarPreview: {
    marginBottom: 8,
    alignItems: "center",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  uploadArea: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 80,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 8,
    gap: 4,
  },
  uploadText: {
    fontSize: 12,
  },
  infoText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtn: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 8 as any },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "500",
  },
});
