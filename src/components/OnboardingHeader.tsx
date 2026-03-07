import { spacing } from '@/constants';
import { FONTS } from '@/constants/typography';
import { useThemedColors } from '@/hooks/useThemedStyles';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OnboardingHeaderProps {
  progressFraction: number;
  onBack: () => void;
  stepLabel?: string;
}

export function OnboardingHeader({ progressFraction, onBack, stepLabel }: OnboardingHeaderProps) {
  const theme = useThemedColors();
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
        <ChevronLeft size={22} color={theme.textPrimary} strokeWidth={2} />
      </TouchableOpacity>
      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: theme.surface }]}> 
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(progressFraction, 1) * 100}%`, backgroundColor: theme.primary },
            ]}
          />
        </View>
        {stepLabel ? (
          <Text style={[styles.stepText, { color: theme.textSecondary }]}>{stepLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  progressContainer: {
    flex: 1,
    gap: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepText: {
    fontSize: 12,
    fontFamily: FONTS.interMedium,
  },
});
