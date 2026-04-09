import {
    OnboardingRoutePath,
    useRemoteOnboardingFlow,
} from "@/config/onboardingFlow";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { Stack, useSegments } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect } from "react";

function OnboardingScreenTracker() {
  const posthog = usePostHog();
  const segments = useSegments();
  const { steps, variant } = useRemoteOnboardingFlow();

  useEffect(() => {
    // Build current route from segments, e.g. ['onboarding', 'name-input']
    const route = ("/" + segments.join("/")) as OnboardingRoutePath;
    const stepIndex = steps.findIndex((s) => s.route === route);
    const step = steps[stepIndex];
    if (!step) return;

    posthog?.capture("onboarding_screen_view", {
      screen_name: step.name,
      step_index: stepIndex,
      total_steps: steps.length,
      variant,
      progress_fraction: stepIndex / Math.max(steps.length - 1, 1),
    });
  }, [segments.join("/")]);

  return null;
}

export default function OnboardingLayout() {
  const theme = useThemedColors();

  return (
    <>
      <OnboardingScreenTracker />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg.primary },
          animation: "none",
        }}
      />
    </>
  );
}
