/**
 * Habit type system for Serenity — Habit Builder
 */

// Habit type enum
export type HabitType =
  | "screentime"
  | "study"
  | "fitness"
  | "sleep"
  | "prayer"
  | "meditation"
  | "reading";

// Habit status in the stacking lifecycle
export type HabitStatus = "active" | "pending" | "stacked";

// Completion verification method
export type CompletionMethod =
  | "auto"
  | "timer"
  | "oath"
  | "healthkit"
  | "schedule";

// Religion for prayer habit
export type Religion =
  | "islam"
  | "christianity"
  | "judaism"
  | "buddhism"
  | "hinduism"
  | "other";

// Fitness goal types
export type FitnessGoalType = "steps" | "workout" | "calories";

// Per-habit config interfaces (discriminated union on `type`)
export interface ScreentimeConfig {
  type: "screentime";
  dailyLimitMinutes: number;
}

export interface StudyConfig {
  type: "study";
  dailyGoalMinutes: number;
  workLabel?: string;
}

export interface FitnessConfig {
  type: "fitness";
  goalType: FitnessGoalType;
  goalValue: number;
}

export interface SleepConfig {
  type: "sleep";
  bedtime: string; // HH:mm
  wakeTime: string; // HH:mm
}

export interface PrayerConfig {
  type: "prayer";
  religion: Religion;
  prayerCount: number;
  customTimes?: string[];
  calculationMethod?: string;
}

export interface MeditationConfig {
  type: "meditation";
  dailyGoalMinutes: number;
}

export interface ReadingConfig {
  type: "reading";
  dailyGoalMinutes: number;
  readingApps?: string[]; // bundle IDs
}

export type HabitConfig =
  | ScreentimeConfig
  | StudyConfig
  | FitnessConfig
  | SleepConfig
  | PrayerConfig
  | MeditationConfig
  | ReadingConfig;

// Streak tracking
export interface HabitStreak {
  currentStreak: number;
  longestStreak: number;
  lastUpdated: string; // ISO date string
  history: string[]; // array of ISO date strings when habit was completed
}

// Daily completion record
export interface DailyHabitCompletion {
  date: string; // ISO date string (YYYY-MM-DD)
  completed: boolean;
  completedAt?: string; // ISO timestamp
  method?: CompletionMethod;
}

// Main Habit object
export interface Habit {
  id: string;
  type: HabitType;
  status: HabitStatus;
  priority: number;
  config: HabitConfig;
  streak: HabitStreak;
  dailyCompletion: DailyHabitCompletion;
  activatedAt?: string; // ISO timestamp
  stackedAt?: string; // ISO timestamp
  createdAt: string; // ISO timestamp
}

// Global streak across all habits
export interface GlobalStreak {
  currentStreak: number;
  longestStreak: number;
  lastUpdated: string; // ISO date string
  history: string[]; // array of ISO date strings
}

// Habit metadata for UI rendering
export interface HabitMeta {
  type: HabitType;
  label: string;
  description: string;
  icon: string; // lucide icon name
  color: string; // habitColors key
}

// Sleep escalation state
export interface SleepEscalationState {
  violations: string[]; // ISO date strings of violations
  escalationMinutes: number;
  goodNightStreak: number;
  effectiveBedtime: string; // HH:mm (computed from bedtime - escalationMinutes)
}

// Prayer tracking for multi-prayer religions
export interface PrayerEntry {
  name: string;
  time: string; // HH:mm
  completed: boolean;
  completedAt?: string; // ISO timestamp
}

export interface PrayerDayStatus {
  date: string; // ISO date string (YYYY-MM-DD)
  prayers: PrayerEntry[];
}
