import { HabitCard } from "@/components/ui";
import { borderRadius, spacing } from "@/constants/spacing";
import { typeScale } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import type { Habit } from "@/types/habits";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface DailyChecklistProps {
  habits: Habit[];
  onHabitPress: (habit: Habit) => void;
}

export default function DailyChecklist({
  habits,
  onHabitPress,
}: DailyChecklistProps) {
  const theme = useThemedColors();

  const { uncompleted, completed } = useMemo(() => {
    return {
      uncompleted: habits.filter((h) => !h.dailyCompletion.completed),
      completed: habits.filter((h) => h.dailyCompletion.completed),
    };
  }, [habits]);

  const completedCount = completed.length;
  const totalCount = habits.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>
          {"Today's Habits"}
        </Text>
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor:
                completedCount === totalCount && totalCount > 0
                  ? theme.status.successSubtle
                  : theme.bg.subtle,
            },
          ]}
        >
          <Text
            style={[
              styles.countText,
              {
                color:
                  completedCount === totalCount && totalCount > 0
                    ? theme.status.success
                    : theme.text.secondary,
              },
            ]}
          >
            {completedCount}/{totalCount} completed
          </Text>
        </View>
      </View>

      {/* Uncompleted habits */}
      {uncompleted.map((habit) => (
        <View key={habit.id} style={styles.cardWrapper}>
          <HabitCard habit={habit} onPress={onHabitPress} showStreak />
        </View>
      ))}

      {/* Completed habits — shown below with visual separation */}
      {completed.length > 0 && (
        <>
          {uncompleted.length > 0 && (
            <View
              style={[styles.divider, { backgroundColor: theme.border.subtle }]}
            />
          )}
          {completed.map((habit) => (
            <View key={habit.id} style={styles.cardWrapper}>
              <HabitCard
                habit={habit}
                onPress={onHabitPress}
                showStreak={false}
              />
            </View>
          ))}
        </>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: theme.bg.subtle }]}>
          <Text style={[styles.emptyText, { color: theme.text.tertiary }]}>
            No habits added yet.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[1],
  },
  title: {
    ...typeScale.headline,
  },
  countBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  countText: {
    ...typeScale.caption1,
    fontWeight: "500",
  },
  cardWrapper: {
    // Slight visual gap handled by container gap
  },
  divider: {
    height: 1,
    marginVertical: spacing[1],
  },
  emptyState: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  emptyText: {
    ...typeScale.subheadline,
  },
});
