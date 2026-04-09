# Serenity — Design System

> **Structured Minimalism with Dark-First UI**
> This document defines the complete visual language for Serenity. Every screen, component, and interaction should reference this guide. The design communicates **controlled intensity**: serious, clean, authoritative — never soft, cozy, or optional.

---

## 1. Design Philosophy

### Identity: Enforcer, Not Wellness App

Serenity blocks your apps until you do the work. The design reflects that energy:

- **Structured** — Typography-driven hierarchy, clear data presentation, intentional negative space
- **Dark-first** — Dark mode is the default experience, not an option
- **Restrained** — Visual richness is reserved for achievement moments only
- **Authoritative** — The UI says "this is serious, this works" — never "this is cozy and optional"

### What Serenity Is NOT

| Avoid                | Why                                                              |
| -------------------- | ---------------------------------------------------------------- |
| Pastel palettes      | Signals "gentle suggestion" — Serenity enforces                  |
| Nature imagery       | Wellness app territory (Calm, Headspace)                         |
| Rounded bubbly fonts | Communicates playfulness — Serenity communicates discipline      |
| Illustrations        | Decorative minimalism — Serenity uses structured minimalism      |
| Glassmorphism        | Purely aesthetic, no substance signal, accessibility issues      |
| Neo-brutalism        | Communicates rebellion/chaos — Serenity is about discipline      |
| Neumorphism          | Poor accessibility, low contrast, bad for multi-habit dashboards |

### The Emotional Curve

| State             | Visual Treatment                                                    |
| ----------------- | ------------------------------------------------------------------- |
| Daily interface   | Restrained, structured, high-contrast. Clean status indicators.     |
| Habit incomplete  | Amber/red signals on dark background. Clear, urgent, no fluff.      |
| Habit completed   | Green checkmark, subtle glow. Earned, not given.                    |
| Streak milestone  | Controlled burst of color, animation, reward. Breaks the restraint. |
| 60-day graduation | Full celebration moment — rich animation, accent color bloom.       |

---

## 2. Color System

### Dark Theme (Primary — Default)

The dark palette is the brand. Warm-tinted blacks and grays, never cold blue-blacks.

```
Background Hierarchy:
┌─────────────────────────────────────────────────┐
│  bg.primary     #0A0A0A   True black base       │
│  bg.elevated    #141414   Cards, containers      │
│  bg.surface     #1C1C1E   Modals, sheets         │
│  bg.subtle      #252528   Inputs, secondary      │
│  bg.hover       #2C2C30   Interactive hover      │
└─────────────────────────────────────────────────┘
```

```typescript
// Dark theme background hierarchy
const darkBg = {
  primary: "#0A0A0A", // Screen background — true black for OLED
  elevated: "#141414", // Cards, containers
  surface: "#1C1C1E", // Modals, sheets, raised surfaces
  subtle: "#252528", // Inputs, secondary containers
  hover: "#2C2C30", // Interactive hover/press states
};
```

### Light Theme (Secondary)

Available but not the default. Clean whites and warm grays for daylight readability.

```typescript
const lightBg = {
  primary: "#FAFAFA", // Screen background
  elevated: "#FFFFFF", // Cards, containers
  surface: "#F5F5F5", // Modals, sheets
  subtle: "#EFEFEF", // Inputs, secondary containers
  hover: "#E8E8E8", // Interactive hover/press states
};
```

### Text Colors

```typescript
// Dark theme text
const darkText = {
  primary: "#F5F5F5", // Headings, primary content — 95% white
  secondary: "#A1A1AA", // Body copy, descriptions — zinc-400
  tertiary: "#71717A", // Hints, placeholders — zinc-500
  disabled: "#3F3F46", // Disabled states — zinc-700
};

// Light theme text
const lightText = {
  primary: "#09090B", // Headings — zinc-950
  secondary: "#52525B", // Body copy — zinc-600
  tertiary: "#A1A1AA", // Hints — zinc-400
  disabled: "#D4D4D8", // Disabled — zinc-300
};
```

### Brand Accent Color

A single accent used sparingly for CTAs and key interactive elements:

