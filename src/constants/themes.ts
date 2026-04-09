import { habitColors } from "./colors";

// Light theme color palette
export const lightTheme = {
  // Primary colors
  primary: "#FF8C42",
  primaryLight: "#FFB67A",
  primaryDark: "#E67A35",
  primarySubtle: "#FFF4EC",

  // Secondary colors
  secondary: "#9B7EBD",
  secondaryLight: "#B899D4",
  accent: "#FF6B9D",

  // Background colors
  background: "#FAFBFC",
  surface: "#FFFFFF",
  surfaceSecondary: "#F5F7FA",

  // Text colors
  textPrimary: "#1A1F26",
  textSecondary: "#4A5568",
  textTertiary: "#718096",
  textMuted: "#A0AEC0",

  // UI colors
  border: "#E2E8F0",
  divider: "#EDF2F7",
  shadow: "rgba(0, 0, 0, 0.1)",
  error: "#F56565",
  success: "#48BB78",
  warning: "#ED8936",
  info: "#4299E1",

  // Habit colors
  habitColors,

  // Status bar
  statusBar: "dark-content" as const,
};

// Dark theme color palette
export const darkTheme = {
  // Primary colors
  primary: "#FF8C42",
  primaryLight: "#FFB67A",
  primaryDark: "#E67A35",
  primarySubtle: "#2A1F15",

  // Secondary colors
  secondary: "#9B7EBD",
  secondaryLight: "#B899D4",
  accent: "#FF6B9D",

  // Background colors
  background: "#0F1419",
  surface: "#1A1F26",
  surfaceSecondary: "#252B35",

  // Text colors
  textPrimary: "#F7FAFC",
  textSecondary: "#CBD5E0",
  textTertiary: "#A0AEC0",
  textMuted: "#718096",

  // UI colors
  border: "#2D3748",
  divider: "#1A202C",
  shadow: "rgba(0, 0, 0, 0.3)",
  error: "#F56565",
  success: "#48BB78",
  warning: "#ED8936",
  info: "#4299E1",

  // Habit colors
  habitColors,

  // Status bar
  statusBar: "light-content" as const,
};

export type Theme = typeof lightTheme;
