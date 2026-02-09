import { Button } from '@/components/ui';
import { spacing, typography } from '@/constants';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SolutionContent {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

const allSolutions: SolutionContent[] = [
  {
    id: 'too-much-time',
    emoji: '⏱️',
    title: 'Smart App Limits',
    description: 'Take back control. Set limits that actually stick, with gentle nudges that keep you on track without feeling restrictive.',
  },
  {
    id: 'difficulty-focusing',
    emoji: '🎯',
    title: 'Focus Mode',
    description: 'Eliminate distractions instantly. Lock out tempting apps until your work is done, no willpower required.',
  },
  {
    id: 'poor-sleep',
    emoji: '🌙',
    title: 'Bedtime Protection',
    description: 'Sleep better tonight. Automatically block late-night scrolling so you wake up refreshed, not regretful.',
  },
  {
    id: 'missing-moments',
    emoji: '✨',
    title: 'Time Reclaimed Insights',
    description: 'Watch your life expand. See exactly how many hours you\'ve reclaimed for the things that truly matter.',
  },
  {
    id: 'anxious-stressed',
    emoji: '💚',
    title: 'Mindful Progress Tracking',
    description: 'Progress without pressure. Compassionate insights that celebrate wins and guide growth—no shame, just support.',
  },
  {
    id: 'procrastinating',
    emoji: '🤔',
    title: 'Intentional Pauses',
    description: 'Break the scroll trap. A simple pause before each app opening transforms mindless taps into conscious choices.',
  },
];

export default function SolutionPreview() {
  const theme = useThemedColors();
  const { primaryProblem, name } = useOnboardingStore();
  
  const [screenFade, headerAnimation, primaryCardAnimation, secondaryCard1Animation, secondaryCard2Animation, buttonAnimation] = useSequentialFadeIn(6, { duration: 300, stagger: 400 });

  // Get primary solution
  const primarySolution = allSolutions.find(s => s.id === primaryProblem) || allSolutions[0];
  
  // Get two other solutions (not the selected one)
  const otherSolutions = allSolutions.filter(s => s.id !== primaryProblem);
  const secondarySolutions = otherSolutions.slice(0, 2);

  // Format date
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', options);

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
              <View style={[styles(theme).progressBarFill, { width: '12%' }]} />
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles(theme).scrollContent}
          contentContainerStyle={styles(theme).scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles(theme).content}>
            {/* Header Card */}
            <Animated.View style={[styles(theme).headerCard, headerAnimation]}>
              <Text style={styles(theme).headerCardText}>
                <Text style={styles(theme).headerHighlight}>Thousands</Text> have been exactly where you are. Here's how Serenity helps you <Text style={styles(theme).headerHighlight}>break free</Text>:
              </Text>
            </Animated.View>

            {/* Primary Solution Card - Larger */}
            <Animated.View style={[styles(theme).primaryCard, primaryCardAnimation]}>
              <View style={styles(theme).forYouBadge}>
                <Text style={styles(theme).forYouText}>✨ For You</Text>
              </View>
              <View style={styles(theme).cardContent}>
                <Text style={styles(theme).secondaryEmoji}>{primarySolution.emoji}</Text>
                <View style={styles(theme).primaryTextContainer}>
                  <Text style={styles(theme).primaryTitle}>{primarySolution.title}</Text>
                  <Text style={styles(theme).primaryDescription}>{primarySolution.description}</Text>
                </View>
              </View>
            </Animated.View>

            {/* Secondary Solution Cards - Smaller */}
            <View style={styles(theme).secondaryCardsContainer}>
              {secondarySolutions.map((solution, index) => (
                <Animated.View 
                  key={solution.id}
                  style={[
                    styles(theme).secondaryCard,
                    index === 0 ? secondaryCard1Animation : secondaryCard2Animation
                  ]}
                >
                  
                  <View style={styles(theme).secondaryCardContent}>
                    <Text style={styles(theme).secondaryEmoji}>{solution.emoji}</Text>
                    <View style={styles(theme).secondaryTextContainer}>
                      <Text style={styles(theme).secondaryTitle}>{solution.title}</Text>
                      <Text style={styles(theme).secondaryDescription}>
                        {solution.description}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        </ScrollView>

        <Animated.View style={[styles(theme).actions, buttonAnimation]}>
          <Button
            title="Begin My Transformation"
            onPress={() => router.push('/onboarding/stats-intro')}
          />
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
    paddingBottom: spacing.xxl,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  greeting: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: typography.body,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  // Header Card
  headerCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderBlockColor: theme.primary,
    borderColor: theme.primary,
    borderWidth: 2,
  },
  headerCardText: {
    fontSize: typography.h3,
    fontWeight: typography.medium,
    color: theme.textPrimary,
    lineHeight: 26,
    textAlign: 'center',
  },
  headerHighlight: {
    fontWeight: "900",
    color: theme.primary,
  },
  // Primary Card (iOS notification style)
  primaryCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  forYouBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  forYouText: {
    fontSize: typography.small,
    fontWeight: typography.bold,
    color: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  appIconEmoji: {
    fontSize: 24,
  },
  cardHeaderText: {
    flex: 1,
  },
  appName: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: theme.textPrimary,
  },
  timestamp: {
    fontSize: typography.small,
    color: theme.textTertiary,
    marginTop: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  primaryEmoji: {
    fontSize: 48,
    marginTop: 4,
  },
  primaryTextContainer: {
    flex: 1,
  },
  primaryTitle: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: theme.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  primaryDescription: {
    fontSize: typography.small,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  // Secondary Cards Container
  secondaryCardsContainer: {
    gap: spacing.md,
  },
  secondaryCard: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  appIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  appIconEmojiSmall: {
    fontSize: 18,
  },
  appNameSmall: {
    fontSize: typography.small,
    fontWeight: typography.semibold,
    color: theme.textPrimary,
  },
  timestampSmall: {
    fontSize: 12,
    color: theme.textTertiary,
    marginTop: 1,
  },
  secondaryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  secondaryEmoji: {
    fontSize: 32,
  },
  secondaryTextContainer: {
    flex: 1,
  },
  secondaryTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: theme.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  secondaryDescription: {
    fontSize: typography.small,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
