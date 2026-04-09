/**
 * Meditation Timer Screen
 *
 * Full-screen calm meditation session for the meditation habit.
 * Features a breathing guide cycling "Breathe in..." → "Hold..." → "Breathe out..."
 * with 4-7-8 timing and haptic pulses on transitions.
 * A hidden oath fallback is available for users who meditated outside the app.
 *
 * Navigation: push from home tab when meditation habit card is pressed.
 * Route: /meditation-timer
 */

import OathConfirmation from "@/components/ui/OathConfirmation";
import TimerView from "@/components/ui/TimerView";
import { habitAccent } from "@/constants/colors";
import { borderRadius, spacing } from "@/constants/spacing";
import { FONTS, typeScale } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { MeditationHabitService } from "@/services/habits/meditationHabit";
import { useHabitStore } from "@/store/habitStore";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Brain, CheckCircle } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    AppState,
    AppStateStatus,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const MEDITATION_COLOR = habitAccent.meditation; // #06B6D4

const OATH_TEXT = "I confirm I have completed my meditation practice today.";

// 4-7-8 breathing cycle (seconds per phase)
const BREATH_IN_S = 4;
const BREATH_HOLD_S = 7;
const BREATH_OUT_S = 8;
const BREATH_CYCLE_S = BREATH_IN_S + BREATH_HOLD_S + BREATH_OUT_S; // 19s

type BreathPhase = "in" | "hold" | "out" | "idle";

function getBreathPhase(elapsedInCycle: number): BreathPhase {
  if (elapsedInCycle < BREATH_IN_S) return "in";
  if (elapsedInCycle < BREATH_IN_S + BREATH_HOLD_S) return "hold";
  return "out";
}

