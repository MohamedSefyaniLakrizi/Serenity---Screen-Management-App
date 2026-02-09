import { Button, Input } from '@/components/ui';
import { spacing, typography } from '@/constants';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Step8Motivation() {
  const theme = useThemedColors();
  const { reasonForChange, updateData } = useOnboardingStore();
  const [reason, setReason] = useState(reasonForChange || '');
  const [screenFade, titleAnimation, subtitleAnimation, inputAnimation, suggestionsAnimation, buttonAnimation] = useSequentialFadeIn(6, { duration: 300, stagger: 400 });

  const handleContinue = () => {
    updateData({ reasonForChange: reason.trim() || null });
    router.push('/onboarding/analytics-opt-in');
  };

  const quickReasons = [
    'I want more free time',
    'I feel addicted to my phone',
    'I want to be more present',
    'I want better sleep',
    'I want to reduce anxiety',
  ];

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
            <View style={[styles(theme).progressBarFill, { width: '80%' }]} />
          </View>
        </View>
      </View>

      <View style={styles(theme).content}>
        <Animated.Text style={[styles(theme).title, titleAnimation]}>Why do you want to change?</Animated.Text>
        <Animated.Text style={[styles(theme).subtitle, subtitleAnimation]}>
          Understanding your motivation helps us support you better (optional)
        </Animated.Text>

        <Animated.View style={inputAnimation}>
        <Input
          value={reason}
          onChangeText={setReason}
          placeholder="I want to reduce my screen time because..."
          multiline
          numberOfLines={4}
          style={styles(theme).textArea}
        />
        </Animated.View>

        <Animated.View style={suggestionsAnimation}>
        <Text style={styles(theme).suggestionsLabel}>Quick suggestions:</Text>
        <View style={styles(theme).suggestionsContainer}>
          {quickReasons.map((suggestion) => (
            <Button
              key={suggestion}
              title={suggestion}
              variant="secondary"
              size="small"
              fullWidth={false}
              onPress={() => setReason(suggestion)}
              style={styles(theme).suggestionButton}
            />
          ))}
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
    backgroundColor: '#444',
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
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: theme.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body,
    color: theme.textSecondary,
    marginBottom: spacing.xl,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  suggestionsLabel: {
    fontSize: typography.small,
    fontWeight: typography.medium,
    color: theme.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionButton: {
    marginBottom: spacing.xs,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
