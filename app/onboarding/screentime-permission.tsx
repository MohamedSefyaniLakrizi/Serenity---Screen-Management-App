import { Button, Card } from '@/components/ui';
import { spacing, typography } from '@/constants';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenTime from '../../utils/screentime';

export default function Step4ScreenTimePermission() {
  const theme = useThemedColors();
  const { updateData } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [screenFade, emojiAnimation, titleAnimation, subtitleAnimation, cardAnimation, buttonAnimation] = useSequentialFadeIn(6, { duration: 300, stagger: 400 });

  const requestScreenTimePermission = async () => {
    setIsLoading(true);
    
    try {
      const granted = await ScreenTime.requestAuthorization();
      
      if (granted) {
        updateData({ screenTimePermissionGranted: true });
      } 
      router.push('/onboarding/notification-permission');
    } catch (error) {
      console.error('Error requesting Screen Time permission:', error);
      Alert.alert(
        'Error',
        'There was an error requesting Screen Time access. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: requestScreenTimePermission,
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View style={[styles(theme).container, screenFade]}>
      <SafeAreaView style={styles(theme).safeArea} edges={['top']}>
      <StatusBar barStyle={theme.statusBar} />
      
      {/* Progress bar */}
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
            <View style={[styles(theme).progressBarFill, { width: '40%' }]} />
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles(theme).scrollContent}
        contentContainerStyle={styles(theme).scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles(theme).content}>
        <Animated.Text style={[styles(theme).emoji, emojiAnimation]}>📊</Animated.Text>
        <Animated.Text style={[styles(theme).title, titleAnimation]}>First, allow Screen Time</Animated.Text>
        <Animated.Text style={[styles(theme).subtitle, subtitleAnimation]}>
          To limit your distracting apps, Serenity requires your permission
        </Animated.Text>

        <Animated.View style={cardAnimation}>
        <Card variant="outlined" style={styles(theme).infoCard}>
          <Text style={styles(theme).infoTitle}>What Serenity can do:</Text>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).bulletPoint}>•</Text>
            <Text style={styles(theme).infoText}>
              Track which apps you use and for how long
            </Text>
          </View>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).bulletPoint}>•</Text>
            <Text style={styles(theme).infoText}>
              Show a mindful pause screen before opening blocked apps
            </Text>
          </View>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).bulletPoint}>•</Text>
            <Text style={styles(theme).infoText}>
              Help you set and maintain daily usage limits
            </Text>
          </View>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).bulletPoint}>•</Text>
            <Text style={styles(theme).infoText}>
              Provide insights on your digital wellness progress
            </Text>
          </View>
        </Card>
        </Animated.View>

        <View style={styles(theme).privacyNote}>
          <Text style={styles(theme).privacyIcon}>🔒</Text>
          <Text style={styles(theme).privacyText}>
            Your data stays on your device and is protected by Apple's privacy framework
          </Text>
        </View>

        <View style={styles(theme).requiredNote}>
          <Text style={styles(theme).requiredIcon}>⚠️</Text>
          <Text style={styles(theme).requiredText}>
            Screen Time permission is required for Serenity to function
          </Text>
        </View>
      </View>
      </ScrollView>

      <Animated.View style={[styles(theme).actions, buttonAnimation]}>
        <Button
          title={isLoading ? "Requesting Permission..." : "Continue"}
          onPress={requestScreenTimePermission}
          disabled={isLoading}
        />

        {isLoading && (
          <ActivityIndicator 
            size="small" 
            color={theme.primary} 
            style={styles(theme).loader}
          />
        )}
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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  emoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: spacing.lg,
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
  infoCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: theme.surface,
    borderColor: theme.border,
  },
  infoTitle: {
    fontSize: typography.h3,
    fontWeight: typography.semibold,
    color: theme.textPrimary,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: typography.body,
    color: theme.primary,
    marginRight: spacing.sm,
    fontWeight: typography.bold,
  },
  infoText: {
    flex: 1,
    fontSize: typography.body,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: `${theme.success}15`,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: typography.small,
    color: theme.textPrimary,
    lineHeight: 20,
  },
  requiredNote: {
    flexDirection: 'row',
    backgroundColor: `${theme.primary}15`,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  requiredIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  requiredText: {
    flex: 1,
    fontSize: typography.small,
    color: theme.textPrimary,
    lineHeight: 20,
    fontWeight: typography.semibold,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loader: {
    marginVertical: spacing.sm,
  },
});
