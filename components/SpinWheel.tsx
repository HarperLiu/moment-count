import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import Svg, {
  G,
  Path,
  Circle,
  Text as SvgText,
} from "react-native-svg";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";
import type { TodType } from "../app/api";

export type GameMode = "truth-and-dare" | "truth-only" | "dare-only";

export type QuestionCategory =
  | "memories"
  | "dreams"
  | "preferences"
  | "hypotheticals"
  | "deep"
  | "daily"
  | "relationship"
  | "fun";

export interface SpinResult {
  type: TodType;
  category?: QuestionCategory;
}

interface SpinWheelProps {
  onResult: (result: SpinResult) => void;
  gameMode: GameMode;
  disabled?: boolean;
  onSpin?: () => void;
}

export interface SpinWheelHandle {
  spin: () => void;
  isSpinning: boolean;
}

const WHEEL_SIZE = 290;
const SPIN_DURATION = 3500;
const NUM_SEGMENTS = 8;
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS;

const SEGMENTS: { type: TodType; iconIndex: number }[] = [
  { type: "truth", iconIndex: 0 },
  { type: "dare", iconIndex: 0 },
  { type: "truth", iconIndex: 1 },
  { type: "dare", iconIndex: 1 },
  { type: "truth", iconIndex: 2 },
  { type: "dare", iconIndex: 2 },
  { type: "truth", iconIndex: 3 },
  { type: "dare", iconIndex: 3 },
];

// Alternating sky blue and bright yellow for truth-and-dare mode
const TD_SEGMENT_COLORS = [
  "#4D96FF", "#FFD93D", "#4D96FF", "#FFD93D",
  "#4D96FF", "#FFD93D", "#4D96FF", "#FFD93D",
];

// Confetti colors for category mode (8 from the 12-color palette)
const CATEGORY_SEGMENT_COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF",
  "#FF78C4", "#A66CFF", "#FFB26B", "#54BAB9",
];

const CATEGORIES: QuestionCategory[] = [
  "memories", "dreams", "preferences", "hypotheticals",
  "deep", "daily", "relationship", "fun",
];

const CATEGORY_LABEL_KEYS: Record<QuestionCategory, string> = {
  memories: "truthOrDare.categoryMemories",
  dreams: "truthOrDare.categoryDreams",
  preferences: "truthOrDare.categoryPreferences",
  hypotheticals: "truthOrDare.categoryHypotheticals",
  deep: "truthOrDare.categoryDeep",
  daily: "truthOrDare.categoryDaily",
  relationship: "truthOrDare.categoryRelationship",
  fun: "truthOrDare.categoryFun",
};

