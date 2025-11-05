export type Theme = {
  colorBackground: string;
  colorForeground: string;
  colorCard: string;
  colorCardForeground: string;
  colorPopover: string;
  colorPopoverForeground: string;
  colorPrimary: string;
  colorPrimaryForeground: string;
  colorSecondary: string;
  colorSecondaryForeground: string;
  colorMuted: string;
  colorMutedForeground: string;
  colorAccent: string;
  colorAccentForeground: string;
  colorDestructive: string;
  colorDestructiveForeground: string;
  colorBorder: string;
  colorInput: string;
  colorInputBackground: string;
  colorSwitchBackground: string;
  colorRing: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  radiusXl: number;
  fontHeadlineFamily: string;
  fontSize: number;
  fontWeightMedium: string | number;
  fontWeightNormal: string | number;
};

const base = {
  fontHeadlineFamily:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif",
  fontSize: 17,
  fontWeightMedium: "500",
  fontWeightNormal: "400",
  radiusSm: 6, // 0.625rem ≈ 10px; sm = radius - 4
  radiusMd: 8, // radius - 2
  radiusLg: 10, // radius
  radiusXl: 14, // radius + 4
};

export const lightTheme: Theme = {
  ...base,
  colorBackground: "#ffffff",
  colorForeground: "#0B0B0B",
  colorCard: "#ffffff",
  colorCardForeground: "#0B0B0B",
  colorPopover: "#ffffff",
  colorPopoverForeground: "#0B0B0B",
  colorPrimary: "#030213",
  colorPrimaryForeground: "#ffffff",
  colorSecondary: "#f2f2fb",
  colorSecondaryForeground: "#030213",
  colorMuted: "#ececf0",
  colorMutedForeground: "#717182",
  colorAccent: "#e9ebef",
  colorAccentForeground: "#030213",
  colorDestructive: "#d4183d",
  colorDestructiveForeground: "#ffffff",
  colorBorder: "rgba(0,0,0,0.1)",
  colorInput: "transparent",
  colorInputBackground: "#f3f3f5",
  colorSwitchBackground: "#cbced4",
  colorRing: "#b5b5ff",
  chart1: "#f3954a",
  chart2: "#7db9ff",
  chart3: "#6c7cff",
  chart4: "#f7d36b",
  chart5: "#f3b25c",
};

export const darkTheme: Theme = {
  ...base,
  colorBackground: "#232323",
  colorForeground: "#ffffff",
  colorCard: "#232323",
  colorCardForeground: "#ffffff",
  colorPopover: "#232323",
  colorPopoverForeground: "#ffffff",
  colorPrimary: "#ffffff",
  colorPrimaryForeground: "#353535",
  colorSecondary: "#444444",
  colorSecondaryForeground: "#ffffff",
  colorMuted: "#444444",
  colorMutedForeground: "#b5b5b5",
  colorAccent: "#444444",
  colorAccentForeground: "#ffffff",
  colorDestructive: "#8a3a2c",
  colorDestructiveForeground: "#f3a28e",
  colorBorder: "#444444",
  colorInput: "#444444",
  colorInputBackground: "#444444",
  colorSwitchBackground: "#6f6f6f",
  colorRing: "#707070",
  chart1: "#6d7cff",
  chart2: "#86e3a8",
  chart3: "#f3b25c",
  chart4: "#a688f5",
  chart5: "#f0a38b",
};
