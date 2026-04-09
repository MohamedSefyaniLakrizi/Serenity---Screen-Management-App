/**
 * Fitness Status Screen
 *
 * Displays today's progress towards the user's fitness goal.
 * Reads data from HealthKit via FitnessHabitService and auto-completes
 * the habit when the goal is met.
 *
 * The screen auto-refreshes on focus and every 60 seconds while visible.
 *
 * Navigation: push from home tab when fitness habit card is pressed.
 * Route: /fitness-status
 */

import ProgressRing from "@/components/ui/ProgressRing";
import { habitAccent } from "@/constants/colors";
import { borderRadius, spacing } from "@/constants/spacing";
import { FONTS, typeScale } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import {
    FitnessGoalStatus,
    FitnessHabitService,
} from "@/services/habits/fitnessHabit";
import { useHabitStore } from "@/store/habitStore";
import { useFocusEffect } from "expo-router";
import { Activity, CheckCircle, Heart } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const FITNESS_COLOR = habitAccent.fitness; // #F97316
const REFRESH_INTERVAL_MS = 60_000; // re-query HealthKit every minute

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function goalLabel(status: FitnessGoalStatus): string {
  switch (status.goalType) {
    case "steps":
      return `${formatNumber(status.current)} / ${formatNumber(status.goal)} steps`;
    case "workout":
      return `${status.current} / ${status.goal} min`;
    case "calories":
      return `${formatNumber(status.current)} / ${formatNumber(status.goal)} kcal`;
    default:
      return "";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FitnessStatusScreen() {
  const theme = useThemedColors();
  const { getActiveHabits, completeHabit } = useHabitStore();

  const fitnessHabit = getActiveHabits().find((h) => h.type === "fitness");
  const fitnessConfig =
    fitnessHabit?.config.type === "fitness" ? fitnessHabit.config : null;

  const [goalStatus, setGoalStatus] = useState<FitnessGoalStatus | null>(null);
  const [isCompleted, setIsCompleted] = useState(
    fitnessHabit?.dailyCompletion.completed ?? false,
  );

  // ── Completion animation ───────────────────────────────────────────────
  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0.5);
  const checkAnimStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  // ── Refresh logic ─────────────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!fitnessConfig) return;
    const status = await FitnessHabitService.checkGoal(fitnessConfig);
    setGoalStatus(status);

    if (status.met && fitnessHabit && !fitnessHabit.dailyCompletion.completed) {
      completeHabit(fitnessHabit.id, "healthkit");
      setIsCompleted(true);
      checkOpacity.value = withTiming(1, { duration: 300 });
      checkScale.value = withTiming(1, { duration: 400 });
    }
  }, [fitnessConfig, fitnessHabit, completeHabit, checkOpacity, checkScale]);

  // Re-fetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refreshStatus();
      intervalRef.current = setInterval(refreshStatus, REFRESH_INTERVAL_MS);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [refreshStatus]),
  );

  // Also re-check if the habit's completion state changes externally
  useEffect(() => {
    setIsCompleted(fitnessHabit?.dailyCompletion.completed ?? false);
  }, [fitnessHabit?.dailyCompletion.completed]);

  // ── Derived display values ────────────────────────────────────────────
  const ringColor = isCompleted ? theme.status.success : FITNESS_COLOR;
  const ringProgress = goalStatus?.progress ?? 0;

  const centerStatText = goalStatus
    ? goalStatus.goalType === "steps"
      ? formatNumber(goalStatus.current)
      : String(goalStatus.current)
    : "—";

  const subtitleText = goalStatus ? goalLabel(goalStatus) : "Loading…";

  // ── Render ─────────────────────────────────────────────────────────────
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
          <Activity size={20} strokeWidth={1.5} color={FITNESS_COLOR} />
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Fitness Goal
          </Text>
        </View>

        {/* ── Ring ───────────────────────────────────────────────────── */}
        <View style={styles.ringContainer}>
          <ProgressRing
            progress={ringProgress}
            size={220}
            strokeWidth={8}
            color={ringColor}
          >
            <View style={styles.ringCenter}>
              {isCompleted ? (
                <Animated.View style={[styles.checkWrapper, checkAnimStyle]}>
                  <CheckCircle
                    size={56}
                    strokeWidth={1.5}
                    color={theme.status.success}
                  />
                </Animated.View>
              ) : (
                <Text
                  style={[styles.statNumber, { color: theme.text.primary }]}
                >
                  {centerStatText}
                </Text>
              )}
            </View>
          </ProgressRing>
        </View>

        {/* ── Goal breakdown ─────────────────────────────────────────── */}
        <View style={styles.statsSection}>
          <Text style={[styles.goalText, { color: theme.text.secondary }]}>
            {isCompleted ? "Goal reached!" : subtitleText}
          </Text>

          {isCompleted && (
            <View
              style={[
                styles.successBanner,
                { backgroundColor: theme.status.successSubtle },
              ]}
            >
              <Text
                style={[styles.successText, { color: theme.status.success }]}
              >
                Apps unlocked · Fitness habit complete
              </Text>
            </View>
          )}
        </View>

        {/* ── Source attribution ──────────────────────────────────────── */}
        <View style={styles.sourceRow}>
          <Heart size={12} strokeWidth={1.5} color={theme.text.tertiary} />
          <Text style={[styles.sourceText, { color: theme.text.tertiary }]}>
            Data from Apple Health
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[10],
    gap: spacing[6],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  headerTitle: {
    fontFamily: FONTS.text,
    fontSize: typeScale.title2.size,
    fontWeight: typeScale.title2.weight,
    lineHeight: typeScale.title2.lineHeight,
    letterSpacing: typeScale.title2.tracking,
  },
  ringContainer: {
    marginTop: spacing[4],
  },
  ringCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statNumber: {
    fontFamily: FONTS.mono,
    fontSize: typeScale.statLarge.size,
    fontWeight: typeScale.statLarge.weight,
    lineHeight: typeScale.statLarge.lineHeight,
  },
  checkWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  statsSection: {
    alignItems: "center",
    gap: spacing[3],
    width: "100%",
  },
  goalText: {
    fontFamily: FONTS.text,
    fontSize: typeScale.callout.size,
    fontWeight: typeScale.callout.weight,
    lineHeight: typeScale.callout.lineHeight,
    letterSpacing: typeScale.callout.tracking,
    textAlign: "center",
  },
  successBanner: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  successText: {
    fontFamily: FONTS.text,
    fontSize: typeScale.subheadline.size,
    fontWeight: "500",
    textAlign: "center",
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    marginTop: "auto",
  },
  sourceText: {
    fontFamily: FONTS.text,
    fontSize: typeScale.caption1.size,
    fontWeight: typeScale.caption1.weight,
    lineHeight: typeScale.caption1.lineHeight,
  },
});
