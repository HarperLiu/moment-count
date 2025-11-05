import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export function UserInfo() {
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
      <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />
      <View style={styles.textCol}>
        <Text style={styles.title}>{name || "User"}</Text>
        {!!slogan && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {slogan}
          </Text>
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
    alignItems: "flex-start",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
  },
});
