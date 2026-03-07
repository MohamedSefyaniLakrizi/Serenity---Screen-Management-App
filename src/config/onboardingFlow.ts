/**
 * Onboarding Flow Configuration
 *
 * Single source of truth for step order. Swap variants here or via a PostHog
 * feature flag without touching individual screens.
 *
 * ─── PostHog A/B Testing ────────────────────────────────────────────────────
 * 1. Install:   npx expo install posthog-react-native
 * 2. Wrap app:  <PostHogProvider apiKey="…" options={{ host: "…" }}>
 * 3. Set the feature flag name in POSTHOG_FLAG below.
 * 4. In PostHog dashboard create a multivariate flag whose values match the
 *    keys in FLOW_VARIANTS (e.g. "default" | "permissions-first").
 *    useOnboardingNext() will pick it up automatically on next app launch.
 * ────────────────────────────────────────────────────────────────────────────
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type OnboardingRoutePath =
  | '/onboarding'
  | '/onboarding/name-input'
  | '/onboarding/name-intro'
  | '/onboarding/problem-selection'
  | '/onboarding/solution-preview'
  | '/onboarding/stats-intro'
  | '/onboarding/pause-reflect'
  | '/onboarding/mindful-sessions'
  | '/onboarding/screentime-permission'
  | '/onboarding/notification-permission'
  | '/onboarding/phone-usage'
  | '/onboarding/daily-goal'
  | '/onboarding/app-selection'
  | '/onboarding/usage-patterns'
  | '/onboarding/building-plan';

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

export type FlowVariantKey = 'default' | 'permissions-first' | (string & {});

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
    { route: '/onboarding',                       name: 'welcome' },
    { route: '/onboarding/name-input',             name: 'name-input' },
    { route: '/onboarding/name-intro',             name: 'name-intro' },
    { route: '/onboarding/problem-selection',      name: 'problem-selection' },
    { route: '/onboarding/solution-preview',       name: 'solution-preview' },
    { route: '/onboarding/stats-intro',            name: 'stats-intro' },
    { route: '/onboarding/pause-reflect',          name: 'pause-reflect' },
    { route: '/onboarding/mindful-sessions',       name: 'mindful-sessions' },
    { route: '/onboarding/screentime-permission',  name: 'screentime-permission' },
    { route: '/onboarding/notification-permission',name: 'notification-permission' },
    { route: '/onboarding/phone-usage',            name: 'phone-usage' },
    { route: '/onboarding/daily-goal',             name: 'daily-goal' },
    { route: '/onboarding/app-selection',          name: 'app-selection' },
    { route: '/onboarding/usage-patterns',         name: 'usage-patterns' },
    { route: '/onboarding/building-plan',          name: 'building-plan' },
  ],

  /**
   * Variant B — permissions asked up front, before the value-prop slides.
   * Example only; enable via PostHog flag "onboarding-flow-variant" = "permissions-first".
   */
  'permissions-first': [
    { route: '/onboarding',                        name: 'welcome' },
    { route: '/onboarding/name-input',             name: 'name-input' },
    { route: '/onboarding/name-intro',             name: 'name-intro' },
    { route: '/onboarding/screentime-permission',  name: 'screentime-permission' },
    { route: '/onboarding/notification-permission',name: 'notification-permission' },
    { route: '/onboarding/problem-selection',      name: 'problem-selection' },
    { route: '/onboarding/solution-preview',       name: 'solution-preview' },
    { route: '/onboarding/stats-intro',            name: 'stats-intro' },
    { route: '/onboarding/pause-reflect',          name: 'pause-reflect' },
    { route: '/onboarding/mindful-sessions',       name: 'mindful-sessions' },
    { route: '/onboarding/phone-usage',            name: 'phone-usage' },
    { route: '/onboarding/daily-goal',             name: 'daily-goal' },
    { route: '/onboarding/app-selection',          name: 'app-selection' },
    { route: '/onboarding/usage-patterns',         name: 'usage-patterns' },
    { route: '/onboarding/building-plan',          name: 'building-plan' },
  ],
};

// ── PostHog feature flag ──────────────────────────────────────────────────────

import { useFeatureFlag } from 'posthog-react-native';

/**
 * Name of the PostHog multivariate feature flag.
 * Create it in the PostHog dashboard with string payloads matching
 * the keys of FLOW_VARIANTS (e.g. "default" | "permissions-first").
 */
export const POSTHOG_FLAG = 'onboarding-flow-variant';

/**
 * Returns the active A/B variant for this session.
 * Returns `undefined` (→ falls back to 'default') when PostHog hasn't loaded
 * the flag yet or when the user is in the control group.
 */
export const useFlowVariantFlag = (): FlowVariantKey | undefined => {
  const value = useFeatureFlag(POSTHOG_FLAG);
  if (typeof value === 'string' && value in FLOW_VARIANTS) {
    return value as FlowVariantKey;
  }
  return undefined;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the resolved step list for a given variant key,
 * falling back to 'default' if the key is unknown.
 */
export function getFlowSteps(variant: FlowVariantKey = 'default'): OnboardingStep[] {
  return FLOW_VARIANTS[variant] ?? FLOW_VARIANTS.default;
}

/**
 * Returns the next NON-SKIPPED step after `currentRoute`.
 * Walks forward past any steps whose `skipWhen(ctx)` returns true.
 */
export function getNextStep(
  currentRoute: OnboardingRoutePath,
  variant: FlowVariantKey = 'default',
  ctx: OnboardingContext = { screenTimePermissionGranted: true },
): OnboardingStep | undefined {
  const steps = getFlowSteps(variant);
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
  variant: FlowVariantKey = 'default',
  ctx: OnboardingContext = { screenTimePermissionGranted: true },
): OnboardingStep | undefined {
  const steps = getFlowSteps(variant);
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
  variant: FlowVariantKey = 'default',
  ctx: OnboardingContext = { screenTimePermissionGranted: true },
): number {
  const steps = getFlowSteps(variant);
  const visible = steps.filter((s) => !s.skipWhen?.(ctx));
  const idx = visible.findIndex((s) => s.route === currentRoute);
  if (idx === -1) return 0;
  return idx / (visible.length - 1);
}
