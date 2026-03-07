import { Button } from '@/components/ui';
import { spacing, typography } from '@/constants';
import { FONTS } from '@/constants/typography';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useOnboardingNext } from '@/hooks/useOnboardingNext';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NameInput() {
  const theme = useThemedColors();
  const { updateData } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext('/onboarding/name-input');
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);
  
  const [screenFade, titleAnimation, subtitleAnimation, inputAnimation, buttonAnimation] = useSequentialFadeIn(5, { duration: 300, stagger: 400 });

  const handleContinue = () => {
    if (name.trim()) {
      updateData({ name: name.trim() });
      navigateNext();
    }
  };

  return (
    <Animated.View style={[styles(theme).container, screenFade]}>
      <SafeAreaView style={styles(theme).safeArea} edges={['top']}>
        <StatusBar barStyle={theme.statusBar} />
        
        {/* Header */}
        <View style={styles(theme).header}>
          <TouchableOpacity style={styles(theme).backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <ChevronLeft size={22} color={theme.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles(theme).progressTrack}>
            <View style={[styles(theme).progressFill, { width: `${progressFraction * 100}%` }]} />
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
                  ref={inputRef}
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
              size="large"
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
    fontFamily: FONTS.loraBold,
    fontSize: typography.sizes.h1,
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.sizes.h1 * 1.25,
  },
  subtitle: {
    fontFamily: FONTS.interRegular,
    fontSize: typography.sizes.bodyLarge,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: typography.sizes.bodyLarge * 1.55,
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
    fontFamily: FONTS.interRegular,
    fontSize: typography.sizes.bodyLarge,
    color: theme.textPrimary,
    borderWidth: 2,
    borderColor: theme.border,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
