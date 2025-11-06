import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "./StatusBar";
import {
  ArrowLeft,
  ChevronRight,
  User,
  Bell,
  Lock,
  Palette,
  Info,
  LogOut,
} from "lucide-react-native";
import { useTheme } from "../styles/useTheme";
import { Image as ExpoImage } from "expo-image";

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
}

type SettingsItem = {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  description: string;
};

export function SettingsPage({ onBack, onLogout }: SettingsPageProps) {
  const theme = useTheme();
  const [name, setName] = useState<string>("");
  const [slogan, setSlogan] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
          };
        const raw = await AsyncStorage.getItem("user:profile");
        if (raw) {
          const p = JSON.parse(raw);
          setName(p?.name || "");
          setSlogan(p?.slogan || "");
          setAvatar(p?.avatar || "");
        }
      } catch {}
    })();
  }, []);

  const settingsItems: SettingsItem[] = [
    {
      icon: User,
      label: "Edit Profile",
      description: "Update your personal information",
    },
    {
      icon: Bell,
      label: "Notifications",
      description: "Manage notification preferences",
    },
    {
      icon: Lock,
      label: "Privacy & Security",
      description: "Control your privacy settings",
    },
    {
      icon: Palette,
      label: "Appearance",
      description: "Customize app theme and display",
    },
    {
      icon: Info,
      label: "About",
      description: "App version and information",
    },
  ];

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
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: theme.colorCard,
                borderBottomColor: theme.colorBorder,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <ArrowLeft size={20} color={theme.colorMutedForeground} />
              </TouchableOpacity>
              <Text
                style={[styles.headerTitle, { color: theme.colorForeground }]}
              >
                Settings
              </Text>
            </View>
          </View>

          {/* Profile Section */}
          <View
            style={[
              styles.profileSection,
              { backgroundColor: theme.colorCard },
            ]}
          >
            <View style={styles.profileRow}>
              {avatar ? (
                <ExpoImage
                  source={{ uri: avatar }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              ) : (
                <Image
                  source={require("../assets/icon.png")}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              )}
              <View style={styles.profileInfo}>
                <Text
                  style={[styles.profileName, { color: theme.colorForeground }]}
                >
                  {name || "User"}
                </Text>
                {slogan ? (
                  <Text
                    style={[
                      styles.profileSlogan,
                      { color: theme.colorMutedForeground },
                    ]}
                  >
                    {slogan}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Settings List */}
          <View style={styles.settingsContainer}>
            <View
              style={[
                styles.settingsList,
                { backgroundColor: theme.colorCard },
              ]}
            >
              {settingsItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.settingsItem,
                      index !== settingsItems.length - 1 && {
                        borderBottomColor: theme.colorBorder,
                      },
                    ]}
                  >
                    <View style={styles.iconContainer}>
                      <Icon size={20} color="#F97316" />
                    </View>
                    <View style={styles.itemContent}>
                      <Text
                        style={[
                          styles.itemLabel,
                          { color: theme.colorForeground },
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.itemDescription,
                          { color: theme.colorMutedForeground },
                        ]}
                      >
                        {item.description}
                      </Text>
                    </View>
                    <ChevronRight
                      size={20}
                      color={theme.colorMutedForeground}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={onLogout}
              style={[styles.logoutBtn, { backgroundColor: theme.colorCard }]}
            >
              <LogOut size={20} color="#DC2626" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
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
    paddingBottom: 24,
  },
  header: {
    paddingTop: 64,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileSlogan: {
    fontSize: 12,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  settingsList: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  iconContainer: {
    padding: 8,
    backgroundColor: "#FEF3F2",
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logoutText: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "500",
  },
});
