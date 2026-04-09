/**
 * Serenity Design System — Spacing & Layout
 * 4px base grid. Tighter radii for structured minimalism.
 */

export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const borderRadius = {
  none: 0,
  sm: 6, // Chips, tags, badges
  md: 10, // Buttons, inputs
  lg: 14, // Cards
  xl: 20, // Modals, sheets
  full: 9999, // Pills, avatars
} as const;

export const shadows = {
  small: {
    shadowColor: "rgba(10, 10, 10, 0.20)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: "rgba(10, 10, 10, 0.25)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: "rgba(10, 10, 10, 0.30)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: "#E07A5F40",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 0,
  },
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;
