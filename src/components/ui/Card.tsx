import { borderRadius, shadows, spacing } from '@/constants';
import { useThemedColors } from '@/hooks/useThemedStyles';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
  style?: ViewStyle;
}

export default function Card({
  children,
  variant = 'default',
  padding = 'lg',
  style,
}: CardProps) {
  const themedColors = useThemedColors();
  
  const getShadowStyle = () => {
    if (variant === 'outlined') return {};
    
    const shadowIntensity = variant === 'elevated' ? 'medium' : 'small';
    const baseStyle = shadows[shadowIntensity];
    
    return {
      ...baseStyle,
      shadowColor: themedColors.shadow,
    };
  };
  
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: themedColors.surface },
        getShadowStyle(),
        variant === 'outlined' && [styles.outlined, { borderColor: themedColors.border }],
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.large,
  },
  outlined: {
    borderWidth: 2,
  },
});
