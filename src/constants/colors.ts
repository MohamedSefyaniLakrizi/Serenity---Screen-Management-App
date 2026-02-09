/**
 * Serenity Design System - Color Palette
 * 
 * Warm, calming colors centered around soft orange and purple tones
 * to create a peaceful, mindful experience for the digital wellness app
 */

export const colors = {
  // Primary Colors - Warm Orange (Main Brand)
  primary: '#FF8C42',        // Warm Orange - main brand color
  primaryLight: '#FFB67A',   // Light Orange - hover states
  primaryDark: '#E67A35',    // Dark Orange - pressed states
  
  // Secondary Colors - Calming Purple
  secondary: '#9B7EBD',      // Soft Purple - secondary actions
  secondaryLight: '#B899D4', // Light Purple - backgrounds
  accent: '#FF6B9D',         // Accent Pink - highlights
  
  // Background Colors - Light Theme
  background: '#FAFBFC',     // Light Background - main app background
  surface: '#FFFFFF',        // Card/Surface White - elevated surfaces
  surfaceSecondary: '#F5F7FA', // Secondary Surface - subtle backgrounds
  white: '#FFFFFF',          // Pure White
  
  // Background Colors - Dark Theme (Onboarding)
  backgroundDark: '#0F1419',    // Dark Background - deep navy black
  surfaceDark: '#1A1F26',       // Dark Surface - elevated dark surfaces
  surfaceDarkSecondary: '#252B35', // Secondary Dark Surface
  
  // Text Colors - Light Theme
  textDark: '#1A1F26',       // Primary Text - headings
  textGray: '#4A5568',       // Secondary Text - body text
  textLight: '#A0AEC0',      // Tertiary Text - hints
  textSecondary: '#718096',  // Quaternary Text - less important
  
  // Text Colors - Dark Theme
  textDarkPrimary: '#F7FAFC',   // Primary Text on dark
  textDarkSecondary: '#CBD5E0', // Secondary Text on dark
  textDarkTertiary: '#A0AEC0',  // Tertiary Text on dark
  textDarkMuted: '#718096',     // Muted Text on dark
  
  // Status Colors
  success: '#48BB78',        // Success Green
  successLight: '#9AE6B4',   // Light Success
  error: '#F56565',          // Error Red
  errorLight: '#FC8181',     // Light Error
  warning: '#ED8936',        // Warning Orange
  warningLight: '#F6AD55',   // Light Warning
  info: '#4299E1',           // Info Blue
  infoLight: '#63B3ED',      // Light Info
  
  // UI Elements
  border: '#E2E8F0',         // Border Light
  borderDark: '#2D3748',     // Border Dark
  divider: '#EDF2F7',        // Divider Light
  dividerDark: '#1A202C',    // Divider Dark
  
  // Shadow Colors
  shadow: 'rgba(0, 0, 0, 0.1)',        // Light shadow
  shadowMedium: 'rgba(0, 0, 0, 0.15)',  // Medium shadow
  shadowDark: 'rgba(0, 0, 0, 0.25)',    // Dark shadow
  shadowPrimary: 'rgba(255, 140, 66, 0.3)', // Primary colored shadow
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',        // Modal overlay
  overlayLight: 'rgba(0, 0, 0, 0.3)',   // Light overlay
  overlayDark: 'rgba(0, 0, 0, 0.7)',    // Dark overlay
} as const;

export type ColorKey = keyof typeof colors;
