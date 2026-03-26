import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { Image, Hourglass, Home, Star, Dices } from "lucide-react-native";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

export type BottomTab = "memories" | "capsules" | "home" | "wishlist" | "truth-or-dare";

interface BottomNavBarProps {
  activeTab: BottomTab;
  onNavigate: (tab: BottomTab) => void;
}

const tabDefs: { key: BottomTab; icon: typeof Image; labelKey: string }[] = [
  { key: "memories", icon: Image, labelKey: "memories" },
  { key: "capsules", icon: Hourglass, labelKey: "capsules" },
  { key: "home", icon: Home, labelKey: "home" },
  { key: "wishlist", icon: Star, labelKey: "wishes" },
  { key: "truth-or-dare", icon: Dices, labelKey: "truthOrDare" },
];

function TabItem({
  icon: Icon,
  labelKey,
  isActive,
  onPress,
}: {
  icon: typeof Image;
  labelKey: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(isActive ? 1 : 0.5)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isActive ? 1 : 0.5,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const color = isActive ? theme.colorPrimary : theme.colorMutedForeground;

  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.tabInner,
          { transform: [{ scale }], opacity },
        ]}
      >
        <Icon size={22} color={color} />
        <Text
          style={[
            styles.tabLabel,
            { color },
            isActive && styles.tabLabelActive,
          ]}
          numberOfLines={1}
        >
          {t(`nav.${labelKey}`)}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function BottomNavBar({ activeTab, onNavigate }: BottomNavBarProps) {
  const { theme } = useThemeContext();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colorCard,
          borderTopColor: theme.colorBorder,
        },
      ]}
    >
      {tabDefs.map((tab) => (
        <TabItem
          key={tab.key}
          icon={tab.icon}
          labelKey={tab.labelKey}
          isActive={activeTab === tab.key}
          onPress={() => onNavigate(tab.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  tabLabelActive: {
    fontWeight: "700",
  },
});
