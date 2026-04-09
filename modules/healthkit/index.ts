/**
 * HealthKit native module bridge for Serenity.
 *
 * iOS only — all methods are no-ops / return defaults on other platforms.
 * Wraps HKHealthStore queries for step count, workout duration, and
 * active energy burned, enabling fitness goal verification without
 * requiring an Apple Watch (steps & calories are tracked by iPhone).
 */

import { NativeModules, Platform } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutSample {
  /** HKWorkoutActivityType raw value string, e.g. "running", "cycling" */
  type: string;
  /** Duration of the workout in minutes */
  durationMinutes: number;
  /** Active calories burned during the workout */
  calories: number;
}

interface HealthKitNativeModule {
  requestAuthorization(): Promise<boolean>;
  getStepCount(dateString: string): Promise<number>;
  getWorkouts(dateString: string): Promise<WorkoutSample[]>;
  getActiveCalories(dateString: string): Promise<number>;
}

// ─── Native bridge ────────────────────────────────────────────────────────────

const LINKING_ERROR =
  `The 'healthkit' native module doesn't seem to be linked. Make sure:\n\n` +
  Platform.select({ ios: "- Run 'cd ios && pod install'\n", default: "" }) +
  "- You have added the HealthKit capability in Xcode\n" +
  "- You rebuilt the app after installing the package";

const Native: HealthKitNativeModule =
  Platform.OS === "ios" && NativeModules.HealthKit
    ? NativeModules.HealthKit
    : new Proxy(
        {},
        {
          get() {
            throw new Error(LINKING_ERROR);
          },
        },
      );

// ─── Public API ───────────────────────────────────────────────────────────────

export const HealthKitModule = {
  /**
   * Whether HealthKit is available on this device.
   * Returns false on non-iOS platforms and on iPad (no step count hardware).
   */
  isAvailable(): boolean {
    return Platform.OS === "ios" && !!NativeModules.HealthKit;
  },

  /**
   * Request HealthKit authorization for the data types Serenity reads:
   * - Step count
   * - Active energy burned
   * - Workout samples
   *
   * Returns `true` if the user granted access (or has previously granted it).
   * Note: HealthKit will only prompt the user once per data type.
   */
  async requestAuthorization(): Promise<boolean> {
    if (!HealthKitModule.isAvailable()) return false;
    try {
      return await Native.requestAuthorization();
    } catch {
      return false;
    }
  },

  /**
   * Get the total step count for a specific calendar day.
   * @param dateString ISO date string — "YYYY-MM-DD"
   */
  async getStepCount(dateString: string): Promise<number> {
    if (!HealthKitModule.isAvailable()) return 0;
    try {
      return await Native.getStepCount(dateString);
    } catch {
      return 0;
    }
  },

  /**
   * Get all workouts recorded on a specific calendar day.
   * @param dateString ISO date string — "YYYY-MM-DD"
   */
  async getWorkouts(dateString: string): Promise<WorkoutSample[]> {
    if (!HealthKitModule.isAvailable()) return [];
    try {
      return await Native.getWorkouts(dateString);
    } catch {
      return [];
    }
  },

  /**
   * Get total active calories burned on a specific calendar day.
   * @param dateString ISO date string — "YYYY-MM-DD"
   */
  async getActiveCalories(dateString: string): Promise<number> {
    if (!HealthKitModule.isAvailable()) return 0;
    try {
      return await Native.getActiveCalories(dateString);
    } catch {
      return 0;
    }
  },
};
