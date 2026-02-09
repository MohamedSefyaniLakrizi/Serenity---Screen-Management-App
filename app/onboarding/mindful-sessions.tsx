import { spacing, typography } from '@/constants';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Intro3() {
  const theme = useThemedColors();
  const [screenFade, titleAnimation, iconAnimation, subtitleAnimation, buttonAnimation] = useSequentialFadeIn(5, { duration: 300, stagger: 400 });

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
            <View style={[styles(theme).progressBarFill, { width: '30%' }]} />
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles(theme).scrollContent}
        contentContainerStyle={styles(theme).scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles(theme).content}>
        <Animated.Text style={[styles(theme).title, titleAnimation]}>Split up your screentime</Animated.Text>
        
        {/* Icon placeholder */}
        <Animated.View style={[styles(theme).iconContainer, iconAnimation]}>
          <Text style={styles(theme).icon}>⏰</Text>
        </Animated.View>
        
        <Animated.Text style={[styles(theme).subtitle, subtitleAnimation]}>into mindful sessions</Animated.Text>
      </View>
      </ScrollView>

      {/* Next button */}
      <View style={styles(theme).actions}>
        <Animated.View style={buttonAnimation}>
        <TouchableOpacity 
          style={styles(theme).button}
          onPress={() => router.push('/onboarding/screentime-permission')}
          activeOpacity={0.8}
        >
          <Text style={styles(theme).buttonText}>Next</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: typography.semibold,
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  iconContainer: {
    marginBottom: spacing.xxl,
  },
  icon: {
    fontSize: 80,
  },
  subtitle: {
    fontSize: typography.h3,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  button: {
    backgroundColor: theme.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: typography.semibold,
    color: '#FFFFFF',
  },
});
