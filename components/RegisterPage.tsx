import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { ArrowLeft, User, Lock, Upload } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { api } from "../app/api";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

interface RegisterPageProps {
  onRegister: (data: {
    name: string;
    slogan: string;
    avatar: string;
    password: string;
  }) => Promise<void>;
  onLoginClick: () => void;
}

export function RegisterPage({ onRegister, onLoginClick }: RegisterPageProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [avatarUri, setAvatarUri] = useState("");
  const [avatarBase64, setAvatarBase64] = useState("");
  const [avatarMime, setAvatarMime] = useState("image/jpeg");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAvatarUri(asset.uri);
      setAvatarBase64(asset.base64 || "");
      setAvatarMime(asset.mimeType || "image/jpeg");
    }
  };

  const handleSubmit = async () => {
    if (!(name.trim() && password.trim())) return;
    if (submitting) return;
    try {
      setSubmitting(true);
      setError(null);
      let avatarUrl = "";
      if (avatarBase64) {
        const ext = avatarMime.split("/")[1] || "jpg";
        const { url } = await api.uploadBase64Image({
          filename: `avatar_${Date.now()}.${ext}`,
          base64: avatarBase64,
          contentType: avatarMime,
        });
        avatarUrl = url;
      }
      await onRegister({ name, slogan, avatar: avatarUrl, password });
    } catch (err: any) {
      setError(err?.message || t("register.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = name.trim() && password.trim();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colorBackground }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onLoginClick} style={styles.headerBtn}>
            <ArrowLeft size={22} color={theme.colorForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colorForeground }]}>
            {t("register.title")}
          </Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
            <Text
              style={[styles.subtitle, { color: theme.colorMutedForeground }]}
            >
              {t("register.subtitle")}
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colorCard,
                borderColor: theme.colorBorder,
              },
            ]}
          >
            {/* Avatar Upload */}
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={handleAvatarUpload}>
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      {
                        backgroundColor: theme.colorInputBackground,
                        borderColor: theme.colorBorder,
                      },
                    ]}
                  >
                    <Upload size={22} color={theme.colorMutedForeground} />
                  </View>
                )}
              </TouchableOpacity>
              <Text
                style={[
                  styles.avatarLabel,
                  { color: theme.colorMutedForeground },
                ]}
              >
                {t("register.avatar")}
              </Text>
            </View>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, { color: theme.colorMutedForeground }]}
              >
                {t("register.name")} <Text style={{ color: theme.colorDestructive }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: theme.colorInputBackground,
                    borderColor: theme.colorBorder,
                  },
                ]}
              >
                <User size={16} color={theme.colorMutedForeground} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t("register.namePlaceholder")}
                  placeholderTextColor={theme.colorMutedForeground}
                  style={[styles.input, { color: theme.colorForeground }]}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, { color: theme.colorMutedForeground }]}
              >
                {t("register.password")} <Text style={{ color: theme.colorDestructive }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: theme.colorInputBackground,
                    borderColor: theme.colorBorder,
                  },
                ]}
              >
                <Lock size={16} color={theme.colorMutedForeground} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t("register.passwordPlaceholder")}
                  placeholderTextColor={theme.colorMutedForeground}
                  secureTextEntry
                  style={[styles.input, { color: theme.colorForeground }]}
                />
              </View>
            </View>

            {/* Error */}
            {error && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: theme.colorDestructive + "15" },
                ]}
              >
                <Text style={{ fontSize: 13, color: theme.colorDestructive, textAlign: "center" }}>
                  {error}
                </Text>
              </View>
            )}

            {/* Info */}
            {!error && (
              <Text
                style={[styles.infoText, { color: theme.colorMutedForeground }]}
              >
                {t("register.info")}
              </Text>
            )}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.submitBtn,
                { backgroundColor: theme.colorPrimary },
                (!isFormValid || submitting) && { opacity: 0.5 },
              ]}
              disabled={!isFormValid || submitting}
            >
              <View style={styles.btnRow}>
                {submitting && (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
                <Text style={styles.submitBtnText}>
                  {submitting ? t("common.loading") : t("register.submit")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.linkContainer}>
            <Text
              style={[styles.linkText, { color: theme.colorMutedForeground }]}
            >
              {t("register.alreadyHaveAccount")}
            </Text>
            <TouchableOpacity onPress={onLoginClick}>
              <Text style={[styles.linkAction, { color: theme.colorPrimary }]}>
                {t("register.loginLink")}
              </Text>
            </TouchableOpacity>
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
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 24,
  },
  logo: {
    width: 80,
    height: 76,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  formCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    fontSize: 12,
    marginTop: 6,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorContainer: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  linkText: {
    fontSize: 14,
  },
  linkAction: {
    fontSize: 14,
    fontWeight: "600",
  },
});
