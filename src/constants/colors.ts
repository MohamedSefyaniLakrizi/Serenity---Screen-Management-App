/**
 * Serenity Design System - Color Palette v2
 *
 * Typography:
 *   - Display / Titles / Logo → Lora             (serif, expressive)
 *   - UI / Body / Labels      → Inter            (sans-serif, engineered for screens)
 *
 * Palette philosophy:
 *   Muted, breathable tones. Warm without being loud. Inspired by Calm,
 *   Oura, and Headspace — colors that feel premium and intentional rather
 *   than gamified or stimulating. Every color passes WCAG AA contrast.
 */
// logo color: #E07A5F
export const colors = {

  // ─── Primary – Terracotta Dusk ───────────────────────────────────────────
  // Shifted from saturated orange → a warmer, dustier terracotta.
  // Still energetic enough to guide action, muted enough not to spike anxiety.
  primary:          '#E07A5F',   // Terracotta — main brand, CTAs
  primaryLight:     '#EDA58E',   // Soft blush — hover / ripple states
  primaryDark:      '#C4624A',   // Deep clay — pressed / active states
  primarySubtle:    '#FAF0EC',   // Blush tint — light-mode tinted backgrounds

  // ─── Secondary – Dusty Violet ────────────────────────────────────────────
  // Desaturated purple keeps the spiritual/mindful signal without feeling
  // synthetic. Works beautifully alongside terracotta.
  secondary:        '#7C6D9E',   // Dusty violet — secondary actions, tags
  secondaryLight:   '#A697C0',   // Lavender mist — pills, badge backgrounds
  secondarySubtle:  '#F2EFF8',   // Whisper violet — light-mode tinted surfaces

  // ─── Accent – Sage ───────────────────────────────────────────────────────
  // Replaces the disconnected pink. Sage communicates "balance" and "growth"
  // and is the third pillar of the wellness trinity (earth, spirit, calm).
  accent:           '#6B9E8F',   // Sage green — highlights, progress rings
  accentLight:      '#95BDB2',   // Pale sage — secondary highlights
  accentSubtle:     '#EDF4F2',   // Barely-there sage — light-mode tinted bg

  // ─── Backgrounds – Light Theme ───────────────────────────────────────────
  background:       '#F8F7F4',   // Warm off-white — avoids clinical bright white
  surface:          '#FFFFFF',   // Card / sheet surface
  surfaceSecondary: '#F2F0EC',   // Subtle warm grey — secondary surfaces
  surfaceTertiary:  '#EAE8E3',   // Divider-level surface

  // ─── Backgrounds – Dark Theme ────────────────────────────────────────────
  // Warm-tinted darks instead of cold blue-blacks — far easier on the eyes
  // at night and consistent with the brand's warmth.
  backgroundDark:         '#13110F',   // Deep warm black
  surfaceDark:            '#1E1B18',   // Elevated dark card
  surfaceDarkSecondary:   '#2A2621',   // Modal / sheet on dark
  surfaceDarkTertiary:    '#353028',   // Deepest raised surface

  // ─── Text – Light Theme ──────────────────────────────────────────────────
  textPrimary:      '#1C1917',   // Near-black with warm undertone — headings
  textSecondary:    '#57534E',   // Stone — body copy
  textTertiary:     '#A8A29E',   // Warm grey — hints, placeholders
  textDisabled:     '#D6D3D1',   // Disabled / muted

  // ─── Text – Dark Theme ───────────────────────────────────────────────────
  textDarkPrimary:    '#F5F4F1',   // Warm white — headings on dark
  textDarkSecondary:  '#C7C4BF',   // Warm light grey — body on dark
  textDarkTertiary:   '#8A8680',   // Muted warm grey — hints on dark
  textDarkDisabled:   '#4A4744',   // Disabled on dark

  // ─── Status Colors ───────────────────────────────────────────────────────
  // All slightly desaturated to stay within the calm palette.
  success:          '#4A9E7F',   // Muted teal-green
  successLight:     '#A3D4C4',   // Pale success
  successSubtle:    '#EDF7F3',   // Success tinted bg (light mode)

  error:            '#C0504A',   // Muted crimson — less alarming than bright red
  errorLight:       '#E09490',   // Pale error
  errorSubtle:      '#FAEEED',   // Error tinted bg (light mode)

  warning:          '#C49A3C',   // Warm amber — distinct from primary terracotta
  warningLight:     '#DFC07A',   // Pale amber
  warningSubtle:    '#FBF6E9',   // Warning tinted bg (light mode)

  info:             '#4A7FA5',   // Slate blue — calm and trustworthy
  infoLight:        '#8AB3CC',   // Pale info
  infoSubtle:       '#EBF3F8',   // Info tinted bg (light mode)

  // ─── UI Chrome ───────────────────────────────────────────────────────────
  border:           '#E7E5E1',   // Light border — warm, not clinical grey
  borderStrong:     '#C4C0BA',   // Stronger border — inputs, separators
  borderDark:       '#302C28',   // Dark mode border
  borderDarkStrong: '#47423D',   // Dark mode strong border

  divider:          '#EDECEA',   // Light divider
  dividerDark:      '#252220',   // Dark divider

  // ─── Shadows ─────────────────────────────────────────────────────────────
  // Warm-tinted shadows feel softer and more cohesive than pure black.
  shadow:           'rgba(28, 25, 23, 0.06)',    // Subtle elevation
  shadowMedium:     'rgba(28, 25, 23, 0.12)',    // Card elevation
  shadowStrong:     'rgba(28, 25, 23, 0.22)',    // Modal / sheet elevation
  shadowPrimary:    'rgba(224, 122, 95, 0.25)',  // Branded glow — FABs, CTAs

  // ─── Overlays ────────────────────────────────────────────────────────────
  overlay:          'rgba(19, 17, 15, 0.55)',    // Modal scrim
  overlayLight:     'rgba(19, 17, 15, 0.30)',    // Drawer / bottom sheet scrim
  overlayDark:      'rgba(19, 17, 15, 0.75)',    // Full-screen modal scrim

  // ─── Utility ─────────────────────────────────────────────────────────────
  white:            '#FFFFFF',
  black:            '#000000',
  transparent:      'transparent',

} as const;

export type ColorKey = keyof typeof colors;

