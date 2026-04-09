/**
 * Fitness Habit Service
 *
 * Queries HealthKit for today's fitness data and compares it against the
 * user's configured goal. Supports three goal types:
 *   - "steps"    → HKStatisticsQuery on stepCount
 *   - "workout"  → Sum of all HKWorkout durations for the day
 *   - "calories" → HKStatisticsQuery on activeEnergyBurned
 *
 * The service is stateless — each call queries HealthKit live.
 * Auto-complete logic is driven from the fitness-status screen via
 * useFocusEffect polling.
 */

import { useHabitStore } from "@/store/habitStore";
import { FitnessConfig, FitnessGoalType } from "@/types/habits";
import { HealthKitModule, WorkoutSample } from "healthkit";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FitnessGoalStatus {
  /** Current measured value (steps, minutes, or kcal) */
  current: number;
  /** Target value from user config */
  goal: number;
  /** Progress ratio 0–1 (clamped) */
  progress: number;
  /** True when current >= goal */
  met: boolean;
  /** Human-readable unit ("steps" | "min" | "kcal") */
  unit: string;
  /** Goal type for display logic */
  goalType: FitnessGoalType;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function unitLabel(goalType: FitnessGoalType): string {
  switch (goalType) {
    case "steps":
      return "steps";
    case "workout":
      return "min";
    case "calories":
      return "kcal";
    default:
      return "";
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const FitnessHabitService = {
  /**
   * Check today's progress toward the configured fitness goal.
   * Returns a FitnessGoalStatus object with current/goal/met/unit.
   */
  async checkGoal(config: FitnessConfig): Promise<FitnessGoalStatus> {
    const today = todayDateString();
    let current = 0;

    switch (config.goalType) {
      case "steps":
        current = await FitnessHabitService.getStepCount();
        break;
      case "workout":
        current = await FitnessHabitService.getWorkoutMinutes();
        break;
      case "calories":
        current = await FitnessHabitService.getActiveCalories();
        break;
    }

    const met = current >= config.goalValue;
    const progress = Math.min(current / Math.max(config.goalValue, 1), 1);

    return {
      current,
      goal: config.goalValue,
      progress,
      met,
      unit: unitLabel(config.goalType),
      goalType: config.goalType,
    };
  },

  /**
   * Returns today's step count from HealthKit.
   * Returns 0 if HealthKit is unavailable or permission was denied.
   */
  async getStepCount(): Promise<number> {
    return HealthKitModule.getStepCount(todayDateString());
  },

  /**
   * Returns the total workout minutes recorded today.
   * Sums all HKWorkout samples for the current calendar day.
   */
  async getWorkoutMinutes(): Promise<number> {
    const workouts = await HealthKitModule.getWorkouts(todayDateString());
    return workouts.reduce(
      (sum: number, w: WorkoutSample) => sum + w.durationMinutes,
      0,
    );
  },

  /**
   * Returns today's active calories burned from HealthKit.
   * Returns 0 if unavailable or denied.
   */
  async getActiveCalories(): Promise<number> {
    return HealthKitModule.getActiveCalories(todayDateString());
  },

  /**
   * Check the fitness goal and, if met, auto-complete the habit in the store.
   * Called from the fitness-status screen on focus and on a refresh interval.
   *
   * @returns true if the goal was newly met and the habit was completed.
   */
  async autoCheckAndComplete(
    habitId: string,
    config: FitnessConfig,
  ): Promise<boolean> {
    const status = await FitnessHabitService.checkGoal(config);
    if (!status.met) return false;

    // Avoid double-completing — check current habit state first
    const { getHabitById, completeHabit } = useHabitStore.getState();
    const habit = getHabitById(habitId);
    if (!habit || habit.dailyCompletion.completed) return false;

    completeHabit(habitId, "healthkit");
    return true;
  },
};
