import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, FlatList } from "react-native";
import { Clock } from "lucide-react-native";

type MenuItem = {
  id: number;
  name: string;
  description: string;
  timeCost: string;
  image: string;
};

export function MenuItems() {
  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        id: 1,
        name: "Thai Seafood Glass Noodle",
        description:
          "A refreshing Thai salad made with tender glass noodles, fresh shrimp, squa...",
        timeCost: "45 min",
        image:
          "https://images.unsplash.com/photo-1745209981037-a92f69e241d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFpJTIwZ2xhc3MlMjBub29kbGVzJTIwc2VhZm9vZHxlbnwxfHx8fDE3NjE4ODE1NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      },
      {
        id: 2,
        name: "Japanese Ramen Bowl",
        description:
          "A rich and savory bowl of ramen noodles served in a fragrant broth, topped with...",
        timeCost: "1 h 30 min",
        image:
          "https://images.unsplash.com/photo-1697652974652-a2336106043b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHJhbWVuJTIwYm93bHxlbnwxfHx8fDE3NjE4ODE1Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      },
    ],
    []
  );

  const renderItem = ({ item, index }: { item: MenuItem; index: number }) => (
    <View
      style={[styles.row, index !== menuItems.length - 1 && styles.rowBorder]}
    >
      <View style={styles.flex1}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.timeRow}>
          <Clock size={14} color="#111827" />
          <Text style={styles.timeText}>{item.timeCost}</Text>
        </View>
      </View>
      <View>
        <Image source={{ uri: item.image }} style={styles.cover} />
      </View>
    </View>
  );

  return (
    <FlatList
      data={menuItems}
      keyExtractor={(i) => String(i.id)}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12 as any,
    paddingBottom: 16,
    alignItems: "center",
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  flex1: { flex: 1 },
  name: {
    marginBottom: 4,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  desc: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 as any },
  timeText: { marginLeft: 4, fontSize: 13, color: "#111827" },
  cover: { width: 96, height: 96, borderRadius: 16 },
});
