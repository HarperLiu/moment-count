import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Heart, Link } from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

interface UserInfoProps {
  linkedUser?: string | null;
  linkedUserProfile?: { name: string; avatar: string } | null;
  onLinkClick?: () => void;
}

export function UserInfo({
  linkedUser,
  linkedUserProfile,
  onLinkClick,
}: UserInfoProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [name, setName] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
          };
        const raw = await AsyncStorage.getItem("user:profile");
        if (raw && mounted) {
          const p = JSON.parse(raw);
          setName(p?.name || "");
          setAvatar(p?.avatar || "");
        }
      } catch {}
    };
    load();
    // Retry once after a short delay in case bootstrap hasn't finished writing yet
    const timer = setTimeout(load, 1500);
    return () => { mounted = false; clearTimeout(timer); };
  }, [linkedUser]);

  const myAvatarSource = avatar
    ? { uri: avatar }
    : require("../assets/icon.jpg");

  // Linked: dual avatar layout
  if (linkedUser && linkedUserProfile) {
    const partnerAvatarSource = linkedUserProfile.avatar
      ? { uri: linkedUserProfile.avatar }
      : require("../assets/icon.jpg");

    return (
      <View style={styles.dualContainer}>
        {/* Row 1: avatars + heart, all vertically centered */}
        <View style={styles.dualRow}>
          <View style={styles.dualCell}>
            <Image
              source={myAvatarSource}
              style={styles.dualAvatar}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>
          <View style={styles.dualCellHeart}>
            <Heart
              size={20}
              color={theme.colorPrimary}
              fill={theme.colorPrimary}
            />
          </View>
          <View style={styles.dualCell}>
            <Image
              source={partnerAvatarSource}
              style={styles.dualAvatar}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          </View>
        </View>
        {/* Row 2: names */}
        <View style={styles.dualRow}>
          <View style={styles.dualCell}>
            <Text
              style={[styles.dualName, { color: theme.colorForeground }]}
              numberOfLines={1}
            >
              {name || "Me"}
            </Text>
          </View>
          <View style={styles.dualCellHeart} />
          <View style={styles.dualCell}>
            <Text
              style={[styles.dualName, { color: theme.colorForeground }]}
              numberOfLines={1}
            >
              {linkedUserProfile.name || linkedUser}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Not linked: single avatar + tap to link
  return (
    <View style={styles.singleContainer}>
      <Image
        source={myAvatarSource}
        style={styles.singleAvatar}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: theme.colorForeground }]}>
          {name || "User"}
        </Text>
        <TouchableOpacity
          onPress={onLinkClick}
          style={styles.linkButton}
          activeOpacity={0.7}
        >
          <Link size={14} color="#3B82F6" />
          <Text style={styles.linkButtonText}>{t("userInfo.tapToLink")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Dual avatar layout (linked)
  dualContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  dualRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dualCell: {
    width: 80,
    alignItems: "center",
  },
  dualCellHeart: {
    width: 40,
    alignItems: "center",
  },
  dualAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  dualName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // Single avatar layout (not linked)
  singleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  singleAvatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkButtonText: {
    fontSize: 12,
    color: "#3B82F6",
    marginLeft: 6,
  },
});
