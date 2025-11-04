import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image, FlatList } from "react-native";

type Memory = { id: number; image: any; date: string };

export function MemoriesSection() {
  const memories = useMemo<Memory[]>(
    () => [
      {
        id: 1,
        image: require("../assets/tree.jpg"),
        date: "Oct 15, 2024",
      },
      {
        id: 2,
        image: require("../assets/banglow.jpg"),
        date: "Sep 22, 2024",
      },
      {
        id: 3,
        image: require("../assets/mountain.jpg"),
        date: "Aug 30, 2024",
      },
      {
        id: 4,
        image: require("../assets/shanghai.jpg"),
        date: "Jul 12, 2024",
      },
    ],
    []
  );

  const renderItem = ({ item }: { item: Memory }) => (
    <View style={styles.item}>
      <View style={styles.card}>
        <Image source={item.image} style={styles.photo} resizeMode="cover" />
      </View>
      <Text style={styles.date}>{item.date}</Text>
    </View>
  );

  return (
    <FlatList
      data={memories}
      keyExtractor={(m) => String(m.id)}
      renderItem={renderItem}
      numColumns={2}
      columnWrapperStyle={styles.row}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  item: {
    width: "48%",
  },
  card: {
    position: "relative",
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 3,
    height: undefined,
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
});
