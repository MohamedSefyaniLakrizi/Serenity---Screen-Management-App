import { borderRadius, colors, spacing, typography } from '@/constants';
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'error';
  size?: 'small' | 'medium';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  text,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], styles[`${size}Size`], style]}>
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`], textStyle]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  success: {
    backgroundColor: colors.success,
  },
  error: {
    backgroundColor: colors.error,
  },

  // Sizes
  smallSize: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  mediumSize: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },

  // Text
  text: {
    fontFamily: typography.fontPrimary,
    fontWeight: typography.semibold,
  },
  primaryText: {
    color: colors.surface,
  },
  secondaryText: {
    color: colors.textDark,
  },
  successText: {
    color: colors.surface,
  },
  errorText: {
    color: colors.surface,
  },
  smallText: {
    fontSize: typography.tiny,
  },
  mediumText: {
    fontSize: typography.small,
  },
});
