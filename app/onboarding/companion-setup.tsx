import { Button } from '@/components/ui';
import { spacing, typography } from '@/constants';
import { FONTS } from '@/constants/typography';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useAppStore } from '@/store/appStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

export default function Step10Complete() {
  const theme = useThemedColors();
  const [isCompleting, setIsCompleting] = useState(false);
  const { completeOnboarding, foxName, primaryGoal, dailyLimitHours, dailyLimitMinutes } = useOnboardingStore();
  const { initializeFox } = useAppStore();
  const [screenFade, foxImageAnimation, titleAnimation, subtitleAnimation, summaryAnimation, tipsAnimation, buttonAnimation] = useSequentialFadeIn(7, { duration: 300, stagger: 400 });

  const handleComplete = async () => {
    setIsCompleting(true);

    try {
      console.log('Completing onboarding...');
      
      // Initialize the fox in app store first
      if (foxName && primaryGoal) {
        initializeFox(foxName, primaryGoal);
      }

      // Save onboarding data to Supabase and mark as complete
      // This will also await the AsyncStorage.setItem calls
      const result = await completeOnboarding();

      if (result.success) {
        console.log('Onboarding completed successfully');
      } else {
        console.error('Error saving onboarding:', result.error);
      }

      console.log('✅ Onboarding complete, navigating to paywall.');
      router.replace('/paywall');
      
    } catch (error) {
      console.error('Unexpected error completing onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const getTotalMinutes = () => {
    return (dailyLimitHours || 0) * 60 + (dailyLimitMinutes || 0);
  };

  const formatTime = () => {
    const hours = dailyLimitHours || 0;
    const minutes = dailyLimitMinutes || 0;
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minutes`;
    }
  };

  return (
    <Animated.View style={[styles(theme).container, screenFade]}>
      <View style={styles(theme).content}>
        <Animated.View style={foxImageAnimation}>
        <Image
          source={require('../../assets/images/default_mascot.png')}
          style={styles(theme).foxImage}
          resizeMode="contain"
        />
        </Animated.View>

        <Animated.Text style={[styles(theme).title, titleAnimation]}>You're all set! 🎉</Animated.Text>
        <Animated.Text style={[styles(theme).subtitle, subtitleAnimation]}>
          {foxName} is excited to start this journey with you
        </Animated.Text>

        <Animated.View style={[styles(theme).summaryContainer, summaryAnimation]}>
          <View style={styles(theme).summaryItem}>
            <Text style={styles(theme).summaryLabel}>Your Goal</Text>
            <Text style={styles(theme).summaryValue}>
              {primaryGoal?.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Text>
          </View>

          <View style={styles(theme).summaryItem}>
            <Text style={styles(theme).summaryLabel}>Daily Limit</Text>
            <Text style={styles(theme).summaryValue}>{formatTime()}</Text>
          </View>

          <View style={styles(theme).summaryItem}>
            <Text style={styles(theme).summaryLabel}>Your Companion</Text>
            <Text style={styles(theme).summaryValue}>{foxName} 🦊</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles(theme).tipsContainer, tipsAnimation]}>
          <Text style={styles(theme).tipsTitle}>Tips to get started:</Text>
          <Text style={styles(theme).tipText}>• Check in with {foxName} daily</Text>
          <Text style={styles(theme).tipText}>• Set app limits for your most-used apps</Text>
          <Text style={styles(theme).tipText}>• Celebrate small wins and milestones</Text>
          <Text style={styles(theme).tipText}>• Be patient with yourself - change takes time</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles(theme).actions, buttonAnimation]}>
        <Button
          size="large"
          title={isCompleting ? 'Setting up...' : 'Start Your Journey'}
          onPress={handleComplete}
          disabled={isCompleting}
          loading={isCompleting}
        />
        {isCompleting && (
          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={styles(theme).loader}
          />
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = (theme: ReturnType<typeof useThemedColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  foxImage: {
    width: 200,
    height: 200,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: FONTS.loraBold,
    fontSize: typography.sizes.display1,
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    lineHeight: typography.sizes.display1 * 1.15,
  },
  subtitle: {
    fontFamily: FONTS.interRegular,
    fontSize: typography.sizes.bodyLarge,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.sizes.bodyLarge * 1.55,
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryItem: {
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: typography.small,
    color: theme.textTertiary,
    marginBottom: spacing.xs / 2,
  },
  summaryValue: {
    fontFamily: FONTS.interSemiBold,
    fontSize: typography.sizes.h2,
    color: theme.primary,
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: `${theme.secondary}20`,
    borderRadius: 12,
    padding: spacing.md,
  },
  tipsTitle: {
    fontFamily: FONTS.interSemiBold,
    fontSize: typography.sizes.body,
    color: theme.textPrimary,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: typography.small,
    color: theme.textPrimary,
    marginBottom: spacing.xs / 2,
    lineHeight: 20,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loader: {
    marginTop: spacing.sm,
  },
});
