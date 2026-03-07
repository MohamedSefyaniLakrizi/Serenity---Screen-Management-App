/**
 * useOnboardingNext
 *
 * Drop-in replacement for every hardcoded `router.push('/onboarding/...')` in
 * the onboarding screens.
 *
 * Usage in any onboarding screen:
 *
 *   const navigateNext = useOnboardingNext('/onboarding/screentime-permission');
 *   // ...
 *   navigateNext();   // goes to whatever the flow config says comes next
 *
 * The active variant is resolved once from PostHog (or defaults to 'default')
 * so all screens in a session use the same variant.
 */

import {
  FlowVariantKey,
  OnboardingContext,
  OnboardingRoutePath,
  getFlowSteps,
  getNextStep,
  getPreviousStep,
  getProgressFraction,
  useFlowVariantFlag,
} from '@/config/onboardingFlow';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useCallback } from 'react';

export interface OnboardingNextResult {
  /** Navigate to the next step in the active flow variant. */
  navigateNext: () => void;
  /** Navigate to the previous step (mirrors router.back() but flow-aware). */
  navigatePrev: () => void;
  /** 0–1 fraction — plug straight into the progress bar width. */
  progressFraction: number;
  /** The resolved variant key being used this session. */
  variant: FlowVariantKey;
}

export function useOnboardingNext(currentRoute: OnboardingRoutePath): OnboardingNextResult {
  const flagVariant = useFlowVariantFlag();
  const variant: FlowVariantKey = flagVariant ?? 'default';
  const { screenTimePermissionGranted } = useOnboardingStore();
  const posthog = usePostHog();

  const ctx: OnboardingContext = { screenTimePermissionGranted };

  // Derive step index and total for analytics
  const steps = getFlowSteps(variant);
  const stepIndex = steps.findIndex((s) => s.route === currentRoute);
  const currentStep = steps[stepIndex];

  const navigateNext = useCallback(() => {
    const next = getNextStep(currentRoute, variant, ctx);

    // Track step completion before navigating away
    posthog?.capture('onboarding_step_completed', {
      screen_name: currentStep?.name ?? currentRoute,
      step_index: stepIndex,
      total_steps: steps.length,
      variant,
      next_screen: next?.name ?? null,
    });

    if (next) {
      router.push(next.route as any);
    }
  }, [currentRoute, variant, screenTimePermissionGranted]);

  const navigatePrev = useCallback(() => {
    const prev = getPreviousStep(currentRoute, variant, ctx);

    posthog?.capture('onboarding_step_back', {
      screen_name: currentStep?.name ?? currentRoute,
      step_index: stepIndex,
      variant,
    });

    if (prev) {
      router.push(prev.route as any);
    } else {
      router.back();
    }
  }, [currentRoute, variant, screenTimePermissionGranted]);

  const progressFraction = getProgressFraction(currentRoute, variant, ctx);

  return { navigateNext, navigatePrev, progressFraction, variant };
}
