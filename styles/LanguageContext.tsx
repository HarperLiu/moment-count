import React, { createContext, useContext, useState, useEffect } from "react";
import { en } from "../locales/en";
import { zh } from "../locales/zh";

export type Language = "en" | "zh";

const translations = { en, zh };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
          };
        const saved = await AsyncStorage.getItem("user:language");
        if (saved === "en" || saved === "zh") {
          setLanguageState(saved);
        }
      } catch {}
    })();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage")
        .default as {
        setItem: (k: string, v: string) => Promise<void>;
      };
      await AsyncStorage.setItem("user:language", lang);
    } catch {}
  };

  const t = (key: string): string => {
    const parts = key.split(".");
    let current: any = translations[language];
    for (const part of parts) {
      if (current == null) return key;
      current = current[part];
    }
    return typeof current === "string" ? current : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguageContext must be used within LanguageProvider");
  }
  return context;
}
