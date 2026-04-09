/**
 * Reading Timer Screen
 *
 * Full-screen reading session for the reading habit.
 * Users start the timer, read for their daily goal, then trigger completion.
 * If reading apps are configured, auto-completion is also possible via
 * DeviceActivity screen time data.
 * A fallback oath is available for users who read outside the app.
 *
 * Navigation: push from home tab when reading habit card is pressed.
 * Route: /reading-timer
 */

import OathConfirmation from "@/components/ui/OathConfirmation";
import TimerView from "@/components/ui/TimerView";
import { habitAccent } from "@/constants/colors";
import { borderRadius, spacing } from "@/constants/spacing";
import { FONTS, typeScale } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { ReadingHabitService } from "@/services/habits/readingHabit";
import { useHabitStore } from "@/store/habitStore";
import { useRouter } from "expo-router";
import { BookText, CheckCircle } from "lucide-react-native";
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

const READING_COLOR = habitAccent.reading; // #A78BFA
const OATH_TEXT =
  "I swear that I have completed my reading for today. I uphold my commitment.";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReadingTimerScreen() {
  const theme = useThemedColors();
  const router = useRouter();
  const { getActiveHabits, completeHabit } = useHabitStore();

  // Resolve the active reading habit
  const readingHabit = getActiveHabits().find((h) => h.type === "reading");
  const goalMinutes =
    readingHabit?.config.type === "reading"
      ? readingHabit.config.dailyGoalMinutes
      : 20;
  const readingApps =
    readingHabit?.config.type === "reading" && readingHabit.config.readingApps
      ? readingHabit.config.readingApps
      : [];

  const goalSeconds = goalMinutes * 60;

  // ── Timer state ────────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [showOath, setShowOath] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const didRestoreRef = useRef(false);

  // ── Completion animation ───────────────────────────────────────────────
  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0.5);

  const checkAnimStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  // ── Restore persisted timer on mount ──────────────────────────────────
  useEffect(() => {
    if (didRestoreRef.current) return;
    didRestoreRef.current = true;

    ReadingHabitService.loadTimerState().then((saved) => {
      if (!saved) return;
      if (ReadingHabitService.isComplete(saved.goalMinutes)) {
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
          ReadingHabitService.saveTimerState();
        }
      },
    );
    return () => subscription.remove();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleToggle = useCallback(() => {
    if (!isRunning) {
      const existing = ReadingHabitService.getState();
      if (!existing) {
        ReadingHabitService.startTimer(goalMinutes);
      } else {
        ReadingHabitService.resumeTimer();
      }
      setIsRunning(true);
    } else {
      ReadingHabitService.pauseTimer();
      setIsRunning(false);
    }
  }, [isRunning, goalMinutes]);

  const handleReset = useCallback(() => {
    ReadingHabitService.resetTimer();
    setIsRunning(false);
  }, []);

  const handleCompletion = useCallback(
    (persist = true) => {
      setIsRunning(false);
      setIsCompleted(true);

      if (persist) {
        ReadingHabitService.clearTimerState();
      }

      checkOpacity.value = withTiming(1, { duration: 300 });
      checkScale.value = withTiming(1, { duration: 400 });

      if (readingHabit) {
        completeHabit(readingHabit.id, "timer");
      }

      setTimeout(() => {
        router.back();
      }, 1800);
    },
    [readingHabit, completeHabit, router, checkOpacity, checkScale],
  );

  const handleOathConfirmed = useCallback(() => {
    setShowOath(false);
    if (readingHabit) {
      completeHabit(readingHabit.id, "oath");
    }
    ReadingHabitService.clearTimerState();
    router.back();
  }, [readingHabit, completeHabit, router]);

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
          <BookText size={20} strokeWidth={1.5} color={READING_COLOR} />
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Reading Session
          </Text>
          <Text style={[styles.headerGoal, { color: theme.text.secondary }]}>
            Daily goal: {goalLabel}
          </Text>
          {readingApps.length > 0 && (
            <Text
              style={[styles.readingAppsHint, { color: theme.text.tertiary }]}
            >
              or read in your apps for {goalMinutes} minutes
            </Text>
          )}
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
                Goal complete!
              </Text>
            </Animated.View>
          ) : (
            <TimerView
              durationSeconds={goalSeconds}
              onComplete={handleCompletion}
              variant="calm"
              habitColor={READING_COLOR}
              isRunning={isRunning}
              onToggle={handleToggle}
              onReset={handleReset}
            />
          )}
        </View>

        {/* ── Fallback oath link ────────────────────────────────────── */}
        {!isCompleted && (
          <Pressable
            style={styles.oathLink}
            onPress={() => setShowOath(true)}
            hitSlop={12}
          >
            <Text style={[styles.oathLinkText, { color: theme.text.tertiary }]}>
              I already completed my reading
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
              Oath Confirmation
            </Text>
            <OathConfirmation
              oathText={OATH_TEXT}
              onConfirmed={handleOathConfirmed}
              holdDurationMs={5000}
              habitColor={READING_COLOR}
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
  readingAppsHint: {
    fontFamily: FONTS.text,
    fontSize: typeScale.footnote.size,
    fontWeight: typeScale.footnote.weight,
    lineHeight: typeScale.footnote.lineHeight,
    textAlign: "center",
    marginTop: spacing[1],
  },
  timerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  oathLink: {
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  oathLinkText: {
    fontFamily: FONTS.text,
    fontSize: typeScale.footnote.size,
    fontWeight: typeScale.footnote.weight,
    lineHeight: typeScale.footnote.lineHeight,
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
