/**
 * Serenity Design System - Typography
 *
 * ─── FONT FAMILIES ──────────────────────────────────────────────────────────
 *  Display / Titles / Logo  →  Lora             (serif, expressive)
 *  All UI / Body / Labels   →  Inter            (sans-serif, engineered for screens)
 *
 * ─── TYPE SCALE ─────────────────────────────────────────────────────────────
 *  Display 1   48  Lora Bold
 *  Display 2   36  Lora SemiBold
 *  Heading 1   28  Lora Medium
 *  Heading 2   22  Inter SemiBold
 *  Heading 3   18  Inter SemiBold
 *  Body Large  16  Inter Regular
 *  Body        14  Inter Regular
 *  Caption     12  Inter Regular
 *  Label       11  Inter Medium  (ALL CAPS + letterSpacing: 0.08 * size)
 */

// ─── Font family name constants (match the keys passed to useFonts) ──────────
export const FONTS = {
  // Lora variants
  loraRegular:   'Lora_400Regular',
  loraMedium:    'Lora_500Medium',
  loraSemiBold:  'Lora_600SemiBold',
  loraBold:      'Lora_700Bold',
  // Inter variants
  interRegular:  'Inter_400Regular',
  interMedium:   'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold:     'Inter_700Bold',
} as const;

export const typography = {
  // ─── Font Families (shorthand refs used throughout components) ───────────
  /** Lora – use for Display / Heading 1 only */
  fontPrimary:   FONTS.loraBold,
  /** Inter – use for all other text */
  fontSecondary: FONTS.interRegular,

  fontFamily: {
    // Lora
    displayBold:      FONTS.loraBold,
    displaySemiBold:  FONTS.loraSemiBold,
    displayMedium:    FONTS.loraMedium,
    displayRegular:   FONTS.loraRegular,
    // Inter
    regular:          FONTS.interRegular,
    medium:           FONTS.interMedium,
    semibold:         FONTS.interSemiBold,
    bold:             FONTS.interBold,
  },

  // ─── Type Scale ──────────────────────────────────────────────────────────
  sizes: {
    display1:  48,   // Lora Bold       – hero / onboarding splash
    display2:  36,   // Lora SemiBold   – section hero blocks
    h1:        28,   // Lora Medium     – screen titles
    h2:        22,   // Inter SemiBold  – card / section headings
    h3:        18,   // Inter SemiBold  – sub-section headings
    bodyLarge: 16,   // Inter Regular   – prominent body copy
    body:      14,   // Inter Regular   – standard body
    caption:   12,   // Inter Regular   – captions, metadata
    label:     11,   // Inter Medium    – ALL CAPS labels
  },

  // Flat aliases kept for backwards-compat with existing usages
  display: 48,
  h1:      28,
  h2:      22,
  h3:      18,
  body:    14,
  small:   12,
  tiny:    11,

  // ─── Letter spacing ──────────────────────────────────────────────────────
  labelLetterSpacing: 0.88, // 0.08 × 11  – used with Label style

  // ─── Font Weights ────────────────────────────────────────────────────────
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
} as const;

/** All font keys required by useFonts() in _layout.tsx */
export const fontAssets = {
  [FONTS.loraRegular]:   require('@expo-google-fonts/lora/400Regular/Lora_400Regular.ttf'),
  [FONTS.loraMedium]:    require('@expo-google-fonts/lora/500Medium/Lora_500Medium.ttf'),
  [FONTS.loraSemiBold]:  require('@expo-google-fonts/lora/600SemiBold/Lora_600SemiBold.ttf'),
  [FONTS.loraBold]:      require('@expo-google-fonts/lora/700Bold/Lora_700Bold.ttf'),
  [FONTS.interRegular]:  require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  [FONTS.interMedium]:   require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  [FONTS.interSemiBold]: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  [FONTS.interBold]:     require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
};

export type FontSize   = keyof typeof typography.sizes;
export type FontWeight = typeof typography.regular | typeof typography.medium | typeof typography.semibold | typeof typography.bold;
