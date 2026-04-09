/**
 * Serenity Design System — Color Tokens
 * Structured Minimalism / Dark-First UI
 *
 * Dark is the default. Color is earned through status and achievement.
 * See DESIGN_SYSTEM.md for full rationale.
 */

// ─── Brand Accent ───────────────────────────────────────────────────────────
export const accent = {
  primary: '#E07A5F',    // Terracotta — CTAs, key actions
  hover:   '#C4624A',    // Pressed/active state
  subtle:  '#E07A5F1A',  // 10% opacity backgrounds
  glow:    '#E07A5F40',  // 25% opacity shadows/glows
} as const;

// ─── Dark Theme Backgrounds (Default) ──────────────────────────────────────
export const darkBg = {
  primary:  '#0A0A0A',  // Screen background — true black for OLED
  elevated: '#141414',  // Cards, containers
  surface:  '#1C1C1E',  // Modals, sheets, raised surfaces
  subtle:   '#252528',  // Inputs, secondary containers
  hover:    '#2C2C30',  // Interactive hover/press states
} as const;

// ─── Light Theme Backgrounds ────────────────────────────────────────────────
export const lightBg = {
  primary:  '#FAFAFA',  // Screen background
  elevated: '#FFFFFF',  // Cards, containers
  surface:  '#F5F5F5',  // Modals, sheets
  subtle:   '#EFEFEF',  // Inputs, secondary containers
  hover:    '#E8E8E8',  // Interactive hover/press states
} as const;

// ─── Text Colors ────────────────────────────────────────────────────────────
export const darkText = {
  primary:  '#F5F5F5',  // Headings — 95% white (never pure white)
  secondary: '#A1A1AA', // Body copy — zinc-400
  tertiary: '#71717A',  // Hints, placeholders — zinc-500
  disabled: '#3F3F46',  // Disabled — zinc-700
} as const;

export const lightText = {
  primary:  '#09090B',  // Headings — zinc-950 (never pure black)
  secondary: '#52525B', // Body copy — zinc-600
  tertiary: '#A1A1AA',  // Hints — zinc-400
  disabled: '#D4D4D8',  // Disabled — zinc-300
} as const;

// ─── Status Signal Colors ───────────────────────────────────────────────────
// These carry meaning. They pop on dark backgrounds.
export const status = {
  success:       '#22C55E',
  successSubtle: '#22C55E1A',
  warning:       '#F59E0B',
  warningSubtle: '#F59E0B1A',
  error:         '#EF4444',
  errorSubtle:   '#EF44441A',
  info:          '#3B82F6',
  infoSubtle:    '#3B82F61A',
} as const;

// ─── Per-Habit Accent Colors ─────────────────────────────────────────────────
export const habitAccent = {
  screentime: '#6366F1',  // Indigo
  study:      '#3B82F6',  // Blue
  fitness:    '#F97316',  // Orange
  sleep:      '#8B5CF6',  // Violet
  prayer:     '#D4A017',  // Gold
  meditation: '#06B6D4',  // Cyan
  reading:    '#A78BFA',  // Light purple
} as const;

// ─── Habit Icon Map ──────────────────────────────────────────────────────────
export const habitIcons = {
  screentime: 'Smartphone',
  study:      'BookOpen',
  fitness:    'Dumbbell',
  sleep:      'Moon',
  prayer:     'Hands',
  meditation: 'Brain',
  reading:    'BookText',
} as const;

// ─── Borders ────────────────────────────────────────────────────────────────
export const darkBorder = {
  subtle:  '#1F1F23',
  default: '#27272A',  // zinc-800
  strong:  '#3F3F46',  // zinc-700
} as const;

export const lightBorder = {
  subtle:  '#F4F4F5',  // zinc-100
  default: '#E4E4E7',  // zinc-200
  strong:  '#D4D4D8',  // zinc-300
} as const;

// ─── Overlays ───────────────────────────────────────────────────────────────
export const overlay = {
  light:  'rgba(10, 10, 10, 0.30)',
  medium: 'rgba(10, 10, 10, 0.55)',
  heavy:  'rgba(10, 10, 10, 0.75)',
} as const;
