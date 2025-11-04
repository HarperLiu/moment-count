import React, { useEffect, useMemo, useState } from "react";
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
import { api } from "../app/api";

type Recipe = {
  id: string;
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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api
      .getRecipes()
      .then((data) => {
        if (!mounted) return;
        const mapped: Recipe[] = (data || []).map((r) => ({
          id: String((r as any).id),
          name: (r as any).title || "",
          description: (r as any).details || "",
          timeCost: `${(r as any).timeCost?.hours || 0} h ${
            (r as any).timeCost?.minutes || 0
          } min`,
          image: (r as any).photos?.[0] || "",
        }));
        setRecipes(mapped);
      })
      .catch((e: any) => setError(String(e?.message || e)))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

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
          {loading && (
            <Text style={{ color: "#6B7280", marginBottom: 12 }}>
              Loading...
            </Text>
          )}
          {!!error && (
            <Text style={{ color: "#DC2626", marginBottom: 12 }}>{error}</Text>
          )}
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
