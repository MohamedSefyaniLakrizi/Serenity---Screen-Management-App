import { Redirect } from "expo-router";

/**
 * Root index - simple passthrough to tabs
 * Onboarding check happens in _layout.tsx
 */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
