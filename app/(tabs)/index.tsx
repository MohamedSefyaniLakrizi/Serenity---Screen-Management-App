import DailyChecklist from "@/components/DailyChecklist";
import { StreakBadge } from "@/components/ui";
import { habitAccent } from "@/constants/colors";
import { borderRadius, spacing } from "@/constants/spacing";
import { typeScale } from "@/constants/typography";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useHabitStore } from "@/store/habitStore";
import type { Habit, HabitType } from "@/types/habits";
import { useFocusEffect, useRouter } from "expo-router";
import {
  BookOpen,
  BookText,
  Brain,
  CheckCircle,
  Crown,
  Dumbbell,
  Hand,
  Moon,
  Smartphone,
  Sparkles,
} from "lucide-react-native";
import { useCallback } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Route map for habit tap actions
const HABIT_ROUTES: Partial<Record<HabitType, string>> = {
  study: "/study-timer",
  meditation: "/meditation-timer",
  reading: "/reading-timer",
  fitness: "/fitness-status",
  prayer: "/prayer-status",
  screentime: "/screentime-status",
};

const HABIT_LABELS: Record<HabitType, string> = {
  screentime: "Screen Time",
  study: "Study / Work",
  fitness: "Fitness",
  sleep: "Sleep",
  prayer: "Prayer",
  meditation: "Meditation",
  reading: "Reading",
};

const HABIT_ICONS: Record<
  HabitType,
  React.ComponentType<{ size: number; strokeWidth: number; color: string }>
> = {
  screentime: Smartphone,
  study: BookOpen,
  fitness: Dumbbell,
  sleep: Moon,
  prayer: Hand,
  meditation: Brain,
  reading: BookText,
};

