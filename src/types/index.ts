/**
 * TypeScript types for Serenity app
 */

export * from "./habits";

// Screen Time
export interface AppUsage {
  appName: string;
  bundleId: string;
  timeSpent: number; // in minutes
  limit?: number; // in minutes
  icon?: string;
  maxUnlocks?: number; // maximum unlocks per day
  currentUnlocks?: number; // unlocks used today
  isBlocked?: boolean; // completely blocked
}

export interface AppLimit {
  bundleId: string;
  appName: string;
  timeLimit: number; // in minutes, 0 = blocked
  maxUnlocks: number; // per day
  currentUnlocks: number;
  lastReset: string; // date string
}

export type AppCategory =
  | "social"
  | "games"
  | "entertainment"
  | "productivity"
  | "other";

export interface CategoryLimit {
  category: AppCategory;
  timeLimit: number; // in minutes
  maxUnlocks: number; // per day
  currentUnlocks: number;
  lastReset: string;
  apps: string[]; // bundleIds in this category
}

export interface DailyGoal {
  totalLimit: number; // in minutes
  breakReminder: boolean;
  reminderInterval: number; // in minutes
}

export interface ScreenTimeData {
  date: string;
  totalUsage: number; // in minutes
  apps: AppUsage[];
  goalMet: boolean;
}

// User Goals
export type UserGoal =
  | "reduce-usage"
  | "build-focus"
  | "better-sleep"
  | "life-balance";

export interface UserPreferences {
  goal: UserGoal;
  dailyLimit: number;
  notificationsEnabled: boolean;
  reminderFrequency: number;
  onboardingCompleted: boolean;
}

// Achievements
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date | null;
  requirement: number; // e.g., 7 for 7-day streak
}

// Stats
export interface WeeklyStats {
  weekStart: Date;
  dailyUsage: number[]; // 7 days of usage in minutes
  averageUsage: number;
  goalsMet: number;
  streak: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastUpdated: string; // date string
  streakHistory: string[]; // array of dates when goals were met
}
