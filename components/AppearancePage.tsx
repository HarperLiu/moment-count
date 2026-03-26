import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
} from "react-native";
import { ArrowLeft, Moon, Globe, ChevronRight } from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";
import {
  useLanguageContext,
  Language,
} from "../styles/LanguageContext";

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
  const { t, language, setLanguage } = useLanguageContext();

  const languageLabel = language === "zh" ? "简体中文" : "English";

  const handleSelectLanguage = () => {
    Alert.alert(t("appearance.selectLanguage"), undefined, [
      { text: "English", onPress: () => setLanguage("en" as Language) },
      { text: "简体中文", onPress: () => setLanguage("zh" as Language) },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorBackground }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.colorBorder },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <ArrowLeft size={22} color={theme.colorForeground} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.colorForeground }]}>
            {t("appearance.title")}
          </Text>
          <View style={styles.iconBtn} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Card */}
        <View
          style={[
            styles.settingsList,
            {
              backgroundColor: theme.colorCard,
              borderColor: theme.colorBorder,
            },
          ]}
        >
          {/* Dark Mode */}
          <View
            style={[
              styles.settingsItem,
              {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colorBorder,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colorPrimary + "15" },
              ]}
            >
              <Moon size={18} color={theme.colorPrimary} />
            </View>
            <View style={styles.itemContent}>
              <Text
                style={[styles.itemLabel, { color: theme.colorForeground }]}
              >
                {t("appearance.darkMode")}
              </Text>
              <Text
                style={[
                  styles.itemDescription,
                  { color: theme.colorMutedForeground },
                ]}
              >
                {t("appearance.darkModeDesc")}
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={onToggleDarkMode}
              trackColor={{
                false: theme.colorSwitchBackground,
                true: theme.colorPrimary,
              }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.colorSwitchBackground}
            />
          </View>

          {/* Language */}
          <TouchableOpacity
            style={styles.settingsItem}
            activeOpacity={0.7}
            onPress={handleSelectLanguage}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colorPrimary + "15" },
              ]}
            >
              <Globe size={18} color={theme.colorPrimary} />
            </View>
            <View style={styles.itemContent}>
              <Text
                style={[styles.itemLabel, { color: theme.colorForeground }]}
              >
                {t("appearance.language")}
              </Text>
              <Text
                style={[
                  styles.itemDescription,
                  { color: theme.colorMutedForeground },
                ]}
              >
                {languageLabel}
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colorMutedForeground} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  settingsList: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 12,
  },
});