import React from "react";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function TodayScreen() {
  const router = useRouter();
  const theme = useThemedColors();
  const { isPro, showPaywall } = useRevenueCat();
  const {
    loadFromStorage,
    getActiveHabits,
    areAllActiveHabitsCompleted,
    getUncompletedHabits,
    checkAndActivateNextHabit,
    clearStackingEvent,
    pendingStackingEvent,
    globalStreak,
    isInitialized,
    habits,
  } = useHabitStore();

  // Reload store and check for stacking milestones when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isInitialized) {
        loadFromStorage().then(() => {
          checkAndActivateNextHabit();
        });
      } else {
        checkAndActivateNextHabit();
      }
    }, [isInitialized, loadFromStorage, checkAndActivateNextHabit]),
  );

  const activeHabits = getActiveHabits();
  const allDone = areAllActiveHabitsCompleted();
  const pendingCount = getUncompletedHabits().length;

  const handleHabitPress = (habit: Habit) => {
    const route = HABIT_ROUTES[habit.type];
    if (route) {
      router.push(route as any);
    }
  };

  // Check whether user has more than 1 habit selected and is not Pro
  const totalHabitsChosen = habits.filter(
    (h) => h.status === "active" || h.status === "pending",
  ).length;
  const showUpgradeBanner = !isPro && totalHabitsChosen > 1;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg.primary }]}
      edges={["top"]}
    >
      <StatusBar barStyle={theme.statusBar} />

      {/* ── Stacking Celebration Modal ─────────────────────────────── */}
      {pendingStackingEvent && (
        <StackingCelebrationModal
          graduated={pendingStackingEvent.graduated}
          activated={pendingStackingEvent.activated}
          onDismiss={clearStackingEvent}
          theme={theme}
        />
      )}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.titleText, { color: theme.text.primary }]}>
            Today
          </Text>
          <Text style={[styles.dateText, { color: theme.text.secondary }]}>
            {formatDate(new Date())}
          </Text>
        </View>
        <StreakBadge
          count={globalStreak.currentStreak}
          label="day streak"
          size="sm"
        />
      </View>

      {/* ── Status Banner ─────────────────────────────────────────────── */}
      {activeHabits.length > 0 && (
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: allDone
                ? theme.status.successSubtle
                : theme.status.warningSubtle,
              borderColor: allDone
                ? theme.status.success
                : theme.status.warning,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: allDone ? theme.status.success : theme.status.warning,
              },
            ]}
          >
            {allDone
              ? "All habits complete! Apps unlocked."
              : `Complete ${pendingCount} more habit${pendingCount === 1 ? "" : "s"} to unlock your apps`}
          </Text>
        </View>
      )}

      {/* ── Content ───────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DailyChecklist habits={activeHabits} onHabitPress={handleHabitPress} />

        {/* Upgrade nudge for free users with multiple habits */}
        {showUpgradeBanner && (
          <TouchableOpacity
            onPress={showPaywall}
            activeOpacity={0.8}
            style={[
              styles.upgradeCard,
              {
                backgroundColor: theme.bg.elevated,
                borderColor: theme.accent.primary,
              },
            ]}
          >
            <Crown size={16} strokeWidth={1.5} color={theme.accent.primary} />
            <Text style={[styles.upgradeText, { color: theme.text.secondary }]}>
              Upgrade to Pro to build multiple habits simultaneously
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stacking Celebration Modal ──────────────────────────────────────────────

interface StackingCelebrationModalProps {
  graduated: Habit;
  activated: Habit | null;
  onDismiss: () => void;
  theme: ReturnType<typeof useThemedColors>;
}

function StackingCelebrationModal({
  graduated,
  activated,
  onDismiss,
  theme,
}: StackingCelebrationModalProps) {
  const graduatedColor = habitAccent[graduated.type];
  const activatedColor = activated ? habitAccent[activated.type] : null;
  const GraduatedIcon = HABIT_ICONS[graduated.type];
  const ActivatedIcon = activated ? HABIT_ICONS[activated.type] : null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={celebStyles.overlay}>
        <View
          style={[
            celebStyles.card,
            {
              backgroundColor: theme.bg.surface,
              borderColor: theme.border.default,
            },
          ]}
        >
          {/* Icon cluster */}
          <View style={celebStyles.iconRow}>
            <View
              style={[
                celebStyles.habitIconWrap,
                {
                  backgroundColor: `${graduatedColor}1A`,
                  borderColor: graduatedColor,
                },
              ]}
            >
              <GraduatedIcon
                size={28}
                strokeWidth={1.5}
                color={graduatedColor}
              />
            </View>
            <CheckCircle
              size={24}
              strokeWidth={1.5}
              color={theme.status.success}
            />
          </View>

          {/* Title */}
          <Text style={[celebStyles.title, { color: theme.text.primary }]}>
            Habit Built!
          </Text>

          {/* Graduated habit */}
          <Text
            style={[celebStyles.graduatedText, { color: theme.text.secondary }]}
          >
            <Text style={{ color: graduatedColor, fontWeight: "600" }}>
              {HABIT_LABELS[graduated.type]}
            </Text>
            {" is now part of you.\nYou built it in 60 days."}
          </Text>

          {/* Next habit (if any) */}
          {activated && ActivatedIcon && activatedColor ? (
            <View
              style={[
                celebStyles.nextHabitCard,
                {
                  backgroundColor: theme.bg.elevated,
                  borderColor: `${activatedColor}40`,
                },
              ]}
            >
              <Sparkles size={14} strokeWidth={1.5} color={activatedColor} />
              <ActivatedIcon
                size={16}
                strokeWidth={1.5}
                color={activatedColor}
              />
              <Text
                style={[
                  celebStyles.nextHabitText,
                  { color: theme.text.secondary },
                ]}
              >
                Starting{" "}
                <Text style={{ color: activatedColor, fontWeight: "600" }}>
                  {HABIT_LABELS[activated.type]}
                </Text>
                {" — your new 60-day challenge."}
              </Text>
            </View>
          ) : (
            <Text
              style={[celebStyles.noNextText, { color: theme.text.tertiary }]}
            >
              All habits in your queue are now stacked.
            </Text>
          )}

          {/* CTA */}
          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.8}
            style={[
              celebStyles.button,
              { backgroundColor: theme.accent.primary },
            ]}
          >
            <Text style={celebStyles.buttonText}>Keep Going</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const celebStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10,10,10,0.75)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  card: {
    width: "100%",
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing[6],
    alignItems: "center",
    gap: spacing[4],
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  habitIconWrap: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typeScale.title2,
  },
  graduatedText: {
    ...typeScale.body,
    textAlign: "center",
    lineHeight: 24,
  },
  nextHabitCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    width: "100%",
  },
  nextHabitText: {
    ...typeScale.footnote,
    flex: 1,
  },
  noNextText: {
    ...typeScale.footnote,
    textAlign: "center",
  },
  button: {
    width: "100%",
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[1],
  },
  buttonText: {
    ...typeScale.headline,
    color: "#FFFFFF",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  headerLeft: {
    gap: spacing[0.5],
  },
  titleText: {
    ...typeScale.title1,
  },
  dateText: {
    ...typeScale.subheadline,
  },
  statusBanner: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  statusText: {
    ...typeScale.footnote,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[10],
    gap: spacing[4],
  },
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing[2],
  },
  upgradeText: {
    ...typeScale.footnote,
    flex: 1,
  },
});