```typescript
const accent = {
  primary: "#E07A5F", // Terracotta — primary CTAs, key actions
  hover: "#C4624A", // Pressed/active state
  subtle: "#E07A5F1A", // 10% opacity — subtle backgrounds
  glow: "#E07A5F40", // 25% opacity — shadow/glow on dark
};
```

The terracotta accent is warm enough to feel intentional, serious enough to not feel playful. It's the only "color" in the daily interface outside of status indicators.

### Status Signal Colors

These colors carry meaning. They pop on dark backgrounds to convey habit state at a glance:

```typescript
const status = {
  // Habit completed / on track
  success: "#22C55E", // Green-500 — clear, unambiguous
  successSubtle: "#22C55E1A", // 10% bg tint

  // In progress / approaching deadline
  warning: "#F59E0B", // Amber-500
  warningSubtle: "#F59E0B1A",

  // Overdue / failed / blocked
  error: "#EF4444", // Red-500
  errorSubtle: "#EF44441A",

  // Informational
  info: "#3B82F6", // Blue-500
  infoSubtle: "#3B82F61A",
};
```

### Per-Habit Accent Colors

Each habit gets a single identifying color used for its left-border accent, icon tint, and progress ring. These are muted enough to not compete with status signals:

```typescript
const habitAccent = {
  screentime: "#6366F1", // Indigo — digital/screen association
  study: "#3B82F6", // Blue — focus, intellect
  fitness: "#F97316", // Orange — energy, movement
  sleep: "#8B5CF6", // Violet — night, rest
  prayer: "#D4A017", // Gold — spiritual, sacred
  meditation: "#06B6D4", // Cyan — calm, clarity
  reading: "#A78BFA", // Light purple — wisdom, imagination
};
```

### Border & Divider Colors

```typescript
const border = {
  dark: {
    subtle: "#1F1F23", // Barely visible — structural separation
    default: "#27272A", // Standard borders — zinc-800
    strong: "#3F3F46", // Emphasized borders — zinc-700
  },
  light: {
    subtle: "#F4F4F5", // zinc-100
    default: "#E4E4E7", // zinc-200
    strong: "#D4D4D8", // zinc-300
  },
};
```

---

## 3. Typography

### Font Stack

| Usage                         | Font        | Why                                                    |
| ----------------------------- | ----------- | ------------------------------------------------------ |
| Numerical data, stats, timers | **SF Mono** | Monospaced — numbers align, feel precise and technical |
| All UI text                   | **SF Pro**  | iOS-native, clean, authoritative at all sizes          |

SF Pro is the system font on iOS — zero load time, perfect rendering, and it signals "this is a serious native app, not a web wrapper." No need for custom fonts when the system font already communicates exactly the right thing.

> **Migration note**: The previous design used Lora (serif) for headings and Inter (sans-serif) for body. The new system replaces both with SF Pro for the structured minimalism identity. Lora's expressiveness and Inter's neutrality are replaced by SF Pro's authority. SF Mono replaces all numerical displays for precision.

### Type Scale

