import { spacing, typography } from '@/constants';
import { FONTS } from '@/constants/typography';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useOnboardingNext } from '@/hooks/useOnboardingNext';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Intro3() {
  const theme = useThemedColors();
  const { navigateNext, progressFraction } = useOnboardingNext('/onboarding/mindful-sessions');
  const [screenFade, titleAnimation, iconAnimation, subtitleAnimation, buttonAnimation] = useSequentialFadeIn(5, { duration: 300, stagger: 400 });

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
          onPress={() => navigateNext()}
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
    marginBottom: spacing.xxl,
    lineHeight: typography.sizes.h1 * 1.25,
  },
  iconContainer: {
    marginBottom: spacing.xxl,
  },
  icon: {
    fontSize: 80,
  },
  subtitle: {
    fontFamily: FONTS.interRegular,
    fontSize: typography.sizes.bodyLarge,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.bodyLarge * 1.55,
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
    fontFamily: FONTS.loraBold,
    fontSize: typography.sizes.h3,
    color: '#FFFFFF',
  },
});
