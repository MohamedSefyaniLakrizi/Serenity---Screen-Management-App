import { borderRadius, spacing, typography } from '@/constants';
import { FONTS } from '@/constants/typography';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useOnboardingNext } from '@/hooks/useOnboardingNext';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const timeOptions = [
  { id: 'morning', label: 'Morning', emoji: '🌅', time: '6 AM - 12 PM' },
  { id: 'afternoon', label: 'Afternoon', emoji: '☀️', time: '12 PM - 6 PM' },
  { id: 'evening', label: 'Evening', emoji: '🌆', time: '6 PM - 10 PM' },
  { id: 'night', label: 'Late Night', emoji: '🌙', time: '10 PM - 2 AM' },
  { id: 'all-day', label: 'Throughout the Day', emoji: '⏰', time: 'All times' },
];

export default function Step7UsagePatterns() {
  const theme = useThemedColors();
  const { whenUsePhoneMost, updateData } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext('/onboarding/usage-patterns');
  const [selected, setSelected] = useState(whenUsePhoneMost);
  const [screenFade, titleAnimation, subtitleAnimation, optionsAnimation] = useSequentialFadeIn(4, { duration: 300, stagger: 400 });

  const handleSelect = (id: string) => {
    setSelected(id as any);
    updateData({ whenUsePhoneMost: id as any });
    setTimeout(() => navigateNext(), 300);
  };

  return (
    <Animated.View style={[styles(theme).container, screenFade]}>
      <SafeAreaView style={styles(theme).safeArea} edges={['top']}>
      <StatusBar barStyle={theme.statusBar} />
      <View style={styles(theme).header}>
        <TouchableOpacity style={styles(theme).backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={theme.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles(theme).progressTrack}>
          <View style={[styles(theme).progressFill, { width: `${progressFraction * 100}%` }]} />
        </View>
      </View>

      <View style={styles(theme).content}>
        <Animated.Text style={[styles(theme).title, titleAnimation]}>When do you use your phone most?</Animated.Text>
        <Animated.Text style={[styles(theme).subtitle, subtitleAnimation]}>
          This helps us send reminders at the right time
        </Animated.Text>

        <Animated.View style={[styles(theme).optionsContainer, optionsAnimation]}>
          {timeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles(theme).optionCard,
                selected === option.id && styles(theme).optionCardSelected,
              ]}
              onPress={() => handleSelect(option.id)}
              activeOpacity={0.7}
            >
              <Text style={styles(theme).optionEmoji}>{option.emoji}</Text>
              <View style={styles(theme).optionContent}>
                <Text style={styles(theme).optionLabel}>{option.label}</Text>
                <Text style={styles(theme).optionTime}>{option.time}</Text>
              </View>
              {selected === option.id && (
                <View style={styles(theme).checkmark}>
                  <Text style={styles(theme).checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

      </SafeAreaView>
    </Animated.View>
  );
}

const styles = (theme: ReturnType<typeof useThemedColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
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
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: {
    fontFamily: FONTS.loraBold,
    fontSize: typography.sizes.h1,
    color: theme.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: typography.sizes.h1 * 1.25,
  },
  subtitle: {
    fontFamily: FONTS.interRegular,
    fontSize: typography.sizes.bodyLarge,
    color: theme.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: typography.sizes.bodyLarge * 1.55,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 2,
    borderColor: theme.border,
  },
  optionCardSelected: {
    borderColor: theme.primary,
    backgroundColor: `${theme.primary}10`,
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: FONTS.interSemiBold,
    fontSize: typography.sizes.h3,
    color: theme.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  optionTime: {
    fontFamily: FONTS.interRegular,
    fontSize: typography.sizes.caption,
    color: theme.textSecondary,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: theme.textPrimary,
    fontSize: typography.body,
    fontWeight: typography.bold,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
