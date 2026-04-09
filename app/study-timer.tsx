/**
 * Study Timer Screen
 *
 * Full-screen focus session for the study/work habit.
 * Users start the timer, work for their daily goal, then trigger completion.
 * A fallback oath is available for users who completed work outside the app.
 *
 * Navigation: push from home tab when study habit card is pressed.
 * Route: /study-timer
 */

import OathConfirmation from "@/components/ui/OathConfirmation";
import TimerView from "@/components/ui/TimerView";
import { habitAccent } from "@/constants/colors";
import { borderRadius, spacing } from "@/constants/spacing";
import { FONTS, typeScale } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { StudyHabitService } from "@/services/habits/studyHabit";
import { useHabitStore } from "@/store/habitStore";
import { useRouter } from "expo-router";
import { BookOpen, CheckCircle } from "lucide-react-native";
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

const STUDY_COLOR = habitAccent.study; // #3B82F6
const OATH_TEXT =
  "I swear that I have completed my study and work for today. I uphold my commitment.";

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudyTimerScreen() {
  const theme = useThemedColors();
  const router = useRouter();
  const { getActiveHabits, completeHabit } = useHabitStore();

  // Resolve the active study habit
  const studyHabit = getActiveHabits().find((h) => h.type === "study");
  const goalMinutes =
    studyHabit?.config.type === "study"
      ? studyHabit.config.dailyGoalMinutes
      : 30;
  const workLabel =
    studyHabit?.config.type === "study" && studyHabit.config.workLabel
      ? studyHabit.config.workLabel
      : "Study Session";

  const goalSeconds = goalMinutes * 60;

  // ── Timer state ────────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [showOath, setShowOath] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Hold a ref to whether we've already persisted state
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

    StudyHabitService.loadTimerState().then((saved) => {
      if (!saved) return;
      // If elapsed time has already met the goal, jump straight to completion
      if (StudyHabitService.isComplete(saved.goalMinutes)) {
        handleCompletion(false);
        return;
      }
      // Otherwise resume from where we left off (timer was running when app backgrounded)
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
          StudyHabitService.saveTimerState();
        }
      },
    );
    return () => subscription.remove();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleToggle = useCallback(() => {
    if (!isRunning) {
      const existing = StudyHabitService.getState();
      if (!existing) {
        StudyHabitService.startTimer(goalMinutes);
      } else {
        StudyHabitService.resumeTimer();
      }
      setIsRunning(true);
    } else {
      StudyHabitService.pauseTimer();
      setIsRunning(false);
    }
  }, [isRunning, goalMinutes]);

  const handleReset = useCallback(() => {
    StudyHabitService.resetTimer();
    setIsRunning(false);
  }, []);

  const handleCompletion = useCallback(
    (persist = true) => {
      setIsRunning(false);
      setIsCompleted(true);

      if (persist) {
        StudyHabitService.clearTimerState();
      }

      // Animate checkmark in
      checkOpacity.value = withTiming(1, { duration: 300 });
      checkScale.value = withTiming(1, { duration: 400 });

      if (studyHabit) {
        completeHabit(studyHabit.id, "timer");
      }

      // Navigate back after brief celebration pause
      setTimeout(() => {
        router.back();
      }, 1800);
    },
    [studyHabit, completeHabit, router, checkOpacity, checkScale],
  );

  const handleOathConfirmed = useCallback(() => {
    setShowOath(false);
    if (studyHabit) {
      completeHabit(studyHabit.id, "oath");
    }
    StudyHabitService.clearTimerState();
    router.back();
  }, [studyHabit, completeHabit, router]);

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
          <BookOpen size={20} strokeWidth={1.5} color={STUDY_COLOR} />
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            {workLabel}
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
                Goal complete!
              </Text>
            </Animated.View>
          ) : (
            <TimerView
              durationSeconds={goalSeconds}
              onComplete={handleCompletion}
              variant="focused"
              habitColor={STUDY_COLOR}
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
              I already completed my work
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
              habitColor={STUDY_COLOR}
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
