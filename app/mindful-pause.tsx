/**
 * Mindful Pause Screen
 *
 * Opens via deep link: serenity://mindful-pause (no group ID needed).
 *
 * Shows the first uncompleted habit and routes the user to the appropriate
 * habit action screen (study timer, meditation timer, prayer status, etc.).
 *
 * Design language: liquid glass — nature video bg, animated gradient blobs,
 * BlurView overlay, Serenity brand logo.
 */

import { ShieldService } from "@/services/shieldService";
import { useHabitStore } from "@/store/habitStore";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useMemo } from "react";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: W } = Dimensions.get("window");

// ─── Habit route map ──────────────────────────────────────────────────────────

const HABIT_ROUTES: Record<string, string> = {
  study: "/study-timer",
  meditation: "/meditation-timer",
  reading: "/reading-timer",
  fitness: "/fitness-status",
  prayer: "/prayer-status",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MindfulPauseScreen() {
  const router = useRouter();

  // Pull the first uncompleted habit from the store
  const uncompletedHabits = useHabitStore((s) => s.getUncompletedHabits());
  const primaryHabit = uncompletedHabits[0] ?? null;

  // Resolve the shield message for the primary habit
  const shieldMessage = useMemo(
    () =>
      primaryHabit
        ? ShieldService.getShieldMessage(primaryHabit.type)
        : {
            title: "Apps Blocked",
            subtitle: "Complete your daily habits to unlock your apps.",
            buttonLabel: "Go to App",
            deepLink: "",
          },
    [primaryHabit],
  );

  // ── Video player (loops silently, graceful fallback on missing asset) ──────
  const VIDEO_SOURCES = useMemo(
    () => [
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../assets/videos/nature-loop-1.mp4"),
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../assets/videos/nature-loop-2.mp4"),
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../assets/videos/nature-loop-3.mp4"),
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../assets/videos/nature-loop-4.mp4"),
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../assets/videos/nature-loop-5.mp4"),
    ],
    [],
  );
  const randomVideoSource = useMemo(
    () => VIDEO_SOURCES[Math.floor(Math.random() * VIDEO_SOURCES.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const videoPlayer = useVideoPlayer(randomVideoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 0.6;
    p.play();
  });

  // ── Navigate to the habit action screen ──────────────────────────────────
  const handleGoToHabit = () => {
    if (!primaryHabit) {
      router.back();
      return;
    }
    const route = HABIT_ROUTES[primaryHabit.type];
    if (route) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(route as any);
    } else {
      // sleep / screentime — dismiss only
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.back();
    }
  };

  // ── Reanimated shared values ─────────────────────────────────────────────

  // Blob animations
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob1Scale = useSharedValue(1);

  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);
  const blob2Scale = useSharedValue(1);

  // Fade-in for the whole content card
  const contentOpacity = useSharedValue(0);

  // ── Boot animations ──────────────────────────────────────────────────────
  useEffect(() => {
    contentOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    // Blob 1: slow diagonal drift
    blob1X.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-20, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(10, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(20, { duration: 4500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    blob1Scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.92, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // Blob 2: opposite phase
    blob2X.value = withRepeat(
      withSequence(
        withTiming(-35, { duration: 5500, easing: Easing.inOut(Easing.sin) }),
        withTiming(25, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-20, { duration: 5500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    blob2Scale.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 4500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.15, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  // ── Animated styles ──────────────────────────────────────────────────────

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob1X.value },
      { translateY: blob1Y.value },
      { scale: blob1Scale.value },
    ],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob2X.value },
      { translateY: blob2Y.value },
      { scale: blob2Scale.value },
    ],
  }));

  const buttonScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: blob1Scale.value }],
  }));

  // ── Render ───────────────────────────────────────────────────────────────
  const habiActionRoute = primaryHabit
    ? HABIT_ROUTES[primaryHabit.type]
    : undefined;
  const isDismissOnly = !habiActionRoute;

  return (
    <View style={styles.root}>
      {/* ── Nature video background ────────────────────────────────────── */}
      {Platform.OS === "ios" && (
        <VideoView
          player={videoPlayer}
          style={StyleSheet.absoluteFill}
          nativeControls={false}
          contentFit="cover"
        />
      )}

      {/* Dark tint on top of video */}
      <View style={styles.videoOverlay} />

      {/* ── Liquid blobs ────────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.blob, styles.blob1, blob1Style]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["rgba(107,158,143,0.55)", "rgba(61,130,110,0.30)"]}
          style={styles.blobGradient}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
        />
      </Animated.View>

      <Animated.View
        style={[styles.blob, styles.blob2, blob2Style]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["rgba(82,110,160,0.45)", "rgba(107,158,143,0.25)"]}
          style={styles.blobGradient}
          start={{ x: 0.8, y: 0.2 }}
          end={{ x: 0.2, y: 0.8 }}
        />
      </Animated.View>

      {/* ── Glass blur layer ────────────────────────────────────────────── */}
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.contentWrapper, contentStyle]}>
          {/* Brand logo */}
          <View style={styles.logoShadow}>
            <Image
              source={require("../assets/images/Serenity.png")}
              style={styles.logo}
            />
          </View>

          {/* Habit-specific headline */}
          <Text style={styles.headline}>{shieldMessage.title}</Text>

          {/* Habit-specific sub-headline */}
          <Text style={styles.subheadline}>{shieldMessage.subtitle}</Text>

          {/* ── Primary CTA — go complete the habit ───────────────────── */}
          <View style={styles.buttonArea}>
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={handleGoToHabit}
            >
              <Text style={styles.ctaButtonText}>
                {shieldMessage.buttonLabel}
              </Text>
            </Pressable>
          </View>

          {/* ── Dismiss button (always available) ─────────────────────── */}
          {!isDismissOnly && (
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              onPress={() => {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Warning,
                );
                router.back();
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          )}

          {/* Subtle bottom label */}
          <Text style={styles.brandLabel}>Serenity</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D1A14", // deep forest dark fallback
  },

  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,20,14,0.55)",
  },

  // ── Liquid blobs ──────────────────────────────────────────────────────────
  blob: {
    position: "absolute",
    borderRadius: 9999,
    overflow: "hidden",
  },
  blob1: {
    width: W * 0.8,
    height: W * 0.8,
    top: -W * 0.15,
    left: -W * 0.2,
  },
  blob2: {
    width: W * 0.75,
    height: W * 0.75,
    bottom: -W * 0.1,
    right: -W * 0.2,
  },
  blobGradient: {
    flex: 1,
  },

  // ── Content ───────────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },

  logoShadow: {
    marginBottom: 4,
    shadowColor: "rgba(0,0,0,0.4)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },

  logo: {
    width: 220,
    height: 100,
    resizeMode: "contain",
  },

  headline: {
    fontFamily: "System",
    fontSize: 30,
    fontWeight: "700",
    color: "#F5F5F5",
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: 0.2,
  },

  subheadline: {
    fontFamily: "System",
    fontSize: 15,
    color: "rgba(255,255,255,0.68)",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  // ── CTA button ────────────────────────────────────────────────────────────
  buttonArea: {
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },

  ctaButton: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    backgroundColor: "#E07A5F", // accent.primary — terracotta
    alignItems: "center",
  },
  ctaButtonPressed: {
    backgroundColor: "#C4624A", // accent.hover
  },
  ctaButtonText: {
    fontFamily: "System",
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // ── Close / dismiss button ────────────────────────────────────────────────
  closeButton: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  closeButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  closeButtonText: {
    fontFamily: "System",
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.3,
  },

  // ── Brand label ──────────────────────────────────────────────────────────
  brandLabel: {
    fontFamily: "System",
    fontSize: 13,
    color: "rgba(255,255,255,0.28)",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginTop: 8,
  },
});
