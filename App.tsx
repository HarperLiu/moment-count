import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { Settings, Heart } from "lucide-react-native";
import { Image } from "expo-image";

import { MapComponent } from "./components/MapComponent";
import { MemoryListPage } from "./components/MemoryListPage";
import { AddMemoryPage } from "./components/AddMemoryPage";
import { WelcomePage } from "./components/WelcomePage";
import { RegisterPage } from "./components/RegisterPage";
import { LoginPage } from "./components/LoginPage";
import { api } from "./app/api";
import { UserInfo } from "./components/UserInfo";
import { AnniversaryCard } from "./components/AnniversaryCard";
import { DailyQACard } from "./components/DailyQACard";
import { CapsuleCard } from "./components/CapsuleCard";
import { BottomNavBar } from "./components/BottomNavBar";
import { SettingsPage } from "./components/SettingsPage";
import { UserLinkPage } from "./components/UserLinkPage";
import { EditProfilePage } from "./components/EditProfilePage";
import { AboutPage } from "./components/AboutPage";
import { AnniversaryPage } from "./components/AnniversaryPage";
import { DailyQAPage } from "./components/DailyQAPage";
import { AppearancePage } from "./components/AppearancePage";
import { CapsuleListPage } from "./components/CapsuleListPage";
import { TruthOrDarePage } from "./components/TruthOrDarePage";
import { ManageQuestionsPage } from "./components/ManageQuestionsPage";
import { AddCapsulePage } from "./components/AddCapsulePage";
import { CapsuleDetailPage } from "./components/CapsuleDetailPage";
import { WishListPage } from "./components/WishListPage";
import { AddWishPage } from "./components/AddWishPage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useThemeContext } from "./styles/ThemeContext";
import { LanguageProvider, useLanguageContext } from "./styles/LanguageContext";