```typescript
const typeScale = {
  // Display — used sparingly: onboarding heroes, milestone celebrations
  display: {
    size: 34,
    weight: "700", // Bold
    font: "SF Pro Display",
    tracking: 0.37, // Apple HIG
    lineHeight: 41,
  },

  // Title 1 — screen titles
  title1: {
    size: 28,
    weight: "700",
    font: "SF Pro Display",
    tracking: 0.36,
    lineHeight: 34,
  },

  // Title 2 — section headers
  title2: {
    size: 22,
    weight: "700",
    font: "SF Pro Display",
    tracking: 0.35,
    lineHeight: 28,
  },

  // Title 3 — card titles, subsection headers
  title3: {
    size: 20,
    weight: "600",
    font: "SF Pro Text",
    tracking: 0.38,
    lineHeight: 25,
  },

  // Headline — emphasized body text
  headline: {
    size: 17,
    weight: "600",
    font: "SF Pro Text",
    tracking: -0.41,
    lineHeight: 22,
  },

  // Body — standard content
  body: {
    size: 17,
    weight: "400",
    font: "SF Pro Text",
    tracking: -0.41,
    lineHeight: 22,
  },

  // Callout — secondary content, descriptions
  callout: {
    size: 16,
    weight: "400",
    font: "SF Pro Text",
    tracking: -0.32,
    lineHeight: 21,
  },

  // Subheadline — labels, metadata
  subheadline: {
    size: 15,
    weight: "400",
    font: "SF Pro Text",
    tracking: -0.24,
    lineHeight: 20,
  },

  // Footnote — hints, secondary metadata
  footnote: {
    size: 13,
    weight: "400",
    font: "SF Pro Text",
    tracking: -0.08,
    lineHeight: 18,
  },

  // Caption — timestamps, tertiary info
  caption1: {
    size: 12,
    weight: "400",
    font: "SF Pro Text",
    tracking: 0,
    lineHeight: 16,
  },

  // Caption 2 — smallest readable text
  caption2: {
    size: 11,
    weight: "400",
    font: "SF Pro Text",
    tracking: 0.07,
    lineHeight: 13,
  },

  // ─── Numerical Display (SF Mono) ──────────────────
  // Used for: streak counts, timer displays, stats, progress percentages

  statLarge: {
    size: 48,
    weight: "700",
    font: "SF Mono",
    tracking: 0,
    lineHeight: 52,
  },

  statMedium: {
    size: 34,
    weight: "600",
    font: "SF Mono",
    tracking: 0,
    lineHeight: 38,
  },

  statSmall: {
    size: 22,
    weight: "600",
    font: "SF Mono",
    tracking: 0,
    lineHeight: 26,
  },

  timer: {
    size: 64,
    weight: "300", // Light weight for large timer
    font: "SF Mono",
    tracking: -2,
    lineHeight: 68,
  },
};
```

### Typography Rules

1. **Numerical data gets prominence** — streak counts, timer displays, completion percentages are rendered in SF Mono at large sizes. Numbers are the primary feedback mechanism.
2. **Bold headings, regular body** — Strong weight contrast creates hierarchy without color.
3. **No decorative type** — No italic, no script, no stylized fonts anywhere.
4. **ALL CAPS sparingly** — Only for labels like "ACTIVE", "STACKED", "COMPLETED" status badges. Use `caption2` weight `'600'` + `letterSpacing: 1.5`.

---

## 4. Spacing & Layout

### Spacing Scale (4px base)

```typescript
const space = {
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
```

### Screen Layout

```
┌────────────────────────────────┐
│ SafeAreaView                    │
│ ┌────────────────────────────┐ │
│ │ Header        px: 20  py:12│ │
│ ├────────────────────────────┤ │
│ │                            │ │
│ │ Content       px: 20      │ │
│ │               gap: 16     │ │
│ │                            │ │
│ │                            │ │
│ │                            │ │
│ ├────────────────────────────┤ │
│ │ Footer/CTA    px: 20 py:16│ │
│ └────────────────────────────┘ │
└────────────────────────────────┘

px = horizontal padding
py = vertical padding
```

### Border Radius

```typescript
const radius = {
  none: 0,
  sm: 6, // Small chips, tags
  md: 10, // Buttons, inputs
  lg: 14, // Cards
  xl: 20, // Modals, sheets
  full: 9999, // Pills, avatars
};
```

> **Note**: Radii are tighter than the previous design (which used 12–24). Structured minimalism favors sharper geometry. Nothing should feel "bubbly."

---

## 5. Component Patterns

### Cards

Cards are the primary content container. They should feel like data panels, not decorative tiles.

```
┌──────────────────────────────────┐
│ ▌ Habit Card                      │  ← 3px left accent in habit color
│ ▌                                 │
│ ▌ [Icon]  Study                   │  ← Icon + title row
│ ▌         45 min daily            │  ← Subtitle in textSecondary
│ ▌                                 │
│ ▌         ██████████░░  73%       │  ← Progress bar (if applicable)
│ ▌                                 │
│ ▌         🔥 12 days              │  ← Streak (SF Mono for number)
│ └─────────────────────────────────┘
```

