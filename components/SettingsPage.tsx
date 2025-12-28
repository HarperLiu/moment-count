import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import {
  ArrowLeft,
  ChevronRight,
  User,
  Link2,
  Palette,
  Info,
  LogOut,
} from "lucide-react-native";
import { Image } from "expo-image";
import { useThemeContext } from "../styles/ThemeContext";

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigateToUserLink?: () => void;
  onNavigateToEditProfile?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToAppearance?: () => void;
}

type SettingsItem = {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  description: string;
  onClick?: () => void;
};

export function SettingsPage({
  onBack,
  onLogout,
  onNavigateToUserLink,
  onNavigateToEditProfile,
  onNavigateToAbout,
  onNavigateToAppearance,
}: SettingsPageProps) {
  const { theme } = useThemeContext();
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
      onClick: onNavigateToEditProfile,
    },
    {
      icon: Link2,
      label: "Manage Link",
      description: "Connect with your partner",
      onClick: onNavigateToUserLink,
    },
    {
      icon: Palette,
      label: "Appearance",
      description: "Customize app theme and display",
      onClick: onNavigateToAppearance,
    },
    {
      icon: Info,
      label: "About",
      description: "App version and information",
      onClick: onNavigateToAbout,
    },
  ];

  const avatarSource = avatar ? { uri: avatar } : require("../assets/icon.png");

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorSecondary }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Sticky Header */}
        <View
          style={[
            styles.stickyHeader,
            {
              backgroundColor: theme.colorSecondary,
              borderBottomColor: theme.colorBorder,
            },
          ]}
        >
          <View style={styles.stickyRow}>
            <View style={styles.leftGroup}>
              <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={20} color={theme.colorForeground} />
              </TouchableOpacity>
              <Text
                style={[styles.pageTitle, { color: theme.colorForeground }]}
              >
                Settings
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Section */}
        <View
          style={[styles.profileSection, { backgroundColor: theme.colorCard }]}
        >
          <View style={styles.profileRow}>
            <Image
              source={avatarSource}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <View style={styles.profileInfo}>
              <Text
                style={[styles.profileName, { color: theme.colorForeground }]}
              >
                {name || "User"}
              </Text>
              {!!slogan && (
                <Text
                  style={[
                    styles.profileSlogan,
                    { color: theme.colorMutedForeground },
                  ]}
                >
                  {slogan}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsContainer}>
          <View
            style={[styles.settingsList, { backgroundColor: theme.colorCard }]}
          >
            {settingsItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.settingsItem,
                    index !== settingsItems.length - 1 && {
                      ...styles.settingsItemBorder,
                      borderBottomColor: theme.colorBorder,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={item.onClick}
                  disabled={!item.onClick}
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
                  <ChevronRight size={20} color={theme.colorMutedForeground} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={onLogout}
            style={[
              styles.logoutBtn,
              {
                backgroundColor: theme.colorCard,
                borderColor: "#EF4444",
                borderWidth: 1,
              },
            ]}
            activeOpacity={0.7}
          >
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  stickyHeader: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: "700",
  },
  profileSection: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
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
    borderRadius: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingsItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    padding: 8,
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    marginRight: 16,
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
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logoutText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "500",
    marginLeft: 8,
  },
});
