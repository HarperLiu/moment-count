import React, { useCallback, useRef } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

interface IntensitySliderProps {
  value: number; // 0–100
  onValueChange: (v: number) => void;
  disabled?: boolean;
  trackColor: string;
  fillColor: string;
  thumbColor: string;
  thumbBorderColor: string;
}

const THUMB_SIZE = 24;

export function IntensitySlider({
  value,
  onValueChange,
  disabled,
  trackColor,
  fillColor,
  thumbColor,
  thumbBorderColor,
}: IntensitySliderProps) {
  const trackWidth = useRef(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  }, []);

  const clamp = (x: number) => {
    const w = trackWidth.current;
    if (w <= 0) return value;
    return Math.round(Math.max(0, Math.min(100, (x / w) * 100)));
  };

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .runOnJS(true)
    .onEnd((e) => {
      onValueChange(clamp(e.x));
    });

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .runOnJS(true)
    .onUpdate((e) => {
      onValueChange(clamp(e.x));
    });

  const composed = Gesture.Race(panGesture, tapGesture);

  const pct = `${value}%` as `${number}%`;

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.container} onLayout={onLayout}>
        <View style={[styles.track, { backgroundColor: trackColor }]}>
          <View
            style={[styles.fill, { backgroundColor: fillColor, width: pct }]}
          />
        </View>
        <View
          style={[
            styles.thumb,
            {
              left: pct,
              backgroundColor: thumbColor,
              borderColor: thumbBorderColor,
            },
          ]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: "center",
    paddingHorizontal: THUMB_SIZE / 2,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    top: (40 - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    marginLeft: 0, // left:pct already accounts for padding
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});
