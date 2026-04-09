/**
 * Onboarding Flow Configuration
 *
 * Single source of truth for step order. The active flow is decided entirely
 * from the PostHog platform — no code release needed.
 *
 * ─── How it works ───────────────────────────────────────────────────────────
 * 1. PostHog feature flag:  "onboarding-flow-variant"
 *    - Type: Multivariate (with JSON payload)
 *    - Payload: a JSON array of screen-name strings, e.g.:
 *        ["welcome","how-it-works","the-pact","habit-selection","habit-priority",
 *         "config-screentime","app-selection","screentime-permission",
 *         "notification-permission","building-plan"]
 *    - Any subset of the names in STEP_REGISTRY, in any order you want.
 * 2. `useRemoteOnboardingFlow()` reads the **payload** via
 *    `useFeatureFlagPayload()`. If the payload is a valid non-empty array of
 *    known step names it becomes the live flow.
 * 3. Fallback chain (most → least preferred):
 *    a) PostHog payload  → JSON array of step names (fully remote)
 *    b) PostHog flag value → legacy variant key string ("default")
 *    c) Hard-coded FLOW_VARIANTS.default  (used when PostHog is unavailable)
 *
 * ─── PostHog dashboard setup ────────────────────────────────────────────────
 * 1. Create a feature flag with key  "onboarding-flow-variant".
 * 2. Add variants. For each variant set the Payload to a JSON array of step
 *    names (see STEP_REGISTRY keys below for valid values).
 * 3. Roll out to user segments as needed. The app picks up changes on the
 *    next cold start (PostHog caches flags locally between sessions).
 * ────────────────────────────────────────────────────────────────────────────
 */

import { HabitType } from "@/types/habits";

// ── Types ────────────────────────────────────────────────────────────────────

export type OnboardingRoutePath =
  | "/onboarding"
  | "/onboarding/how-it-works"
  | "/onboarding/the-pact"
  | "/onboarding/habit-selection"
  | "/onboarding/habit-priority"
  | "/onboarding/config-screentime"
  | "/onboarding/config-study"
  | "/onboarding/config-fitness"
  | "/onboarding/config-sleep"
  | "/onboarding/config-prayer"
  | "/onboarding/config-meditation"
  | "/onboarding/config-reading"
  | "/onboarding/app-selection"
  | "/onboarding/screentime-permission"
  | "/onboarding/notification-permission"
  | "/onboarding/healthkit-permission"
  | "/onboarding/pact-screen"
  | "/onboarding/building-plan";

export interface OnboardingStep {
  /** Expo Router path */
  route: OnboardingRoutePath;
  /** Human-readable name sent to analytics on every screen_view event */
  name: string;
  /**
   * When this function returns true, the step is skipped (jumped over) during
   * forward and backward navigation. The condition is re-evaluated at runtime
   * so it always reflects the current store state.
   */
  skipWhen?: (ctx: OnboardingContext) => boolean;
}

/**
 * Slice of onboarding state that skip conditions can inspect.
 */
export interface OnboardingContext {
  screenTimePermissionGranted: boolean;
  selectedHabits?: HabitType[];
}

export type FlowVariantKey = "default" | (string & {});

// ── Helpers for skipWhen ──────────────────────────────────────────────────────

function habitNotSelected(type: HabitType) {
  return (ctx: OnboardingContext) => !ctx.selectedHabits?.includes(type);
}

// ── Variants ──────────────────────────────────────────────────────────────────

