import { spacing, typography } from '@/constants';
import { FONTS } from '@/constants/typography';
import { useSequentialFadeIn } from '@/hooks/useOnboardingAnimation';
import { useOnboardingNext } from '@/hooks/useOnboardingNext';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { useOnboardingStore } from '@/store/onboardingStore';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type ProblemType = 
  | 'too-much-time'
  | 'difficulty-focusing'
  | 'poor-sleep'
  | 'missing-moments'
  | 'anxious-stressed'
  | 'procrastinating';

interface ProblemOption {
  id: ProblemType;
  emoji: string;
  title: string;
}

const problems: ProblemOption[] = [
  {
    id: 'too-much-time',
    emoji: '📱',
    title: 'Spending too much time on distracting apps (social media, games, etc.)',
  },
  {
    id: 'difficulty-focusing',
    emoji: '🎯',
    title: 'Difficulty focusing on important tasks due to phone interruptions',
  },
  {
    id: 'poor-sleep',
    emoji: '😴',
    title: 'Poor sleep quality from late-night scrolling',
  },
  {
    id: 'missing-moments',
    emoji: '🌅',
    title: 'Missing out on real-life moments while on the phone',
  },
  {
    id: 'anxious-stressed',
    emoji: '😰',
    title: 'Feeling anxious or stressed about screen time habits',
  },
  {
    id: 'procrastinating',
    emoji: '⏰',
    title: 'Procrastinating by defaulting to phone use',
  },
];

export default function ProblemSelection() {
  const theme = useThemedColors();
  const { updateData } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext('/onboarding/problem-selection');
  const [selectedProblem, setSelectedProblem] = useState<ProblemType | null>(null);
  
  const animations = useSequentialFadeIn(3 + problems.length, { duration: 300, stagger: 400 });
  const [screenFade, titleAnimation, subtitleAnimation, ...problemAnimations] = animations;

  const handleSelectProblem = (problemId: ProblemType) => {
    setSelectedProblem(problemId);
    updateData({ primaryProblem: problemId });
    setTimeout(() => navigateNext(), 300);
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

        <ScrollView 
          style={styles(theme).scrollContent}
          contentContainerStyle={styles(theme).scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles(theme).content}>
            <Animated.Text style={[styles(theme).title, titleAnimation]}>
              What's your main challenge?
            </Animated.Text>
            
            <Animated.Text style={[styles(theme).subtitle, subtitleAnimation]}>
              Select the problem you're facing the most
            </Animated.Text>

            <View style={styles(theme).optionsContainer}>
              {problems.map((problem, index) => {
                const isSelected = selectedProblem === problem.id;

                return (
                  <Animated.View key={problem.id} style={problemAnimations[index]}>
                    <TouchableOpacity
                      style={[
                        styles(theme).optionCard,
                        isSelected && styles(theme).optionCardSelected
                      ]}
                      onPress={() => handleSelectProblem(problem.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles(theme).optionEmoji}>{problem.emoji}</Text>
                      <Text style={[
                        styles(theme).optionText,
                        isSelected && styles(theme).optionTextSelected
                      ]}>
                        {problem.title}
                      </Text>
                      {isSelected && (
                        <View style={styles(theme).selectedIndicator}>
                          <Text style={styles(theme).checkmark}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </ScrollView>
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
    paddingBottom: spacing.xxl,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontFamily: FONTS.loraBold,
    fontSize: typography.sizes.h1,
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: typography.sizes.h1 * 1.25,
  },
  subtitle: {
    fontFamily: FONTS.interRegular,
    fontSize: typography.sizes.bodyLarge,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.sizes.bodyLarge * 1.55,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionCardSelected: {
    borderColor: theme.primary,
    backgroundColor: `${theme.primary}10`,
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionText: {
    flex: 1,
    fontSize: typography.body,
    color: theme.textPrimary,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: theme.textPrimary,
    fontWeight: typography.semibold,
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: typography.bold,
  },
});
