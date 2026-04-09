/**
 * Onboarding data types and interfaces
 */

export interface OnboardingData {
  // User Profile
  name?: string;
  email?: string;

  // Primary Problem
  primaryProblem?:
    | "too-much-time"
    | "difficulty-focusing"
    | "poor-sleep"
    | "missing-moments"
    | "anxious-stressed"
    | "procrastinating";

  // Goals & Preferences
  primaryGoal:
    | "reduce-usage"
    | "build-focus"
    | "better-sleep"
    | "life-balance"
    | null;
  dailyLimitHours: number | null;
  dailyLimitMinutes: number | null;

  // Permissions
  notificationsEnabled: boolean;
  screenTimePermissionGranted: boolean;

  // Analytics & Insights
  currentDailyUsageHours: number | null;
  currentDailyUsageRange: "under-3" | "3-5" | "5-7" | "7-9" | "9+" | null;
  problemApps: string[];
  selectedApps?: string[];
  selectedCategories?: string[];
  selectionType?: "apps" | "categories";
  whenUsePhoneMost:
    | "morning"
    | "afternoon"
    | "evening"
    | "night"
    | "all-day"
    | null;
  reasonForChange: string | null;

  // Analytics consent
  analyticsEnabled: boolean;

  // Metadata
  completedAt: string | null;
  deviceInfo?: {
    platform: string;
    version: string;
  };
}

export interface OnboardingStep {
  id: number;
  title: string;
  completed: boolean;
}

// Supabase database schema type
export interface OnboardingRecord {
  id: string;
  user_id?: string;
  name?: string;
  email?: string;
  primary_goal: string | null;
  daily_limit_hours: number | null;
  daily_limit_minutes: number | null;
  notifications_enabled: boolean;
  screen_time_permission_granted: boolean;
  current_daily_usage_hours: number | null;
  problem_apps: string[];
  selected_apps?: string[];
  selected_categories?: string[];
  selection_type?: string;
  when_use_phone_most: string | null;
  reason_for_change: string | null;
  analytics_enabled: boolean;
  completed_at: string | null;
  device_platform: string;
  device_version: string;
  created_at: string;
}
