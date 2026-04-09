import { borderRadius, spacing, typeScale } from "@/constants";
import { habitAccent } from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useHabitStore } from "@/store/habitStore";
import type { Habit, HabitType } from "@/types/habits";
import { ActivityReportView } from "activity-report";
import {
    BookOpen,
    BookText,
    Brain,
    Crown,
    Dumbbell,
    Flame,
    Hand,
    Moon,
    Smartphone,
    TrendingUp,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const HABIT_LABELS: Record<HabitType, string> = {
  screentime: "Screen Time",
  study: "Study / Work",
  fitness: "Fitness",
  sleep: "Sleep",
  prayer: "Prayer",
  meditation: "Meditation",
  reading: "Reading",
};

/** Returns ISO date string (YYYY-MM-DD) for a date `daysAgo` days before today. */
function dateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

/** Format a date string for display (e.g. "Jan 5") */
function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Returns approx days remaining until 60-day streak for the active habit */
function daysUntilStack(habit: Habit): number {
  return Math.max(0, 60 - habit.streak.currentStreak);
}

// ─── Calendar Heatmap ────────────────────────────────────────────────────────

type CellStatus = "full" | "partial" | "missed" | "future" | "empty";

function buildHeatmapData(
  habits: Habit[],
  globalHistory: Set<string>,
  weeks: number,
): { date: string; status: CellStatus }[] {
  const totalDays = weeks * 7;
  const todayStr = dateOffset(0);

  // Union of all habit history dates
  const anyHabitDates = new Set<string>();
  for (const h of habits) {
    for (const d of h.streak.history) anyHabitDates.add(d);
  }

  // Earliest habit creation date
  const createdDates = habits.map((h) => h.createdAt.split("T")[0]).sort();
  const earliestDate = createdDates[0] ?? todayStr;

  const cells: { date: string; status: CellStatus }[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = dateOffset(i);
    let status: CellStatus;
    if (date > todayStr) {
      status = "future";
    } else if (date < earliestDate) {
      status = "empty";
    } else if (globalHistory.has(date)) {
      status = "full";
    } else if (anyHabitDates.has(date)) {
      status = "partial";
    } else {
      status = "missed";
    }
    cells.push({ date, status });
  }
  return cells;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const theme = useThemedColors();
  const { isPro, showPaywall } = useRevenueCat();
  const [period, setPeriod] = useState<"day" | "week">("week");

  const {
    habits,
    globalStreak,
    loadFromStorage,
    getActiveHabits,
    getStackedHabits,
    getPendingHabits,
  } = useHabitStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  const activeHabits = getActiveHabits();
  const stackedHabits = getStackedHabits();
  const pendingHabits = getPendingHabits();

  const globalHistorySet = useMemo(
    () => new Set(globalStreak.history),
    [globalStreak.history],
  );

  const heatmapCells = useMemo(
    () => buildHeatmapData(habits, globalHistorySet, 5),
    [habits, globalHistorySet],
  );

  // Statistics
  const totalBuilt = stackedHabits.length;
  const last30 = useMemo(() => {
    const cutoff = dateOffset(30);
    return globalStreak.history.filter((d) => d >= cutoff).length;
  }, [globalStreak.history]);
  const firstHabitDate = useMemo(() => {
    const dates = habits.map((h) => h.createdAt.split("T")[0]).sort();
    return dates[0] ?? dateOffset(0);
  }, [habits]);
  const daysSinceStart = Math.max(
    1,
    Math.ceil((Date.now() - new Date(firstHabitDate).getTime()) / 86400000),
  );
  const completionRate =
    habits.length === 0
      ? 0
      : Math.round((last30 / Math.min(30, daysSinceStart)) * 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <StatusBar barStyle={theme.statusBar} />

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: theme.text.primary }]}>
            Progress
          </Text>
          {!isPro && (
            <TouchableOpacity
              onPress={showPaywall}
              style={[
                styles.upgradeButton,
                {
                  backgroundColor: theme.accent.subtle,
                  borderColor: theme.accent.primary,
                },
              ]}
              activeOpacity={0.7}
            >
              <Crown size={13} color={theme.accent.primary} />
              <Text
                style={[
                  styles.upgradeButtonText,
                  { color: theme.accent.primary },
                ]}
              >
                Upgrade
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Global Streak Card ── */}
          <View
            style={[
              styles.globalStreakCard,
              {
                backgroundColor: theme.bg.elevated,
                borderColor: theme.border.subtle,
              },
            ]}
          >
            <Flame size={28} strokeWidth={1.5} color="#D4A017" />
            <Text
              style={[
                styles.globalStreakNumber,
                { color: theme.text.primary, fontFamily: FONTS.mono },
              ]}
            >
              {globalStreak.currentStreak}
            </Text>
            <Text
              style={[
                styles.globalStreakLabel,
                { color: theme.text.secondary },
              ]}
            >
              day streak
            </Text>
            {globalStreak.longestStreak > 0 && (
              <Text
                style={[
                  styles.globalStreakBest,
                  { color: theme.text.tertiary },
                ]}
              >
                Best: {globalStreak.longestStreak} days
              </Text>
            )}
          </View>

          {/* ── Per-Habit Streaks ── */}
          {activeHabits.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.text.secondary }]}
              >
                HABIT STREAKS
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.habitStreakRow}
              >
                {activeHabits.map((habit) => {
                  const color = habitAccent[habit.type];
                  const Icon = HABIT_ICONS[habit.type];
                  return (
                    <View
                      key={habit.id}
                      style={[
                        styles.habitStreakCard,
                        {
                          backgroundColor: theme.bg.elevated,
                          borderColor: `${color}40`,
                          borderTopColor: color,
                        },
                      ]}
                    >
                      <Icon size={18} strokeWidth={1.5} color={color} />
                      <Text
                        style={[
                          styles.habitStreakNumber,
                          { color: color, fontFamily: FONTS.mono },
                        ]}
                      >
                        {habit.streak.currentStreak}
                      </Text>
                      <Text
                        style={[
                          styles.habitStreakDays,
                          { color: theme.text.tertiary },
                        ]}
                      >
                        days
                      </Text>
                      <Text
                        style={[
                          styles.habitStreakName,
                          { color: theme.text.secondary },
                        ]}
                      >
                        {HABIT_LABELS[habit.type]}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ── Calendar Heatmap ── */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: theme.text.secondary }]}
            >
              LAST 5 WEEKS
            </Text>
            <View
              style={[
                styles.heatmapCard,
                {
                  backgroundColor: theme.bg.elevated,
                  borderColor: theme.border.subtle,
                },
              ]}
            >
              {/* Day-of-week labels */}
              <View style={styles.heatmapRow}>
                {DAY_LABELS.map((label, i) => (
                  <View key={i} style={styles.heatmapCell}>
                    <Text
                      style={[
                        styles.heatmapDayLabel,
                        { color: theme.text.tertiary },
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
              {/* 5 rows of 7 cells */}
              {Array.from({ length: 5 }).map((_, weekIdx) => (
                <View key={weekIdx} style={styles.heatmapRow}>
                  {heatmapCells
                    .slice(weekIdx * 7, weekIdx * 7 + 7)
                    .map((cell, dayIdx) => {
                      let bg: string;
                      if (cell.status === "full") bg = theme.status.success;
                      else if (cell.status === "partial")
                        bg = theme.status.warning;
                      else if (cell.status === "missed")
                        bg = theme.status.error;
                      else bg = theme.bg.subtle; // future or empty
                      return (
                        <View key={dayIdx} style={styles.heatmapCell}>
                          <View
                            style={[
                              styles.heatmapSquare,
                              {
                                backgroundColor: bg,
                                opacity:
                                  cell.status === "future" ||
                                  cell.status === "empty"
                                    ? 0.3
                                    : 1,
                              },
                            ]}
                          />
                        </View>
                      );
                    })}
                </View>
              ))}
              {/* Legend */}
              <View style={styles.heatmapLegend}>
                {[
                  { status: "full" as CellStatus, label: "Complete" },
                  { status: "partial" as CellStatus, label: "Partial" },
                  { status: "missed" as CellStatus, label: "Missed" },
                ].map(({ status: s, label }) => {
                  const bg =
                    s === "full"
                      ? theme.status.success
                      : s === "partial"
                        ? theme.status.warning
                        : theme.status.error;
                  return (
                    <View key={s} style={styles.legendItem}>
                      <View
                        style={[styles.legendSquare, { backgroundColor: bg }]}
                      />
                      <Text
                        style={[
                          styles.legendLabel,
                          { color: theme.text.tertiary },
                        ]}
                      >
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ── Habit Stacking Timeline ── */}
          {habits.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.text.secondary }]}
              >
                STACKING TIMELINE
              </Text>
              <View
                style={[
                  styles.timelineCard,
                  {
                    backgroundColor: theme.bg.elevated,
                    borderColor: theme.border.subtle,
                  },
                ]}
              >
                {[...stackedHabits, ...activeHabits, ...pendingHabits].map(
                  (habit, idx, arr) => {
                    const color = habitAccent[habit.type];
                    const Icon = HABIT_ICONS[habit.type];
                    const isLast = idx === arr.length - 1;

                    return (
                      <View key={habit.id} style={styles.timelineItem}>
                        {/* Connector line */}
                        {!isLast && (
                          <View
                            style={[
                              styles.timelineConnector,
                              { backgroundColor: theme.border.default },
                            ]}
                          />
                        )}
                        {/* Dot */}
                        <View
                          style={[
                            styles.timelineDot,
                            {
                              backgroundColor:
                                habit.status === "pending"
                                  ? theme.bg.subtle
                                  : color,
                              borderColor:
                                habit.status === "pending"
                                  ? theme.border.default
                                  : color,
                            },
                          ]}
                        >
                          {habit.status === "stacked" && (
                            <View
                              style={[
                                styles.timelineDotInner,
                                { backgroundColor: "#fff" },
                              ]}
                            />
                          )}
                        </View>
                        {/* Content */}
                        <View style={styles.timelineContent}>
                          <View style={styles.timelineRow}>
                            <Icon
                              size={16}
                              strokeWidth={1.5}
                              color={
                                habit.status === "pending"
                                  ? theme.text.tertiary
                                  : color
                              }
                            />
                            <Text
                              style={[
                                styles.timelineHabitName,
                                {
                                  color:
                                    habit.status === "pending"
                                      ? theme.text.tertiary
                                      : theme.text.primary,
                                },
                              ]}
                            >
                              {HABIT_LABELS[habit.type]}
                            </Text>
                            {habit.status === "stacked" && (
                              <View
                                style={[
                                  styles.builtBadge,
                                  { backgroundColor: `${color}1A` },
                                ]}
                              >
                                <Text
                                  style={[styles.builtBadgeText, { color }]}
                                >
                                  Built
                                </Text>
                              </View>
                            )}
                          </View>
                          {habit.status === "active" && (
                            <View style={styles.timelineProgressWrap}>
                              <View
                                style={[
                                  styles.timelineProgressTrack,
                                  { backgroundColor: theme.border.subtle },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.timelineProgressFill,
                                    {
                                      backgroundColor: color,
                                      width: `${Math.min(100, (habit.streak.currentStreak / 60) * 100)}%`,
                                    },
                                  ]}
                                />
                              </View>
                              <Text
                                style={[
                                  styles.timelineProgressLabel,
                                  {
                                    color: theme.text.tertiary,
                                    fontFamily: FONTS.mono,
                                  },
                                ]}
                              >
                                Day {habit.streak.currentStreak} / 60
                              </Text>
                            </View>
                          )}
                          {habit.status === "stacked" && habit.stackedAt && (
                            <Text
                              style={[
                                styles.timelineDate,
                                { color: theme.text.tertiary },
                              ]}
                            >
                              Completed{" "}
                              {formatShortDate(habit.stackedAt.split("T")[0])}
                            </Text>
                          )}
                          {habit.status === "pending" && (
                            <Text
                              style={[
                                styles.timelineDate,
                                { color: theme.text.tertiary },
                              ]}
                            >
                              Starts after current habit
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  },
                )}
              </View>
            </View>
          )}

          {/* ── Statistics ── */}
          {habits.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: theme.text.secondary }]}
              >
                STATISTICS
              </Text>
              <View
                style={[
                  styles.statsCard,
                  {
                    backgroundColor: theme.bg.elevated,
                    borderColor: theme.border.subtle,
                  },
                ]}
              >
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <TrendingUp
                      size={16}
                      strokeWidth={1.5}
                      color={theme.text.tertiary}
                    />
                    <Text
                      style={[
                        styles.statValue,
                        { color: theme.text.primary, fontFamily: FONTS.mono },
                      ]}
                    >
                      {totalBuilt}
                    </Text>
                    <Text
                      style={[styles.statLabel, { color: theme.text.tertiary }]}
                    >
                      Habits Built
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statDivider,
                      { backgroundColor: theme.border.subtle },
                    ]}
                  />
                  <View style={styles.statItem}>
                    <Flame
                      size={16}
                      strokeWidth={1.5}
                      color={theme.text.tertiary}
                    />
                    <Text
                      style={[
                        styles.statValue,
                        { color: theme.text.primary, fontFamily: FONTS.mono },
                      ]}
                    >
                      {completionRate}%
                    </Text>
                    <Text
                      style={[styles.statLabel, { color: theme.text.tertiary }]}
                    >
                      30-Day Rate
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statDivider,
                      { backgroundColor: theme.border.subtle },
                    ]}
                  />
                  <View style={styles.statItem}>
                    <Flame size={16} strokeWidth={1.5} color="#D4A017" />
                    <Text
                      style={[
                        styles.statValue,
                        { color: theme.text.primary, fontFamily: FONTS.mono },
                      ]}
                    >
                      {globalStreak.longestStreak}
                    </Text>
                    <Text
                      style={[styles.statLabel, { color: theme.text.tertiary }]}
                    >
                      Best Streak
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── Period toggle + ActivityReportView ── */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: theme.text.secondary }]}
            >
              SCREEN TIME
            </Text>
            {/* Period toggle */}
            <View
              style={[
                styles.toggleTrack,
                {
                  backgroundColor: theme.bg.surface,
                  borderColor: theme.border.default,
                },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { backgroundColor: theme.accent.primary },
                  period === "day"
                    ? styles.toggleThumbLeft
                    : styles.toggleThumbRight,
                ]}
              />
              <Text
                onPress={() => setPeriod("day")}
                style={[
                  styles.toggleLabel,
                  {
                    color: period === "day" ? "#fff" : theme.text.secondary,
                  },
                ]}
              >
                Today
              </Text>
              <Text
                onPress={() => setPeriod("week")}
                style={[
                  styles.toggleLabel,
                  {
                    color: period === "week" ? "#fff" : theme.text.secondary,
                  },
                ]}
              >
                This Week
              </Text>
            </View>
            {Platform.OS === "ios" ? (
              <ActivityReportView period={period} style={styles.reportView} />
            ) : (
              <View style={[styles.reportView, styles.unsupportedContainer]}>
                <Text
                  style={[
                    styles.unsupportedText,
                    { color: theme.text.secondary },
                  ]}
                >
                  Screen Time reports are only available on iOS.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    fontSize: typeScale.title1.size,
    fontWeight: typeScale.title1.weight,
    lineHeight: typeScale.title1.lineHeight,
    letterSpacing: typeScale.title1.tracking,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  upgradeButtonText: {
    fontSize: typeScale.caption1.size,
    fontWeight: typeScale.caption1.weight,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing[8] },
  bottomPad: { height: spacing[6] },

  // Sections
  section: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  sectionTitle: {
    fontSize: typeScale.caption2.size,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: spacing[2],
    textTransform: "uppercase",
  },

  // Global streak card
  globalStreakCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing[6],
    alignItems: "center",
    gap: spacing[1],
  },
  globalStreakNumber: {
    fontSize: typeScale.statLarge.size,
    fontWeight: typeScale.statLarge.weight,
    lineHeight: typeScale.statLarge.lineHeight,
    marginTop: spacing[1],
  },
  globalStreakLabel: {
    fontSize: typeScale.subheadline.size,
    fontWeight: typeScale.subheadline.weight,
  },
  globalStreakBest: {
    fontSize: typeScale.footnote.size,
    fontWeight: typeScale.footnote.weight,
    marginTop: spacing[0.5],
  },

  // Per-habit streak scroll
  habitStreakRow: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  habitStreakCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderTopWidth: 3,
    padding: spacing[4],
    alignItems: "center",
    gap: spacing[0.5],
    minWidth: 88,
  },
  habitStreakNumber: {
    fontSize: typeScale.statSmall.size,
    fontWeight: typeScale.statSmall.weight,
    lineHeight: typeScale.statSmall.lineHeight,
    marginTop: spacing[1],
  },
  habitStreakDays: {
    fontSize: typeScale.caption2.size,
    fontWeight: typeScale.caption2.weight,
  },
  habitStreakName: {
    fontSize: typeScale.caption1.size,
    fontWeight: typeScale.caption1.weight,
    marginTop: spacing[0.5],
    textAlign: "center",
  },

  // Calendar heatmap
  heatmapCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[1],
  },
  heatmapRow: {
    flexDirection: "row",
    gap: spacing[1],
  },
  heatmapCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heatmapDayLabel: {
    fontSize: typeScale.caption2.size,
    fontWeight: "600",
    textAlign: "center",
  },
  heatmapSquare: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: borderRadius.sm - 2,
  },
  heatmapLegend: {
    flexDirection: "row",
    gap: spacing[4],
    marginTop: spacing[2],
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  legendSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: typeScale.caption2.size,
    fontWeight: typeScale.caption2.weight,
  },

  // Stacking Timeline
  timelineCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing[4],
  },
  timelineItem: {
    flexDirection: "row",
    gap: spacing[3],
    paddingBottom: spacing[4],
    position: "relative",
  },
  timelineConnector: {
    position: "absolute",
    left: 7,
    top: 16,
    bottom: 0,
    width: 1,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineContent: {
    flex: 1,
    gap: spacing[1],
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  timelineHabitName: {
    fontSize: typeScale.headline.size,
    fontWeight: typeScale.headline.weight,
    flex: 1,
  },
  builtBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  builtBadgeText: {
    fontSize: typeScale.caption1.size,
    fontWeight: "600",
  },
  timelineProgressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  timelineProgressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  timelineProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  timelineProgressLabel: {
    fontSize: typeScale.caption1.size,
  },
  timelineDate: {
    fontSize: typeScale.caption1.size,
    fontWeight: typeScale.caption1.weight,
  },

  // Statistics
  statsCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing[4],
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing[0.5],
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statValue: {
    fontSize: typeScale.statSmall.size,
    fontWeight: typeScale.statSmall.weight,
    lineHeight: typeScale.statSmall.lineHeight,
  },
  statLabel: {
    fontSize: typeScale.caption2.size,
    fontWeight: typeScale.caption2.weight,
    textAlign: "center",
  },

  // Period toggle
  toggleTrack: {
    flexDirection: "row",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    height: 36,
    position: "relative",
    marginBottom: spacing[3],
  },
  toggleThumb: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50%",
    borderRadius: borderRadius.md - 2,
  },
  toggleThumbLeft: { left: 0 },
  toggleThumbRight: { left: "50%" },
  toggleLabel: {
    flex: 1,
    textAlign: "center",
    lineHeight: 36,
    fontSize: typeScale.subheadline.size,
    zIndex: 1,
  },

  // ActivityReport
  reportView: {
    height: 280,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  unsupportedContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  unsupportedText: {
    fontSize: typeScale.subheadline.size,
    textAlign: "center",
    paddingHorizontal: spacing[4],
  },
});