```typescript
const card = {
  background: darkBg.elevated, // #141414
  border: border.dark.subtle, // #1F1F23
  borderWidth: 1,
  borderRadius: radius.lg, // 14
  padding: space[4], // 16
  accentBorderWidth: 3, // Left accent strip
};
```

### Buttons

```typescript
const button = {
  primary: {
    background: accent.primary, // Terracotta
    text: "#FFFFFF",
    borderRadius: radius.md, // 10
    height: 52,
    fontSize: typeScale.headline.size,
    fontWeight: "600",
  },
  secondary: {
    background: "transparent",
    text: darkText.primary,
    border: border.dark.default,
    borderWidth: 1,
    borderRadius: radius.md,
    height: 52,
  },
  ghost: {
    background: "transparent",
    text: darkText.secondary,
    borderRadius: radius.md,
    height: 44,
  },
  destructive: {
    background: status.errorSubtle,
    text: status.error,
    borderRadius: radius.md,
    height: 52,
  },
};
```

### Status Badges

Small pill-shaped indicators for habit completion status:

```
[● ACTIVE]     — accent.primary background at 10%, accent text
[✓ COMPLETED]  — status.success background at 10%, success text
[◇ PENDING]    — darkBg.subtle background, textTertiary
[★ STACKED]    — habitAccent.prayer (gold) background at 10%, gold text
```

```typescript
const badge = {
  paddingH: space[2.5], // 10
  paddingV: space[1], // 4
  borderRadius: radius.sm, // 6
  fontSize: typeScale.caption2.size,
  fontWeight: "600",
  letterSpacing: 1.5,
  textTransform: "uppercase",
};
```

### Progress Ring

Used for timer displays and completion tracking:

```typescript
const progressRing = {
  strokeWidth: 4, // Thin, precise
  trackColor: border.dark.subtle,
  activeColor: accent.primary, // Or habit-specific color
  backgroundColor: "transparent",
};
```

### Inputs

```typescript
const input = {
  background: darkBg.subtle,
  border: border.dark.default,
  borderWidth: 1,
  borderRadius: radius.md,
  height: 48,
  paddingH: space[4],
  fontSize: typeScale.body.size,
  placeholderColor: darkText.tertiary,
  focusBorder: accent.primary,
};
```

---

## 6. Iconography

### Library

`lucide-react-native` exclusively — no emojis, no custom icon sets.

### Style Rules

| Rule                | Detail                                                |
| ------------------- | ----------------------------------------------------- |
| Default size        | 20px                                                  |
| Stroke width        | 1.5px (thinner than default for precision)            |
| Color               | `textSecondary` by default, `textPrimary` when active |
| Habit-specific icon | Tinted with habit's accent color                      |

### Habit Icon Map

```typescript
const habitIcon = {
  screentime: "Smartphone",
  study: "BookOpen",
  fitness: "Dumbbell",
  sleep: "Moon",
  prayer: "Hands", // or 'HandHeart'
  meditation: "Brain",
  reading: "BookText",
};
```

---

## 7. Animation & Motion

### Philosophy

Motion is functional, not decorative. It confirms actions and guides attention.

### Rules

| Context            | Motion                                              | Duration |
| ------------------ | --------------------------------------------------- | -------- |
| Screen transitions | Slide or fade, not bounce                           | 250ms    |
| Button press       | Scale 0.97 + haptic (light)                         | 100ms    |
| Completion         | Checkmark draw + ring fill                          | 400ms    |
| Streak milestone   | Number count-up (SF Mono) + subtle glow bloom       | 600ms    |
| 60-day graduation  | Full celebration — confetti particles + color bloom | 1200ms   |
| Timer tick         | None — numbers change without animation             | —        |
| Card appear        | Fade-in with 8px upward slide, staggered per card   | 200ms    |
| Oath hold          | Ring fill + haptic pulse every 500ms                | 5000ms   |

### Reward Moments

The daily interface is deliberately restrained. This makes reward moments feel genuinely special:

