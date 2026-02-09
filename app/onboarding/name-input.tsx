import { Button } from '@/components/ui';
import { spacing, typography } from '@/constants';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NameInput() {
  const theme = useThemedColors();
  const { updateData } = useOnboardingStore();
  const [name, setName] = useState('');
  
  const [screenFade, titleAnimation, subtitleAnimation, inputAnimation, buttonAnimation] = useSequentialFadeIn(5, { duration: 300, stagger: 400 });

  const handleContinue = () => {
    if (name.trim()) {
      updateData({ name: name.trim() });
      router.push('/onboarding/name-intro');
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
              <View style={[styles(theme).progressBarFill, { width: '5%' }]} />
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles(theme).keyboardView}
        >
          <ScrollView 
            style={styles(theme).scrollContent}
            contentContainerStyle={styles(theme).scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles(theme).content}>
              <Animated.Text style={[styles(theme).title, titleAnimation]}>
                What's your name?
              </Animated.Text>
              
              <Animated.Text style={[styles(theme).subtitle, subtitleAnimation]}>
                I'd love to know what to call you
              </Animated.Text>

              <Animated.View style={[styles(theme).inputContainer, inputAnimation]}>
                <TextInput
                  style={styles(theme).input}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                />
              </Animated.View>
            </View>
          </ScrollView>

          <Animated.View style={[styles(theme).actions, buttonAnimation]}>
            <Button
              title="Continue"
              onPress={handleContinue}
              disabled={!name.trim()}
            />
          </Animated.View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.body,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.body,
    color: theme.textPrimary,
    borderWidth: 2,
    borderColor: theme.border,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
