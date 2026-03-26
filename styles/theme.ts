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

  // ── 背景层次 ──
  colorBackground:          "#F8F9FC",   // 极淡冷白，与 icon 白底呼应
  colorForeground:          "#1C1F2E",   // 深蓝灰文字，比纯黑更柔和

  // ── 卡片 & 弹出层（逐级提亮营造层次）──
  colorCard:                "#FFFFFF",
  colorCardForeground:      "#1C1F2E",
  colorPopover:             "#FFFFFF",
  colorPopoverForeground:   "#1C1F2E",

  // ── 主色：薰衣草蓝紫（无限符号交汇色）──
  colorPrimary:             "#7B8FD4",
  colorPrimaryForeground:   "#FFFFFF",

  // ── 次要色：极淡蓝灰 ──
  colorSecondary:           "#EEF0F7",
  colorSecondaryForeground: "#1C1F2E",

  // ── 静默色：灰蓝 ──
  colorMuted:               "#EAECF2",
  colorMutedForeground:     "#8A8FA2",

  // ── 强调色：蜜桃暖色（icon 右环底部）──
  colorAccent:              "#F5EBE4",
  colorAccentForeground:    "#1C1F2E",

  // ── 危险色：柔和红 ──
  colorDestructive:         "#E05C6E",
  colorDestructiveForeground: "#FFFFFF",

  // ── 边框 & 输入 ──
  colorBorder:              "rgba(28, 31, 46, 0.08)",
  colorInput:               "transparent",
  colorInputBackground:     "#F0F1F6",
  colorSwitchBackground:    "#C4C8D4",
  colorRing:                "#B0BCE0",

  // ── 图表色：从 icon 提取的 5 色彩虹 ──
  chart1:                   "#8BBEE8",   // 柔蓝
  chart2:                   "#8DD4B0",   // 薄荷绿
  chart3:                   "#B0A0D4",   // 薰衣草紫
  chart4:                   "#E8D88C",   // 暖黄
  chart5:                   "#E8B090",   // 蜜桃色
};

export const darkTheme: Theme = {
  ...base,

  // ── 背景层次：暖灰基调，与 claude.ai 一致 ──
  colorBackground:          "#2b2a27",
  colorForeground:          "#ECEEF4",

  // ── 卡片 & 弹出层 ──
  colorCard:                "#3b3a37",
  colorCardForeground:      "#ECEEF4",
  colorPopover:             "#403f3c",
  colorPopoverForeground:   "#ECEEF4",

  // ── 主色：提亮的薰衣草蓝紫 ──
  colorPrimary:             "#99ABE0",
  colorPrimaryForeground:   "#181B28",

  // ── 次要色 ──
  colorSecondary:           "#353432",
  colorSecondaryForeground: "#ECEEF4",

  // ── 静默色 ──
  colorMuted:               "#353432",
  colorMutedForeground:     "#9b9a97",

  // ── 强调色：暗底暖色 ──
  colorAccent:              "#403f3c",
  colorAccentForeground:    "#ECEEF4",

  // ── 危险色 ──
  colorDestructive:         "#C04858",
  colorDestructiveForeground: "#F8D0D6",

  // ── 边框 & 输入 ──
  colorBorder:              "#4a4945",
  colorInput:               "#4a4945",
  colorInputBackground:     "#353432",
  colorSwitchBackground:    "#5a5955",
  colorRing:                "#6878A8",

  // ── 图表色：深底适配，略提饱和度 ──
  chart1:                   "#78B4E0",   // 柔蓝
  chart2:                   "#78C8A0",   // 薄荷绿
  chart3:                   "#A090CC",   // 薰衣草紫
  chart4:                   "#DCC878",   // 暖黄
  chart5:                   "#D8A480",   // 蜜桃色
};
