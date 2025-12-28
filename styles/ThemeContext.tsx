import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import { darkTheme, lightTheme, Theme } from "./theme";

type ThemeMode = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");

  // 从 AsyncStorage 加载主题设置
  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
          };
        const savedMode = await AsyncStorage.getItem("user:themeMode");
        if (
          savedMode === "light" ||
          savedMode === "dark" ||
          savedMode === "auto"
        ) {
          setThemeModeState(savedMode);
        }
      } catch {}
    })();
  }, []);

  // 保存主题设置到 AsyncStorage
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage")
        .default as {
        setItem: (k: string, v: string) => Promise<void>;
      };
      await AsyncStorage.setItem("user:themeMode", mode);
    } catch {}
  };

  // 计算实际使用的主题
  const isDark =
    themeMode === "dark" || (themeMode === "auto" && systemScheme === "dark");
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return context;
}
