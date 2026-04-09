import { HabitConfig, HabitType } from "./habits";

export interface OnboardingData {
  // Habits
  selectedHabits: HabitType[];
  habitPriority: HabitType[]; // ordered by user priority
  habitConfigs: Partial<Record<HabitType, HabitConfig>>;

  // Blocked apps
  selectedApps: string[]; // bundle IDs
  selectedCategories: string[];
  familyActivitySelection?: string; // opaque FamilyActivitySelection token

  // Permissions
  screenTimePermissionGranted: boolean;
  notificationsEnabled: boolean;
  healthKitPermissionGranted: boolean;
  locationPermissionGranted: boolean;

  // Pact
  pactAccepted: boolean;

  // Analytics consent
  analyticsEnabled: boolean;

  // Metadata
  completedAt?: string;
}

// Supabase database schema type — updated for habit-centric model
export interface OnboardingRecord {
  id: string;
  user_id?: string;
  selected_habits: string[];
  habit_priority: string[];
  habit_configs: Record<string, unknown>;
  selected_apps: string[];
  selected_categories: string[];
  family_activity_selection?: string;
  screen_time_permission_granted: boolean;
  notifications_enabled: boolean;
  health_kit_permission_granted: boolean;
  location_permission_granted: boolean;
  pact_accepted: boolean;
  analytics_enabled: boolean;
  completed_at?: string;
  device_platform: string;
  device_version: string;
  created_at: string;
}
