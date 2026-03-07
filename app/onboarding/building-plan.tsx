import { spacing, typography } from '@/constants';
import { FONTS } from '@/constants/typography';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useAppStore } from '@/store/appStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import { Check, Sparkles } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Config ───────────────────────────────────────────────────────────────────

const STEPS: { label: string; sublabel: string }[] = [
  { label: 'Analyzing usage patterns',    sublabel: 'Reviewing your daily habits' },
  { label: 'Calibrating blocker intensity', sublabel: 'Tuning limits to your goals' },
  { label: 'Finalizing your schedule',    sublabel: 'Almost ready' },
];

const STEP_TIMINGS = [0, 1800, 3600];   // when each step becomes "active"
const DONE_TIMINGS  = [1600, 3400, 5200]; // when each step ticks "done"
const REDIRECT_MS   = 5800;

// ─── Step card component ──────────────────────────────────────────────────────

function StepCard({
  label,
  sublabel,
  state,
  theme,
  delay,
}: {
  label: string;
  sublabel: string;
  state: 'pending' | 'active' | 'done';
  theme: ReturnType<typeof useThemedColors>;
  delay: number;
}) {
  const opacity   = useSharedValue(0);
  const translateY = useSharedValue(12);
  const barWidth  = useSharedValue(0);

  // fade-in on mount
  useEffect(() => {
    opacity.value    = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 120 }));
  }, []);

  // bar fill when active
  useEffect(() => {
    if (state === 'active') {
      barWidth.value = withTiming(100, { duration: DONE_TIMINGS[STEPS.findIndex(s => s.label === label)] - STEP_TIMINGS[STEPS.findIndex(s => s.label === label)] - 100 });
    }
    if (state === 'done') {
      barWidth.value = withTiming(100, { duration: 200 });
    }
  }, [state]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%` as any,
  }));

  const isDone   = state === 'done';
  const isActive = state === 'active';

  return (
    <Animated.View
      style={[
        styles(theme).card,
        isDone   && styles(theme).cardDone,
        isActive && styles(theme).cardActive,
        wrapStyle,
      ]}
    >
      <View style={styles(theme).cardLeft}>
        <View style={[
          styles(theme).iconBox,
          isDone   && { backgroundColor: theme.primary },
          isActive && { backgroundColor: theme.primaryLight + '33' },
          !isDone && !isActive && { backgroundColor: theme.surfaceSecondary },
        ]}>
          {isDone
            ? <Check size={13} color="#fff" strokeWidth={2.5} />
            : <View style={[styles(theme).dot, { backgroundColor: isActive ? theme.primary : theme.textMuted }]} />
          }
        </View>
      </View>

      <View style={styles(theme).cardBody}>
        <Text style={[
          styles(theme).cardLabel,
          { color: isDone || isActive ? theme.textPrimary : theme.textTertiary },
        ]}>
          {label}
        </Text>

        <Text style={[styles(theme).cardSublabel, { color: theme.textSecondary, opacity: isDone || isActive ? 1 : 0 }]}>
          {sublabel}
        </Text>

        <View style={[styles(theme).progressTrack, { backgroundColor: theme.border, opacity: isActive ? 1 : 0 }]}>
          <Animated.View style={[styles(theme).progressFill, { backgroundColor: theme.primary }, barStyle]} />
        </View>
      </View>

      <Text style={[styles(theme).doneLabel, { color: theme.primary, opacity: isDone ? 1 : 0 }]}>Done</Text>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BuildingPlanScreen() {
  const theme = useThemedColors();
  const { completeOnboarding, foxName, primaryGoal } = useOnboardingStore();
  const { initializeFox } = useAppStore();

  // -1 = nothing started yet; 0/1/2 = that index is active; 3 = all done
  const [activeIndex, setActiveIndex] = useState(-1);
  const [doneUpTo, setDoneUpTo]       = useState(-1);
  const mountedRef = useRef(true);

  const titleOpacity    = useSharedValue(0);
  const titleTranslateY = useSharedValue(16);

  useEffect(() => {
    titleOpacity.value    = withDelay(100, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(100, withSpring(0, { damping: 16, stiffness: 110 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  useEffect(() => {
    mountedRef.current = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEP_TIMINGS.forEach((t, i) => {
      timers.push(setTimeout(() => mountedRef.current && setActiveIndex(i), t));
    });
    DONE_TIMINGS.forEach((t, i) => {
      timers.push(setTimeout(() => mountedRef.current && setDoneUpTo(i), t));
    });

    const redirect = setTimeout(async () => {
      try {
        if (foxName && primaryGoal) initializeFox(foxName, primaryGoal);
        await completeOnboarding();
      } catch (err) {
        console.error('building-plan completion error:', err);
      } finally {
        if (mountedRef.current) router.replace('/paywall');
      }
    }, REDIRECT_MS);

    timers.push(redirect);
    return () => {
      mountedRef.current = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  const getState = (i: number): 'pending' | 'active' | 'done' => {
    if (doneUpTo >= i)   return 'done';
    if (activeIndex === i) return 'active';
    return 'pending';
  };

  return (
    <SafeAreaView style={styles(theme).container} edges={['top', 'bottom']}>
      <StatusBar barStyle={theme.statusBar} />

      <View style={styles(theme).inner}>

        {/* Icon badge */}
        <View style={[styles(theme).badge, { backgroundColor: theme.primaryLight + '22', borderColor: theme.primaryLight + '55' }]}>
          <Sparkles size={22} color={theme.primary} />
        </View>

        {/* Headline */}
        <Animated.View style={titleStyle}>
          <Text style={[styles(theme).title, { color: theme.textPrimary }]}>
            Building your{'\n'}personal plan
          </Text>
          <Text style={[styles(theme).subtitle, { color: theme.textSecondary }]}>
            This only takes a moment
          </Text>
        </Animated.View>

        {/* Steps */}
        <View style={styles(theme).steps}>
          {STEPS.map((step, i) => (
            <StepCard
              key={step.label}
              label={step.label}
              sublabel={step.sublabel}
              state={getState(i)}
              theme={theme}
              delay={200 + i * 120}
            />
          ))}
        </View>

      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = (theme: ReturnType<typeof useThemedColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    inner: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      justifyContent: 'center',
      gap: spacing.lg,
    },
    badge: {
      alignSelf: 'flex-start',
      width: 48,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    title: {
      fontFamily: FONTS.loraBold,
      fontSize: typography.sizes.h1,
      lineHeight: 36,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontFamily: FONTS.interRegular,
      fontSize: typography.sizes.body,
      marginTop: 6,
    },
    steps: {
      gap: spacing.sm,
    },
    // ── Card
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    cardActive: {
      borderColor: theme.primary + '55',
      backgroundColor: theme.primaryLight + '0D',
    },
    cardDone: {
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    cardLeft: {
      paddingTop: 2,
    },
    iconBox: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    cardBody: {
      flex: 1,
      gap: 4,
    },
    cardLabel: {
      fontFamily: FONTS.interSemiBold,
      fontSize: typography.sizes.body,
      lineHeight: 20,
    },
    cardSublabel: {
      fontFamily: FONTS.interRegular,
      fontSize: typography.sizes.caption,
      lineHeight: 16,
    },
    progressTrack: {
      height: 3,
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 6,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    doneLabel: {
      fontFamily: FONTS.interMedium,
      fontSize: typography.sizes.caption,
      alignSelf: 'center',
    },
  });