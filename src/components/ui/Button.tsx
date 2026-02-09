import { borderRadius, colors, spacing, typography } from '@/constants';
import { useThemedColors } from '@/hooks/useThemedStyles';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = true,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const themedColors = useThemedColors();
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return themedColors.surface;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return colors.surface;
      case 'secondary':
        return themedColors.textPrimary;
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return colors.surface;
    }
  };

  const buttonStyles = [
    styles.base,
    { backgroundColor: getBackgroundColor() },
    variant === 'outline' && [styles.outline, { borderColor: colors.primary }],
    styles[`${size}Size`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    { color: getTextColor() },
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.surface : colors.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  outline: {
    borderWidth: 2,
  },

  // Sizes
  smallSize: {
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
  },
  mediumSize: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  largeSize: {
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
  },

  // Text Styles
  text: {
    fontFamily: typography.fontPrimary,
    fontWeight: typography.semibold,
  },
  smallText: {
    fontSize: typography.small,
  },
  mediumText: {
    fontSize: typography.body,
  },
  largeText: {
    fontSize: typography.h3,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});
