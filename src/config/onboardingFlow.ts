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
 *        ["welcome","name-input","problem-selection","screentime-permission",
 *         "notification-permission","daily-goal","app-selection","building-plan"]
 *    - Any subset of the names in STEP_REGISTRY, in any order you want.
 * 2. `useRemoteOnboardingFlow()` reads the **payload** via
 *    `useFeatureFlagPayload()`. If the payload is a valid non-empty array of
 *    known step names it becomes the live flow.
 * 3. Fallback chain (most → least preferred):
 *    a) PostHog payload  → JSON array of step names (fully remote)
 *    b) PostHog flag value → legacy variant key string ("default" / "permissions-first")
 *    c) Hard-coded FLOW_VARIANTS.default  (used when PostHog is unavailable)
 *
 * ─── PostHog dashboard setup ────────────────────────────────────────────────
 * 1. Create a feature flag with key  "onboarding-flow-variant".
 * 2. Add variants. For each variant set the Payload to a JSON array of step
 *    names (see STEP_REGISTRY keys below for valid values), e.g.:
 *      Variant "control"  payload: null   → uses app default
 *      Variant "short"    payload: ["welcome","name-input","screentime-permission",
 *                                   "notification-permission","daily-goal",
 *                                   "app-selection","building-plan"]
 *      Variant "long"     payload: ["welcome","name-input","name-intro",
 *                                   "problem-selection","solution-preview",
 *                                   "stats-intro","pause-reflect",
 *                                   "mindful-sessions","screentime-permission",
 *                                   "notification-permission","phone-usage",
 *                                   "daily-goal","app-selection",
 *                                   "usage-patterns","building-plan"]
 * 3. Roll out to user segments as needed. The app picks up changes on the
 *    next cold start (PostHog caches flags locally between sessions).
 * ────────────────────────────────────────────────────────────────────────────
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type OnboardingRoutePath =
  | "/onboarding"
  | "/onboarding/name-input"
  | "/onboarding/name-intro"
  | "/onboarding/problem-selection"
  | "/onboarding/solution-preview"
  | "/onboarding/stats-intro"
  | "/onboarding/pause-reflect"
  | "/onboarding/mindful-sessions"
  | "/onboarding/screentime-permission"
  | "/onboarding/notification-permission"
  | "/onboarding/phone-usage"
  | "/onboarding/daily-goal"
  | "/onboarding/app-selection"
  | "/onboarding/usage-patterns"
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
   *
   * Example:
   *   skipWhen: (ctx) => !ctx.screenTimePermissionGranted
   */
  skipWhen?: (ctx: OnboardingContext) => boolean;
}

/**
 * Slice of onboarding state that skip conditions can inspect.
 * Add more fields here as new conditional steps are introduced.
 */
export interface OnboardingContext {
  screenTimePermissionGranted: boolean;
}

export type FlowVariantKey = "default" | "permissions-first" | (string & {});

// ── Variants ──────────────────────────────────────────────────────────────────

/**
 * Add new variants here. Every key must list ALL steps you want in the flow.
 * Missing steps are simply not shown.
 */
export const FLOW_VARIANTS: Record<FlowVariantKey, OnboardingStep[]> = {
  /**
   * Default flow — current production order.
   */
  default: [
    { route: "/onboarding", name: "welcome" },
    { route: "/onboarding/name-input", name: "name-input" },
    { route: "/onboarding/name-intro", name: "name-intro" },
    { route: "/onboarding/problem-selection", name: "problem-selection" },
    { route: "/onboarding/solution-preview", name: "solution-preview" },
    { route: "/onboarding/stats-intro", name: "stats-intro" },
    { route: "/onboarding/pause-reflect", name: "pause-reflect" },
    { route: "/onboarding/mindful-sessions", name: "mindful-sessions" },
    {
      route: "/onboarding/screentime-permission",
      name: "screentime-permission",
    },
    {
      route: "/onboarding/notification-permission",
      name: "notification-permission",
    },
    { route: "/onboarding/phone-usage", name: "phone-usage" },
    { route: "/onboarding/daily-goal", name: "daily-goal" },
    { route: "/onboarding/app-selection", name: "app-selection" },
    { route: "/onboarding/usage-patterns", name: "usage-patterns" },
    { route: "/onboarding/building-plan", name: "building-plan" },
  ],

  /**
   * Variant B — permissions asked up front, before the value-prop slides.
   * Example only; enable via PostHog flag "onboarding-flow-variant" = "permissions-first".
   */
  "permissions-first": [
    { route: "/onboarding", name: "welcome" },
    { route: "/onboarding/name-input", name: "name-input" },
    { route: "/onboarding/name-intro", name: "name-intro" },
    {
      route: "/onboarding/screentime-permission",
      name: "screentime-permission",
    },
    {
      route: "/onboarding/notification-permission",
      name: "notification-permission",
    },
    { route: "/onboarding/problem-selection", name: "problem-selection" },
    { route: "/onboarding/solution-preview", name: "solution-preview" },
    { route: "/onboarding/stats-intro", name: "stats-intro" },
    { route: "/onboarding/pause-reflect", name: "pause-reflect" },
    { route: "/onboarding/mindful-sessions", name: "mindful-sessions" },
    { route: "/onboarding/phone-usage", name: "phone-usage" },
    { route: "/onboarding/daily-goal", name: "daily-goal" },
    { route: "/onboarding/app-selection", name: "app-selection" },
    { route: "/onboarding/usage-patterns", name: "usage-patterns" },
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
 * Add new screens here as you build them.
 */
export const STEP_REGISTRY: Record<string, OnboardingStep> = {
  welcome: { route: "/onboarding", name: "welcome" },
  "name-input": { route: "/onboarding/name-input", name: "name-input" },
  "name-intro": { route: "/onboarding/name-intro", name: "name-intro" },
  "problem-selection": {
    route: "/onboarding/problem-selection",
    name: "problem-selection",
  },
  "solution-preview": {
    route: "/onboarding/solution-preview",
    name: "solution-preview",
  },
  "stats-intro": { route: "/onboarding/stats-intro", name: "stats-intro" },
  "pause-reflect": {
    route: "/onboarding/pause-reflect",
    name: "pause-reflect",
  },
  "mindful-sessions": {
    route: "/onboarding/mindful-sessions",
    name: "mindful-sessions",
  },
  "screentime-permission": {
    route: "/onboarding/screentime-permission",
    name: "screentime-permission",
  },
  "notification-permission": {
    route: "/onboarding/notification-permission",
    name: "notification-permission",
  },
  "phone-usage": { route: "/onboarding/phone-usage", name: "phone-usage" },
  "daily-goal": { route: "/onboarding/daily-goal", name: "daily-goal" },
  "app-selection": {
    route: "/onboarding/app-selection",
    name: "app-selection",
  },
  "usage-patterns": {
    route: "/onboarding/usage-patterns",
    name: "usage-patterns",
  },
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
 * 2. Flag **value** is a known variant key string ("default" | "permissions-first")
 *    → legacy A/B variant hard-coded in FLOW_VARIANTS
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
 * Kept for gradual migration; returns the variant key for backward compat.
 */
export const useFlowVariantFlag = (): FlowVariantKey | undefined => {
  const { variant } = useRemoteOnboardingFlow();
  if (variant === "default") return undefined; // matches original "no flag" behaviour
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
