import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "./StatusBar";
import { useTheme } from "../styles/useTheme";

interface WelcomePageProps {
  onGetStarted: () => void;
  onLogIn: () => void;
}

export function WelcomePage({ onGetStarted, onLogIn }: WelcomePageProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: "#F1F5F9" }]}>
      <StatusBar />
      {/* iPhone Container */}
      <View
        style={[styles.phoneContainer, { backgroundColor: theme.colorCard }]}
      >
        {/* Dynamic Island / Notch */}
        <View style={styles.notch} />

        {/* Content */}
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/app-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Welcome Text */}
          <Text style={[styles.headline, { color: "#F97316" }]}>
            Welcome To MomentCount
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colorMutedForeground }]}
          >
            Create an account and access thousand of cool stuffs
          </Text>

          {/* Get Started Button */}
          <TouchableOpacity
            onPress={onGetStarted}
            style={[styles.getStartedBtn, { backgroundColor: "#F97316" }]}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.colorForeground }]}>
              Already have an account ?{" "}
            </Text>
            <TouchableOpacity onPress={onLogIn}>
              <Text style={[styles.loginLink, { color: "#F97316" }]}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  phoneContainer: {
    flex: 1,
    position: "relative",
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
  content: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 168,
    height: 160,
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
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  getStartedText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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
    fontWeight: "500",
  },
});
