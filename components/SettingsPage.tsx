import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  ArrowLeft,
  ChevronRight,
  User,
  Link2,
  Palette,
  Info,
  LogOut,
  Trash2,
} from "lucide-react-native";
import { Image } from "expo-image";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
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
  onDeleteAccount,
  onNavigateToUserLink,
  onNavigateToEditProfile,
  onNavigateToAbout,
  onNavigateToAppearance,
}: SettingsPageProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [name, setName] = useState<string>("");
  const [slogan, setSlogan] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      t("settings.deleteAccountTitle"),
      t("settings.deleteAccountMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("settings.deleteAccountConfirm"),
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await onDeleteAccount();
            } catch (error) {
              Alert.alert(t("common.error"), t("settings.deleteAccountError"));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

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
      label: t("settings.editProfile"),
      description: t("settings.editProfileDesc"),
      onClick: onNavigateToEditProfile,
    },
    {
      icon: Link2,
      label: t("settings.manageLink"),
      description: t("settings.manageLinkDesc"),
      onClick: onNavigateToUserLink,
    },
    {
      icon: Palette,
      label: t("settings.appearance"),
      description: t("settings.appearanceDesc"),
      onClick: onNavigateToAppearance,
    },
    {
      icon: Info,
      label: t("settings.about"),
      description: t("settings.aboutDesc"),
      onClick: onNavigateToAbout,
    },
  ];

  const avatarSource = avatar ? { uri: avatar } : require("../assets/icon.jpg");

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorBackground }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.colorBorder },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <ArrowLeft size={22} color={theme.colorForeground} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.colorForeground }]}>
            {t("settings.title")}
          </Text>
          <View style={styles.iconBtn} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onNavigateToEditProfile}
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.colorCard,
              borderColor: theme.colorBorder,
            },
          ]}
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
            <ChevronRight size={18} color={theme.colorMutedForeground} />
          </View>
        </TouchableOpacity>

        {/* Settings List */}
        <View
          style={[
            styles.settingsList,
            {
              backgroundColor: theme.colorCard,
              borderColor: theme.colorBorder,
            },
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
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colorBorder,
                  },
                ]}
                activeOpacity={0.7}
                onPress={item.onClick}
                disabled={!item.onClick}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colorPrimary + "15" },
                  ]}
                >
                  <Icon size={18} color={theme.colorPrimary} />
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
                <ChevronRight size={18} color={theme.colorMutedForeground} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity
            onPress={onLogout}
            style={[
              styles.dangerBtn,
              {
                backgroundColor: theme.colorCard,
                borderColor: theme.colorBorder,
                borderWidth: StyleSheet.hairlineWidth,
              },
            ]}
            activeOpacity={0.7}
          >
            <LogOut size={18} color={theme.colorDestructive} />
            <Text style={[styles.logoutText, { color: theme.colorDestructive }]}>
              {t("settings.logout")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            style={[
              styles.dangerBtn,
              {
                backgroundColor: theme.colorDestructive,
                opacity: isDeleting ? 0.6 : 1,
              },
            ]}
            activeOpacity={0.7}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Trash2 size={18} color="#FFFFFF" />
                <Text style={styles.deleteAccountText}>
                  {t("settings.deleteAccount")}
                </Text>
              </>
            )}
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
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  profileCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 3,
  },
  profileSlogan: {
    fontSize: 13,
  },
  settingsList: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
  },
  dangerSection: {
    gap: 10,
    marginTop: 8,
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "500",
  },
  deleteAccountText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "500",
  },
});
