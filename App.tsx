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
import { LogOut, Settings } from "lucide-react-native";

import { InfoCards } from "./components/InfoCards";
import { MemoriesSection } from "./components/MemoriesSection";
import { MenuItems } from "./components/MenuItems";
import { MemoryListPage } from "./components/MemoryListPage";
import { CookingReceiptListPage } from "./components/CookingReceiptListPage";
import { AddMemoryPage } from "./components/AddMemoryPage";
import { AddRecipePage } from "./components/AddRecipePage";
import { AuthPage } from "./components/AuthPage";
import { WelcomePage } from "./components/WelcomePage";
import { RegisterPage } from "./components/RegisterPage";
import { LoginPage } from "./components/LoginPage";
import { api } from "./app/api";
import { UserInfo } from "./components/UserInfo";
import { SettingsPage } from "./components/SettingsPage";
import { UserLinkPage } from "./components/UserLinkPage";
import { EditProfilePage } from "./components/EditProfilePage";
import { useTheme } from "./styles/useTheme";

type PageKey =
  | "welcome"
  | "login"
  | "register"
  | "auth"
  | "home"
  | "memories"
  | "cooking"
  | "add-memory"
  | "add-recipe"
  | "settings"
  | "user-link"
  | "edit-profile";

export default function App() {
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState<PageKey>("welcome");
  const [bootstrapped, setBootstrapped] = useState(false);
  const [linkedUser, setLinkedUser] = useState<string | null>(null);
  const [relationshipStartDate, setRelationshipStartDate] =
    useState<Date | null>(null);
  const [hasMemories, setHasMemories] = useState(false);
  const [hasRecipes, setHasRecipes] = useState(false);
  const [returnToPage, setReturnToPage] = useState<PageKey>("home");

  useEffect(() => {
    (async () => {
      try {
        // dynamic require to avoid type resolution at build time
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
            setItem: (k: string, v: string) => Promise<void>;
            removeItem: (k: string) => Promise<void>;
          };
        const uuid = await AsyncStorage.getItem("user:uuid");
        const loginAtStr = await AsyncStorage.getItem("user:loginAt");
        const linkedUserStr = await AsyncStorage.getItem("user:linkedUser");
        const linkId = await AsyncStorage.getItem("user:linkId");
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const within7Days =
          !!loginAtStr && now - Number(loginAtStr || 0) < sevenDaysMs;
        if (uuid && within7Days) {
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
            // Fetch relationship info using linkId
            if (linkId) {
              const relationshipInfo = await api.getRelationship(uuid);
              if (relationshipInfo && relationshipInfo.linkKey === linkId) {
                // linkId is still valid
                if (relationshipInfo.relationshipStartDate) {
                  setRelationshipStartDate(
                    new Date(relationshipInfo.relationshipStartDate)
                  );
                }
              } else {
                // linkId is outdated, clear it
                await AsyncStorage.removeItem("user:linkId");
                await AsyncStorage.removeItem("user:linkedUser");
                setLinkedUser(null);
                setRelationshipStartDate(null);
              }
            }
          } catch {}
          setLinkedUser(linkedUserStr);
          setCurrentPage("home");
        } else {
          setCurrentPage("welcome");
        }
      } catch {
        setCurrentPage("welcome");
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
      // Get user UUID
      const AsyncStorage = require("@react-native-async-storage/async-storage")
        .default as {
        getItem: (k: string) => Promise<string | null>;
      };
      const userId = (await AsyncStorage.getItem("user:uuid")) || "";

      const y = memory.date.getFullYear();
      const m = String(memory.date.getMonth() + 1).padStart(2, "0");
      const d = String(memory.date.getDate()).padStart(2, "0");
      await api.createMemory({
        title: memory.title,
        details: memory.details,
        photos: memory.photos,
        date: `${y}-${m}-${d}`,
        userId,
      });
    } finally {
      setCurrentPage(returnToPage);
    }
  };

  const handleSaveRecipe = async (recipe: {
    title: string;
    details: string;
    photos: string[];
    timeCost: { hours: number; minutes: number };
  }) => {
    try {
      // Get user UUID
      const AsyncStorage = require("@react-native-async-storage/async-storage")
        .default as {
        getItem: (k: string) => Promise<string | null>;
      };
      const userId = (await AsyncStorage.getItem("user:uuid")) || "";

      await api.createRecipe({
        title: recipe.title,
        details: recipe.details,
        photos: recipe.photos,
        timeCost: recipe.timeCost,
        userId,
      });
    } finally {
      setCurrentPage(returnToPage);
    }
  };

  const handleClearCache = async () => {
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage")
        .default as {
        removeItem: (k: string) => Promise<void>;
      };
      await AsyncStorage.removeItem("user:uuid");
      await AsyncStorage.removeItem("user:profile");
      await AsyncStorage.removeItem("user:loginAt");
      await AsyncStorage.removeItem("user:linkedUser");
      await AsyncStorage.removeItem("user:linkId");
      setLinkedUser(null);
      setRelationshipStartDate(null);
      setCurrentPage("welcome");
    } catch (e) {
      console.error("Failed to clear cache", e);
      setCurrentPage("welcome");
    }
  };

  const handleUpdateLink = async (
    username: string | null,
    startDate?: Date | null,
    linkKey?: string | null
  ) => {
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage")
        .default as {
        setItem: (k: string, v: string) => Promise<void>;
        removeItem: (k: string) => Promise<void>;
      };
      if (username && linkKey) {
        // Link: save linkId and username, set start date in state
        await AsyncStorage.setItem("user:linkId", linkKey);
        await AsyncStorage.setItem("user:linkedUser", username);
        setLinkedUser(username);
        if (startDate) {
          setRelationshipStartDate(startDate);
        }
      } else {
        // Unlink: clear linkId, username, and start date
        await AsyncStorage.removeItem("user:linkId");
        await AsyncStorage.removeItem("user:linkedUser");
        setLinkedUser(null);
        setRelationshipStartDate(null);
      }
    } catch (e) {
      console.error("Failed to update link", e);
    }
  };

  // Auth flows
  const handleGetStarted = () => setCurrentPage("register");
  const handleGoLogin = () => setCurrentPage("login");

  const handleRegister = async (data: {
    name: string;
    slogan: string;
    username: string; // avatar
    password: string;
  }) => {
    try {
      const user = await api.register({
        name: data.name.trim(),
        slogan: data.slogan.trim(),
        avatar: data.username || "",
        password: data.password,
      });
      const profile = {
        uuid: user.uuid,
        name: user.name || "",
        slogan: user.slogan || "",
        avatar: user.avatar || "",
      };
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default as {
        setItem: (k: string, v: string) => Promise<void>;
        removeItem: (k: string) => Promise<void>;
      };
      await AsyncStorage.setItem("user:uuid", profile.uuid);
      await AsyncStorage.setItem("user:profile", JSON.stringify(profile));
      await AsyncStorage.setItem("user:loginAt", String(Date.now()));

      // Fetch relationship info (unlikely for new user, but good to check)
      try {
        const relationshipInfo = await api.getRelationship(user.uuid);
        if (relationshipInfo && relationshipInfo.linkKey) {
          await AsyncStorage.setItem("user:linkId", relationshipInfo.linkKey);
        } else {
          await AsyncStorage.removeItem("user:linkId");
        }
      } catch (e) {
        // Silent fail for new users
      }

      setCurrentPage("home");
    } catch {}
  };

  const handleLogin = async (data: { username: string; password: string }) => {
    try {
      const user = await api.login({
        username: data.username,
        password: data.password,
      });
      const profile = {
        uuid: user.uuid,
        name: user.name || "",
        slogan: user.slogan || "",
        avatar: user.avatar || "",
      };
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default as {
        setItem: (k: string, v: string) => Promise<void>;
        removeItem: (k: string) => Promise<void>;
      };
      await AsyncStorage.setItem("user:uuid", profile.uuid);
      await AsyncStorage.setItem("user:profile", JSON.stringify(profile));
      await AsyncStorage.setItem("user:loginAt", String(Date.now()));

      // Fetch and cache relationship info
      try {
        const relationshipInfo = await api.getRelationship(user.uuid);
        if (relationshipInfo && relationshipInfo.linkKey) {
          // Only cache linkId, fetch other data on demand
          await AsyncStorage.setItem("user:linkId", relationshipInfo.linkKey);

          // Set relationship data in state
          if (relationshipInfo.linkedUserUuid) {
            // Get linked user's name
            const linkedUserData = await api.getUserByUuid(
              relationshipInfo.linkedUserUuid
            );
            if (linkedUserData) {
              setLinkedUser(linkedUserData.name || "");
              await AsyncStorage.setItem(
                "user:linkedUser",
                linkedUserData.name || ""
              );
            }
          }
          if (relationshipInfo.relationshipStartDate) {
            setRelationshipStartDate(
              new Date(relationshipInfo.relationshipStartDate)
            );
          }
        } else {
          // No relationship, clear linkId
          await AsyncStorage.removeItem("user:linkId");
        }
      } catch (e) {
        console.error("Failed to fetch relationship info:", e);
      }

      setCurrentPage("home");
    } catch {}
  };

  if (!bootstrapped) {
    return <View style={{ flex: 1, backgroundColor: "#F8FAFC" }} />;
  }

  if (currentPage === "welcome") {
    return (
      <WelcomePage onGetStarted={handleGetStarted} onLogIn={handleGoLogin} />
    );
  }
  if (currentPage === "register") {
    return (
      <RegisterPage
        onRegister={handleRegister}
        onLoginClick={() => setCurrentPage("login")}
      />
    );
  }
  if (currentPage === "login") {
    return (
      <LoginPage
        onLogin={handleLogin}
        onSignUpClick={() => setCurrentPage("register")}
      />
    );
  }

  if (currentPage === "settings") {
    return (
      <SettingsPage
        onBack={() => setCurrentPage("home")}
        onLogout={handleClearCache}
        onNavigateToUserLink={() => setCurrentPage("user-link")}
        onNavigateToEditProfile={() => setCurrentPage("edit-profile")}
      />
    );
  }

  if (currentPage === "edit-profile") {
    return (
      <EditProfilePage
        onBack={() => setCurrentPage("settings")}
        onSave={(data) => {
          console.log("Profile updated:", data);
        }}
      />
    );
  }

  if (currentPage === "user-link") {
    return (
      <UserLinkPage
        onBack={() => setCurrentPage("home")}
        currentLinkedUser={linkedUser}
        relationshipStartDate={relationshipStartDate}
        onUpdateLink={handleUpdateLink}
      />
    );
  }

  if (currentPage === "add-memory") {
    return (
      <AddMemoryPage
        onBack={() => setCurrentPage(returnToPage)}
        onSave={handleSaveMemory}
      />
    );
  }

  if (currentPage === "add-recipe") {
    return (
      <AddRecipePage
        onBack={() => setCurrentPage(returnToPage)}
        onSave={handleSaveRecipe}
      />
    );
  }

  if (currentPage === "memories") {
    return (
      <MemoryListPage
        onBack={() => setCurrentPage("home")}
        onAddMemory={() => {
          setReturnToPage("memories");
          setCurrentPage("add-memory");
        }}
      />
    );
  }

  if (currentPage === "cooking") {
    return (
      <CookingReceiptListPage
        onBack={() => setCurrentPage("home")}
        onAddRecipe={() => {
          setReturnToPage("cooking");
          setCurrentPage("add-recipe");
        }}
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
            {/* Settings Button (top-right) */}
            <TouchableOpacity
              onPress={() => setCurrentPage("settings")}
              style={styles.settingsBtn}
            >
              <Settings size={18} color={theme.colorForeground} />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <UserInfo
            linkedUser={linkedUser}
            onLinkClick={() => setCurrentPage("user-link")}
          />

          {/* Info Cards */}
          <InfoCards relationshipStartDate={relationshipStartDate} />

          {/* Memories Section */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Memory</Text>
              {hasMemories && (
                <TouchableOpacity onPress={() => setCurrentPage("memories")}>
                  <Text style={styles.linkText}>See more</Text>
                </TouchableOpacity>
              )}
            </View>
            <MemoriesSection
              onAddMemory={() => {
                setReturnToPage("home");
                setCurrentPage("add-memory");
              }}
              onDataLoad={setHasMemories}
            />
          </View>

          {/* Cooking Receipt Section */}
          <View style={styles.sectionWrapperBottom}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cooking Receipt</Text>
              {hasRecipes && (
                <TouchableOpacity onPress={() => setCurrentPage("cooking")}>
                  <Text style={styles.linkText}>See more</Text>
                </TouchableOpacity>
              )}
            </View>
            <MenuItems
              onAddRecipe={() => {
                setReturnToPage("home");
                setCurrentPage("add-recipe");
              }}
              onDataLoad={setHasRecipes}
            />
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
  settingsBtn: {
    position: "absolute",
    top: 48,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
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
