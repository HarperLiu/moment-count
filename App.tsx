import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import { InfoCards } from "./components/InfoCards";
import { MemoriesSection } from "./components/MemoriesSection";
import { MenuItems } from "./components/MenuItems";
import { MemoryListPage } from "./components/MemoryListPage";
import { CookingReceiptListPage } from "./components/CookingReceiptListPage";
import { AddMemoryPage } from "./components/AddMemoryPage";
import { AddRecipePage } from "./components/AddRecipePage";
import { AuthPage } from "./components/AuthPage";
import { api } from "./app/api";
import { UserInfo } from "./components/UserInfo";
import { useTheme } from "./styles/useTheme";

type PageKey =
  | "auth"
  | "home"
  | "memories"
  | "cooking"
  | "add-memory"
  | "add-recipe";

export default function App() {
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState<PageKey>("auth");
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // dynamic require to avoid type resolution at build time
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
            setItem: (k: string, v: string) => Promise<void>;
          };
        const uuid = await AsyncStorage.getItem("user:uuid");
        if (uuid) {
          try {
            const { api } = await import("./app/api");
            const serverUser = await api.getUserByUuid(uuid);
            if (serverUser) {
              const profile = {
                uuid: serverUser.uuid,
                name: serverUser.name || "",
                slogan: serverUser.slogan || "",
                avatar: serverUser.avatar || "",
              };
              await AsyncStorage.setItem(
                "user:profile",
                JSON.stringify(profile)
              );
            }
          } catch {}
          setCurrentPage("home");
        } else {
          setCurrentPage("auth");
        }
      } catch {
        setCurrentPage("auth");
      } finally {
        setBootstrapped(true);
      }
    })();
  }, []);

  const handleSaveMemory = async (memory: {
    title: string;
    details: string;
    photos: string[];
    date: Date;
  }) => {
    try {
      const y = memory.date.getFullYear();
      const m = String(memory.date.getMonth() + 1).padStart(2, "0");
      const d = String(memory.date.getDate()).padStart(2, "0");
      await api.createMemory({
        title: memory.title,
        details: memory.details,
        photos: memory.photos,
        date: `${y}-${m}-${d}`,
      });
    } finally {
      setCurrentPage("memories");
    }
  };

  const handleSaveRecipe = async (recipe: {
    title: string;
    details: string;
    photos: string[];
    timeCost: { hours: number; minutes: number };
  }) => {
    try {
      await api.createRecipe({
        title: recipe.title,
        details: recipe.details,
        photos: recipe.photos,
        timeCost: recipe.timeCost,
      });
    } finally {
      setCurrentPage("cooking");
    }
  };

  if (!bootstrapped) {
    return <View style={{ flex: 1, backgroundColor: "#F8FAFC" }} />;
  }

  if (currentPage === "auth") {
    return <AuthPage onRegistered={() => setCurrentPage("home")} />;
  }

  if (currentPage === "add-memory") {
    return (
      <AddMemoryPage
        onBack={() => setCurrentPage("memories")}
        onSave={handleSaveMemory}
      />
    );
  }

  if (currentPage === "add-recipe") {
    return (
      <AddRecipePage
        onBack={() => setCurrentPage("cooking")}
        onSave={handleSaveRecipe}
      />
    );
  }

  if (currentPage === "memories") {
    return (
      <MemoryListPage
        onBack={() => setCurrentPage("home")}
        onAddMemory={() => setCurrentPage("add-memory")}
      />
    );
  }

  if (currentPage === "cooking") {
    return (
      <CookingReceiptListPage
        onBack={() => setCurrentPage("home")}
        onAddRecipe={() => setCurrentPage("add-recipe")}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colorBackground }]}>
      <ExpoStatusBar style="dark" backgroundColor="#E5E7EB" />
      <View
        style={[styles.phoneContainer, { backgroundColor: theme.colorCard }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Image */}
          <View style={styles.heroWrapper}>
            <Image
              source={require("./assets/background.jpg")}
              resizeMode="cover"
              style={styles.heroImage}
            />
          </View>

          {/* User Info */}
          <UserInfo />

          {/* Info Cards */}
          <InfoCards />

          {/* Memories Section */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Memory</Text>
              <TouchableOpacity onPress={() => setCurrentPage("memories")}>
                <Text style={styles.linkText}>See more</Text>
              </TouchableOpacity>
            </View>
            <MemoriesSection />
          </View>

          {/* Cooking Receipt Section */}
          <View style={styles.sectionWrapperBottom}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cooking Receipt</Text>
              <TouchableOpacity onPress={() => setCurrentPage("cooking")}>
                <Text style={styles.linkText}>See more</Text>
              </TouchableOpacity>
            </View>
            <MenuItems />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#E5E7EB",
  },

  phoneContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 9 / 19.5,
    backgroundColor: "#FFFFFF",
    borderRadius: 48,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    alignSelf: "center",
    maxWidth: 420,
  },
  notch: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    width: 128,
    height: 28,
    backgroundColor: "#000",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 20,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroWrapper: {
    height: 192,
    width: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  sectionWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionWrapperBottom: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  linkText: {
    fontSize: 14,
    color: "#6B7280",
  },
});
