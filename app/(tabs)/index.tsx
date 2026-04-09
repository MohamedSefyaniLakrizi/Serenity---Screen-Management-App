import DailyChecklist from "@/components/DailyChecklist";
import { StreakBadge } from "@/components/ui";
import { borderRadius, spacing } from "@/constants/spacing";
import { typeScale } from "@/constants/typography";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useHabitStore } from "@/store/habitStore";
import type { Habit, HabitType } from "@/types/habits";
import { useFocusEffect, useRouter } from "expo-router";
import { Crown } from "lucide-react-native";
import { useCallback } from "react";
import {
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
    globalStreak,
    isInitialized,
    habits,
  } = useHabitStore();

  // Reload store when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isInitialized) {
        loadFromStorage();
      }
    }, [isInitialized, loadFromStorage]),
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
