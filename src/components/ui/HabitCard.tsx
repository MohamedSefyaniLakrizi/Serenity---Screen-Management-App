import { habitAccent } from "@/constants/colors";
import { borderRadius, spacing } from "@/constants/spacing";
import { typeScale } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import type { Habit, HabitType } from "@/types/habits";
import {
    BookOpen,
    BookText,
    Brain,
    Check,
    Dumbbell,
    Hand,
    Moon,
    Smartphone,
} from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import StreakBadge from "./StreakBadge";

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

function getGoalSummary(habit: Habit): string {
  const { config } = habit;
  switch (config.type) {
    case "screentime":
      return `Under ${config.dailyLimitMinutes} min/day`;
    case "study":
      return `${config.dailyGoalMinutes} min${config.workLabel ? ` · ${config.workLabel}` : ""}`;
    case "fitness":
      if (config.goalType === "steps")
        return `${config.goalValue.toLocaleString()} steps`;
      if (config.goalType === "workout")
        return `${config.goalValue} min workout`;
      return `${config.goalValue} kcal`;
    case "sleep":
      return `${config.bedtime} – ${config.wakeTime}`;
    case "prayer":
      return `${config.prayerCount} prayer${config.prayerCount !== 1 ? "s" : ""}/day`;
    case "meditation":
      return `${config.dailyGoalMinutes} min meditation`;
    case "reading":
      return `${config.dailyGoalMinutes} min reading`;
  }
}

interface HabitCardProps {
  habit: Habit;
  onPress: (habit: Habit) => void;
  showStreak?: boolean;
}

export default function HabitCard({
  habit,
  onPress,
  showStreak = false,
}: HabitCardProps) {
  const theme = useThemedColors();
  const color = habitAccent[habit.type];
  const isCompleted = habit.dailyCompletion.completed;
  const Icon = HABIT_ICONS[habit.type];

  return (
    <Pressable
      onPress={() => onPress(habit)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.bg.elevated,
          borderColor: theme.border.subtle,
          borderLeftColor: isCompleted ? theme.status.success : color,
          opacity: isCompleted ? 0.7 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Icon
          size={20}
          strokeWidth={1.5}
          color={isCompleted ? theme.status.success : color}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text.primary }]}>
          {HABIT_LABELS[habit.type]}
        </Text>
        <Text style={[styles.goal, { color: theme.text.secondary }]}>
          {getGoalSummary(habit)}
        </Text>
      </View>

      <View style={styles.trailing}>
        {showStreak && habit.streak.currentStreak > 0 && !isCompleted && (
          <StreakBadge
            count={habit.streak.currentStreak}
            size="sm"
            color={color}
          />
        )}
        {isCompleted && (
          <View
            style={[
              styles.checkCircle,
              { backgroundColor: theme.status.success },
            ]}
          >
            <Check size={14} strokeWidth={2} color="#FFFFFF" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: spacing[4],
    gap: spacing[3],
  },
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: spacing[0.5],
  },
  name: {
    fontSize: typeScale.headline.size,
    fontWeight: typeScale.headline.weight,
    lineHeight: typeScale.headline.lineHeight,
  },
  goal: {
    fontSize: typeScale.callout.size,
    fontWeight: typeScale.callout.weight,
    lineHeight: typeScale.callout.lineHeight,
  },
  trailing: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
