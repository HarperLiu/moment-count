import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  FlatList,
} from "react-native";
import { ArrowLeft, Plus, Clock } from "lucide-react-native";

type Recipe = {
  id: number;
  name: string;
  description: string;
  timeCost: string;
  image: string;
};

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <View style={[styles.row, styles.rowBorder]}>
      <View style={styles.flex1}>
        <Text style={styles.name}>{recipe.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {recipe.description}
        </Text>
        <View style={styles.timeRow}>
          <Clock size={14} color="#111827" />
          <Text style={styles.timeText}>{recipe.timeCost}</Text>
        </View>
      </View>
      <View>
        <Image source={{ uri: recipe.image }} style={styles.cover} />
      </View>
    </View>
  );
}

export function CookingReceiptListPage({
  onBack,
  onAddRecipe,
}: {
  onBack: () => void;
  onAddRecipe: () => void;
}) {
  const recipes = useMemo<Recipe[]>(
    () => [
      {
        id: 1,
        name: "Thai Seafood Glass Noodle",
        description:
          "A refreshing Thai salad made with tender glass noodles, fresh shrimp, squid, and aromatic herbs tossed in a zesty lime dressing.",
        timeCost: "45 min",
        image:
          "https://images.unsplash.com/photo-1745209981037-a92f69e241d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFpJTIwZ2xhc3MlMjBub29kbGVzJTIwc2VhZm9vZHxlbnwxfHx8fDE3NjE4ODE1NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      },
      {
        id: 2,
        name: "Japanese Ramen Bowl",
        description:
          "A rich and savory bowl of ramen noodles served in a fragrant broth, topped with tender pork, soft-boiled egg, and fresh scallions.",
        timeCost: "1 h 30 min",
        image:
          "https://images.unsplash.com/photo-1697652974652-a2336106043b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHJhbWVuJTIwYm93bHxlbnwxfHx8fDE3NjE4ODE1Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      },
      {
        id: 3,
        name: "Italian Carbonara Pasta",
        description:
          "Classic Roman pasta dish with creamy egg sauce, crispy pancetta, and freshly grated Pecorino Romano cheese.",
        timeCost: "25 min",
        image:
          "https://images.unsplash.com/photo-1739417083034-4e9118f487be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFsaWFuJTIwcGFzdGElMjBkaXNofGVufDF8fHx8MTc2MTg5MTMxNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      },
      {
        id: 4,
        name: "Premium Sushi Platter",
        description:
          "An elegant assortment of fresh nigiri and maki rolls featuring premium tuna, salmon, and seasonal fish with wasabi and pickled ginger.",
        timeCost: "2 h",
        image:
          "https://images.unsplash.com/photo-1625937751876-4515cd8e78bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMHBsYXR0ZXJ8ZW58MXx8fHwxNzYxODM0NDI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      },
      {
        id: 5,
        name: "Mexican Street Tacos",
        description:
          "Authentic street-style tacos with seasoned meat, fresh cilantro, onions, and a squeeze of lime on soft corn tortillas.",
        timeCost: "30 min",
        image:
          "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXhpY2FuJTIwdGFjb3N8ZW58MXx8fHwxNzYxODAwNjM4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      },
      {
        id: 6,
        name: "Butter Chicken Curry",
        description:
          "Tender chicken pieces simmered in a rich, creamy tomato-based sauce with aromatic Indian spices, served with basmati rice.",
        timeCost: "1 h",
        image:
          "https://images.unsplash.com/photo-1710091691802-7dedb8af9a77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBjdXJyeXxlbnwxfHx8fDE3NjE4OTMwODh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      },
      {
        id: 7,
        name: "French Crème Brûlée",
        description:
          "Classic French dessert featuring silky vanilla custard with a perfectly caramelized sugar crust that cracks with every spoonful.",
        timeCost: "3 h",
        image:
          "https://images.unsplash.com/photo-1589091637765-cbd0eff73a44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVuY2glMjBkZXNzZXJ0fGVufDF8fHx8MTc2MTg5MzA4OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      },
    ],
    []
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView stickyHeaderIndices={[0]}>
        <View style={styles.stickyHeader}>
          <View style={styles.stickyRow}>
            <View style={styles.leftGroup}>
              <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={20} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.pageTitle}>Cooking Receipt</Text>
            </View>
            <TouchableOpacity onPress={onAddRecipe} style={styles.iconBtn}>
              <Plus size={20} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.feed}>
          <FlatList
            data={recipes}
            keyExtractor={(r) => String(r.id)}
            renderItem={({ item, index }) => (
              <View
                style={{ marginBottom: index === recipes.length - 1 ? 0 : 16 }}
              >
                <RecipeCard recipe={item} />
              </View>
            )}
            scrollEnabled={false}
          />

          <View style={styles.endRow}>
            <View style={styles.endLine} />
            <Text style={styles.endText}>More is coming</Text>
            <View style={styles.endLine} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
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
  leftGroup: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  feed: { paddingHorizontal: 20, paddingVertical: 16 },

  row: { flexDirection: "row", alignItems: "center" },
  rowBorder: {
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  flex1: { flex: 1 },
  name: { marginBottom: 4, fontSize: 16, fontWeight: "700", color: "#111827" },
  desc: { fontSize: 13, color: "#6B7280", marginBottom: 8 },
  timeRow: { flexDirection: "row", alignItems: "center" },
  timeText: { marginLeft: 4, fontSize: 13, color: "#111827" },
  cover: { width: 96, height: 96, borderRadius: 16 },

  endRow: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  endLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
  },
  endText: { fontSize: 13, color: "#94A3B8", marginHorizontal: 12 },
});

// removed legacy styles from placeholder implementation