type PageKey =
  | "welcome"
  | "login"
  | "register"
  | "home"
  | "memories"
  | "add-memory"
  | "edit-memory"
  | "capsules"
  | "add-capsule"
  | "capsule-detail"
  | "wishlist"
  | "add-wish"
  | "edit-wish"
  | "truth-or-dare"
  | "manage-questions"
  | "anniversaries"
  | "add-anniversary"
  | "edit-anniversary"
  | "daily-qa"
  | "settings"
  | "user-link"
  | "edit-profile"
  | "about"
  | "appearance";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { theme, isDark, setThemeMode } = useThemeContext();
  const { t } = useLanguageContext();
  const [currentPage, setCurrentPage] = useState<PageKey>("welcome");
  const [bootstrapped, setBootstrapped] = useState(false);
  const [userProfile, setUserProfile] = useState<{ uuid: string; name: string; avatar: string } | null>(null);
  const [linkedUser, setLinkedUser] = useState<string | null>(null);
  const [linkedUserProfile, setLinkedUserProfile] = useState<{
    name: string;
    avatar: string;
  } | null>(null);
  const [linkKey, setLinkKey] = useState<string | null>(null);
  const [relationshipStartDate, setRelationshipStartDate] =
    useState<Date | null>(null);
  const [returnToPage, setReturnToPage] = useState<PageKey>("home");
  const [editMemoryData, setEditMemoryData] = useState<{
    id: string;
    title: string;
    details: string;
    photos: string[];
    date: string;
  } | null>(null);
  const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);
  const [selectedCapsuleId, setSelectedCapsuleId] = useState<string | null>(null);
  const [editWishData, setEditWishData] = useState<any>(null);

  // Page transition fade animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevPageRef = useRef<PageKey>(currentPage);

  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      prevPageRef.current = currentPage;
    }
  }, [currentPage]);

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
        const linkedUserProfileStr = await AsyncStorage.getItem(
          "user:linkedUserProfile"
        );
        const linkId = await AsyncStorage.getItem("user:linkId");
        if (linkId) setLinkKey(linkId);
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
              setUserProfile({ uuid: profile.uuid, name: profile.name, avatar: profile.avatar });
            } else {
              setUserProfile({ uuid, name: "", avatar: "" });
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
                // Refresh partner profile from server
                if (relationshipInfo.linkedUserUuid) {
                  const partnerData = await api.getUserByUuid(relationshipInfo.linkedUserUuid);
                  if (partnerData) {
                    const freshProfile = {
                      name: partnerData.name || linkedUserStr || "",
                      avatar: partnerData.avatar || "",
                    };
                    setLinkedUserProfile(freshProfile);
                    await AsyncStorage.setItem("user:linkedUserProfile", JSON.stringify(freshProfile));
                  }
                }
              } else {
                // linkId is outdated, clear it
                await AsyncStorage.removeItem("user:linkId");
                await AsyncStorage.removeItem("user:linkedUser");
                setLinkedUser(null);
                setRelationshipStartDate(null);
              }
            }
          } catch {
            // Server fetch failed; load from stored profile
            const storedProfile = await AsyncStorage.getItem("user:profile");
            if (storedProfile) {
              try {
                const p = JSON.parse(storedProfile);
                setUserProfile({ uuid: p.uuid || uuid, name: p.name || "", avatar: p.avatar || "" });
              } catch {}
            } else {
              setUserProfile({ uuid, name: "", avatar: "" });
            }
          }
          // Register push token for notifications
          try {
            const Notifications = require("expo-notifications");
            const { status: existingStatus } =
              await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== "granted") {
              const { status } =
                await Notifications.requestPermissionsAsync();
              finalStatus = status;
            }
            if (finalStatus === "granted") {
              const tokenData =
                await Notifications.getDevicePushTokenAsync();
              if (tokenData?.data) {
                await api.registerPushToken({
                  userId: uuid,
                  token: tokenData.data,
                });
              }
            }
          } catch (e) {
            // Push token registration is best-effort; don't block app startup
            console.warn("Push token registration failed:", e);
          }
          setLinkedUser(linkedUserStr);
          if (linkedUserProfileStr) {
            try {
              setLinkedUserProfile(JSON.parse(linkedUserProfileStr));
            } catch {}
          }
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
      setMemoryRefreshKey((k) => k + 1);
    } finally {
      setCurrentPage(returnToPage);
    }
  };

  const handleUpdateMemory = async (memory: {
    title: string;
    details: string;
    photos: string[];
    date: Date;
  }) => {
    if (!editMemoryData) return;
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage")
        .default as {
        getItem: (k: string) => Promise<string | null>;
      };
      const userId = (await AsyncStorage.getItem("user:uuid")) || "";

      const y = memory.date.getFullYear();
      const m = String(memory.date.getMonth() + 1).padStart(2, "0");
      const d = String(memory.date.getDate()).padStart(2, "0");
      await api.updateMemory(editMemoryData.id, {
        title: memory.title,
        details: memory.details,
        photos: memory.photos,
        date: `${y}-${m}-${d}`,
        userId,
      });
      setMemoryRefreshKey((k) => k + 1);
    } finally {
      setEditMemoryData(null);
      setCurrentPage("memories");
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
      await AsyncStorage.removeItem("user:linkedUserProfile");
      await AsyncStorage.removeItem("user:linkId");
      setLinkedUser(null);
      setLinkedUserProfile(null);
      setRelationshipStartDate(null);
      setCurrentPage("welcome");
    } catch (e) {
      console.error("Failed to clear cache", e);
      setCurrentPage("welcome");
    }
  };

  const handleDeleteAccount = async () => {
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default as {
      getItem: (k: string) => Promise<string | null>;
      removeItem: (k: string) => Promise<void>;
    };
    const uuid = await AsyncStorage.getItem("user:uuid");
    if (!uuid) {
      throw new Error("User not found");
    }
    await api.deleteAccount({ uuid });
    // Clear all local data after successful deletion
    await AsyncStorage.removeItem("user:uuid");
    await AsyncStorage.removeItem("user:profile");
    await AsyncStorage.removeItem("user:loginAt");
    await AsyncStorage.removeItem("user:linkedUser");
    await AsyncStorage.removeItem("user:linkedUserProfile");
    await AsyncStorage.removeItem("user:linkId");
    setLinkedUser(null);
    setLinkedUserProfile(null);
    setRelationshipStartDate(null);
    setCurrentPage("welcome");
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
        getItem: (k: string) => Promise<string | null>;
      };
      if (username && linkKey) {
        // Link: save linkId and username, set start date in state
        await AsyncStorage.setItem("user:linkId", linkKey);
        setLinkKey(linkKey);
        await AsyncStorage.setItem("user:linkedUser", username);
        setLinkedUser(username);
        if (startDate) {
          setRelationshipStartDate(startDate);
        }
        // Fetch partner avatar
        const uuid = await AsyncStorage.getItem("user:uuid");
        if (uuid) {
          const relationshipInfo = await api.getRelationship(uuid);
          if (relationshipInfo?.linkedUserUuid) {
            const partnerData = await api.getUserByUuid(
              relationshipInfo.linkedUserUuid
            );
            if (partnerData) {
              const partnerProfile = {
                name: partnerData.name || username,
                avatar: partnerData.avatar || "",
              };
              setLinkedUserProfile(partnerProfile);
              await AsyncStorage.setItem(
                "user:linkedUserProfile",
                JSON.stringify(partnerProfile)
              );
            }
          }
        }
      } else {
        // Unlink: clear linkId, username, and start date
        await AsyncStorage.removeItem("user:linkId");
        setLinkKey(null);
        await AsyncStorage.removeItem("user:linkedUser");
        await AsyncStorage.removeItem("user:linkedUserProfile");
        setLinkedUser(null);
        setLinkedUserProfile(null);
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
      setUserProfile({ uuid: profile.uuid, name: profile.name, avatar: profile.avatar });

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
    } catch (err: any) {
      // Re-throw the error so RegisterPage can catch it
      throw new Error(err?.message || "注册失败，请重试");
    }
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
      setUserProfile({ uuid: profile.uuid, name: profile.name, avatar: profile.avatar });

      // Fetch and cache relationship info
      try {
        const relationshipInfo = await api.getRelationship(user.uuid);
        if (relationshipInfo && relationshipInfo.linkKey) {
          // Only cache linkId, fetch other data on demand
          await AsyncStorage.setItem("user:linkId", relationshipInfo.linkKey);
          setLinkKey(relationshipInfo.linkKey);

          // Set relationship data in state
          if (relationshipInfo.linkedUserUuid) {
            // Get linked user's profile (name + avatar)
            const linkedUserData = await api.getUserByUuid(
              relationshipInfo.linkedUserUuid
            );
            if (linkedUserData) {
              const partnerProfile = {
                name: linkedUserData.name || "",
                avatar: linkedUserData.avatar || "",
              };
              setLinkedUser(partnerProfile.name);
              setLinkedUserProfile(partnerProfile);
              await AsyncStorage.setItem(
                "user:linkedUser",
                partnerProfile.name
              );
              await AsyncStorage.setItem(
                "user:linkedUserProfile",
                JSON.stringify(partnerProfile)
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
    } catch (err: any) {
      // Re-throw the error so LoginPage can catch it
      throw new Error(err?.message || "用户名或密码错误");
    }
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
        onDeleteAccount={handleDeleteAccount}
        onNavigateToUserLink={() => setCurrentPage("user-link")}
        onNavigateToEditProfile={() => setCurrentPage("edit-profile")}
        onNavigateToAbout={() => setCurrentPage("about")}
        onNavigateToAppearance={() => setCurrentPage("appearance")}
      />
    );
  }

  if (currentPage === "appearance") {
    return (
      <AppearancePage
        onBack={() => setCurrentPage("settings")}
        darkMode={isDark}
        onToggleDarkMode={(enabled) => {
          setThemeMode(enabled ? "dark" : "light");
        }}
      />
    );
  }

  if (currentPage === "about") {
    return <AboutPage onBack={() => setCurrentPage("settings")} />;
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

  // --- Bottom nav handler (shared by home + first-level pages) ---
  const handleBottomNav = (tab: "memories" | "capsules" | "home" | "wishlist" | "truth-or-dare") => {
    setCurrentPage(tab);
  };

  // Determine the active bottom tab for first-level pages
  const activeBottomTab: "memories" | "capsules" | "home" | "wishlist" | "truth-or-dare" =
    currentPage === "memories" ? "memories"
    : currentPage === "capsules" ? "capsules"
    : currentPage === "wishlist" ? "wishlist"
    : currentPage === "truth-or-dare" ? "truth-or-dare"
    : "home";

  // --- Second-level pages (no bottom nav, use back navigation) ---
  if (currentPage === "add-memory") {
    return (
      <AddMemoryPage
        onBack={() => setCurrentPage(returnToPage)}
        onSave={handleSaveMemory}
      />
    );
  }

  if (currentPage === "edit-memory" && editMemoryData) {
    return (
      <AddMemoryPage
        onBack={() => {
          setEditMemoryData(null);
          setCurrentPage("memories");
        }}
        onSave={handleUpdateMemory}
        editData={editMemoryData}
      />
    );
  }

  if (currentPage === "add-capsule" && linkedUser) {
    return (
      <AddCapsulePage
        onBack={() => setCurrentPage("capsules")}
        userId={userProfile?.uuid || ""}
        linkedUser={linkedUser}
        linkKey={linkKey || ""}
      />
    );
  }

  if (currentPage === "capsule-detail" && selectedCapsuleId) {
    return (
      <CapsuleDetailPage
        onBack={() => {
          setSelectedCapsuleId(null);
          setCurrentPage("capsules");
        }}
        capsuleId={selectedCapsuleId}
        userId={userProfile?.uuid || ""}
      />
    );
  }

  if (currentPage === "add-wish" || currentPage === "edit-wish") {
    return (
      <AddWishPage
        onBack={() => {
          setEditWishData(null);
          setCurrentPage("wishlist");
        }}
        userId={userProfile?.uuid || ""}
        linkKey={linkKey || ""}
        editData={currentPage === "edit-wish" ? editWishData : null}
      />
    );
  }

  if (currentPage === "manage-questions") {
    return (
      <ManageQuestionsPage
        onBack={() => setCurrentPage("truth-or-dare")}
        userId={userProfile?.uuid || ""}
        linkKey={linkKey}
      />
    );
  }

  if (currentPage === "anniversaries") {
    return (
      <AnniversaryPage
        onBack={() => setCurrentPage("home")}
        relationshipStartDate={relationshipStartDate}
        userId={userProfile?.uuid || ""}
        linkedUser={linkedUser}
      />
    );
  }

  if (currentPage === "add-anniversary" || currentPage === "edit-anniversary") {
    return (
      <View style={[styles.placeholderPage, { backgroundColor: theme.colorBackground }]}>
        <TouchableOpacity onPress={() => setCurrentPage("anniversaries")} style={styles.backBtn}>
          <Text style={{ color: theme.colorPrimary, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.placeholderTitle, { color: theme.colorForeground }]}>
          Anniversary
        </Text>
        <Text style={{ color: theme.colorMutedForeground }}>{t("common.moreIsComing")}</Text>
      </View>
    );
  }

  if (currentPage === "daily-qa") {
    return (
      <DailyQAPage
        onBack={() => setCurrentPage("home")}
        user={userProfile}
        linkedUser={linkedUser}
        linkKey={linkKey}
      />
    );
  }

  // --- All tab pages share the same layout: content + BottomNavBar ---
  const renderTabContent = () => {
    if (currentPage === "memories") {
      return (
        <MemoryListPage
          onBack={() => setCurrentPage("home")}
          onAddMemory={() => {
            setReturnToPage("memories");
            setCurrentPage("add-memory");
          }}
          onEditMemory={(memory) => {
            setEditMemoryData(memory);
            setCurrentPage("edit-memory");
          }}
          refreshKey={memoryRefreshKey}
          linkedUser={linkedUser}
        />
      );
    }

    if (currentPage === "capsules") {
      return (
        <CapsuleListPage
          onBack={() => setCurrentPage("home")}
          onAddCapsule={() => setCurrentPage("add-capsule")}
          onOpenCapsule={(id) => {
            setSelectedCapsuleId(id);
            setCurrentPage("capsule-detail");
          }}
          userId={userProfile?.uuid || ""}
          linkKey={linkKey}
          linkedUser={linkedUser}
        />
      );
    }

    if (currentPage === "wishlist") {
      return (
        <WishListPage
          onBack={() => setCurrentPage("home")}
          onAddWish={() => setCurrentPage("add-wish")}
          onEditWish={(wish) => {
            setEditWishData(wish);
            setCurrentPage("edit-wish");
          }}
          userId={userProfile?.uuid || ""}
          linkKey={linkKey}
          linkedUser={linkedUser}
        />
      );
    }

    if (currentPage === "truth-or-dare") {
      return (
        <TruthOrDarePage
          onBack={() => setCurrentPage("home")}
          onManageQuestions={() => setCurrentPage("manage-questions")}
          userId={userProfile?.uuid || ""}
          linkKey={linkKey}
          linkedUser={linkedUser}
          linkedUserProfile={linkedUserProfile}
        />
      );
    }

    // Home
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colorBackground }}>
        <ExpoStatusBar style={isDark ? "light" : "dark"} />
        {/* Top Bar: Logo + Settings */}
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <Image
              source={require("./assets/logo.png")}
              style={styles.logoIcon}
              contentFit="cover"
            />
            <Text
              style={[styles.logoText, { color: theme.colorForeground }]}
            >
              {t("common.appName")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setCurrentPage("settings")}
            style={[
              styles.settingsBtn,
              { backgroundColor: theme.colorCard },
            ]}
          >
            <Settings size={18} color={theme.colorForeground} />
          </TouchableOpacity>
        </View>

        {/* Main scrollable content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. UserInfo */}
          <UserInfo
            linkedUser={linkedUser}
            linkedUserProfile={linkedUserProfile}
            onLinkClick={() => setCurrentPage("user-link")}
          />

          {/* 2. Location Sharing — Map */}
          <View style={styles.sectionWrapper}>
            <View style={styles.mapContainer}>
              <MapComponent />
            </View>
          </View>

          {/* 3. Anniversary Reminder */}
          <View style={styles.sectionWrapper}>
            <AnniversaryCard
              relationshipStartDate={relationshipStartDate}
              onPress={() => setCurrentPage("anniversaries")}
              userId={userProfile?.uuid || ""}
            />
          </View>

          {/* 4. Daily Q&A */}
          <View style={styles.sectionWrapper}>
            <DailyQACard
              onPress={() => setCurrentPage("daily-qa")}
              linkKey={linkKey}
              userId={userProfile?.uuid ?? null}
            />
          </View>

          {/* 5. Time Capsules */}
          <View style={styles.sectionWrapper}>
            <CapsuleCard
              onPress={() => setCurrentPage("capsules")}
              userId={userProfile?.uuid ?? null}
              linkKey={linkKey}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colorBackground }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {renderTabContent()}
      </Animated.View>
      <BottomNavBar activeTab={activeBottomTab} onNavigate={handleBottomNav} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoIcon: {
    width: 32,
    height: 21,
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingBottom: 16,
  },

  sectionWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  mapContainer: {
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
  },

  // Placeholder page styles for unimplemented modules
  placeholderPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  placeholderPageInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backBtn: {
    position: "absolute",
    top: 56,
    left: 20,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
});
