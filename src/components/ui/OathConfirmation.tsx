import { spacing } from "@/constants/spacing";
import { typeScale } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const COUNTDOWN_PHRASES = [
  "Breathe in slowly…",
  "Feel the stillness…",
  "You are in control.",
  "Almost there…",
  "One last breath…",
];

interface OathConfirmationProps {
  oathText: string;
  onConfirmed: () => void;
  holdDurationMs?: number;
  habitColor: string;
}

export default function OathConfirmation({
  oathText,
  onConfirmed,
  holdDurationMs = 5000,
  habitColor,
}: OathConfirmationProps) {
  const theme = useThemedColors();
  const [isHolding, setIsHolding] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);

  const completedRef = useRef(false);
  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phraseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const RING_SIZE = 100;
  const RING_STROKE = 4;
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  const holdProgress = useSharedValue(0);

  const animatedRingProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - holdProgress.value) * circumference,
  }));

  const clearHoldTimers = useCallback(() => {
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (phraseIntervalRef.current) {
      clearInterval(phraseIntervalRef.current);
      phraseIntervalRef.current = null;
    }
  }, []);

  const handleHoldComplete = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearHoldTimers();
    setIsHolding(false);
    setHintVisible(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirmed();
  }, [clearHoldTimers, onConfirmed]);

  const onPressIn = useCallback(() => {
    if (completedRef.current) return;
    setIsHolding(true);
    setHintVisible(false);
    setPhraseIndex(0);

    holdProgress.value = withTiming(1, {
      duration: holdDurationMs,
      easing: Easing.linear,
    });

    hapticIntervalRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 500);

    phraseIntervalRef.current = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % COUNTDOWN_PHRASES.length);
    }, 2500);

    holdTimeoutRef.current = setTimeout(() => {
      handleHoldComplete();
    }, holdDurationMs);
  }, [holdDurationMs, handleHoldComplete, holdProgress]);

  const onPressOut = useCallback(() => {
    if (completedRef.current) return;
    clearHoldTimers();
    setIsHolding(false);
    holdProgress.value = withTiming(0, { duration: 400 });
    setHintVisible(true);
    setTimeout(() => setHintVisible(false), 2000);
  }, [clearHoldTimers, holdProgress]);

  // Cleanup on unmount
  useEffect(() => () => clearHoldTimers(), [clearHoldTimers]);

  const center = RING_SIZE / 2;

  return (
    <View style={styles.container}>
      <Text style={[styles.oathText, { color: theme.text.secondary }]}>
        {oathText}
      </Text>

      <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
        <View style={styles.ringContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={theme.border.subtle}
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <AnimatedCircle
              cx={center}
              cy={center}
              r={radius}
              stroke={habitColor}
              strokeWidth={RING_STROKE}
              fill="none"
              strokeDasharray={circumference}
              animatedProps={animatedRingProps}
              strokeLinecap="round"
              rotation="-90"
              origin={`${center}, ${center}`}
            />
          </Svg>
          <View style={[StyleSheet.absoluteFill, styles.holdLabelContainer]}>
            <Text style={[styles.holdLabel, { color: theme.text.primary }]}>
              {isHolding ? "Keep holding…" : "Hold to confirm"}
            </Text>
          </View>
        </View>
      </Pressable>

      {isHolding && (
        <Text style={[styles.phrase, { color: theme.text.tertiary }]}>
          {COUNTDOWN_PHRASES[phraseIndex]}
        </Text>
      )}

      {hintVisible && !isHolding && (
        <Text style={[styles.hint, { color: theme.text.tertiary }]}>
          Keep holding until the ring fills
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing[4],
  },
  oathText: {
    fontSize: typeScale.callout.size,
    fontWeight: typeScale.callout.weight,
    lineHeight: typeScale.callout.lineHeight,
    textAlign: "center",
    paddingHorizontal: spacing[4],
  },
  ringContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  holdLabelContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  holdLabel: {
    fontSize: typeScale.caption1.size,
    fontWeight: "600",
    lineHeight: typeScale.caption1.lineHeight,
  },
  phrase: {
    fontSize: typeScale.footnote.size,
    fontWeight: typeScale.footnote.weight,
    lineHeight: typeScale.footnote.lineHeight,
    fontStyle: "italic",
  },
  hint: {
    fontSize: typeScale.caption1.size,
    fontWeight: typeScale.caption1.weight,
    lineHeight: typeScale.caption1.lineHeight,
  },
});
