/**
 * Serenity Design System - Spacing & Layout
 * 
 * Consistent spacing scale and border radius values
 */

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const borderRadius = {
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 24,
  full: 9999,
} as const;

// Common shadow styles
export const shadows = {
  small: {
    shadowColor: 'rgba(255, 122, 61, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: 'rgba(255, 122, 61, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: 'rgba(255, 122, 61, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;
