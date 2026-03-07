import { borderRadius, spacing, typography } from '@/constants';
import { FONTS } from '@/constants/typography';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useOnboardingNext } from '@/hooks/useOnboardingNext';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const usageOptions = [
  { id: 'under-3', label: 'Under 3 hours', description: 'Light user' },
  { id: '3-5',     label: '3–5 hours',     description: 'Moderate user' },
  { id: '5-7',     label: '5–7 hours',     description: 'Heavy user' },
  { id: '7-9',     label: '7–9 hours',     description: 'Very heavy user' },
  { id: '9+',      label: '9+ hours',      description: 'Extreme user' },
];

export default function StepPhoneUsage() {
  const theme = useThemedColors();
  const { updateData } = useOnboardingStore() as any;
  const { navigateNext, progressFraction } = useOnboardingNext('/onboarding/phone-usage');

  const [screenFade, titleAnimation, subtitleAnimation, optionsAnimation] =
    useSequentialFadeIn(4, { duration: 300, stagger: 350 });

  const handleSelect = (id: string) => {
    updateData({ currentDailyUsageRange: id });
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
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.Text style={[s.title, titleAnimation]}>
            How many hours do you use your phone right now?
          </Animated.Text>
          <Animated.Text style={[s.subtitle, subtitleAnimation]}>
            Be honest — this helps us set the right starting point for you.
          </Animated.Text>

          <Animated.View style={[s.optionsContainer, optionsAnimation]}>
            {usageOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={s.optionCard}
                onPress={() => handleSelect(option.id)}
                activeOpacity={0.65}
              >
                <Text style={s.optionLabel}>{option.label}</Text>
                <Text style={s.optionDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </ScrollView>

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
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    title: {
      fontFamily: FONTS.loraBold,
      fontSize: typography.sizes.h1,
      color: theme.textPrimary,
      lineHeight: typography.sizes.h1 * 1.25,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontFamily: FONTS.interRegular,
      fontSize: typography.sizes.bodyLarge,
      color: theme.textSecondary,
      lineHeight: typography.sizes.bodyLarge * 1.55,
      marginBottom: spacing.xl,
    },

    // Options
    optionsContainer: {
      gap: spacing.sm,
    },
    optionCard: {
      backgroundColor: theme.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.medium,
      borderWidth: 2,
      borderColor: theme.border,
    },
    optionLabel: {
      fontFamily: FONTS.interSemiBold,
      fontSize: typography.sizes.body,
      color: theme.textPrimary,
      marginBottom: 2,
    },
    optionDescription: {
      fontFamily: FONTS.interRegular,
      fontSize: typography.sizes.small,
      color: theme.textSecondary,
    },
  });
