import { Button, Card } from '@/components/ui';
import { spacing, typography } from '@/constants';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Step9Analytics() {
  const theme = useThemedColors();
  const { analyticsEnabled, updateData } = useOnboardingStore();
  const [enabled, setEnabled] = useState(analyticsEnabled);
  const [screenFade, emojiAnimation, titleAnimation, subtitleAnimation, cardsAnimation, buttonAnimation] = useSequentialFadeIn(6, { duration: 300, stagger: 400 });

  const handleContinue = () => {
    updateData({ analyticsEnabled: enabled });
    router.push('/onboarding/companion-setup');
  };

  const toggleAnalytics = () => {
    setEnabled(!enabled);
  };

  return (
    <Animated.View style={[styles(theme).container, screenFade]}>
      <SafeAreaView style={styles(theme).safeArea} edges={['top']}>
      <StatusBar barStyle={theme.statusBar} />
      <View style={styles(theme).progressBarContainer}>
        <View style={styles(theme).progressBarWrapper}>
          <TouchableOpacity 
            style={styles(theme).backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles(theme).backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles(theme).progressBarBackground}>
            <View style={[styles(theme).progressBarFill, { width: '90%' }]} />
          </View>
        </View>
      </View>

      <View style={styles(theme).content}>
        <Animated.Text style={[styles(theme).emoji, emojiAnimation]}>📈</Animated.Text>
        <Animated.Text style={[styles(theme).title, titleAnimation]}>Help us improve Serenity</Animated.Text>
        <Animated.Text style={[styles(theme).subtitle, subtitleAnimation]}>
          Share anonymous usage data to help make the app better
        </Animated.Text>

        <Animated.View style={cardsAnimation}>
        <Card variant="outlined" style={styles(theme).analyticsCard}>
          <View style={styles(theme).switchRow}>
            <View style={styles(theme).switchContent}>
              <Text style={styles(theme).switchTitle}>Enable Analytics</Text>
              <Text style={styles(theme).switchSubtitle}>
                Help us understand how people use Serenity
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={toggleAnalytics}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={theme.textPrimary}
            />
          </View>
        </Card>

        <Card variant="outlined" style={styles(theme).infoCard}>
          <Text style={styles(theme).infoTitle}>What we collect:</Text>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).bulletPoint}>✓</Text>
            <Text style={styles(theme).infoText}>App usage patterns (when you open the app)</Text>
          </View>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).bulletPoint}>✓</Text>
            <Text style={styles(theme).infoText}>Feature usage (which screens you visit)</Text>
          </View>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).bulletPoint}>✓</Text>
            <Text style={styles(theme).infoText}>Device type and OS version</Text>
          </View>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).bulletPoint}>✗</Text>
            <Text style={styles(theme).infoText}>
              Personal information or screen time data
            </Text>
          </View>
        </Card>

        <View style={styles(theme).noteContainer}>
          <Text style={styles(theme).noteText}>
            🔒 All data is anonymous and never sold to third parties. You can change this anytime in Settings.
          </Text>
        </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles(theme).actions, buttonAnimation]}>
        <Button title="Continue" onPress={handleContinue} />
      </Animated.View>
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
  progressBarContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xl,
    backgroundColor: theme.background,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: 24,
    color: theme.textPrimary,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: theme.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  emoji: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  analyticsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchTitle: {
    fontSize: typography.h3,
    fontWeight: typography.semibold,
    color: theme.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  switchSubtitle: {
    fontSize: typography.small,
    color: theme.textSecondary,
  },
  infoCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: theme.textPrimary,
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: typography.small,
    color: theme.textTertiary,
    marginRight: spacing.sm,
    fontWeight: typography.bold,
  },
  infoText: {
    flex: 1,
    fontSize: typography.small,
    color: theme.textTertiary,
    lineHeight: 20,
  },
  noteContainer: {
    backgroundColor: `${theme.primary}10`,
    padding: spacing.md,
    borderRadius: 12,
  },
  noteText: {
    fontSize: typography.small,
    color: theme.textPrimary,
    lineHeight: 20,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
