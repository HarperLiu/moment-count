import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { ArrowLeft, Plus, Clock } from "lucide-react-native";
import { api } from "../app/api";
import { useTheme } from "../styles/useTheme";
import { RecipeDetailCard } from "./RecipeDetailCard";

type Recipe = {
  id: string;
  name: string;
  description: string;
  timeCost: string;
  image: string;
};

// Format time cost: if hours is 0, only show minutes
function formatTimeCost(hours: number, minutes: number): string {
  if (hours === 0) {
    return `${minutes} min`;
  }
  return `${hours} h ${minutes} min`;
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <View style={[styles.row, styles.rowBorder]}>
      <View style={styles.flex1}>
        <Text style={styles.name}>{recipe.name}</Text>
        <Text style={styles.desc} numberOfLines={3} ellipsizeMode="tail">
          {recipe.description}
        </Text>
        <View style={styles.timeRow}>
          <Clock size={14} color="#111827" />
          <Text style={styles.timeText}>{recipe.timeCost}</Text>
        </View>
      </View>
      <View>
        <Image
          source={{ uri: recipe.image }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={recipe.image}
        />
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
  const theme = useTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Recipe | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Get user UUID
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
          };
        const userId = (await AsyncStorage.getItem("user:uuid")) || "";

        const data = await api.getRecipes(userId);
        if (!mounted) return;
        const mapped: Recipe[] = (data || []).map((r) => ({
          id: String((r as any).id),
          name: (r as any).title || "",
          description: (r as any).details || "",
          timeCost: formatTimeCost(
            (r as any).timeCost?.hours || 0,
            (r as any).timeCost?.minutes || 0
          ),
          image: (r as any).photos?.[0] || "",
        }));
        setRecipes(mapped);
      } catch (e: any) {
        if (mounted) setError(String(e?.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorBackground }]}
    >
      <ScrollView stickyHeaderIndices={[0]}>
        <View
          style={[
            styles.stickyHeader,
            {
              backgroundColor: theme.colorBackground,
              borderBottomColor: theme.colorBorder,
            },
          ]}
        >
          <View style={styles.stickyRow}>
            <View style={styles.leftGroup}>
              <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={20} color={theme.colorForeground} />
              </TouchableOpacity>
              <Text
                style={[styles.pageTitle, { color: theme.colorForeground }]}
              >
                Cooking Receipt
              </Text>
            </View>
            <TouchableOpacity onPress={onAddRecipe} style={styles.iconBtn}>
              <Plus size={20} color={theme.colorForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.feed}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F97316" />
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.colorMutedForeground },
                ]}
              >
                Loading recipes...
              </Text>
            </View>
          )}
          {!!error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {!loading && !error && (
            <>
              <FlatList
                data={recipes}
                keyExtractor={(r) => String(r.id)}
                renderItem={({ item, index }) => (
                  <View
                    style={{
                      marginBottom: index === recipes.length - 1 ? 0 : 16,
                    }}
                  >
                    <Pressable onPress={() => setSelected(item)}>
                      <RecipeCard recipe={item} />
                    </Pressable>
                  </View>
                )}
                scrollEnabled={false}
              />
              {selected && (
                <RecipeDetailCard
                  recipe={selected}
                  onClose={() => setSelected(null)}
                />
              )}
              <View style={styles.endRow}>
                <View
                  style={[
                    styles.endLine,
                    { backgroundColor: theme.colorBorder },
                  ]}
                />
                <Text
                  style={[
                    styles.endText,
                    { color: theme.colorMutedForeground },
                  ]}
                >
                  More is coming
                </Text>
                <View
                  style={[
                    styles.endLine,
                    { backgroundColor: theme.colorBorder },
                  ]}
                />
              </View>
            </>
          )}
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

  row: { flexDirection: "row", alignItems: "flex-start" },
  rowBorder: {
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  flex1: { flex: 1, minHeight: 96, justifyContent: "space-between" },
  name: { marginBottom: 4, fontSize: 16, fontWeight: "700", color: "#111827" },
  desc: { fontSize: 13, color: "#6B7280", marginBottom: 8, marginRight: 4 },
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
  },
});

// removed legacy styles from placeholder implementation
