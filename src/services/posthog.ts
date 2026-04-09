/**
 * PostHog service
 *
 * Centralises all PostHog interactions so screens only call typed helpers
 * instead of coupling directly to the SDK.
 *
 * ─── Setup ──────────────────────────────────────────────────────────────────
 * 1. In your PostHog dashboard, create a multivariate feature flag whose key
 *    matches POSTHOG_FLAG (default: "onboarding-flow-variant") and whose
 *    string values match FLOW_VARIANTS keys ("default" | "permissions-first").
 * 2. Replace EXPO_PUBLIC_POSTHOG_API_KEY in .env with your project API key.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { POSTHOG_FLAG } from "@/config/onboardingFlow";

// ── Re-export provider so only one import is needed in _layout.tsx ───────────
export { PostHogProvider } from "posthog-react-native";

// ── Typed event catalogue ────────────────────────────────────────────────────

export type OnboardingEventName =
  | "onboarding_screen_view"
  | "onboarding_step_completed"
  | "onboarding_step_back"
  | "onboarding_completed"
  | "onboarding_abandoned";

// ── Habit event names ────────────────────────────────────────────────────────

export type HabitEventName =
  | "habit_completed"
  | "habit_stacked"
  | "habit_activated"
  | "streak_milestone"
  | "timer_started"
  | "timer_completed"
  | "oath_confirmed"
  | "prayer_confirmed"
  | "blocking_triggered"
  | "apps_unlocked"
  | "pact_accepted";

export type EventName = OnboardingEventName | HabitEventName;

// ── Habit event property shapes ──────────────────────────────────────────────

export interface HabitCompletedProps {
  habitType: string;
  method: string;
  streakCount: number;
}

export interface HabitStackedProps {
  habitType: string;
  streakDays: number;
}

export interface HabitActivatedProps {
  habitType: string;
  priority: number;
}

export interface StreakMilestoneProps {
  days: number;
  habitType: string;
}

export interface TimerStartedProps {
  habitType: string;
  goalMinutes: number;
}

export interface TimerCompletedProps {
  habitType: string;
  durationMinutes: number;
}

export interface OathConfirmedProps {
  habitType: string;
  context: string;
}

export interface PrayerConfirmedProps {
  prayerName: string;
  religion: string;
}

export interface BlockingTriggeredProps {
  reason: string; // habitType | 'sleep' | 'screentime_exceeded'
}

export interface AppsUnlockedProps {
  allHabitsCompleted: true;
}

export interface PactAcceptedProps {
  habitCount: number;
}

// ── Onboarding event property shapes ────────────────────────────────────────

export interface OnboardingScreenViewProps {
  screen_name: string;
  step_index: number;
  total_steps: number;
  variant: string;
  progress_fraction: number;
}

export interface OnboardingStepCompletedProps {
  screen_name: string;
  step_index: number;
  variant: string;
  /** Any data collected on this step (e.g. selected problem, goal value). */
  [key: string]: unknown;
}

// ── Config ───────────────────────────────────────────────────────────────────

export const POSTHOG_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "",
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
  /** Disable in development so local sessions don't pollute dashboards. */
  disabled: __DEV__ && process.env.EXPO_PUBLIC_POSTHOG_DEV !== "true",
  /** Feature flag used for A/B testing the onboarding flow order. */
  onboardingFlowFlag: POSTHOG_FLAG,
} as const;