- **Habit completed**: Green checkmark draws in with a subtle ring fill animation. Single medium haptic.
- **All habits done**: Status banner transitions from warning amber to success green. "Apps Unlocked" appears with a brief glow.
- **Streak milestone (7, 30, 60 days)**: The streak number counts up in SF Mono with a subtle golden glow bloom behind it. Stronger haptic.
- **60-day graduation**: Full celebration. Confetti particle system (keep it classy — small, monochrome particles with one or two accent-colored ones). The graduated habit card gets a gold border pulse.

---

## 8. Dark-First Principles

### Why Dark-First

1. **Gen Z / millennial default** — This audience expects dark mode as standard
2. **OLED battery savings** — True black (#0A0A0A) pixels are off
3. **Status signals pop** — Green/amber/red indicators are immediately visible on dark backgrounds
4. **11 PM use case** — Users checking habits before bed shouldn't be blasted with white light
5. **Premium signal** — Dark UIs consistently perceived as more premium and intentional

### Implementation Rules

1. Dark theme is the **default** on first launch. No prompt to choose.
2. Light theme is available in settings under "Appearance" — Dark / Light / System.
3. All designs and mockups are created dark-first. Light theme is a derivative.
4. Status bar: `light-content` (dark theme), `dark-content` (light theme).
5. Never use pure white (#FFFFFF) text on dark backgrounds — use #F5F5F5 (95% white) to reduce eye strain.
6. Never use pure black (#000000) text on light backgrounds — use #09090B.

---

## 9. Logo Concept

### Direction: The Structured Shield

The Serenity logo should communicate **protection through discipline** — not peace, not nature, not softness.

### Concept: Abstracted Lock/Shield Monogram

A geometric **"S"** constructed from shield/lock geometry:

```
    ╭─────────╮
    │  ╭───╮  │
    │  │   │  │        The "S" path flows through a shield outline,
    │  ╰───┤  │        creating a monogram that reads as both
    │  ┌───╯  │        a letter and a protective structure.
    │  │   │  │
    │  ╰───╯  │
    ╰────┬────╯
         │
```

**Construction**:

- An **S-shaped path** that flows continuously, formed by two interlocking rectangular cutouts within a shield silhouette
- The shield shape is a **rounded rectangle with a pointed bottom** (software shield, not heraldic)
- The S-path is created by **negative space** — the shield is solid, the S is cut out
- Line weight: consistent, medium — matches the structured minimalism of the UI
- Corners: slightly rounded (matching `radius.sm` of 6px feel) — not sharp, not bubbly

**Color treatments**:

- **Primary**: Solid white mark on dark background (for app icon, headers)
- **App icon**: Terracotta (#E07A5F) S-cutout on #0A0A0A black, with the shield perimeter subtly visible in #1C1C1E
- **Monochrome**: Works at single-color in any size — from 16px favicon to marketing hero

**Rationale**:

- **Shield** = protection, enforcement, security → "Your apps are guarded until habits are done"
- **S** = Serenity branding
- **Negative space construction** = Structured minimalism aesthetic — the logo IS the design philosophy
- **No organic shapes** — purely geometric, matching the rest of the design system
- **No gradients in primary usage** — gradient only appears in celebration/reward contexts

### Logo Usage Rules

| Context           | Treatment                                         |
| ----------------- | ------------------------------------------------- |
| App icon          | Terracotta S on black shield, no text             |
| Onboarding splash | White S on transparent, Lottie fade-in animation  |
| Navigation header | Small (20px) monochrome mark, no text             |
| Marketing         | Mark + "Serenity" wordmark in SF Pro Display Bold |
| Loading states    | Subtle pulse animation on the S mark              |

### Wordmark

When the logo appears with text:

```
[S-Shield]  Serenity
            SF Pro Display, Bold, tracking: 1.5
```

The wordmark uses **SF Pro Display Bold** with expanded letter-spacing (1.5) for a premium, structured feel. The mark and wordmark are separate elements — never merged into a single glyph.

---

## 10. Screen-by-Screen Guidance

### Onboarding

- Dark background throughout. No white screens.
- Large SF Pro Display headings, generous line height
- Single accent-colored CTA button per screen
- Sequential fade-in animations (200ms stagger)
- Progress bar: thin (2px), accent-colored track on `border.dark.subtle` background

### Home (Daily Habits)

- "Today" title in `title1` + date in `subheadline` textSecondary
- Global streak badge: SF Mono number + Flame icon in gold
- Habit cards stacked vertically with 12px gap
- Status banner: full-width, rounded corners, background color = status signal at 10% opacity
- Completed habits: card gets green left accent + checkmark icon + reduced opacity (0.7)

### Progress

- Large stat numbers (SF Mono `statLarge`) centered at top
- Calendar heatmap: 7-column grid, cells are small rounded squares (4px radius)
  - Green = all done, amber = partial, red = missed, `darkBg.subtle` = future
- Per-habit streak cards: horizontal scroll, each card uses its habit accent color

### Timer Screens (Study, Meditation, Reading)

- Full-screen dark background
- Massive timer display (SF Mono `timer` — 64px, light weight)
- Minimal UI: timer + single Start/Pause button
- Progress ring with habit-specific color
- No decorative elements — pure focus

### Settings

- Grouped sections with `title3` section headers
- List items: 48px height minimum, chevron for navigation items
- Destructive actions (reset, delete) in `status.error` color

---

## 11. Implementation Mapping

### Files to Update

| File                           | Changes Required                                           |
| ------------------------------ | ---------------------------------------------------------- |
| `src/constants/colors.ts`      | Replace entire palette with dark-first structured system   |
| `src/constants/typography.ts`  | Replace Lora/Inter with SF Pro/SF Mono type scale          |
| `src/constants/spacing.ts`     | Update radii to tighter values, add 4px-base spacing scale |
| `src/constants/themes.ts`      | Rebuild light/dark themes using new token structure        |
| `src/hooks/useThemedStyles.ts` | Update to return new token structure                       |

### Design Token Export Structure

```typescript
// Proposed structure for src/constants/theme.ts
export const theme = {
  colors: {
    bg: { primary, elevated, surface, subtle, hover },
    text: { primary, secondary, tertiary, disabled },
    accent: { primary, hover, subtle, glow },
    status: { success, warning, error, info, ...subtle variants },
    habit: { screentime, study, fitness, sleep, prayer, meditation, reading },
    border: { subtle, default, strong },
  },
  type: {
    display, title1, title2, title3, headline, body, callout,
    subheadline, footnote, caption1, caption2,
    statLarge, statMedium, statSmall, timer,
  },
  space: { 0, px, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10, 12, 16, 20 },
  radius: { none, sm, md, lg, xl, full },
};
```

---

## 12. Accessibility

| Rule                              | Implementation                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------- |
| Contrast ratio (text on bg)       | Minimum 4.5:1 (WCAG AA) for all text                                              |
| Contrast ratio (large text on bg) | Minimum 3:1 for text ≥ 18px bold or ≥ 24px regular                                |
| Touch targets                     | Minimum 44×44pt (Apple HIG)                                                       |
| Color not sole indicator          | Status always has icon + text label alongside color                               |
| Dynamic Type support              | Scale factor applied to all text sizes                                            |
| Reduce Motion                     | Respect `UIAccessibilityIsReduceMotionEnabled` — skip all non-essential animation |
| VoiceOver                         | All interactive elements have accessibility labels                                |

---

## 13. Summary Principles

1. **Dark is home.** The dark theme is where Serenity lives. Light is a courtesy.
2. **Numbers are king.** Streak counts, timer displays, completion stats — all rendered in SF Mono, large and prominent.
3. **Color earns its place.** Only status signals and habit accents get color. Everything else is grayscale.
4. **Reward the restraint.** The daily UI is deliberately austere so that achievement moments feel genuinely special.
5. **No fluff.** No illustrations, no nature imagery, no motivational quotes, no decorative elements. Data and actions only.
6. **Sharp, not soft.** Tighter radii, thinner strokes, geometric shapes. Nothing bubbly or rounded.
7. **System-native.** SF Pro, SF Mono, iOS conventions. This app feels like it belongs on the device.
