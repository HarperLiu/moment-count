import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from "react-native";
import { ArrowLeft, Moon, Globe, ChevronRight } from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";

interface AppearancePageProps {
  onBack: () => void;
  darkMode: boolean;
  onToggleDarkMode: (enabled: boolean) => void;
}

export function AppearancePage({
  onBack,
  darkMode,
  onToggleDarkMode,
}: AppearancePageProps) {
  const { theme } = useThemeContext();
  const [language, setLanguage] = useState<string>("English");

  useEffect(() => {
    // 从 AsyncStorage 加载语言设置
    (async () => {
      try {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
          };
        const savedLanguage = await AsyncStorage.getItem("user:language");
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
      } catch {}
    })();
  }, []);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorBackground }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colorBackground,
              borderBottomColor: theme.colorBorder,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.leftGroup}>
              <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={20} color={theme.colorForeground} />
              </TouchableOpacity>
              <Text
                style={[styles.pageTitle, { color: theme.colorForeground }]}
              >
                Appearance
              </Text>
            </View>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsContainer}>
          <View
            style={[styles.settingsList, { backgroundColor: theme.colorCard }]}
          >
            {/* Dark Mode */}
            <View
              style={[
                styles.settingsItem,
                {
                  ...styles.settingsItemBorder,
                  borderBottomColor: theme.colorBorder,
                },
              ]}
            >
              <View style={styles.iconContainer}>
                <Moon size={20} color="#F97316" />
              </View>
              <View style={styles.itemContent}>
                <Text
                  style={[styles.itemLabel, { color: theme.colorForeground }]}
                >
                  Dark Mode
                </Text>
                <Text
                  style={[
                    styles.itemDescription,
                    { color: theme.colorMutedForeground },
                  ]}
                >
                  Enable dark theme for the app
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={onToggleDarkMode}
                trackColor={{ false: "#E5E7EB", true: "#F97316" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            {/* Language */}
            <TouchableOpacity
              style={styles.settingsItem}
              activeOpacity={0.7}
              onPress={() => {
                // TODO: 打开语言选择器
                console.log("Open language selector");
              }}
            >
              <View style={styles.iconContainer}>
                <Globe size={20} color="#F97316" />
              </View>
              <View style={styles.itemContent}>
                <Text
                  style={[styles.itemLabel, { color: theme.colorForeground }]}
                >
                  Language
                </Text>
                <Text
                  style={[
                    styles.itemDescription,
                    { color: theme.colorMutedForeground },
                  ]}
                >
                  {language}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.colorMutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: "700",
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingsList: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingsItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    padding: 8,
    backgroundColor: "#FFF7ED",
    borderRadius: 8,
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
  },
});