const HALF = WHEEL_SIZE / 2;
const RADIUS = HALF - 6;
const INNER_RADIUS = 10;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(index: number): string {
  const startAngle = index * SEGMENT_ANGLE;
  const endAngle = startAngle + SEGMENT_ANGLE;

  const outerStart = polarToCartesian(HALF, HALF, RADIUS, startAngle);
  const outerEnd = polarToCartesian(HALF, HALF, RADIUS, endAngle);
  const innerEnd = polarToCartesian(HALF, HALF, INNER_RADIUS, endAngle);
  const innerStart = polarToCartesian(HALF, HALF, INNER_RADIUS, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${RADIUS} ${RADIUS} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function labelPosition(index: number) {
  const midAngle = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const labelR = (RADIUS + INNER_RADIUS) / 2;
  return polarToCartesian(HALF, HALF, labelR, midAngle);
}

function WheelFace({
  labels,
  colors,
}: {
  labels: string[];
  colors: string[];
}) {
  return (
    <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
      {/* Segments */}
      {labels.map((_, i) => (
        <Path key={i} d={segmentPath(i)} fill={colors[i]} opacity={0.5} />
      ))}

      {/* Divider lines */}
      {labels.map((_, i) => {
        const angle = i * SEGMENT_ANGLE;
        const outer = polarToCartesian(HALF, HALF, RADIUS, angle);
        const inner = polarToCartesian(HALF, HALF, INNER_RADIUS, angle);
        return (
          <Path
            key={`div-${i}`}
            d={`M ${inner.x} ${inner.y} L ${outer.x} ${outer.y}`}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={1.5}
          />
        );
      })}

      {/* Segment labels */}
      {labels.map((label, i) => {
        const pos = labelPosition(i);
        const midAngle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
        return (
          <SvgText
            key={`lbl-${i}`}
            x={pos.x}
            y={pos.y}
            fill="#FFFFFF"
            fontSize={13}
            fontWeight="700"
            textAnchor="middle"
            alignmentBaseline="central"
            rotation={midAngle}
            origin={`${pos.x}, ${pos.y}`}
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

export const SpinWheelWithRef = forwardRef<SpinWheelHandle, SpinWheelProps>(
  function SpinWheelWithRef(props, ref) {
    const { theme } = useThemeContext();
    const { t } = useLanguageContext();
    const rotation = useRef(new Animated.Value(0)).current;
    const breathProgress = useRef(new Animated.Value(0)).current;
    const pointerOpacity = useRef(new Animated.Value(1)).current;
    const [spinning, setSpinning] = useState(false);
    const [idle, setIdle] = useState(true);
    const currentDegRef = useRef(0);
    const breathRef = useRef<Animated.CompositeAnimation | null>(null);

    const isCategoryMode = props.gameMode !== "truth-and-dare";

    // Build labels and colors based on mode
    const labels = isCategoryMode
      ? CATEGORIES.map((c) => t(CATEGORY_LABEL_KEYS[c]))
      : SEGMENTS.map((seg) =>
          seg.type === "truth" ? t("truthOrDare.truth") : t("truthOrDare.dare")
        );
    const colors = isCategoryMode ? CATEGORY_SEGMENT_COLORS : TD_SEGMENT_COLORS;

    // Resume idle when no longer disabled (result dismissed)
    useEffect(() => {
      if (!props.disabled && !spinning) {
        setIdle(true);
      }
    }, [props.disabled, spinning]);

    // Breathing: drive a linear 0→1 loop, interpolated to sine wave scale
    const scale = breathProgress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.08, 1],
    });

    useEffect(() => {
      if (idle && !props.disabled) {
        breathProgress.setValue(0);
        const loop = Animated.loop(
          Animated.timing(breathProgress, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          })
        );
        breathRef.current = loop;
        loop.start();
        return () => {
          loop.stop();
          breathRef.current = null;
        };
      } else {
        if (breathRef.current) {
          breathRef.current.stop();
          breathRef.current = null;
        }
        breathProgress.setValue(0); // maps to scale 1
      }
    }, [idle, props.disabled]);

    const doSpin = useCallback(() => {
      if (spinning || props.disabled) return;

      props.onSpin?.();

      // Pick a random segment index
      const chosenIndex = Math.floor(Math.random() * NUM_SEGMENTS);

      // Determine the result
      let result: SpinResult;
      if (isCategoryMode) {
        const type: TodType = props.gameMode === "truth-only" ? "truth" : "dare";
        const category = CATEGORIES[chosenIndex];
        result = { type, category };
      } else {
        result = { type: SEGMENTS[chosenIndex].type };
      }

      const targetDeg = chosenIndex * SEGMENT_ANGLE;
      const landingOffset = (360 - targetDeg) % 360;
      const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.5);

      const fullRotations = 5 + Math.floor(Math.random() * 3);
      const totalDeg = fullRotations * 360 + landingOffset + jitter;

      setIdle(false);
      setSpinning(true);

      const startDeg = currentDegRef.current % 360;
      rotation.setValue(startDeg);

      const finalDeg = startDeg + totalDeg;
      currentDegRef.current = finalDeg;

      // Fade pointer down while spinning
      Animated.timing(pointerOpacity, {
        toValue: 0.35,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.timing(rotation, {
        toValue: finalDeg,
        duration: SPIN_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // Restore pointer opacity
        Animated.timing(pointerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        setSpinning(false);
        setTimeout(() => {
          props.onResult(result);
        }, 300);
      });
    }, [spinning, props.disabled, rotation, props.onResult, props.gameMode, props.onSpin, isCategoryMode]);

    useImperativeHandle(ref, () => ({
      spin: doSpin,
      isSpinning: spinning,
    }));

    const spinInterpolation = rotation.interpolate({
      inputRange: [0, 360],
      outputRange: ["0deg", "360deg"],
    });

    return (
      <View style={styles.outerContainer}>
        {/* Shadow */}
        <View style={[styles.wheelShadow, { shadowColor: theme.colorForeground }]} />

        {/* Spinning wheel — scales with animation */}
        <Animated.View
          style={[
            styles.wheelWrapper,
            { transform: [{ scale }, { rotate: spinInterpolation }] },
          ]}
        >
          <WheelFace labels={labels} colors={colors} />
        </Animated.View>

        {/* Center pointer — fixed rotation, scales with wheel */}
        <Animated.View style={[styles.centerPointer, { opacity: pointerOpacity }]} pointerEvents="none">
          {(() => {
            const triH = 16;
            const baseHalfW = 6;
            const hubR = INNER_RADIUS;
            const svgW = hubR * 2 + 4;
            const svgH = hubR * 2 + triH + 4;
            const cx = svgW / 2;
            const cy = svgH / 2 + triH / 2;
            const tipY = cy - hubR - triH + 2;
            const baseY = cy - hubR + 2;
            return (
              <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
                <G>
                  {/* Flat pointer triangle */}
                  <Path
                    d={`M ${cx} ${tipY} L ${cx - baseHalfW} ${baseY} L ${cx + baseHalfW} ${baseY} Z`}
                    fill="#888888"
                  />
                  {/* Flat hub circle */}
                  <Circle cx={cx} cy={cy} r={hubR} fill="#EAEAEA" />
                </G>
              </Svg>
            );
          })()}
        </Animated.View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 8,
    height: WHEEL_SIZE + 48,
  },
  wheelShadow: {
    position: "absolute",
    width: WHEEL_SIZE - 10,
    height: WHEEL_SIZE - 10,
    borderRadius: WHEEL_SIZE / 2,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    backgroundColor: "transparent",
  },
  wheelWrapper: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  centerPointer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});