export const FLOW_VARIANTS: Record<FlowVariantKey, OnboardingStep[]> = {
  /**
   * Default flow — new habit-centric onboarding.
   * Config screens for habits not selected by the user are auto-skipped.
   */
  default: [
    { route: "/onboarding", name: "welcome" },
    { route: "/onboarding/how-it-works", name: "how-it-works" },
    { route: "/onboarding/the-pact", name: "the-pact" },
    { route: "/onboarding/habit-selection", name: "habit-selection" },
    { route: "/onboarding/habit-priority", name: "habit-priority" },
    {
      route: "/onboarding/config-screentime",
      name: "config-screentime",
      skipWhen: habitNotSelected("screentime"),
    },
    {
      route: "/onboarding/config-study",
      name: "config-study",
      skipWhen: habitNotSelected("study"),
    },
    {
      route: "/onboarding/config-fitness",
      name: "config-fitness",
      skipWhen: habitNotSelected("fitness"),
    },
    {
      route: "/onboarding/config-sleep",
      name: "config-sleep",
      skipWhen: habitNotSelected("sleep"),
    },
    {
      route: "/onboarding/config-prayer",
      name: "config-prayer",
      skipWhen: habitNotSelected("prayer"),
    },
    {
      route: "/onboarding/config-meditation",
      name: "config-meditation",
      skipWhen: habitNotSelected("meditation"),
    },
    {
      route: "/onboarding/config-reading",
      name: "config-reading",
      skipWhen: habitNotSelected("reading"),
    },
    { route: "/onboarding/app-selection", name: "app-selection" },
    {
      route: "/onboarding/screentime-permission",
      name: "screentime-permission",
    },
    {
      route: "/onboarding/notification-permission",
      name: "notification-permission",
    },
    {
      route: "/onboarding/healthkit-permission",
      name: "healthkit-permission",
      skipWhen: habitNotSelected("fitness"),
    },
    { route: "/onboarding/pact-screen", name: "pact-screen" },
    { route: "/onboarding/building-plan", name: "building-plan" },
  ],
};

// ── PostHog feature flag ──────────────────────────────────────────────────────

import { useFeatureFlagWithPayload } from "posthog-react-native";

/**
 * Name of the PostHog feature flag.
 * Set its **payload** in the PostHog dashboard to a JSON array of step names
 * (see STEP_REGISTRY below for valid values).
 */
export const POSTHOG_FLAG = "onboarding-flow-variant";

/**
 * Registry of every onboarding screen the app knows about.
 * Keys are the stable "step names" used in PostHog payloads.
 */
export const STEP_REGISTRY: Record<string, OnboardingStep> = {
  welcome: { route: "/onboarding", name: "welcome" },
  "how-it-works": { route: "/onboarding/how-it-works", name: "how-it-works" },
  "the-pact": { route: "/onboarding/the-pact", name: "the-pact" },
  "habit-selection": {
    route: "/onboarding/habit-selection",
    name: "habit-selection",
  },
  "habit-priority": {
    route: "/onboarding/habit-priority",
    name: "habit-priority",
  },
  "config-screentime": {
    route: "/onboarding/config-screentime",
    name: "config-screentime",
    skipWhen: habitNotSelected("screentime"),
  },
  "config-study": {
    route: "/onboarding/config-study",
    name: "config-study",
    skipWhen: habitNotSelected("study"),
  },
  "config-fitness": {
    route: "/onboarding/config-fitness",
    name: "config-fitness",
    skipWhen: habitNotSelected("fitness"),
  },
  "config-sleep": {
    route: "/onboarding/config-sleep",
    name: "config-sleep",
    skipWhen: habitNotSelected("sleep"),
  },
  "config-prayer": {
    route: "/onboarding/config-prayer",
    name: "config-prayer",
    skipWhen: habitNotSelected("prayer"),
  },
  "config-meditation": {
    route: "/onboarding/config-meditation",
    name: "config-meditation",
    skipWhen: habitNotSelected("meditation"),
  },
  "config-reading": {
    route: "/onboarding/config-reading",
    name: "config-reading",
    skipWhen: habitNotSelected("reading"),
  },
  "app-selection": {
    route: "/onboarding/app-selection",
    name: "app-selection",
  },
  "screentime-permission": {
    route: "/onboarding/screentime-permission",
    name: "screentime-permission",
  },
  "notification-permission": {
    route: "/onboarding/notification-permission",
    name: "notification-permission",
  },
  "healthkit-permission": {
    route: "/onboarding/healthkit-permission",
    name: "healthkit-permission",
    skipWhen: habitNotSelected("fitness"),
  },
  "pact-screen": { route: "/onboarding/pact-screen", name: "pact-screen" },
  "building-plan": {
    route: "/onboarding/building-plan",
    name: "building-plan",
  },
};

/**
 * Resolves the active onboarding flow from PostHog, falling back to the
 * hard-coded default when PostHog hasn't loaded or the flag is off.
 *
 * Priority:
 * 1. Flag **payload** is a non-empty JSON array of valid step names
 *    → fully remote flow defined in the PostHog dashboard
 * 2. Flag **value** is a known variant key string ("default")
 *    → legacy variant hard-coded in FLOW_VARIANTS
 * 3. FLOW_VARIANTS.default
 *    → used in development or when PostHog is unreachable
 *
 * Returns `{ steps, variant }` where `variant` is the string label used in
 * analytics events.
 */
