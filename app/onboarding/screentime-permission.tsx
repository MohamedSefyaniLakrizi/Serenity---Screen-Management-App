import { Button } from '@/components/ui';
import { spacing, typography } from '@/constants';
import { FONTS } from '@/constants/typography';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useOnboardingNext } from '@/hooks/useOnboardingNext';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenTime from '../../utils/screentime';

const ANIMATION_SOURCE = require('../../assets/videos/Screentime-Animation.json');

export default function Step4ScreenTimePermission() {
  const theme = useThemedColors();
  const { updateData } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);
  const lottieRef = useRef<LottieView>(null);

  const { progressFraction } = useOnboardingNext('/onboarding/screentime-permission');
  const [screenFade, lottieAnimation, titleAnimation, subtitleAnimation, buttonAnimation] =
    useSequentialFadeIn(5, { duration: 300, stagger: 350 });

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
        [{ text: 'Try Again', onPress: requestScreenTimePermission }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const s = styles(theme);

  return (
    <Animated.View style={[s.container, screenFade]}>
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <StatusBar barStyle={theme.statusBar} />

        {/* ── Header: back + progress ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <ChevronLeft size={22} color={theme.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progressFraction * 100}%` }]} />
          </View>
        </View>

        {/* Spacer — pushes text block down toward the animation */}
        <View style={s.spacer} />

        {/* ── Text ── */}
        <View style={s.textBlock}>
          <Animated.Text style={[s.title, titleAnimation]}>
            Real app blocking
          </Animated.Text>
          <Animated.Text style={[s.subtitle, subtitleAnimation]}>
            Screen Time permission enables actual limits—not just tracking.
          </Animated.Text>
        </View>

        {/* ── Lottie animation ── */}
        <Animated.View style={[s.lottieWrapper, lottieAnimation]}>
          <LottieView
            ref={lottieRef}
            source={ANIMATION_SOURCE}
            style={s.lottie}
            autoPlay
            loop
          />
        </Animated.View>

        {/* ── CTA ── */}
        <Animated.View style={[s.actions, buttonAnimation]}>
          <Button
            size="large"
            title={isLoading ? 'Requesting…' : 'Enable Screen Time'}
            onPress={requestScreenTimePermission}
            disabled={isLoading}
            icon={isLoading ? undefined : <ShieldCheck size={18} color="#fff" strokeWidth={2} />}
          />
          {isLoading && (
            <ActivityIndicator size="small" color={theme.primary} style={s.loader} />
          )}
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = (theme: ReturnType<typeof useThemedColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
    },

    // Header
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

    // Spacer
    spacer: {
      flex: 1,
    },

    // Lottie
    lottieWrapper: {
      width: '85%',
      alignSelf: 'center' as const,
      aspectRatio: 1,
    },
    lottie: {
      width: '100%',
      aspectRatio: 1,
    },

    // Text
    textBlock: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.xs,
    },
    title: {
      fontFamily: FONTS.loraBold,
      fontSize: typography.sizes.h1,
      color: theme.textPrimary,
      textAlign: 'center',
      lineHeight: typography.sizes.h1 * 1.25,
    },
    subtitle: {
      fontFamily: FONTS.interRegular,
      fontSize: typography.sizes.bodyLarge,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: typography.sizes.bodyLarge * 1.55,
    },

    // CTA
    actions: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    loader: {
      marginTop: spacing.sm,
    },
  });
