/**
 * Serenity Design System — Typography
 * SF Pro for all UI text. SF Mono for numerical data.
 * See DESIGN_SYSTEM.md for full rationale.
 */

export const FONTS = {
  display: "System", // SF Pro Display (system default at large sizes)
  text: "System", // SF Pro Text (system default at body sizes)
  mono: "Menlo", // SF Mono fallback for React Native
} as const;

export const typeScale = {
  display: { size: 34, weight: "700" as const, lineHeight: 41, tracking: 0.37 },
  title1: { size: 28, weight: "700" as const, lineHeight: 34, tracking: 0.36 },
  title2: { size: 22, weight: "700" as const, lineHeight: 28, tracking: 0.35 },
  title3: { size: 20, weight: "600" as const, lineHeight: 25, tracking: 0.38 },
  headline: {
    size: 17,
    weight: "600" as const,
    lineHeight: 22,
    tracking: -0.41,
  },
  body: { size: 17, weight: "400" as const, lineHeight: 22, tracking: -0.41 },
  callout: {
    size: 16,
    weight: "400" as const,
    lineHeight: 21,
    tracking: -0.32,
  },
  subheadline: {
    size: 15,
    weight: "400" as const,
    lineHeight: 20,
    tracking: -0.24,
  },
  footnote: {
    size: 13,
    weight: "400" as const,
    lineHeight: 18,
    tracking: -0.08,
  },
  caption1: { size: 12, weight: "400" as const, lineHeight: 16, tracking: 0 },
  caption2: {
    size: 11,
    weight: "400" as const,
    lineHeight: 13,
    tracking: 0.07,
  },
  // Numerical display (SF Mono)
  statLarge: {
    size: 48,
    weight: "700" as const,
    lineHeight: 52,
    tracking: 0,
    font: "Menlo" as const,
  },
  statMedium: {
    size: 34,
    weight: "600" as const,
    lineHeight: 38,
    tracking: 0,
    font: "Menlo" as const,
  },
  statSmall: {
    size: 22,
    weight: "600" as const,
    lineHeight: 26,
    tracking: 0,
    font: "Menlo" as const,
  },
  timer: {
    size: 64,
    weight: "300" as const,
    lineHeight: 68,
    tracking: -2,
    font: "Menlo" as const,
  },
} as const;

export type TypeScaleKey = keyof typeof typeScale;
