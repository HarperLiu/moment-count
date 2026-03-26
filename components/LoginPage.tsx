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
import { ArrowLeft, User, Lock } from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

interface LoginPageProps {
  onLogin: (data: { username: string; password: string }) => Promise<void>;
  onSignUpClick: () => void;
}

export function LoginPage({ onLogin, onSignUpClick }: LoginPageProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!(username.trim() && password.trim())) return;
    if (submitting) return;
    try {
      setSubmitting(true);
      setError(null);
      await onLogin({ username, password });
    } catch (err: any) {
      setError(err?.message || t("login.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = username.trim() && password.trim();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colorBackground }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onSignUpClick} style={styles.headerBtn}>
            <ArrowLeft size={22} color={theme.colorForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colorForeground }]}>
            {t("login.title")}
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
              {t("login.subtitle")}
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
            {/* Username */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, { color: theme.colorMutedForeground }]}
              >
                {t("login.name")} <Text style={{ color: theme.colorDestructive }}>*</Text>
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
                  value={username}
                  onChangeText={setUsername}
                  placeholder={t("login.namePlaceholder")}
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
                {t("login.password")} <Text style={{ color: theme.colorDestructive }}>*</Text>
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
                  placeholder={t("login.passwordPlaceholder")}
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
                {t("login.info")}
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
                  {submitting ? t("common.loading") : t("login.submit")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.linkContainer}>
            <Text
              style={[styles.linkText, { color: theme.colorMutedForeground }]}
            >
              {t("login.noAccount")}
            </Text>
            <TouchableOpacity onPress={onSignUpClick}>
              <Text style={[styles.linkAction, { color: theme.colorPrimary }]}>
                {t("login.signUp")}
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
    paddingTop: 24,
    paddingBottom: 32,
  },
  logo: {
    width: 88,
    height: 84,
    marginBottom: 16,
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
