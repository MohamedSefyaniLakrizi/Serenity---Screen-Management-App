import { Button } from '@/components/ui';
import { spacing, typography } from '@/constants';
import { FONTS } from '@/constants/typography';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useOnboardingNext } from '@/hooks/useOnboardingNext';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import { ChevronLeft, Minus, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const MIN_HOURS = 1;
const MAX_HOURS = 16;

export default function StepDailyGoal() {
  const theme = useThemedColors();
  const { dailyLimitHours, updateData } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext('/onboarding/daily-goal');

  const [hours, setHours] = useState(dailyLimitHours ?? 2);

  const [screenFade, titleAnimation, subtitleAnimation, pickerAnimation, buttonAnimation] =
    useSequentialFadeIn(5, { duration: 300, stagger: 350 });

  const decrement = () => setHours((h) => Math.max(MIN_HOURS, h - 1));
  const increment = () => setHours((h) => Math.min(MAX_HOURS, h + 1));

  const handleContinue = () => {
    updateData({ dailyLimitHours: hours, dailyLimitMinutes: 0 });
    navigateNext();
  };

  const s = styles(theme);

  return (
    <Animated.View style={[s.container, screenFade]}>
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <StatusBar barStyle={theme.statusBar} />

        {/* ── Header: back + progress ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <ChevronLeft size={22} color={theme.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progressFraction * 100}%` }]} />
          </View>
        </View>

        {/* ── Content ── */}
        <View style={s.content}>
          <Animated.Text style={[s.title, titleAnimation]}>
            What's your daily screen time goal?
          </Animated.Text>
          <Animated.Text style={[s.subtitle, subtitleAnimation]}>
            Set a realistic target. You can always adjust it later.
          </Animated.Text>

          {/* ── Stepper ── */}
          <Animated.View style={[s.stepperWrapper, pickerAnimation]}>
            <TouchableOpacity
              style={[s.stepperBtn, hours <= MIN_HOURS && s.stepperBtnDisabled]}
              onPress={decrement}
              activeOpacity={0.7}
              disabled={hours <= MIN_HOURS}
            >
              <Minus size={22} color={hours <= MIN_HOURS ? theme.textSecondary : theme.primary} strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={s.stepperValue}>
              <Text style={s.stepperNumber}>{hours}</Text>
              <Text style={s.stepperUnit}>{hours === 1 ? 'hour' : 'hours'} / day</Text>
            </View>

            <TouchableOpacity
              style={[s.stepperBtn, hours >= MAX_HOURS && s.stepperBtnDisabled]}
              onPress={increment}
              activeOpacity={0.7}
              disabled={hours >= MAX_HOURS}
            >
              <Plus size={22} color={hours >= MAX_HOURS ? theme.textSecondary : theme.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── CTA ── */}
        <Animated.View style={[s.actions, buttonAnimation]}>
          <Button size="large" title="Set My Goal" onPress={handleContinue} />
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = (theme: ReturnType<typeof useThemedColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
    },
    backButton: {
      padding: spacing.xs,
    },
    progressTrack: {
      flex: 1,
      height: 6,
      backgroundColor: theme.surface,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 3,
    },

    // Content
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      alignItems: 'center',
    },
    title: {
      fontFamily: FONTS.loraBold,
      fontSize: typography.sizes.h1,
      color: theme.textPrimary,
      textAlign: 'center',
      lineHeight: typography.sizes.h1 * 1.25,
      marginBottom: spacing.sm,
      alignSelf: 'stretch',
    },
    subtitle: {
      fontFamily: FONTS.interRegular,
      fontSize: typography.sizes.bodyLarge,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: typography.sizes.bodyLarge * 1.55,
      marginBottom: spacing.xxl,
      alignSelf: 'stretch',
    },

    // Stepper
    stepperWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xl,
      marginTop: spacing.xl,
    },
    stepperBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: `${theme.primary}15`,
      borderWidth: 1.5,
      borderColor: `${theme.primary}40`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepperBtnDisabled: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    stepperValue: {
      alignItems: 'center',
      minWidth: 100,
    },
    stepperNumber: {
      fontFamily: FONTS.loraBold,
      fontSize: 72,
      lineHeight: 80,
      color: theme.textPrimary,
    },
    stepperUnit: {
      fontFamily: FONTS.interRegular,
      fontSize: typography.sizes.body,
      color: theme.textSecondary,
      marginTop: spacing.xs,
    },

    // CTA
    actions: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
  });