export function useRemoteOnboardingFlow(): {
  steps: OnboardingStep[];
  variant: string;
} {
  const [flagValue, payload] = useFeatureFlagWithPayload(POSTHOG_FLAG);

  // Priority 1 — payload is a JSON array of step name strings (fully remote).
  if (Array.isArray(payload) && payload.length > 0) {
    const steps = (payload as unknown[])
      .filter((item): item is string => typeof item === "string")
      .map((name) => STEP_REGISTRY[name])
      .filter((step): step is OnboardingStep => step !== undefined);

    if (steps.length > 0) {
      return { steps, variant: "remote" };
    }
  }

  // Priority 2 — flag value is a legacy variant key string.
  if (typeof flagValue === "string" && flagValue in FLOW_VARIANTS) {
    return {
      steps: FLOW_VARIANTS[flagValue as FlowVariantKey],
      variant: flagValue,
    };
  }

  // Priority 3 — fall back to the hard-coded default.
  return { steps: FLOW_VARIANTS.default, variant: "default" };
}

/**
 * @deprecated Use `useRemoteOnboardingFlow()` instead.
 */
export const useFlowVariantFlag = (): FlowVariantKey | undefined => {
  const { variant } = useRemoteOnboardingFlow();
  if (variant === "default") return undefined;
  return variant as FlowVariantKey;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Accepted by every helper — either a resolved step array or a variant key. */
type StepsOrVariant = OnboardingStep[] | FlowVariantKey;

function resolveSteps(
  stepsOrVariant: StepsOrVariant = "default",
): OnboardingStep[] {
  return Array.isArray(stepsOrVariant)
    ? stepsOrVariant
    : (FLOW_VARIANTS[stepsOrVariant] ?? FLOW_VARIANTS.default);
}

/**
 * Returns the resolved step list for a given variant key or step array,
 * falling back to 'default' if the key is unknown.
 */
export function getFlowSteps(
  stepsOrVariant: StepsOrVariant = "default",
): OnboardingStep[] {
  return resolveSteps(stepsOrVariant);
}

/**
 * Returns the next NON-SKIPPED step after `currentRoute`.
 * Walks forward past any steps whose `skipWhen(ctx)` returns true.
 */
export function getNextStep(
  currentRoute: OnboardingRoutePath,
  stepsOrVariant: StepsOrVariant = "default",
  ctx: OnboardingContext = { screenTimePermissionGranted: true },
): OnboardingStep | undefined {
  const steps = resolveSteps(stepsOrVariant);
  let idx = steps.findIndex((s) => s.route === currentRoute);
  if (idx === -1) return undefined;
  for (let i = idx + 1; i < steps.length; i++) {
    if (!steps[i].skipWhen?.(ctx)) return steps[i];
  }
  return undefined;
}

/**
 * Returns the previous NON-SKIPPED step before `currentRoute`.
 * Walks backward past any steps whose `skipWhen(ctx)` returns true.
 */
export function getPreviousStep(
  currentRoute: OnboardingRoutePath,
  stepsOrVariant: StepsOrVariant = "default",
  ctx: OnboardingContext = { screenTimePermissionGranted: true },
): OnboardingStep | undefined {
  const steps = resolveSteps(stepsOrVariant);
  const idx = steps.findIndex((s) => s.route === currentRoute);
  if (idx <= 0) return undefined;
  for (let i = idx - 1; i >= 0; i--) {
    if (!steps[i].skipWhen?.(ctx)) return steps[i];
  }
  return undefined;
}

/**
 * Returns a 0-based progress fraction (0–1) for the given route,
 * calculated over only the non-skipped steps for accuracy.
 */
export function getProgressFraction(
  currentRoute: OnboardingRoutePath,
  stepsOrVariant: StepsOrVariant = "default",
  ctx: OnboardingContext = { screenTimePermissionGranted: true },
): number {
  const steps = resolveSteps(stepsOrVariant);
  const visible = steps.filter((s) => !s.skipWhen?.(ctx));
  const idx = visible.findIndex((s) => s.route === currentRoute);
  if (idx === -1) return 0;
  return idx / (visible.length - 1);
}
