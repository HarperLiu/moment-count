import { useColorScheme } from "react-native";
import { darkTheme, lightTheme, Theme } from "./theme";

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}
