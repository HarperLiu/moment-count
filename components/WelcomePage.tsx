import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Image } from "expo-image";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

interface WelcomePageProps {
  onGetStarted: () => void;
  onLogIn: () => void;
}

export function WelcomePage({ onGetStarted, onLogIn }: WelcomePageProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colorBackground }}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        {/* Welcome Text */}
        <Text style={[styles.headline, { color: theme.colorPrimary }]}>
          {t("welcome.title")}
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.colorMutedForeground }]}
        >
          {t("welcome.subtitle")}
        </Text>

        {/* Get Started Button */}
        <TouchableOpacity
          onPress={onGetStarted}
          style={[styles.getStartedBtn, { backgroundColor: theme.colorPrimary }]}
        >
          <Text style={styles.getStartedText}>{t("welcome.getStarted")}</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: theme.colorForeground }]}>
            {t("welcome.alreadyHaveAccount")}
          </Text>
          <TouchableOpacity onPress={onLogIn}>
            <Text style={[styles.loginLink, { color: theme.colorPrimary }]}>
              {t("welcome.loginLink")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 140,
    height: 100,
  },
  headline: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 48,
    maxWidth: 280,
    lineHeight: 20,
  },
  getStartedBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  getStartedText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
