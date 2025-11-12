import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Link } from "lucide-react-native";

interface UserInfoProps {
  linkedUser?: string | null;
  onLinkClick?: () => void;
}

export function UserInfo({ linkedUser, onLinkClick }: UserInfoProps) {
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

  const avatarSource = avatar ? { uri: avatar } : require("../assets/icon.png");

  return (
    <View style={styles.container}>
      <Image
        source={avatarSource}
        style={styles.avatar}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
      <View style={styles.textCol}>
        <Text style={styles.title}>{name || "User"}</Text>
        {!!slogan && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {slogan}
          </Text>
        )}
        {linkedUser ? (
          <View style={styles.linkRow}>
            <Link size={14} color="#64748B" />
            <Text style={styles.linkText}>Linked with {linkedUser}</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onLinkClick}
            style={styles.linkButton}
            activeOpacity={0.7}
          >
            <Link size={14} color="#3B82F6" />
            <Text style={styles.linkButtonText}>Tap to link with the one</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  textCol: {
    flex: 1,
    paddingBottom: 2,
  },
  title: {
    marginBottom: 4,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 6,
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
