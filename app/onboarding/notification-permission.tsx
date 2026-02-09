import { Button, Card } from '@/components/ui';
import { spacing, typography } from '@/constants';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Step5NotificationPermission() {
  const theme = useThemedColors();
  const { updateData } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [screenFade, emojiAnimation, titleAnimation, subtitleAnimation, cardAnimation, buttonAnimation] = useSequentialFadeIn(6, { duration: 300, stagger: 400 });

  const requestNotificationPermission = async () => {
    setIsLoading(true);
    
    try {
      if (Platform.OS === 'ios') {
        // Request notification permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus === 'granted') {
          updateData({ notificationsEnabled: true });
          router.push('/onboarding/app-selection');
        } else {
          Alert.alert(
            'Permission Required',
            'Serenity needs notification permission to send you mindful reminders and help you stay on track with your goals. This is essential for the app to work properly.',
            [
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
              {
                text: 'Try Again',
                onPress: requestNotificationPermission,
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert(
        'Error',
        'There was an error requesting notification access. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: requestNotificationPermission,
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
            <View style={[styles(theme).progressBarFill, { width: '50%' }]} />
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles(theme).scrollContent}
        contentContainerStyle={styles(theme).scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles(theme).content}>
        <Animated.Text style={[styles(theme).emoji, emojiAnimation]}>🔔</Animated.Text>
        <Animated.Text style={[styles(theme).title, titleAnimation]}>Stay mindful with reminders</Animated.Text>
        <Animated.Text style={[styles(theme).subtitle, subtitleAnimation]}>
          Get gentle notifications to help you pause and reflect
        </Animated.Text>

        <Animated.View style={cardAnimation}>
        <Card variant="outlined" style={styles(theme).infoCard}>
          <Text style={styles(theme).infoTitle}>How we use notifications:</Text>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).bulletPoint}>•</Text>
            <Text style={styles(theme).infoText}>
              Mindful pause reminders before opening blocked apps
            </Text>
          </View>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).bulletPoint}>•</Text>
            <Text style={styles(theme).infoText}>
              Daily check-ins to celebrate your progress
            </Text>
          </View>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).bulletPoint}>•</Text>
            <Text style={styles(theme).infoText}>
              Screen time limit alerts when you're close to your goal
            </Text>
          </View>
          <View style={styles(theme).infoItem}>
            <Text style={styles(theme).bulletPoint}>•</Text>
            <Text style={styles(theme).infoText}>
              Motivation from your fox companion
            </Text>
          </View>
        </Card>
        </Animated.View>

        <View style={styles(theme).requiredNote}>
          <Text style={styles(theme).requiredIcon}>⚠️</Text>
          <Text style={styles(theme).requiredText}>
            Notifications are required for Serenity to help you build healthier digital habits
          </Text>
        </View>
      </View>
      </ScrollView>

      <Animated.View style={[styles(theme).actions, buttonAnimation]}>
        <Button
          title={isLoading ? "Requesting Permission..." : "Enable Notifications"}
          onPress={requestNotificationPermission}
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
    paddingTop: spacing.xxl,
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
    marginBottom: spacing.lg,
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
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loader: {
    marginVertical: spacing.sm,
  },
});
