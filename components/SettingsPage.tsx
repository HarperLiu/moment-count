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

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigateToUserLink?: () => void;
  onNavigateToEditProfile?: () => void;
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
}: SettingsPageProps) {
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
      onClick: undefined,
    },
    {
      icon: Info,
      label: "About",
      description: "App version and information",
      onClick: undefined,
    },
  ];

  const avatarSource = avatar ? { uri: avatar } : require("../assets/icon.png");

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <View style={styles.stickyRow}>
            <View style={styles.leftGroup}>
              <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={20} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.pageTitle}>Settings</Text>
            </View>
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <Image
              source={avatarSource}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{name || "User"}</Text>
              {!!slogan && <Text style={styles.profileSlogan}>{slogan}</Text>}
            </View>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsContainer}>
          <View style={styles.settingsList}>
            {settingsItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.settingsItem,
                    index !== settingsItems.length - 1 &&
                      styles.settingsItemBorder,
                  ]}
                  activeOpacity={0.7}
                  onPress={item.onClick}
                  disabled={!item.onClick}
                >
                  <View style={styles.iconContainer}>
                    <Icon size={20} color="#F97316" />
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemDescription}>
                      {item.description}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#CBD5E1" />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={onLogout}
            style={styles.logoutBtn}
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
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingBottom: 20,
  },
  stickyHeader: {
    backgroundColor: "#F8FAFC",
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
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
    color: "#111827",
  },
  profileSection: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
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
    color: "#111827",
    marginBottom: 4,
  },
  profileSlogan: {
    fontSize: 12,
    color: "#64748B",
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  settingsList: {
    backgroundColor: "#FFFFFF",
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
    borderBottomColor: "#F1F5F9",
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
    color: "#111827",
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
    color: "#64748B",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
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