const BREATH_LABELS: Record<BreathPhase, string> = {
  in: "Breathe in...",
  hold: "Hold...",
  out: "Breathe out...",
  idle: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MeditationTimerScreen() {
  const theme = useThemedColors();
  const router = useRouter();
  const { getActiveHabits, completeHabit } = useHabitStore();

  // Resolve the active meditation habit
  const meditationHabit = getActiveHabits().find(
    (h) => h.type === "meditation",
  );
  const goalMinutes =
    meditationHabit?.config.type === "meditation"
      ? meditationHabit.config.dailyGoalMinutes
      : 10;

  const goalSeconds = goalMinutes * 60;

  // ── Timer state ────────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [showOath, setShowOath] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Breathing guide state
  const [breathPhase, setBreathPhase] = useState<BreathPhase>("idle");
  const breathElapsedRef = useRef(0); // seconds elapsed in current breath cycle
  const prevPhaseRef = useRef<BreathPhase>("idle");
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const didRestoreRef = useRef(false);

  // ── Completion animation ───────────────────────────────────────────────
  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0.5);

  const checkAnimStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  // ── Breathing label opacity ────────────────────────────────────────────
  const breathLabelOpacity = useSharedValue(0);
  const breathLabelAnimStyle = useAnimatedStyle(() => ({
    opacity: breathLabelOpacity.value,
  }));

  // ── Breathing guide ticker ─────────────────────────────────────────────
  useEffect(() => {
    if (isRunning && !isCompleted) {
      breathLabelOpacity.value = withTiming(1, { duration: 600 });
      breathElapsedRef.current = 0;

      breathIntervalRef.current = setInterval(() => {
        breathElapsedRef.current += 1;
        const cyclePos = breathElapsedRef.current % BREATH_CYCLE_S;
        const phase = getBreathPhase(cyclePos);

        setBreathPhase(phase);

        // Haptic pulse on phase transition
        if (phase !== prevPhaseRef.current) {
          prevPhaseRef.current = phase;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, 1000);
    } else {
      if (breathIntervalRef.current) {
        clearInterval(breathIntervalRef.current);
        breathIntervalRef.current = null;
      }
      breathLabelOpacity.value = withTiming(0, { duration: 400 });
      setBreathPhase("idle");
      prevPhaseRef.current = "idle";
    }

    return () => {
      if (breathIntervalRef.current) {
        clearInterval(breathIntervalRef.current);
        breathIntervalRef.current = null;
      }
    };
  }, [isRunning, isCompleted, breathLabelOpacity]);

  // ── Restore persisted timer on mount ──────────────────────────────────
  useEffect(() => {
    if (didRestoreRef.current) return;
    didRestoreRef.current = true;

    MeditationHabitService.loadTimerState().then((saved) => {
      if (!saved) return;
      if (MeditationHabitService.isComplete(saved.goalMinutes)) {
        handleCompletion(false);
        return;
      }
      if (!saved.pausedAt) {
        setIsRunning(true);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist timer state when app backgrounds ──────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "background" || state === "inactive") {
          MeditationHabitService.saveTimerState();
        }
      },
    );
    return () => subscription.remove();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleToggle = useCallback(() => {
    if (!isRunning) {
      const existing = MeditationHabitService.getState();
      if (!existing) {
        MeditationHabitService.startTimer(goalMinutes);
      } else {
        MeditationHabitService.resumeTimer();
      }
      setIsRunning(true);
    } else {
      MeditationHabitService.pauseTimer();
      setIsRunning(false);
    }
  }, [isRunning, goalMinutes]);

  const handleReset = useCallback(() => {
    MeditationHabitService.resetTimer();
    setIsRunning(false);
  }, []);

  const handleCompletion = useCallback(
    (persist = true) => {
      setIsRunning(false);
      setIsCompleted(true);

      if (persist) {
        MeditationHabitService.clearTimerState();
      }

      // Animate checkmark in
      checkOpacity.value = withTiming(1, { duration: 300 });
      checkScale.value = withTiming(1, { duration: 400 });

      if (meditationHabit) {
        completeHabit(meditationHabit.id, "timer");
      }

      // Navigate back after brief celebration pause
      setTimeout(() => {
        router.back();
      }, 1800);
    },
    [meditationHabit, completeHabit, router, checkOpacity, checkScale],
  );

  const handleOathConfirmed = useCallback(() => {
    setShowOath(false);
    if (meditationHabit) {
      completeHabit(meditationHabit.id, "oath");
    }
    MeditationHabitService.clearTimerState();
    router.back();
  }, [meditationHabit, completeHabit, router]);

  // ── Render ─────────────────────────────────────────────────────────────

  const goalLabel =
    goalMinutes >= 60
      ? `${Math.floor(goalMinutes / 60)}h ${goalMinutes % 60 > 0 ? `${goalMinutes % 60}m` : ""}`.trim()
      : `${goalMinutes} min`;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg.primary }]}
    >
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.content}
        scrollEnabled={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Brain size={20} strokeWidth={1.5} color={MEDITATION_COLOR} />
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Meditation Session
          </Text>
          <Text style={[styles.headerGoal, { color: theme.text.secondary }]}>
            Daily goal: {goalLabel}
          </Text>
        </View>

        {/* ── Timer ─────────────────────────────────────────────────── */}
        <View style={styles.timerSection}>
          {isCompleted ? (
            <Animated.View style={[styles.completionView, checkAnimStyle]}>
              <CheckCircle
                size={80}
                strokeWidth={1.5}
                color={theme.status.success}
              />
              <Text
                style={[styles.completionText, { color: theme.status.success }]}
              >
                Session complete!
              </Text>
            </Animated.View>
          ) : (
            <>
              <TimerView
                durationSeconds={goalSeconds}
                onComplete={handleCompletion}
                variant="calm"
                habitColor={MEDITATION_COLOR}
                isRunning={isRunning}
                onToggle={handleToggle}
                onReset={handleReset}
              />

              {/* ── Breathing guide ───────────────────────────────── */}
              <Animated.View
                style={[styles.breathingGuide, breathLabelAnimStyle]}
                pointerEvents="none"
              >
                <Text
                  style={[
                    styles.breathingText,
                    { color: theme.text.secondary },
                  ]}
                >
                  {BREATH_LABELS[breathPhase]}
                </Text>
              </Animated.View>
            </>
          )}
        </View>

        {/* ── Hidden oath fallback ──────────────────────────────────── */}
        {!isCompleted && (
          <Pressable
            style={styles.oathLink}
            onPress={() => setShowOath(true)}
            hitSlop={12}
          >
            <Text style={[styles.oathLinkText, { color: theme.text.tertiary }]}>
              Already meditated?
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* ── Oath modal ────────────────────────────────────────────────── */}
      <Modal
        visible={showOath}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOath(false)}
      >
        <View
          style={[
            styles.oathOverlay,
            { backgroundColor: "rgba(10, 10, 10, 0.85)" },
          ]}
        >
          <View
            style={[
              styles.oathSheet,
              {
                backgroundColor: theme.bg.surface,
                borderColor: theme.border.default,
              },
            ]}
          >
            <Text style={[styles.oathTitle, { color: theme.text.primary }]}>
              Meditation Oath
            </Text>
            <OathConfirmation
              oathText={OATH_TEXT}
              onConfirmed={handleOathConfirmed}
              holdDurationMs={5000}
              habitColor={MEDITATION_COLOR}
            />
            <Pressable
              style={styles.oathCancel}
              onPress={() => setShowOath(false)}
            >
              <Text
                style={[styles.oathCancelText, { color: theme.text.tertiary }]}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    gap: spacing[2],
  },
  headerTitle: {
    fontFamily: FONTS.text,
    fontSize: typeScale.title2.size,
    fontWeight: typeScale.title2.weight,
    lineHeight: typeScale.title2.lineHeight,
    textAlign: "center",
    marginTop: spacing[2],
  },
  headerGoal: {
    fontFamily: FONTS.text,
    fontSize: typeScale.callout.size,
    fontWeight: typeScale.callout.weight,
    lineHeight: typeScale.callout.lineHeight,
    textAlign: "center",
  },
  timerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[6],
  },
  breathingGuide: {
    alignItems: "center",
    minHeight: typeScale.body.lineHeight,
  },
  breathingText: {
    fontFamily: FONTS.text,
    fontSize: typeScale.body.size,
    fontWeight: typeScale.body.weight,
    lineHeight: typeScale.body.lineHeight,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  completionView: {
    alignItems: "center",
    gap: spacing[4],
  },
  completionText: {
    fontFamily: FONTS.text,
    fontSize: typeScale.title2.size,
    fontWeight: typeScale.title2.weight,
    lineHeight: typeScale.title2.lineHeight,
  },
  // Hidden — styled as very subtle caption2 text
  oathLink: {
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  oathLinkText: {
    fontFamily: FONTS.text,
    fontSize: typeScale.caption2.size,
    fontWeight: typeScale.caption2.weight,
    lineHeight: typeScale.caption2.lineHeight,
    textDecorationLine: "underline",
  },
  // ── Oath Modal ─────────────────────────────────────────────────────────
  oathOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  oathSheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[10],
    alignItems: "center",
    gap: spacing[6],
  },
  oathTitle: {
    fontFamily: FONTS.text,
    fontSize: typeScale.headline.size,
    fontWeight: typeScale.headline.weight,
    lineHeight: typeScale.headline.lineHeight,
  },
  oathCancel: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[6],
  },
  oathCancelText: {
    fontFamily: FONTS.text,
    fontSize: typeScale.subheadline.size,
    fontWeight: typeScale.subheadline.weight,
    lineHeight: typeScale.subheadline.lineHeight,
  },
});
