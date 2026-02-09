/**
 * Serenity Design System - Typography
 * 
 * Font families, sizes, and weights for consistent text styling
 */

export const typography = {
  // Font Families
  fontPrimary: 'Poppins',    // Headings, Buttons - friendly and modern
  fontSecondary: 'Inter',     // Body Text - clean and readable
  
  fontFamily: {
    primary: 'Poppins',
    secondary: 'Inter',
    regular: 'Poppins',
    medium: 'Poppins-Medium',
    semibold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
  },
  
  // Font Sizes
  sizes: {
    display: 48,               // Hero text - onboarding, welcome screens
    h1: 32,                    // Main headings - screen titles
    h2: 24,                    // Section headings - card titles
    h3: 20,                    // Subheadings - section labels
    body: 16,                  // Body text - primary content
    small: 14,                 // Small text - secondary content
    tiny: 12,                  // Labels, captions - metadata
    xs: 10,                    // Extra small
  },
  
  display: 48,               // Hero text - onboarding, welcome screens
  h1: 32,                    // Main headings - screen titles
  h2: 24,                    // Section headings - card titles
  h3: 20,                    // Subheadings - section labels
  body: 16,                  // Body text - primary content
  small: 14,                 // Small text - secondary content
  tiny: 12,                  // Labels, captions - metadata
  
  // Font Weights (must match loaded font variants)
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export type FontSize = keyof Omit<typeof typography, 'fontPrimary' | 'fontSecondary' | 'regular' | 'medium' | 'semibold' | 'bold'>;
export type FontWeight = typeof typography.regular | typeof typography.medium | typeof typography.semibold | typeof typography.bold;
