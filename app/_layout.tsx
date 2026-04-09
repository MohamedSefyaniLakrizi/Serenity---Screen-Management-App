import { colors, fontAssets } from "@/constants";
import { AppGroupService } from "@/services/appGroups";
import { POSTHOG_CONFIG, PostHogProvider } from "@/services/posthog";
import { configurePurchases } from "@/services/purchases";
import { usePurchasesStore } from "@/store/purchasesStore";
import { useThemeStore } from "@/store/themeStore";
import { appEvents, EVENTS } from "@/utils/events";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { useURL } from "expo-linking";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  StyleSheet,
  View,
} from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<
    boolean | null
  >(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const onSDKConfigured = usePurchasesStore((state) => state.onSDKConfigured);
  const deepLinkUrl = useURL();
  // Buffer a deep link that arrives before the navigation tree is mounted.
  const pendingDeepLinkRef = useRef<string | null>(null);

  // Navigate to the mindful-pause screen, buffering if not yet ready.
  const navigateToMindfulPause = useCallback(
    (groupId: string) => {
      const path = `/mindful-pause?groupId=${encodeURIComponent(groupId)}`;
      if (isInitialized && isOnboardingComplete !== null) {
        router.push(path as any);
      } else {
        pendingDeepLinkRef.current = path;
      }
    },
    [isInitialized, isOnboardingComplete, router],
  );

  // Handle deep links (e.g. serenity://mindful-pause?groupId=xxx from shield button)
  useEffect(() => {
    if (!deepLinkUrl) return;
    try {
      const url = new URL(deepLinkUrl);
      if (url.hostname === "mindful-pause") {
        const groupId = url.searchParams.get("groupId") ?? "";
        navigateToMindfulPause(groupId);
      }
    } catch {}
  }, [deepLinkUrl, navigateToMindfulPause]);

  // Flush any buffered deep link once the navigation tree is ready.
  useEffect(() => {
    if (!isInitialized || isOnboardingComplete === null) return;
    if (pendingDeepLinkRef.current) {
      const path = pendingDeepLinkRef.current;
      pendingDeepLinkRef.current = null;
      // Small delay to let the Stack finish mounting before pushing.
      setTimeout(() => router.push(path as any), 150);
    }
  }, [isInitialized, isOnboardingComplete, router]);

  // Check onboarding status on mount
  const checkOnboardingStatus = useCallback(async () => {
    try {
      console.log("Checking onboarding status...");
      const completed = await AsyncStorage.getItem("onboardingCompleted");
      const isComplete = completed === "true";
      console.log("Onboarding completed:", isComplete);
      setIsOnboardingComplete(isComplete);
      return isComplete;
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setIsOnboardingComplete(false);
      return false;
    }
  }, []);

  // Setup daily reset timer and app state listener
  useEffect(() => {
    // Setup app state listener for reapplying blocking
    AppGroupService.setupAppStateListener();

    // Function to check if we need to reset daily unlocks
    const checkDailyReset = async () => {
      try {
        await AppGroupService.resetDailyUnlocks();
      } catch (error) {
        console.error("Error resetting daily unlocks:", error);
      }
    };

    // Check on app launch
    checkDailyReset();

    // Check when app comes to foreground
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          checkDailyReset();
          // Sync unlock counts from shield extension
          AppGroupService.syncUnlockCounts();
        }
      },
    );

    // Set up midnight reset timer
    const setupMidnightTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const timeUntilMidnight = tomorrow.getTime() - now.getTime();

      // Schedule reset at midnight
      const timeout = setTimeout(() => {
        checkDailyReset();
        // Reschedule for next midnight
        setupMidnightTimer();
      }, timeUntilMidnight);

      return timeout;
    };

    const midnightTimer = setupMidnightTimer();

    // Cleanup
    return () => {
      subscription.remove();
      clearTimeout(midnightTimer);
    };
  }, []);

  // Initialize app
  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        checkOnboardingStatus(),
        loadTheme(),
        // Rewrite all shield configs to UserDefaults so that any code changes
        // to colours / quotes / emoji are reflected immediately for existing groups.
        AppGroupService.refreshAllShieldConfigs(),
        // Configure RevenueCat SDK. Any errors here are non-fatal.
        configurePurchases()
          .then(() => {
            onSDKConfigured();
          })
          .catch((err) => {
            console.warn("[RevenueCat] Init error (non-fatal):", err);
          }),
      ]);
      setIsInitialized(true);
    };
    initialize();
  }, []);

  // Navigation guard - handle routing based on onboarding status
  useEffect(() => {
    if (!isInitialized || isOnboardingComplete === null) return;

    const inOnboarding = segments[0] === "onboarding";
    const inTabs = segments[0] === "(tabs)";

    console.log("🚦 Navigation guard:", {
      isOnboardingComplete,
      inOnboarding,
      inTabs,
      segments,
    });

    // Route to appropriate location
    if (!isOnboardingComplete && !inOnboarding) {
      console.log("➡️ Navigating to onboarding...");
      router.replace("/onboarding/");
    } else if (isOnboardingComplete && inOnboarding) {
      console.log("➡️ Onboarding complete, navigating to paywall...");
      router.replace("/paywall");
    }
  }, [isInitialized, isOnboardingComplete, segments, router]);

  // Listen for onboarding events for immediate state updates
  useEffect(() => {
    const handleOnboardingComplete = () => {
      console.log("📢 Onboarding completed event received");
      setIsOnboardingComplete(true);
    };

    const handleOnboardingReset = () => {
      console.log("📢 Onboarding reset event received");
      setIsOnboardingComplete(false);
    };

    appEvents.on(EVENTS.ONBOARDING_COMPLETED, handleOnboardingComplete);
    appEvents.on(EVENTS.ONBOARDING_RESET, handleOnboardingReset);

    return () => {
      appEvents.off(EVENTS.ONBOARDING_COMPLETED, handleOnboardingComplete);
      appEvents.off(EVENTS.ONBOARDING_RESET, handleOnboardingReset);
    };
  }, []);

  // Hide splash screen once fonts and app state are both ready
  useEffect(() => {
    if (
      (fontsLoaded || fontError) &&
      isInitialized &&
      isOnboardingComplete !== null
    ) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isInitialized, isOnboardingComplete]);

  // Show loading screen while fonts or app state are not yet ready
  if (
    (!fontsLoaded && !fontError) ||
    !isInitialized ||
    isOnboardingComplete === null
  ) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <PostHogProvider
      apiKey={POSTHOG_CONFIG.apiKey}
      options={{
        host: POSTHOG_CONFIG.host,
        disabled: POSTHOG_CONFIG.disabled,
      }}
    >
      <StatusBar style="dark" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="mindful-pause"
          options={{
            presentation: "fullScreenModal",
            headerShown: false,
            animation: "fade",
          }}
        />
      </Stack>
    </PostHogProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.textDark,
  },
});
