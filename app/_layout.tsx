import { accent, darkBg } from "@/constants/colors";
import { BlockingService } from "@/services/blockingService";
import { NotificationService } from "@/services/notificationService";
import { POSTHOG_CONFIG, PostHogProvider } from "@/services/posthog";
import { configurePurchases } from "@/services/purchases";
import { usePurchasesStore } from "@/store/purchasesStore";
import { useThemeStore } from "@/store/themeStore";
import { appEvents, EVENTS } from "@/utils/events";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

  // Navigate to a screen by path, buffering if the navigation tree is not yet ready.
  const navigateTo = useCallback(
    (path: string) => {
      if (isInitialized && isOnboardingComplete !== null) {
        router.push(path as any);
      } else {
        pendingDeepLinkRef.current = path;
      }
    },
    [isInitialized, isOnboardingComplete, router],
  );

  // Handle deep links from shield buttons — maps serenity:// scheme to app routes.
  useEffect(() => {
    if (!deepLinkUrl) return;
    try {
      const url = new URL(deepLinkUrl);
      const routes: Record<string, string> = {
        "mindful-pause": "/mindful-pause",
        "study-timer": "/study-timer",
        "meditation-timer": "/meditation-timer",
        "reading-timer": "/reading-timer",
        "fitness-status": "/fitness-status",
        "prayer-status": "/prayer-status",
      };
      const route = routes[url.hostname];
      if (route) {
        navigateTo(route);
      }
    } catch {}
  }, [deepLinkUrl, navigateTo]);

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
    // Re-evaluate blocking whenever the app comes to the foreground
    const checkDailyReset = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const lastResetKey = "@lastDailyReset";
        const lastReset = await AsyncStorage.getItem(lastResetKey);
        const { useHabitStore } = await import("@/store/habitStore");
        const habitStore = useHabitStore.getState();

        if (lastReset !== today) {
          // New day — reset completions, update streaks, re-block apps
          await AsyncStorage.setItem(lastResetKey, today);
          habitStore.resetDailyCompletions();
          habitStore.updateStreaks(today);
          await BlockingService.resetForNewDay();
        } else {
          // Same day — re-evaluate blocking on foreground
          await BlockingService.onAppForeground();

          // Auto-complete fitness habit if HealthKit goal is already met
          const fitnessHabit = habitStore
            .getActiveHabits()
            .find((h) => h.type === "fitness" && !h.dailyCompletion.completed);
          if (fitnessHabit) {
            import("@/services/habits/fitnessHabit")
              .then(({ FitnessHabitService }) =>
                FitnessHabitService.autoCheckAndComplete(
                  fitnessHabit.id,
                  fitnessHabit.config as import("@/types/habits").FitnessConfig,
                ),
              )
              .catch(() => {});
          }
        }

        // Check whether any habit has crossed the 60-day stacking threshold
        habitStore.checkAndActivateNextHabit();

        // Refresh notification schedule to reflect current state
        await NotificationService.refreshSchedule();
      } catch (error) {
        console.error("Error in daily reset / foreground check:", error);
      }
    };

    // Check on app launch
    checkDailyReset();

    // Re-check when app returns to foreground
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          checkDailyReset();
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
        // Load habits and re-evaluate blocking state on every cold start so
        // the shield message is always current.
        (async () => {
          const { useHabitStore } = await import("@/store/habitStore");
          await useHabitStore.getState().loadFromStorage();
          await BlockingService.onAppForeground();
          // Check stacking milestones after loading persisted state
          useHabitStore.getState().checkAndActivateNextHabit();
          // Ensure notification schedule is current
          await NotificationService.refreshSchedule();
        })(),
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
      router.replace("/onboarding");
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

  // Hide splash screen once app state is ready
  useEffect(() => {
    if (isInitialized && isOnboardingComplete !== null) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized, isOnboardingComplete]);

  // Show loading screen while app state is not yet ready
  if (!isInitialized || isOnboardingComplete === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={accent.primary} />
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
      <StatusBar style="dark" backgroundColor={darkBg.primary} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: darkBg.primary },
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
    backgroundColor: darkBg.primary,
  },
});
