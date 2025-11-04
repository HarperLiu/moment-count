import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export function RestaurantHeader() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/avatar.jpg")}
        style={styles.avatar}
        resizeMode="cover"
      />
      <View style={styles.textCol}>
        <Text style={styles.title}>MetaCat</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          Living for now instead of future.
        </Text>
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
