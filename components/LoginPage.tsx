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
import { StatusBar } from "./StatusBar";
import { useTheme } from "../styles/useTheme";

interface LoginPageProps {
  onLogin: (data: { username: string; password: string }) => void;
  onSignUpClick: () => void;
}

export function LoginPage({ onLogin, onSignUpClick }: LoginPageProps) {
  const theme = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!(username.trim() && password.trim())) return;
    if (submitting) return;
    try {
      setSubmitting(true);
      await Promise.resolve(onLogin({ username, password }));
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = username.trim() && password.trim();

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
              Log In Now
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.colorMutedForeground }]}
            >
              Log in to continue sharing moments
            </Text>
          </View>

          {/* Form Content */}
          <View style={styles.form}>
            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, { color: theme.colorMutedForeground }]}
              >
                Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
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

            {/* Info Text */}
            <Text
              style={[styles.infoText, { color: theme.colorMutedForeground }]}
            >
              Enter your credentials to access your account
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
              <Text style={styles.submitBtnText}>
                {submitting ? "Please wait..." : "Log In"}
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text
                style={[
                  styles.signUpText,
                  { color: theme.colorMutedForeground },
                ]}
              >
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity onPress={onSignUpClick}>
                <Text style={[styles.signUpLink, { color: "#F97316" }]}>
                  Sign Up
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
  signUpContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: "500",
  },
});
