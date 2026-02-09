import { spacing, typography } from '@/constants';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const theme = useThemedColors();
  
  // Sequential fade-in animations for all elements
  const [screenFade, mascotAnim, headingAnim, subtitleAnim, descriptionAnim, buttonAnim] = useSequentialFadeIn(6, { duration: 400, stagger: 400 });
  
  // Breathing animation for mascot
  const breathingScale = useSharedValue(1);

  useEffect(() => {
    breathingScale.value = withRepeat(
      withTiming(1.05, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingScale.value }],
  }));

  return (
    <SafeAreaView style={styles(theme).container} edges={['top', 'bottom']}>
      <StatusBar barStyle={theme.statusBar} />
      
      <Animated.View style={[styles(theme).content, screenFade]}>
        {/* Fox Mascot */}
        <Animated.View style={[styles(theme).mascotContainer, mascotAnim]}>
          <Animated.Image
            source={require('../../assets/images/default_mascot.png')}
            style={[
              styles(theme).mascot,
              breathingStyle,
            ]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text Content */}
        <View style={styles(theme).textContent}>
          <Animated.Text style={[styles(theme).heading, headingAnim]}>Hey, I'm Serenity!</Animated.Text>
          
          <Animated.Text style={[styles(theme).subtitle, subtitleAnim]}>
            I'm here to help you in your everyday life!
          </Animated.Text>
          
          <Animated.Text style={[styles(theme).description, descriptionAnim]}>
            Let's start your journey to take back control of your life
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Button */}
      <Animated.View style={[styles(theme).actions, buttonAnim]}>
        <TouchableOpacity 
          style={styles(theme).button} 
          activeOpacity={0.8}
          onPress={() => router.push('/onboarding/name-input')}
        >
          <Text style={styles(theme).buttonText}>Let's get started</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = (theme: ReturnType<typeof useThemedColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  mascot: {
    width: 250,
    height: 250,
  },
  textContent: {
    alignItems: 'center',
  },
  heading: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: theme.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.body,
    fontWeight: typography.medium,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.body,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  button: {
    backgroundColor: theme.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: typography.bold,
  },
});