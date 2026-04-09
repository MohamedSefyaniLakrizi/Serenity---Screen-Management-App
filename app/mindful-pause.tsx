/**
 * Mindful Pause Screen
 *
 * Opens via deep link: serenity://mindful-pause?groupId=<id>
 *
 * – LIMITED group  → user must hold the button for 5 s (with haptic rhythm)
 *                    before iOS lifts the shield. Decrement unlock count.
 * – BLOCKED group  → single tap closes the screen (shield stays active).
 *
 * Design language: liquid glass — nature video bg, animated gradient blobs,
 * BlurView overlay, Lottie brand logo, Lora serif headings.
 */

import { AppGroup, AppGroupService } from "@/services/appGroups";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Dimensions,
    Image,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { unblockSelection } from "react-native-device-activity";
import Animated, {
    Easing,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get("window");
const HOLD_DURATION_MS = 5_000;
const RING_RADIUS = 44;
const RING_STROKE = 4;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Motivating messages for the limited-mode countdown
const COUNTDOWN_PHRASES = [
  "Breathe in slowly…",
  "Feel the stillness…",
  "You are in control.",
  "Almost there…",
  "One last breath…",
];

// Random quotes shown on blocked / no-unlocks screen
const BLOCKED_QUOTES = [
  '"Almost everything will work again if you unplug it for a few minutes, including you."\n\u2014 Anne Lamott',
  '"The present moment is the only moment available to us, and it is the door to all moments."\n\u2014 Thich Nhat Hanh',
  '"You have power over your mind, not outside events. Realise this and you will find strength."\n\u2014 Marcus Aurelius',
  '"Disconnecting from technology is the first step to reconnecting with yourself."',
  '"In the depth of winter, I finally learned that within me there lay an invincible summer."\n\u2014 Albert Camus',
  '"Every moment of resistance to temptation is a victory."\n\u2014 Frederick William Faber',
  '"What you pay attention to grows. Pay attention to what matters."',
  '"Rest is not idleness. It is the work of a different kind."',
  '"You don\'t have to scroll to feel alive."',
  '"Small disciplines repeated with consistency every day lead to great achievements."\n\u2014 John C. Maxwell',
];

// ─── Dev testing helpers ─────────────────────────────────────────────────────
// Pass groupId="__dev_limited__" or "__dev_blocked__" to bypass storage
// and render the screen with canned mock data.

const DEV_MOCK_GROUPS: Record<string, AppGroup> = {
  __dev_limited__: {
    id: "__dev_limited__",
    name: "Social Media",
    apps: [],
    sessionLength: 30,
    dailyUnlocks: 3,
    currentUnlocks: 2, // 2 remaining
    isBlocked: false,
    createdAt: new Date().toISOString(),
    lastReset: new Date().toISOString().split("T")[0],
  },
  __dev_blocked__: {
    id: "__dev_blocked__",
    name: "Games",
    apps: [],
    sessionLength: 0,
    dailyUnlocks: 0,
    currentUnlocks: 0,
    isBlocked: true,
    createdAt: new Date().toISOString(),
    lastReset: new Date().toISOString().split("T")[0],
  },
  __dev_no_unlocks__: {
    id: "__dev_no_unlocks__",
    name: "Social Media",
    apps: [],
    sessionLength: 30,
    dailyUnlocks: 3,
    currentUnlocks: 0, // all used up
    isBlocked: false,
    createdAt: new Date().toISOString(),
    lastReset: new Date().toISOString().split("T")[0],
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MindfulPauseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();

  const [group, setGroup] = useState<AppGroup | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [noUnlocksLeft, setNoUnlocksLeft] = useState(false);

  // Pick a random quote once per screen open
  const blockedQuote = useMemo(
    () => BLOCKED_QUOTES[Math.floor(Math.random() * BLOCKED_QUOTES.length)],
    [],
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(false); // "keep holding" hint

  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phraseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // ── Video player (loops silently, graceful fallback on missing asset) ──────
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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

  // ── Load group data ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!groupId) return;
      // Dev fast-path: skip storage for mock IDs
      if (__DEV__ && DEV_MOCK_GROUPS[groupId]) {
        const mock = DEV_MOCK_GROUPS[groupId];
        setGroup(mock);
        if (!mock.isBlocked && mock.currentUnlocks <= 0) setNoUnlocksLeft(true);
        return;
      }
      const groups = await AppGroupService.getAppGroups();
      const found = groups.find((g) => g.id === groupId) ?? null;
      setGroup(found);
      // Detect zero-unlocks immediately — no need to attempt the 5-second hold
      if (found && !found.isBlocked && found.currentUnlocks <= 0) {
        setNoUnlocksLeft(true);
      }
    };
    load();
  }, [groupId]);

  // ── Reanimated shared values ─────────────────────────────────────────────

  // Hold progress (0 → 1 over HOLD_DURATION_MS)
  const holdProgress = useSharedValue(0);

  // Button scale pulse while holding
  const buttonScale = useSharedValue(1);

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
    transform: [{ scale: buttonScale.value }],
  }));

  // SVG ring fill driven by holdProgress
  const animatedRingProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - holdProgress.value) * RING_CIRCUMFERENCE,
  }));

  // ── Hold-button handlers ─────────────────────────────────────────────────

  const clearHoldTimers = useCallback(() => {
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (phraseIntervalRef.current) {
      clearInterval(phraseIntervalRef.current);
      phraseIntervalRef.current = null;
    }
  }, []);

  const handleHoldComplete = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;

    clearHoldTimers();
    setIsHolding(false);
    setHintVisible(false);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (group) {
      // Dev mock groups skip the real unlock decrement
      const isMock = __DEV__ && !!DEV_MOCK_GROUPS[group.id];
      const success = isMock
        ? group.currentUnlocks > 0
        : await AppGroupService.incrementUnlock(group.id);
      if (!success) {
        setNoUnlocksLeft(true);
        holdProgress.value = withTiming(0, { duration: 400 });
        buttonScale.value = withTiming(1, { duration: 200 });
        return;
      }

      // Lift the native Screen Time shield so the app becomes accessible.
      // The shield will be re-applied on the next app launch / block cycle.
      if (!isMock && Platform.OS === "ios") {
        try {
          unblockSelection({ activitySelectionId: group.id });
        } catch (e) {
          console.warn(
            "[MindfulPause] unblockSelection failed (non-fatal):",
            e,
          );
        }
      }
    }

    setShowSuccess(true);
    setTimeout(() => router.back(), 1_400);
  }, [group, clearHoldTimers]);

  const onPressIn = useCallback(() => {
    if (completedRef.current || noUnlocksLeft || showSuccess) return;
    completedRef.current = false;
    setIsHolding(true);
    setHintVisible(false);
    setPhraseIndex(0);

    // Smooth 5-second ring fill
    holdProgress.value = withTiming(1, {
      duration: HOLD_DURATION_MS,
      easing: Easing.linear,
    });

    // Slow, meditative breathe pulse
    buttonScale.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    // Haptic rhythm every 250 ms
    hapticIntervalRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 250);

    // Cycle motivating phrases every ~2 s
    phraseIntervalRef.current = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % COUNTDOWN_PHRASES.length);
    }, 2_500);

    // Completion timer
    holdTimeoutRef.current = setTimeout(() => {
      handleHoldComplete();
    }, HOLD_DURATION_MS);
  }, [noUnlocksLeft, showSuccess, handleHoldComplete]);

  const onPressOut = useCallback(() => {
    if (completedRef.current) return;
    clearHoldTimers();
    setIsHolding(false);
    holdProgress.value = withTiming(0, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
    buttonScale.value = withTiming(1, { duration: 200 });
    setHintVisible(true);
    // Hide hint after 2 s
    setTimeout(() => setHintVisible(false), 2_000);
  }, [clearHoldTimers]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => () => clearHoldTimers(), [clearHoldTimers]);

  // ── Derived UI state ─────────────────────────────────────────────────────
  const isBlocked = group?.isBlocked ?? false;
  const unlocksRemaining = group ? group.currentUnlocks : 0;
  // Treat blocked and no-unlocks-remaining identically in the UI
  const showBlockedUI = isBlocked || noUnlocksLeft;

  // ── Render ───────────────────────────────────────────────────────────────
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

          {/* Headline */}
          <Text style={styles.headline}>
            {showSuccess
              ? "Enjoy your session."
              : showBlockedUI
                ? isBlocked
                  ? "This app is blocked."
                  : "No unlocks remaining."
                : isHolding
                  ? COUNTDOWN_PHRASES[phraseIndex]
                  : "You're in control."}
          </Text>

          {/* Sub-headline / motivational quote */}
          {showBlockedUI && !showSuccess ? (
            <Text style={styles.quote}>{blockedQuote}</Text>
          ) : (
            <Text style={styles.subheadline}>
              {showSuccess
                ? "Your unlock has been recorded. \nBe intentional."
                : isHolding
                  ? "Keep holding to open the app…"
                  : `${group?.name ?? "This group"} is gently blocking you.\n${
                      unlocksRemaining > 0
                        ? `${unlocksRemaining} unlock${unlocksRemaining !== 1 ? "s" : ""} remaining today.`
                        : "No unlocks remaining today."
                    }`}
            </Text>
          )}

          {/* ── Hold-button (limited) ──────────────────────────────────── */}
          {!showBlockedUI && !showSuccess && (
            <View style={styles.buttonArea}>
              <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.holdButtonPressable}
              >
                <Animated.View
                  style={[styles.holdButtonOuter, buttonScaleStyle]}
                >
                  {/* Background glass circle */}
                  <BlurView
                    intensity={40}
                    tint="light"
                    style={styles.holdButtonBlur}
                  />

                  {/* SVG progress ring */}
                  <Svg
                    width={(RING_RADIUS + RING_STROKE) * 2 + 8}
                    height={(RING_RADIUS + RING_STROKE) * 2 + 8}
                    style={styles.svgRing}
                  >
                    {/* Track */}
                    <Circle
                      cx={RING_RADIUS + RING_STROKE + 4}
                      cy={RING_RADIUS + RING_STROKE + 4}
                      r={RING_RADIUS}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth={RING_STROKE}
                      fill="none"
                    />
                    {/* Fill */}
                    <AnimatedCircle
                      cx={RING_RADIUS + RING_STROKE + 4}
                      cy={RING_RADIUS + RING_STROKE + 4}
                      r={RING_RADIUS}
                      stroke="rgba(107,200,160,0.95)"
                      strokeWidth={RING_STROKE}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      animatedProps={animatedRingProps}
                      // Start at the top
                      transform={`rotate(-90 ${RING_RADIUS + RING_STROKE + 4} ${RING_RADIUS + RING_STROKE + 4})`}
                    />
                  </Svg>

                  {/* Center label */}
                  <View style={styles.holdButtonCenter}>
                    <Text style={styles.holdButtonLabel}>
                      {isHolding ? "Holding…" : "Hold"}
                    </Text>
                  </View>
                </Animated.View>
              </Pressable>

              {/* Release hint */}
              {hintVisible && (
                <Text style={styles.hint}>Hold until the ring completes</Text>
              )}

              {!isHolding && !hintVisible && (
                <Text style={styles.hint}>Press and hold for 5 seconds</Text>
              )}
            </View>
          )}

          {/* ── Blocked / no-unlocks close button (unified) ───────────── */}
          {showBlockedUI && !showSuccess && (
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
              <Text style={styles.closeButtonText}>
                {isBlocked ? "I understand, close" : "Got it, close"}
              </Text>
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
    fontFamily: "Lora-SemiBold",
    fontSize: 30,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: 0.2,
  },

  subheadline: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "rgba(255,255,255,0.68)",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  // ── Hold button ───────────────────────────────────────────────────────────
  buttonArea: {
    alignItems: "center",
    marginTop: 20,
    gap: 14,
  },

  holdButtonPressable: {
    alignItems: "center",
    justifyContent: "center",
  },

  holdButtonOuter: {
    width: (RING_RADIUS + RING_STROKE) * 2 + 24,
    height: (RING_RADIUS + RING_STROKE) * 2 + 24,
    alignItems: "center",
    justifyContent: "center",
  },

  holdButtonBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.18)",
  },

  svgRing: {
    position: "absolute",
  },

  holdButtonCenter: {
    alignItems: "center",
  },

  holdButtonLabel: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.5,
  },

  hint: {
    fontFamily: "Inter",
    fontSize: 13,
    color: "rgba(255,255,255,0.50)",
    textAlign: "center",
  },

  // ── Close / dismissed button ──────────────────────────────────────────────
  closeButton: {
    marginTop: 24,
    paddingVertical: 16,
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
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    letterSpacing: 0.3,
  },

  // ── Motivational quote (blocked / no-unlocks) ───────────────────────────
  quote: {
    fontFamily: "Lora",
    fontStyle: "italic",
    fontSize: 15,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
    marginTop: 4,
  },

  // ── Brand label ──────────────────────────────────────────────────────────
  brandLabel: {
    fontFamily: "Lora",
    fontSize: 13,
    color: "rgba(255,255,255,0.28)",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginTop: 8,
  },
});
