import { borderRadius, spacing } from "@/constants/spacing";
import { FONTS, typeScale } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { Pause, Play, RotateCcw } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import ProgressRing from "./ProgressRing";

interface TimerViewProps {
  durationSeconds: number;
  onComplete: () => void;
  variant: "focused" | "calm";
  habitColor: string;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}

export default function TimerView({
  durationSeconds,
  onComplete,
  variant,
  habitColor,
  isRunning,
  onToggle,
  onReset,
}: TimerViewProps) {
  const theme = useThemedColors();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const progress = durationSeconds > 0 ? elapsed / durationSeconds : 0;
  const remaining = Math.max(0, durationSeconds - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Breathing pulse for calm variant
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (variant === "calm" && isRunning) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [variant, isRunning, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Timer interval
  useEffect(() => {
    if (isRunning && !completedRef.current) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= durationSeconds) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            completedRef.current = true;
            onComplete();
            return durationSeconds;
          }
          return next;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, durationSeconds, onComplete]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    completedRef.current = false;
    setElapsed(0);
    onReset();
  }, [onReset]);

  const isComplete = elapsed >= durationSeconds;

  return (
    <View style={styles.container}>
      <Animated.View style={variant === "calm" ? pulseStyle : undefined}>
        <ProgressRing
          progress={progress}
          size={200}
          strokeWidth={variant === "focused" ? 6 : 4}
          color={isComplete ? theme.status.success : habitColor}
        >
          <Text style={[styles.timeText, { color: theme.text.primary }]}>
            {timeDisplay}
          </Text>
        </ProgressRing>
      </Animated.View>

      <View style={styles.controls}>
        {!isComplete && (
          <Pressable
            style={[styles.controlButton, { backgroundColor: habitColor }]}
            onPress={onToggle}
          >
            {isRunning ? (
              <Pause size={20} strokeWidth={1.5} color="#FFFFFF" />
            ) : (
              <Play size={20} strokeWidth={1.5} color="#FFFFFF" />
            )}
          </Pressable>
        )}

        {elapsed > 0 && !isRunning && !isComplete && (
          <Pressable
            style={[styles.controlButton, { backgroundColor: theme.bg.subtle }]}
            onPress={handleReset}
          >
            <RotateCcw
              size={20}
              strokeWidth={1.5}
              color={theme.text.secondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing[8],
  },
  timeText: {
    fontFamily: FONTS.mono,
    fontSize: typeScale.timer.size,
    fontWeight: typeScale.timer.weight,
    lineHeight: typeScale.timer.lineHeight,
    letterSpacing: typeScale.timer.tracking,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
