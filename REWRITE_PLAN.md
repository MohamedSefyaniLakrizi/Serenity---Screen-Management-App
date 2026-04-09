# Serenity — Habit Builder Rewrite Plan

> **For AI agents**: This document is a step-by-step execution plan. Each step is **one prompt-sized unit of work**. Use the status checkboxes to track progress. After completing a step, change its checkbox from `[ ]` to `[x]`.
>
> **Design reference**: See `DESIGN_SYSTEM.md` for the complete visual language — **Structured Minimalism with Dark-First UI**. All UI work must follow that spec.

---

## Status Tracker

> **How to find the next task**: Search this file for the first `- [ ]` checkbox. That is the next step to execute. After completing it, change it to `- [x]` and verify the work compiles with `npx tsc --noEmit`.

| Phase                 | Steps       | Status        |
| --------------------- | ----------- | ------------- | --------------------------------------------------------------------------- |
| 1. Foundation & Types | Steps 1–3   | `IN_PROGRESS` |
| 2. Design System      | Steps 4–6   | `COMPLETED`   | ← **Overhauled**: Dark-first structured minimalism (see `DESIGN_SYSTEM.md`) |
| 3. Onboarding Rewrite | Steps 7–11  | `COMPLETED`   |
| 4. Main App Screens   | Steps 12–14 | `IN_PROGRESS` |
| 5. Habit Engines      | Steps 15–21 | `NOT_STARTED` |
| 6. Integration        | Steps 22–25 | `NOT_STARTED` |
| 7. Cleanup & Polish   | Steps 26–27 | `COMPLETED`   |

> After completing all steps in a phase, update the phase status to `COMPLETED`.

---

## Key Decisions

| Decision             | Choice                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Fox companion        | **Removed entirely**                                                                                                     |
| Habit stacking model | **Stack & keep all** — completed habits remain enforced forever                                                          |
| Paywall              | **1 free habit**, Pro unlocks additional habits                                                                          |
| App groups           | **Single global blocked-apps list** replaces multiple groups                                                             |
| Default blocking     | Most habits block apps until daily goal is met (exceptions: screentime is reversed/threshold-based, sleep is time-based) |

---

## Conventions & Patterns

> **Agents: READ THIS before writing any code.** These are the coding conventions to follow across all steps.
> **Design reference**: See `DESIGN_SYSTEM.md` for the complete visual language (Structured Minimalism / Dark-First UI).

| Convention  | Rule                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------- |
| Path alias  | `@/*` → `./src/*` — all imports from `src/` must use `@/`                                     |
| Icons       | `lucide-react-native` exclusively — **no emojis in UI**, stroke 1.5px, 20px default           |
| Styling     | `StyleSheet.create()` + design-system tokens, `useThemedColors()` for theme                   |
| Design      | **Dark-first** structured minimalism — see `DESIGN_SYSTEM.md` for full spec                   |
| State       | Zustand stores with manual `loadFromStorage()`/`saveToStorage()` to AsyncStorage              |
| Animations  | `react-native-reanimated` — functional motion only, no decorative animation                   |
| Fonts       | **SF Pro** (system font) for all UI text, **SF Mono** for numerical data/timers/stats         |
| Colors      | Dark backgrounds (#0A0A0A base), single accent (terracotta #E07A5F), status-driven color only |
| Navigation  | Expo Router (file-based), `useOnboardingNext()` for onboarding flow                           |
| Platform    | iOS only — all Screen Time calls wrapped in `Platform.OS !== 'ios'` checks                    |
| Persistence | Offline-first (AsyncStorage primary), Supabase best-effort                                    |

### Reference files for patterns:

- **Zustand store pattern**: `src/store/appStore.ts` — follow its `loadFromStorage`/`saveToStorage` structure
- **Onboarding screen pattern**: `app/onboarding/daily-goal.tsx` — SafeAreaView + OnboardingHeader + animations + Button
- **UI component pattern**: `src/components/ui/Button.tsx` — themed, variant-based, typed props
- **Service pattern**: `src/services/appGroups.ts` — AsyncStorage CRUD + native bridge calls
- **Theme usage**: `src/hooks/useThemedStyles.ts` — `useThemedColors()` returns active palette

---

## Habit Verification Architecture

> **Agents**: Reference this section when implementing each habit engine (Steps 15–21).

### 1. Screentime Limit (Reversed — apps open by default)

| Aspect            | Detail                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| Default state     | Apps **OPEN**                                                                                      |
| Trigger           | `DeviceActivityEvent` with threshold at user's daily limit                                         |
| Action on trigger | Block all apps for rest of day                                                                     |
| "Completed"       | Stayed under limit by end of day (auto-tracked)                                                    |
| Reset             | Midnight — unblock + restart monitoring                                                            |
| Native API        | `DeviceActivityMonitor.startMonitoring()` with `DeviceActivityEvent` threshold                     |
| Config needed     | `dailyLimitMinutes: number`                                                                        |
| Files to study    | `src/services/appGroups.ts` (blocking logic), `targets/ActivityMonitorExtension/` (event handling) |

### 2. Study/Work (Timer-based)

| Aspect          | Detail                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| Default state   | Apps **BLOCKED**                                                                   |
| Primary verify  | In-app timer — user starts, runs for goal duration, completion unlocks apps        |
| Fallback verify | Touch-and-hold oath (~5s) — "I swear I completed my work" (not encouraged, hidden) |
| Timer states    | `idle → running → paused → completed`                                              |
| Config needed   | `dailyGoalMinutes: number`, `workLabel?: string`                                   |
| UI reference    | `app/mindful-pause.tsx` for hold mechanic, SVG ring animation                      |

### 3. Fitness (HealthKit)

| Aspect          | Detail                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| Default state   | Apps **BLOCKED**                                                                                                   |
| Primary verify  | `HKWorkoutQuery` — query workouts completed today                                                                  |
| Fallback verify | `HKStatisticsQuery` for `.stepCount` (iPhone-only, no Apple Watch needed)                                          |
| Auto-unlock     | `HKObserverQuery` + `enableBackgroundDelivery()` (~15 min latency)                                                 |
| Goal types      | Steps (number), Workout duration (minutes), Active calories (kcal)                                                 |
| Config needed   | `goalType: 'steps' \| 'workout' \| 'calories'`, `goalValue: number`                                                |
| Requires        | New `modules/healthkit/` Expo module, HealthKit capability in Xcode, `NSHealthShareUsageDescription` in Info.plist |

### 4. Sleep (Time-based lockdown)

| Aspect        | Detail                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| Mechanism     | Block at bedtime, unblock at wake time (clock-based)                                                      |
| Escalation    | Phone used after bedtime → lock 30 min earlier next day (max 2h earlier). De-escalate after 3 good nights |
| Verification  | Clock enforcement — no user action needed                                                                 |
| Config needed | `bedtime: string` (HH:mm), `wakeTime: string` (HH:mm)                                                     |
| Native API    | `DeviceActivitySchedule` for time-based blocking                                                          |
| State tracked | `violations: string[]`, `escalationMinutes: number`, `goodNightStreak: number`                            |

### 5. Prayer (Religion-specific, oath-based)

| Aspect                  | Detail                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Default state           | **Blocks when prayer is due**, unblocks on oath                                                      |
| Islam                   | 5 prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) calculated from GPS via `adhan` npm package              |
| Christianity            | 1+ daily prayers at user-set times                                                                   |
| Judaism                 | 3 daily prayers (Shacharit, Mincha, Maariv)                                                          |
| Buddhism/Hinduism/Other | Customizable count + times                                                                           |
| Verification            | Per-prayer touch-and-hold oath ("I confirm I completed my prayer")                                   |
| Config needed           | `religion: Religion`, `prayerCount?: number`, `customTimes?: string[]`, `calculationMethod?: string` |
| Requires                | `adhan` npm package, Location permission (for Islamic prayer times)                                  |

### 6. Meditation (Timer-based, calm variant)

| Aspect          | Detail                                                             |
| --------------- | ------------------------------------------------------------------ |
| Default state   | Apps **BLOCKED**                                                   |
| Primary verify  | In-app meditation timer with breathing guide UI                    |
| Fallback verify | Hidden oath — accessible via small text link (not promoted)        |
| Config needed   | `dailyGoalMinutes: number`                                         |
| UI              | Calm TimerView variant — breathing animation, minimal distractions |

### 7. Reading (Timer + external app monitoring)

| Aspect           | Detail                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Default state    | Apps **BLOCKED**                                                                                                        |
| Primary verify   | In-app reading timer                                                                                                    |
| Secondary verify | Monitor usage of user-selected reading apps (Kindle, Apple Books) via DeviceActivity. Usage ≥ threshold → auto-complete |
| Fallback verify  | Oath confirmation                                                                                                       |
| Config needed    | `dailyGoalMinutes: number`, `readingApps?: string[]` (bundle IDs)                                                       |
| Native API       | `DeviceActivity` usage queries for reading app monitoring                                                               |

---

## Phase 1: Foundation & Types

### Step 1: New Habit Type System

- [x] **STEP 1 — Create habit type definitions**

**Goal**: Define the complete TypeScript type system for the 7 habits, their configs, streaks, and daily completion tracking.

**Files to create**:

- `src/types/habits.ts` — All new types

**Files to modify**:

- `src/types/index.ts` — Remove `FoxState` export, add `export * from './habits'`

**Read first** (understand existing type patterns):

- `src/types/index.ts` — Current types: `FoxState`, `ScreenTimeData`, `AppLimit`, `CategoryLimit`, `StreakData`, `UserPreferences`
- `src/types/onboarding.ts` — Current `OnboardingData` shape (will be rewritten later, but understand it)

**What to define in `src/types/habits.ts`**:

```typescript
// Habit type enum
type HabitType =
  | "screentime"
  | "study"
  | "fitness"
  | "sleep"
  | "prayer"
  | "meditation"
  | "reading";

// Habit status in the stacking lifecycle
type HabitStatus = "active" | "pending" | "stacked";

// Completion verification method
type CompletionMethod = "auto" | "timer" | "oath" | "healthkit" | "schedule";

// Religion for prayer habit
type Religion =
  | "islam"
  | "christianity"
  | "judaism"
  | "buddhism"
  | "hinduism"
  | "other";

// Fitness goal types
type FitnessGoalType = "steps" | "workout" | "calories";

// Per-habit config interfaces (discriminated union on `type`)
interface ScreentimeConfig {
  type: "screentime";
  dailyLimitMinutes: number;
}
interface StudyConfig {
  type: "study";
  dailyGoalMinutes: number;
  workLabel?: string;
}
interface FitnessConfig {
  type: "fitness";
  goalType: FitnessGoalType;
  goalValue: number;
}
interface SleepConfig {
  type: "sleep";
  bedtime: string;
  wakeTime: string;
}
interface PrayerConfig {
  type: "prayer";
  religion: Religion;
  prayerCount: number;
  customTimes?: string[];
  calculationMethod?: string;
}
interface MeditationConfig {
  type: "meditation";
  dailyGoalMinutes: number;
}
interface ReadingConfig {
  type: "reading";
  dailyGoalMinutes: number;
  readingApps?: string[];
}

type HabitConfig =
  | ScreentimeConfig
  | StudyConfig
  | FitnessConfig
  | SleepConfig
  | PrayerConfig
  | MeditationConfig
  | ReadingConfig;

// Streak tracking
interface HabitStreak {
  currentStreak: number;
  longestStreak: number;
  lastUpdated: string;
  history: string[];
}

// Daily completion record
interface DailyHabitCompletion {
  date: string;
  completed: boolean;
  completedAt?: string;
  method?: CompletionMethod;
}

// Main Habit object
interface Habit {
  id: string;
  type: HabitType;
  status: HabitStatus;
  priority: number;
  config: HabitConfig;
  streak: HabitStreak;
  dailyCompletion: DailyHabitCompletion;
  activatedAt?: string;
  stackedAt?: string;
  createdAt: string;
}

// Global streak across all habits
interface GlobalStreak {
  currentStreak: number;
  longestStreak: number;
  lastUpdated: string;
  history: string[];
}

// Habit metadata for UI rendering
interface HabitMeta {
  type: HabitType;
  label: string;
  description: string;
  icon: string; // lucide icon name
  color: string; // habitAccent key
}

// Sleep escalation state
interface SleepEscalationState {
  violations: string[];
  escalationMinutes: number;
  goodNightStreak: number;
  effectiveBedtime: string;
}

// Prayer tracking for multi-prayer religions
interface PrayerDayStatus {
  date: string;
  prayers: {
    name: string;
    time: string;
    completed: boolean;
    completedAt?: string;
  }[];
}
```

**In `src/types/index.ts`**: Remove the `FoxState` interface and its related types (`FoxMood`, `FoxEvolution`). Add `export * from './habits'`. Keep `ScreenTimeData`, `StreakData`, `UserPreferences` for now (migration path).

**Verify**: `npx tsc --noEmit` — Should pass. Existing fox references in stores/screens will break but that's expected (fixed in Step 3).

---

### Step 2: Create Habit Store

- [x] **STEP 2 — Build the central habit Zustand store**

**Goal**: Create the Zustand store that manages all habits, their completion state, streaks, the global blocked-apps selection, and stacking logic.

**Files to create**:

- `src/store/habitStore.ts`

**Read first** (understand existing store patterns — CRITICAL):

- `src/store/appStore.ts` — Follow its exact Zustand + AsyncStorage pattern:
  - `create<StoreType>()((set, get) => ({ ... }))`
  - `loadFromStorage()` — reads from AsyncStorage, calls `set()` with parsed data
  - `saveToStorage()` — serializes state to AsyncStorage (fire-and-forget)
  - Called after every mutation: `get().saveToStorage()`
- `src/store/onboardingStore.ts` — Same pattern, with `completeOnboarding()` flow

**State shape**:

```typescript
interface HabitStoreState {
  habits: Habit[];
  globalStreak: GlobalStreak;
  blockedAppsSelection: string | null; // FamilyActivitySelection token
  blockedAppsCount: { apps: number; categories: number };
  isInitialized: boolean;
}
```

**Actions to implement**:

```typescript
interface HabitStoreActions {
  // Lifecycle
  loadFromStorage(): Promise<void>;
  saveToStorage(): void;

  // CRUD
  addHabit(type: HabitType, config: HabitConfig, priority: number): void;
  removeHabit(id: string): void;
  updateHabitConfig(id: string, config: Partial<HabitConfig>): void;
  reorderHabits(orderedIds: string[]): void;

  // Blocked apps
  setBlockedApps(
    selection: string,
    counts: { apps: number; categories: number },
  ): void;

  // Daily completion
  completeHabit(id: string, method: CompletionMethod): void;
  resetDailyCompletions(): void;

  // Streak
  updateStreaks(date: string): void;

  // Stacking
  checkAndActivateNextHabit(): {
    graduated: Habit | null;
    activated: Habit | null;
  } | null;

  // Queries
  getActiveHabits(): Habit[];
  getPendingHabits(): Habit[];
  getStackedHabits(): Habit[];
  areAllActiveHabitsCompleted(): boolean;
  getUncompletedHabits(): Habit[];
  getHabitById(id: string): Habit | undefined;
}
```

**AsyncStorage key**: `@habits` (for the entire store state)

**Stacking logic** (`checkAndActivateNextHabit`):

- Find the first `active` habit with `streak.currentStreak >= 60`
- Set its status to `'stacked'`, record `stackedAt` timestamp
- Find the first `pending` habit (sorted by priority) → set to `'active'`, record `activatedAt`
- Return both for notification purposes

**Verify**: `npx tsc --noEmit` — Types from Step 1 should resolve. Store should be importable.

---

### Step 3: Simplify App Store & Remove Fox

- [x] **STEP 3 — Remove fox system, simplify app store, delete fox references**

**Goal**: Strip the fox companion system from the codebase. The fox state, fox UI, and all references must go. Simplify `appStore` to only keep screen time tracking and user preferences.

**Read first**:

- `src/store/appStore.ts` — Identify all fox-related state and actions to remove
- `src/types/index.ts` — `FoxState`, `FoxMood`, `FoxEvolution` types (should already be removed from Step 1, verify)
- `app/(tabs)/index.tsx` — Find fox references (FoxAvatar import, fox state usage)
- `app/(tabs)/progress.tsx` — Find fox references
- `app/(tabs)/settings.tsx` — Find fox references
- `app/_layout.tsx` — Find `initializeFox`, fox-related setup
- `app/onboarding/companion-setup.tsx` — Entire file is fox-related

**Files to modify**:

- `src/store/appStore.ts` — Remove: `fox` state, `initializeFox()`, `updateFoxMood()`, `updateFoxEvolution()`, `feedFox()`, `setFoxName()`. Remove: `appLimits`, `categoryLimits` and their actions (`setAppLimit`, `incrementAppUnlock`, `setCategoryLimit`, etc.). Keep: `todayData`, `streakData` (migration reference), `userPreferences`, `loadFromStorage()`, `saveToStorage()`, `updateStreak()`
- `app/(tabs)/index.tsx` — Remove fox imports, fox rendering, fox state access. Leave screen structure (will be rewritten in Step 12 but should compile)
- `app/(tabs)/progress.tsx` — Remove fox references
- `app/_layout.tsx` — Remove `initializeFox` calls, fox setup
- Any other file importing `FoxAvatar` or fox state

**Files to delete**:

- `src/components/FoxAvatar.tsx` (if it exists — check first)
- `app/onboarding/companion-setup.tsx`

**Approach**: Search the entire codebase for `fox`, `Fox`, `FoxAvatar`, `initializeFox`, `updateFoxMood`, `FoxState` to find all references. Remove each one. Replace with placeholder content where needed to keep screens rendering (e.g., replace fox section with empty View).

**Verify**: `npx tsc --noEmit` — All fox references gone. App should compile.

---

## Phase 2: Design System

### Step 4: Design System Overhaul — Dark-First Structured Minimalism

- [x] **STEP 4 — Rebuild entire design token system for Structured Minimalism / Dark-First UI**

**Goal**: Replace the existing calm/wellness color palette, typography (Lora + Inter), and spacing with the new Structured Minimalism system: dark-first backgrounds, SF Pro/SF Mono typography, tighter radii, status-driven color, and per-habit accent colors. This is a foundational change — every subsequent step builds on these tokens.

**Design reference**: `DESIGN_SYSTEM.md` (MUST READ before starting this step)

**Files to rewrite**:

- `src/constants/colors.ts` — Complete replacement with dark-first palette
- `src/constants/typography.ts` — Replace Lora/Inter with SF Pro/SF Mono type scale
- `src/constants/spacing.ts` — 4px-base spacing scale, tighter border radii
- `src/constants/themes.ts` — Rebuild light/dark themes using new token structure

**Files to modify**:

- `src/hooks/useThemedStyles.ts` — Update to return new token structure
- `src/constants/index.ts` — Verify all exports

**Read first**:

- `DESIGN_SYSTEM.md` — **CRITICAL**: The complete design spec. Every token defined here must match.
- `src/constants/colors.ts` — Understand current structure (to know what to replace)
- `src/constants/typography.ts` — Current Lora/Inter setup (being replaced)
- `src/constants/spacing.ts` — Current spacing (being tightened)
- `src/constants/themes.ts` — Current light/dark themes
- `src/hooks/useThemedStyles.ts` — How themes are consumed

**New `src/constants/colors.ts`**:

```typescript
/**
 * Serenity Design System — Color Tokens
 * Structured Minimalism / Dark-First UI
 *
 * Dark is the default. Color is earned through status and achievement.
 * See DESIGN_SYSTEM.md for full rationale.
 */

// ─── Brand Accent ──────────────────────────────────────────────────────
export const accent = {
  primary: "#E07A5F", // Terracotta — CTAs, key actions
  hover: "#C4624A", // Pressed/active state
  subtle: "#E07A5F1A", // 10% opacity backgrounds
  glow: "#E07A5F40", // 25% opacity shadows/glows
} as const;

// ─── Dark Theme Backgrounds (Default) ──────────────────────────────────
export const darkBg = {
  primary: "#0A0A0A", // Screen background — true black for OLED
  elevated: "#141414", // Cards, containers
  surface: "#1C1C1E", // Modals, sheets, raised surfaces
  subtle: "#252528", // Inputs, secondary containers
  hover: "#2C2C30", // Interactive hover/press states
} as const;

// ─── Light Theme Backgrounds ───────────────────────────────────────────
export const lightBg = {
  primary: "#FAFAFA", // Screen background
  elevated: "#FFFFFF", // Cards, containers
  surface: "#F5F5F5", // Modals, sheets
  subtle: "#EFEFEF", // Inputs, secondary containers
  hover: "#E8E8E8", // Interactive hover/press states
} as const;

// ─── Text Colors ───────────────────────────────────────────────────────
export const darkText = {
  primary: "#F5F5F5", // Headings — 95% white (never pure white)
  secondary: "#A1A1AA", // Body copy — zinc-400
  tertiary: "#71717A", // Hints, placeholders — zinc-500
  disabled: "#3F3F46", // Disabled — zinc-700
} as const;

export const lightText = {
  primary: "#09090B", // Headings — zinc-950 (never pure black)
  secondary: "#52525B", // Body copy — zinc-600
  tertiary: "#A1A1AA", // Hints — zinc-400
  disabled: "#D4D4D8", // Disabled — zinc-300
} as const;

// ─── Status Signal Colors ──────────────────────────────────────────────
// These carry meaning. They pop on dark backgrounds.
export const status = {
  success: "#22C55E",
  successSubtle: "#22C55E1A",
  warning: "#F59E0B",
  warningSubtle: "#F59E0B1A",
  error: "#EF4444",
  errorSubtle: "#EF44441A",
  info: "#3B82F6",
  infoSubtle: "#3B82F61A",
} as const;

// ─── Per-Habit Accent Colors ───────────────────────────────────────────
export const habitAccent = {
  screentime: "#6366F1", // Indigo
  study: "#3B82F6", // Blue
  fitness: "#F97316", // Orange
  sleep: "#8B5CF6", // Violet
  prayer: "#D4A017", // Gold
  meditation: "#06B6D4", // Cyan
  reading: "#A78BFA", // Light purple
} as const;

// ─── Habit Icon Map ────────────────────────────────────────────────────
export const habitIcons = {
  screentime: "Smartphone",
  study: "BookOpen",
  fitness: "Dumbbell",
  sleep: "Moon",
  prayer: "Hands",
  meditation: "Brain",
  reading: "BookText",
} as const;

// ─── Borders ───────────────────────────────────────────────────────────
export const darkBorder = {
  subtle: "#1F1F23",
  default: "#27272A", // zinc-800
  strong: "#3F3F46", // zinc-700
} as const;

export const lightBorder = {
  subtle: "#F4F4F5", // zinc-100
  default: "#E4E4E7", // zinc-200
  strong: "#D4D4D8", // zinc-300
} as const;

// ─── Overlays ──────────────────────────────────────────────────────────
export const overlay = {
  light: "rgba(10, 10, 10, 0.30)",
  medium: "rgba(10, 10, 10, 0.55)",
  heavy: "rgba(10, 10, 10, 0.75)",
} as const;
```

**New `src/constants/typography.ts`**:

```typescript
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
    font: FONTS.mono,
  },
  statMedium: {
    size: 34,
    weight: "600" as const,
    lineHeight: 38,
    tracking: 0,
    font: FONTS.mono,
  },
  statSmall: {
    size: 22,
    weight: "600" as const,
    lineHeight: 26,
    tracking: 0,
    font: FONTS.mono,
  },
  timer: {
    size: 64,
    weight: "300" as const,
    lineHeight: 68,
    tracking: -2,
    font: FONTS.mono,
  },
} as const;
```

**New `src/constants/spacing.ts`**:

```typescript
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
```

**Rebuild `src/constants/themes.ts`**:

```typescript
import {
  darkBg,
  lightBg,
  darkText,
  lightText,
  darkBorder,
  lightBorder,
  accent,
  status,
  habitAccent,
} from "./colors";

export const darkTheme = {
  bg: darkBg,
  text: darkText,
  accent,
  status,
  habitAccent,
  border: darkBorder,
  statusBar: "light-content" as const,
} as const;

export const lightTheme = {
  bg: lightBg,
  text: lightText,
  accent,
  status,
  habitAccent,
  border: lightBorder,
  statusBar: "dark-content" as const,
} as const;

export type Theme = typeof darkTheme;
```

**Update `src/hooks/useThemedStyles.ts`**: Update `useThemedColors()` to return the new theme structure (`.bg.primary`, `.text.primary`, etc. instead of `.background`, `.textPrimary`).

**Migration note**: This step changes the entire token API surface. Steps 5+ will use the new tokens. Existing screens may break — they will be rewritten in later steps.

**Verify**: `npx tsc --noEmit` — Theme types should resolve. Existing screen breakage is expected and acceptable.

---

### Step 5: Core Reusable UI Components

- [x] **STEP 5 — Build TimerView, OathConfirmation, ProgressRing, StreakBadge, HabitCard**

**Goal**: Create 5 reusable UI components that will be used across all habit screens and the main dashboard.

**Files to create**:

- `src/components/ui/ProgressRing.tsx`
- `src/components/ui/TimerView.tsx`
- `src/components/ui/OathConfirmation.tsx`
- `src/components/ui/StreakBadge.tsx`
- `src/components/ui/HabitCard.tsx`

**Files to modify**:

- `src/components/ui/index.ts` — Add exports for all 5 new components

**Read first** (extract patterns and logic from):

- `app/mindful-pause.tsx` — **CRITICAL**: Contains the existing hold-to-unlock logic (5s hold, haptic feedback, SVG ring animation, countdown phrases). Extract and generalize into `OathConfirmation` and `ProgressRing`.
- `src/components/ui/Button.tsx` — Component pattern: typed props interface, themed colors via `useThemedColors()`, `StyleSheet.create()`
- `src/components/ui/Card.tsx` — Variant pattern
- `src/constants/colors.ts` — `habitAccent` map (from Step 4)
- `src/types/habits.ts` — `Habit`, `HabitType`, `DailyHabitCompletion` types (from Step 1)

**Component specifications**:

**ProgressRing** (`ProgressRing.tsx`):

- Props: `progress: number` (0–1), `size: number`, `strokeWidth?: number` (default 4 — thin/precise per design system), `color: string`, `trackColor?: string` (default `border.dark.subtle`), `children?: ReactNode`
- SVG circle with `strokeDashoffset` animation via Reanimated
- Extracted from `mindful-pause.tsx` ring logic
- Track is barely visible (`border.subtle`), active stroke in accent or habit color

**TimerView** (`TimerView.tsx`):

- Props: `durationSeconds: number`, `onComplete: () => void`, `variant: 'focused' | 'calm'`, `habitColor: string`, `isRunning: boolean`, `onToggle: () => void`, `onReset: () => void`
- Large ProgressRing with time display in center (MM:SS format)
- Start/Pause button + Reset button below
- `focused` variant: habit accent color ring, sharp stroke. `calm` variant: softer ring, subtle breathing pulse on the progress track
- Uses `useRef` for interval, `useState` for elapsed seconds

**OathConfirmation** (`OathConfirmation.tsx`):

- Props: `oathText: string`, `onConfirmed: () => void`, `holdDurationMs?: number` (default 5000), `habitColor: string`
- Touch-and-hold button with ProgressRing filling over duration
- Haptic feedback every 500ms via `expo-haptics`
- Countdown phrases cycling (reuse from mindful-pause)
- On complete: single strong haptic + call `onConfirmed`
- Extract and generalize the hold logic from `app/mindful-pause.tsx` lines handling `panResponder`/`onPressIn`/`onPressOut`

**StreakBadge** (`StreakBadge.tsx`):

- Props: `count: number`, `label?: string`, `color?: string`, `size?: 'sm' | 'md' | 'lg'`
- Flame icon (lucide `Flame`) + count in **SF Mono** (`statSmall` or `statMedium`) + "days" label
- Subtle background pill shape (`borderRadius.full`), no colored circle — structured, not decorative

**HabitCard** (`HabitCard.tsx`):

- Props: `habit: Habit`, `onPress: (habit: Habit) => void`, `showStreak?: boolean`
- Dark card (`darkBg.elevated`, `border.dark.subtle` border, `borderRadius.lg`)
- 3px left-accent border in habit's accent color (`habitAccent[type]`)
- Content: habit icon (lucide, tinted in habit accent color, 20px, stroke 1.5) + habit name (`headline`) + goal summary (`callout`, `textSecondary`) + completion indicator + optional streak badge
- Completed state: green left-accent + checkmark icon + 0.7 opacity
- No shadows — borders only for elevation

**Verify**: `npx tsc --noEmit`

---

### Step 6: Habit-Specific Compound Components

- [x] **STEP 6 — Build DailyChecklist, HabitConfigCard, PrayerTimesList**

**Goal**: Create 3 compound components that compose the primitives from Step 5 into feature-level views.

**Files to create**:

- `src/components/DailyChecklist.tsx`
- `src/components/HabitConfigCard.tsx`
- `src/components/PrayerTimesList.tsx`

**Read first**:

- `src/components/ui/HabitCard.tsx` (from Step 5) — DailyChecklist is a list of these
- `src/components/ui/OathConfirmation.tsx` (from Step 5) — PrayerTimesList uses this per prayer
- `src/store/habitStore.ts` (from Step 2) — `getActiveHabits()`, `areAllActiveHabitsCompleted()`
- `src/types/habits.ts` (from Step 1) — `Habit`, `PrayerDayStatus`

**Component specifications**:

**DailyChecklist** (`DailyChecklist.tsx`):

- Props: `habits: Habit[]`, `onHabitPress: (habit: Habit) => void`
- Renders a vertical list of HabitCards for today
- Header: "Today's Habits" with completion count ("3/5 completed")
- Groups: completed habits at bottom (collapsed), uncompleted at top

**HabitConfigCard** (`HabitConfigCard.tsx`):

- Props: `habitType: HabitType`, `config: HabitConfig`, `onConfigChange: (config: HabitConfig) => void`
- Renders the appropriate config controls based on `habitType`:
  - Screentime → limit stepper (hours/minutes)
  - Study → duration stepper, optional label input
  - Fitness → goal type picker + value stepper
  - Sleep → bedtime/wake time pickers
  - Prayer → religion selector + count
  - Meditation → duration stepper
  - Reading → duration stepper + app selector
- Used in both onboarding config screens AND settings edit screens

**PrayerTimesList** (`PrayerTimesList.tsx`):

- Props: `prayers: PrayerDayStatus['prayers']`, `onPrayerConfirmed: (prayerName: string) => void`, `habitColor: string`
- Vertical list of prayer cards, each showing: prayer name, scheduled time, completion status
- Current/next prayer highlighted with accent border
- Each uncompleted prayer has an OathConfirmation button
- Completed prayers show checkmark

**Verify**: `npx tsc --noEmit`

---

## Phase 3: Onboarding Rewrite

### Step 7: Onboarding Infrastructure

- [x] **STEP 7 — Rewrite onboarding types, store, and flow config**

**Goal**: Replace the current onboarding data model and flow with the new habit-centric version. This is infrastructure only — screens come in Steps 8–11.

**Files to rewrite**:

- `src/types/onboarding.ts`
- `src/store/onboardingStore.ts`
- `src/config/onboardingFlow.ts`

**Read first** (understand current patterns to preserve):

- `src/types/onboarding.ts` — Current `OnboardingData` interface (will be fully replaced)
- `src/store/onboardingStore.ts` — **CRITICAL**: Understand the `completeOnboarding()` save sequence (AsyncStorage first → emit event → Supabase background). Preserve this exact pattern.
- `src/config/onboardingFlow.ts` — **CRITICAL**: Understand `STEP_REGISTRY`, `FLOW_VARIANTS`, `getNextStep()`, `getPreviousStep()`, `getProgressFraction()`, `skipWhen()` conditional logic. The new flow must support dynamic per-habit config screens.
- `src/hooks/useOnboardingNext.ts` — Consumes the flow config. Don't modify this file, but ensure the new flow config is compatible
- `src/services/posthog.ts` — PostHog feature flag integration for flow variants

**New `src/types/onboarding.ts`**:

```typescript
import { HabitType, HabitConfig, Religion } from "./habits";

export interface OnboardingData {
  // Habits
  selectedHabits: HabitType[];
  habitPriority: HabitType[]; // ordered by user priority
  habitConfigs: Partial<Record<HabitType, HabitConfig>>;

  // Blocked apps
  selectedApps: string[]; // bundle IDs
  selectedCategories: string[];
  familyActivitySelection?: string; // opaque token

  // Permissions
  screenTimePermissionGranted: boolean;
  notificationsEnabled: boolean;
  healthKitPermissionGranted: boolean;
  locationPermissionGranted: boolean;

  // Pact
  pactAccepted: boolean;

  // Analytics
  analyticsEnabled: boolean;
  completedAt?: string;
}
```

**New `src/store/onboardingStore.ts`**: Same Zustand + AsyncStorage pattern. Key actions: `updateData(partial)`, `selectHabit(type)`, `deselectHabit(type)`, `setHabitPriority(ordered)`, `setHabitConfig(type, config)`, `completeOnboarding()` (preserve existing save pattern), `resetOnboarding()`.

**New `src/config/onboardingFlow.ts`**:

- New `STEP_REGISTRY` with steps: `welcome`, `how-it-works`, `the-pact`, `habit-selection`, `habit-priority`, `config-screentime`, `config-study`, `config-fitness`, `config-sleep`, `config-prayer`, `config-meditation`, `config-reading`, `app-selection`, `screentime-permission`, `notification-permission`, `healthkit-permission`, `pact-screen`, `building-plan`
- Per-habit config steps have `skipWhen(ctx) => !ctx.selectedHabits.includes('...')`
- `healthkit-permission` has `skipWhen(ctx) => !ctx.selectedHabits.includes('fitness')`
- Default flow order: welcome → how-it-works → the-pact → habit-selection → habit-priority → [config screens for selected habits] → app-selection → screentime-permission → notification-permission → [healthkit-permission if fitness] → pact-screen → building-plan

**Verify**: `npx tsc --noEmit` — Onboarding screens will break (they reference old data shape). That's expected, they're rewritten in Steps 8–11.

---

### Step 8: Onboarding Intro Screens

- [x] **STEP 8 — Rewrite welcome screen, create how-it-works and the-pact, delete unused screens**

**Goal**: Create the first 3 onboarding screens and delete all screens that are no longer part of the flow.

**Files to create**:

- `app/onboarding/how-it-works.tsx`
- `app/onboarding/the-pact.tsx`

**Files to rewrite**:

- `app/onboarding/index.tsx` — New welcome screen

**Files to delete**:

- `app/onboarding/name-input.tsx`
- `app/onboarding/name-intro.tsx`
- `app/onboarding/problem-selection.tsx`
- `app/onboarding/solution-preview.tsx`
- `app/onboarding/stats-intro.tsx`
- `app/onboarding/pause-reflect.tsx`
- `app/onboarding/mindful-sessions.tsx`
- `app/onboarding/phone-usage.tsx`
- `app/onboarding/usage-patterns.tsx`
- `app/onboarding/companion-setup.tsx` (if not deleted in Step 3)

**Read first** (understand the onboarding screen pattern):

- `app/onboarding/daily-goal.tsx` — Best reference for screen structure: SafeAreaView, StatusBar, OnboardingHeader, useSequentialFadeIn, Animated.View/Text wrappers, Button CTA, `navigateNext()` on continue
- `app/onboarding/_layout.tsx` — Stack navigator config for onboarding
- `src/components/OnboardingHeader.tsx` — Progress bar + back button
- `src/hooks/useOnboardingNext.ts` — `navigateNext()`, `navigatePrev()`, `progressFraction`
- `src/hooks/useOnboardingAnimation.ts` — `useSequentialFadeIn(count, { duration, stagger })`

**Screen: `index.tsx` (Welcome)**:

- Dark background (`bg.primary`), full screen
- S-shield logo mark centered, Lottie fade-in animation
- "Build Habits That Stick" title (SF Pro Display `display`, bold, `text.primary`)
- Subtitle: "Serenity blocks your apps until you complete your daily habits. One habit at a time. Two months to build it. Then stack the next." (`callout`, `text.secondary`)
- "Get Started" CTA button (terracotta accent, full width, `borderRadius.md`)
- Sequential fade-in for 4 elements (logo, title, subtitle, button) — 200ms stagger

**Screen: `how-it-works.tsx`**:

- Dark background, 3 cards explaining the system:
  1. "Choose Your Habits" — Pick from 7 life-changing habits
  2. "Build One at a Time" — Focus on your top priority for 60 days
  3. "Stack & Grow" — Once built, add the next habit on top
- Each card: `bg.elevated` background, `border.subtle` border, `borderRadius.lg`. Lucide icon (20px, `text.secondary`) + title (`headline`) + description (`callout`, `text.secondary`)
- "Continue" CTA (terracotta accent)
- Sequential staggered fade-in for cards (200ms apart)

**Screen: `the-pact.tsx`**:

- Dark background, serious tone:
  - "This is a Commitment" (SF Pro Display `title1`, bold, `text.primary`)
  - "Your apps will be blocked every day until you complete your habits. There are no shortcuts." (`body`, `text.secondary`)
  - "This program works because it's strict. You're making a pact with yourself." (`body`, `text.secondary`)
- Shield icon from lucide (32px, terracotta accent color) centered above title
- "I Understand" CTA button (terracotta accent)
- This screen sets the emotional tone — no decorative elements, just gravity

**Verify**: `npx tsc --noEmit` — All remaining onboarding screens should compile. The deleted screens won't cause import errors because they're only referenced from the flow config (updated in Step 7).

---

### Step 9: Habit Selection & Priority Screens

- [x] **STEP 9 — Create habit-selection and habit-priority onboarding screens**

**Goal**: Let users select which habits they want and order them by priority.

**Files to create**:

- `app/onboarding/habit-selection.tsx`
- `app/onboarding/habit-priority.tsx`

**Read first**:

- `app/onboarding/daily-goal.tsx` — Screen structure pattern
- `src/constants/colors.ts` — `habitAccent` map, `habitIcons` map (from Step 4)
- `src/store/onboardingStore.ts` — `selectHabit()`, `deselectHabit()`, `updateData()` (from Step 7)
- `src/types/habits.ts` — `HabitType`, `HabitMeta` (from Step 1)

**Screen: `habit-selection.tsx`**:

- Title: "Choose Your Habits" (SF Pro `title1`, bold, `text.primary`)
- Subtitle: "Select the habits you want to build. You'll focus on one at a time." (`callout`, `text.secondary`)
- Grid (2 columns) of 7 habit cards, each on `bg.elevated` with `border.subtle` border:
  - Lucide icon (20px, tinted in `habitAccent[type]`)
  - Habit name label (`headline`)
  - Short description (`caption1`, `text.tertiary`)
  - Toggle: tappable, selected state = `habitAccent[type]` border + checkmark icon
  - Unselected state = `border.default`
- Validation: at least 1 habit must be selected
- "Continue" CTA (disabled if none selected)
- Free users: if >1 selected, show subtle "Pro" badge on extra habits. Allow selection but note "Pro required for multiple habits" (actual enforcement at paywall)

**Screen: `habit-priority.tsx`**:

- Title: "Set Your Priority" (SF Pro `title1`, bold)
- Subtitle: "Drag to reorder. Your #1 habit is what you'll build first for 60 days." (`callout`, `text.secondary`)
- List of selected habits (from onboarding store) as draggable cards
  - Each card: number badge + habit icon + habit name
  - Visual: #1 is highlighted/larger
- Explain: "After 60 days of your first habit, Serenity will automatically add #2, and so on."
- "Continue" CTA
- Note: For drag-and-drop, use `react-native-gesture-handler` (already installed) with reanimated. If too complex for one step, use simple "move up/down" arrow buttons instead.

**Verify**: `npx tsc --noEmit`

---

### Step 10: Per-Habit Configuration Screens

- [x] **STEP 10 — Create 7 habit configuration onboarding screens**

**Goal**: Each selected habit needs a config screen to collect its specific settings.

**Files to create**:

- `app/onboarding/config-screentime.tsx`
- `app/onboarding/config-study.tsx`
- `app/onboarding/config-fitness.tsx`
- `app/onboarding/config-sleep.tsx`
- `app/onboarding/config-prayer.tsx`
- `app/onboarding/config-meditation.tsx`
- `app/onboarding/config-reading.tsx`

**Read first**:

- `app/onboarding/daily-goal.tsx` — **Best reference**: Has stepper UI (plus/minus buttons + large number display). Copy this pattern for duration/count steppers.
- `src/components/HabitConfigCard.tsx` (from Step 6) — May be usable here or referenced
- `src/store/onboardingStore.ts` — `setHabitConfig(type, config)` (from Step 7)
- `src/types/habits.ts` — Each config type interface (from Step 1)

**All screens follow this layout** (dark background, structured minimalism):

```
SafeAreaView (bg.primary) → OnboardingHeader → Title (SF Pro title1) → Subtitle (callout, text.secondary) → Config Controls → CTA Button (terracotta accent)
```

With sequential fade-in for 4–5 animated elements (200ms stagger).

**Screen: `config-screentime.tsx`**:

- Title: "Daily Screen Limit"
- Stepper for hours (1–16) + stepper for minutes (0/15/30/45)
- Display: "Your apps will stay open until you exceed X hours Y minutes"
- Saves: `{ type: 'screentime', dailyLimitMinutes: hours * 60 + minutes }`

**Screen: `config-study.tsx`**:

- Title: "Daily Study Goal"
- Stepper for minutes (15–480, step 15)
- Optional text input for work label (e.g., "University", "Work Project")
- Display: "You'll need to complete X minutes of focused work each day"
- Saves: `{ type: 'study', dailyGoalMinutes, workLabel }`

**Screen: `config-fitness.tsx`**:

- Title: "Fitness Goal"
- Goal type selector: 3 cards — Steps, Workout Duration, Active Calories
- Value stepper (adapts to type):
  - Steps: 1000–30000, step 1000 (default 8000)
  - Workout: 15–120 min, step 15 (default 30)
  - Calories: 100–1000 kcal, step 50 (default 300)
- Note: "Serenity will read your fitness data from Apple Health"
- Saves: `{ type: 'fitness', goalType, goalValue }`

**Screen: `config-sleep.tsx`**:

- Title: "Sleep Schedule"
- Two time pickers: Bedtime (default 22:00), Wake time (default 07:00)
- Explain: "Your apps will lock at bedtime and unlock at wake time. If you don't respect your schedule, the lock time will move earlier."
- Saves: `{ type: 'sleep', bedtime: 'HH:mm', wakeTime: 'HH:mm' }`

**Screen: `config-prayer.tsx`**:

- Title: "Prayer Practice"
- Religion selector: 6 options as tappable cards — Islam, Christianity, Judaism, Buddhism, Hinduism, Other
- Dynamic based on selection:
  - Islam: "5 daily prayers calculated from your location" (auto prayer count = 5)
  - Christianity: Number stepper (1–7, default 1) + "At what time?" single time picker
  - Judaism: "3 daily prayers" (auto = 3)
  - Buddhism/Hinduism/Other: Number stepper (1–5) + time picker per prayer
- Saves: `{ type: 'prayer', religion, prayerCount, customTimes?, calculationMethod? }`

**Screen: `config-meditation.tsx`**:

- Title: "Daily Meditation"
- Stepper for minutes (5–60, step 5, default 10)
- Display: "You'll meditate for X minutes each day to unlock your apps"
- Saves: `{ type: 'meditation', dailyGoalMinutes }`

**Screen: `config-reading.tsx`**:

- Title: "Daily Reading"
- Stepper for minutes (10–120, step 5, default 20)
- Optional: "Track reading apps?" toggle. If on, show app selection hint (actual selection done post-onboarding in settings)
- Saves: `{ type: 'reading', dailyGoalMinutes, readingApps: [] }`

**Verify**: `npx tsc --noEmit`

---

### Step 11: Final Onboarding Screens

- [x] **STEP 11 — Rework app-selection, add healthkit-permission, create pact-screen, rework building-plan**

**Goal**: Complete the onboarding flow with app selection, permissions, and the final pact commitment.

**Files to create**:

- `app/onboarding/healthkit-permission.tsx`
- `app/onboarding/pact-screen.tsx`

**Files to modify**:

- `app/onboarding/app-selection.tsx` — Change messaging
- `app/onboarding/building-plan.tsx` — New content

**Files to keep as-is (or minimal changes)**:

- `app/onboarding/screentime-permission.tsx`
- `app/onboarding/notification-permission.tsx`
- `app/onboarding/daily-goal.tsx` — Remove or repurpose (no longer in flow, but keep file if it doesn't break routing)
- `app/onboarding/_layout.tsx` — Should work with new routes if using Expo Router catch-all

**Read first**:

- `app/onboarding/app-selection.tsx` — Current app selection with `DeviceActivitySelectionView`. Keep the native picker, change the messaging.
- `app/onboarding/screentime-permission.tsx` — Pattern for permission screens
- `app/onboarding/building-plan.tsx` — Current auto-redirect animation pattern
- `src/components/ui/OathConfirmation.tsx` (from Step 5) — Used in pact-screen

**Rework: `app-selection.tsx`**:

- Change title to "Select Apps to Block"
- Change subtitle to "Choose ALL apps except the essentials you need (phone, messages, maps). These will be blocked until you complete your daily habits."
- Keep the `DeviceActivitySelectionView` native picker exactly as-is
- Change the info text from current messaging to emphasize: "The more apps you block, the stronger your commitment."

**New: `healthkit-permission.tsx`**:

- Only shown when fitness habit is selected (skip logic in flow config)
- Title: "Connect Apple Health"
- Subtitle: "Serenity needs to read your fitness data to verify your workout goals."
- Request HealthKit authorization (will use the native module from Step 21, but for now just request permission and store result)
- Shield icon + Heart Pulse icon (lucide)
- "Allow Access" CTA

**New: `pact-screen.tsx`**:

- Title: "Your Pact" (SF Pro Display `display`, bold, `text.primary`)
- Summary card listing: selected habits + their goals (from onboarding store)
- OathConfirmation component with oath text: "I commit to building these habits. I understand my apps will be blocked until I complete them each day. I will uphold this pact."
- Hold duration: 5 seconds
- On confirmed: `onboardingStore.updateData({ pactAccepted: true })` → `navigateNext()`
- This is the emotional/commitment peak of onboarding

**Rework: `building-plan.tsx`**:

- Dark background, habit stacking timeline:
  - List of selected habits in priority order on `bg.elevated` cards
  - First habit highlighted: terracotta accent border + "Starting now — 60 days to build" (`headline`)
  - Remaining habits: `text.tertiary` + "Coming up next" with estimated dates in SF Mono
- Subtle animated progress bars per habit (monochrome fill on `border.subtle` track)
- After 5s: auto-redirect to paywall (preserve existing pattern)

**Verify**: `npx tsc --noEmit` — Full onboarding flow should be navigable from welcome to building-plan.

---

## Phase 4: Main App Screens

### Step 12: Home Tab — Daily Habit Dashboard

- [x] **STEP 12 — Rewrite the home tab as a habit dashboard**

**Goal**: Replace the current app groups management screen with a daily habit checklist showing today's habit status, completion actions, and global unlock state.

**Files to rewrite**:

- `app/(tabs)/index.tsx`

**Read first**:

- `app/(tabs)/index.tsx` — Current screen structure (FlatList, RefreshControl, header, cards)
- `src/store/habitStore.ts` (from Step 2) — `getActiveHabits()`, `areAllActiveHabitsCompleted()`, `getUncompletedHabits()`
- `src/components/DailyChecklist.tsx` (from Step 6) — Main content component
- `src/components/ui/StreakBadge.tsx` (from Step 5) — For header streak display
- `src/types/habits.ts` — `Habit`, `HabitType`
- `app/(tabs)/_layout.tsx` — Tab config (may need icon/label update)

**New screen structure**:

```
SafeAreaView (bg.primary — dark)
├── Header Row
│   ├── "Today" title (SF Pro title1, text.primary) + formatted date (subheadline, text.secondary)
│   └── StreakBadge (SF Mono stat number, gold flame icon)
├── Status Banner (conditional)
│   ├── All done: "All habits complete! Apps unlocked" (status.successSubtle bg, status.success text)
│   └── Pending: "Complete X more habits to unlock" (status.warningSubtle bg, status.warning text)
├── ScrollView (gap: 12px between cards)
│   ├── DailyChecklist (HabitCards on bg.elevated, 3px left accent per habit)
│   └── Stacked habits section (collapsed, reduced opacity)
└── [Upgrade button if !isPro and >1 habit selected]
```

**Tap actions per habit type**:

- `screentime` → Navigate to status view (showing usage vs limit)
- `study` → Navigate to `/study-timer`
- `fitness` → Navigate to `/fitness-status`
- `sleep` → Show sleep schedule info
- `prayer` → Navigate to `/prayer-status`
- `meditation` → Navigate to `/meditation-timer`
- `reading` → Navigate to `/reading-timer`

**Verify**: `npx tsc --noEmit`

---

### Step 13: Progress Tab — Streaks & Analytics

- [x] **STEP 13 — Rewrite progress tab with per-habit streaks and calendar view**

**Goal**: Replace the current progress screen with global/per-habit streaks, a calendar heatmap, and habit stacking timeline.

**Files to rewrite**:

- `app/(tabs)/progress.tsx`

**Read first**:

- `app/(tabs)/progress.tsx` — Current structure (period toggle, chart, streak cards). Preserve the `ActivityReportView` for screen time data.
- `src/store/habitStore.ts` — `habits` array with per-habit `streak`, `globalStreak`
- `src/components/ui/StreakBadge.tsx` (from Step 5)
- `src/constants/colors.ts` — `habitAccent`

**New screen structure**:

```
SafeAreaView (bg.primary — dark)
├── Header: "Progress" (title1) + [Upgrade button]
├── ScrollView
│   ├── Global Streak Card (bg.elevated, SF Mono statLarge number, Flame icon in gold)
│   ├── Per-Habit Streaks (horizontal ScrollView of cards, each with habitAccent color)
│   ├── Calendar Heatmap (7-column grid, 5 weeks visible)
│   │   └── Cell colors: status.success (all done), status.warning (partial),
│   │       status.error (missed), bg.subtle (future). Tight 4px radius squares.
│   ├── Habit Stacking Timeline
│   │   └── Vertical timeline, monochrome with habit accent dots at milestones
│   ├── Statistics Card (SF Mono for all numbers)
│   │   └── Total habits built, completion rate, best streak
│   └── ActivityReportView (screen time data, keep from current)
```

**Calendar heatmap**: Simple View grid (7 columns × 5 rows). Each cell is a small colored square. Data from `habitStore.habits[].streak.history` arrays.

**Verify**: `npx tsc --noEmit`

---

### Step 14: Settings Tab Update

- [x] **STEP 14 — Add habit management to settings**

**Goal**: Allow users to edit habit configs, manage blocked apps, and add/remove habits from settings.

**Files to rewrite**:

- `app/(tabs)/settings.tsx`

**Read first**:

- `app/(tabs)/settings.tsx` — Current structure (appearance, preferences, subscription, dev tools). Preserve: appearance toggle, subscription management, dev tools.
- `src/store/habitStore.ts` — `getActiveHabits()`, `getPendingHabits()`, `updateHabitConfig()`, `addHabit()`, `removeHabit()`
- `src/components/HabitConfigCard.tsx` (from Step 6) — For inline config editing

**New screen structure**:

```
SafeAreaView (bg.primary — dark)
├── Header: "Settings" (title1)
├── ScrollView (grouped sections, title3 section headers, bg.elevated cards)
│   ├── Active Habits Section
│   │   └── List of active habits with "Edit" button each → modal/inline config editor
│   ├── Pending Habits Section (if any)
│   │   └── List showing queue order + "Move Up/Down" actions
│   ├── Add Habit Button (ghost variant, border.default)
│   ├── Blocked Apps Section
│   │   ├── "Manage Blocked Apps" → DeviceActivitySelectionView
│   │   └── Current count: SF Mono number + "apps · Y categories blocked" (callout)
│   ├── Appearance Card (Dark / Light / System — dark is default)
│   ├── Notifications Card
│   ├── Subscription Card (RevenueCat)
│   └── Dev Tools
│
│   List items: 48px min height, text.primary label, chevron in text.tertiary
│   Destructive actions: status.error text, status.errorSubtle background
```

**Verify**: `npx tsc --noEmit`

---

## Phase 5: Habit Engines

> **Agents**: Each step below creates a habit service AND its associated screen (if applicable). Read the matching entry in the "Habit Verification Architecture" section above for full details on verification logic.

### Step 15: Screentime Limit Engine

- [x] **STEP 15 — Implement reversed screentime blocking**

**Goal**: Set up DeviceActivity threshold monitoring so apps are open until the user exceeds their daily limit, then blocked for the rest of the day.

**Files to create**:

- `src/services/habits/screentimeHabit.ts`

**Files to modify**:

- `targets/ActivityMonitorExtension/` — Swift code to handle threshold events

**Read first**:

- `src/services/appGroups.ts` — **CRITICAL**: Understand how `blockSelection()`, `unblockSelection()` work. Understand shield configuration writing. Understand `startMonitoring()` with `DeviceActivityEvent`.
- `targets/ActivityMonitorExtension/` — All Swift files. Understand `intervalDidStart`, `intervalDidEnd`, `eventDidReachThreshold` callbacks.
- `modules/screentime/index.ts` — Native bridge methods available
- `src/store/habitStore.ts` — `completeHabit()`, `getHabitById()`

**Service specification** (`screentimeHabit.ts`):

```typescript
export const ScreentimeHabitService = {
  // Start monitoring for the day — sets threshold event at user's limit
  startDailyMonitoring(limitMinutes: number, selection: string): Promise<void>;

  // Called when threshold is reached (from native callback)
  onThresholdReached(): Promise<void>;  // blocks selection, marks habit as failed for day

  // Daily reset — unblock and restart monitoring
  resetForNewDay(limitMinutes: number, selection: string): Promise<void>;

  // Check current status
  getStatus(): Promise<{ usageMinutes: number; limitMinutes: number; exceeded: boolean }>;
};
```

**Native changes** (ActivityMonitorExtension):

- In `eventDidReachThreshold`: Write to UserDefaults that threshold was reached for screentime habit
- The main app reads this on foreground and triggers blocking

**Verify**: Manual test on physical device — set a low limit (e.g., 1 minute), use phone, verify apps get blocked.

---

### Step 16: Study/Work Timer Engine

- [x] **STEP 16 — Build study timer service and screen**

**Goal**: Create a focus timer where users start a session, complete their study goal, and apps unlock.

**Files to create**:

- `src/services/habits/studyHabit.ts`
- `app/study-timer.tsx`

**Read first**:

- `src/components/ui/TimerView.tsx` (from Step 5) — Reuse for the timer display
- `src/components/ui/OathConfirmation.tsx` (from Step 5) — For the fallback oath
- `src/store/habitStore.ts` — `completeHabit(id, 'timer')`, `getHabitById()`
- `app/mindful-pause.tsx` — Screen layout inspiration (full-screen modal with blur)

**Service specification** (`studyHabit.ts`):

```typescript
export const StudyHabitService = {
  // Timer state
  startTimer(goalMinutes: number): void;
  pauseTimer(): void;
  resumeTimer(): void;
  getElapsedSeconds(): number;
  isComplete(goalMinutes: number): boolean;

  // Persistence — save timer state across app switches
  saveTimerState(): Promise<void>;
  loadTimerState(): Promise<TimerState | null>;
};

interface TimerState {
  startedAt: string;
  pausedAt?: string;
  totalPausedSeconds: number;
  goalMinutes: number;
}
```

**Screen: `app/study-timer.tsx`**:

- Full-screen dark layout (`bg.primary`), habit accent color (study blue `#3B82F6`) for ring
- Large TimerView with SF Mono `timer` display (64px, light weight, countdown)
- BookOpen icon (20px, study blue) + "Focus Session" title (`title2`) + goal text (`callout`, `text.secondary`)
- Start/Pause toggle button (terracotta accent) + Reset button (ghost)
- On completion: checkmark draw animation (400ms) → `habitStore.completeHabit()` → navigate back
- Bottom: small text link (`footnote`, `text.tertiary`) "I already completed my work" → OathConfirmation modal
  - Oath text: "I swear that I have completed my study/work for today. I uphold my commitment."

**Verify**: `npx tsc --noEmit`. Manual test: start timer, let it run, verify completion callback.

---

### Step 17: Meditation Timer Engine

- [x] **STEP 17 — Build meditation timer service and screen**

**Goal**: Create a calm meditation timer with breathing guide.

**Files to create**:

- `src/services/habits/meditationHabit.ts`
- `app/meditation-timer.tsx`

**Read first**:

- `src/services/habits/studyHabit.ts` (from Step 16) — Same timer pattern, different UI
- `src/components/ui/TimerView.tsx` (from Step 5) — Use 'calm' variant
- `src/components/ui/OathConfirmation.tsx` (from Step 5)
- `src/store/habitStore.ts` — `completeHabit(id, 'timer')`

**Service**: Same pattern as `studyHabit.ts` but named `MeditationHabitService`.

**Screen: `app/meditation-timer.tsx`**:

- Full-screen, `bg.primary` dark background, meditation cyan (`#06B6D4`) accent for ring
- Large TimerView with 'calm' variant (SF Mono `timer`, thin soft ring with subtle pulse)
- Breathing guide: animated text (`body`, `text.secondary`) cycling "Breathe in..." → "Hold..." → "Breathe out..." with 4-7-8 timing
- Extreme minimalism — just the timer ring, breathing text, and a small "Done" `ghost` button on completion
- Haptic pulse on breathing transitions (gentle)
- **Hidden** oath fallback: `caption2` text at very bottom, `text.tertiary` — "Already meditated?" → OathConfirmation
  - Oath text: "I confirm I have completed my meditation practice today."

**Verify**: `npx tsc --noEmit`

---

### Step 18: Reading Engine

- [x] **STEP 18 — Build reading timer service with external app monitoring**

**Goal**: Reading timer + option to auto-detect usage of reading apps.

**Files to create**:

- `src/services/habits/readingHabit.ts`
- `app/reading-timer.tsx`

**Read first**:

- `src/services/habits/studyHabit.ts` (from Step 16) — Timer pattern
- `src/services/appGroups.ts` — DeviceActivity usage query capabilities (check if screen time data can be queried per-app)
- `modules/screentime/index.ts` — `getScreenTimeData()` method (if available)
- `src/components/ui/TimerView.tsx` — Timer display
- `src/store/habitStore.ts` — `completeHabit()`, `getHabitById()`

**Service specification** (`readingHabit.ts`):

```typescript
export const ReadingHabitService = {
  // Timer (same as study)
  startTimer(goalMinutes: number): void;
  pauseTimer(): void;
  resumeTimer(): void;
  getElapsedSeconds(): number;
  isComplete(goalMinutes: number): boolean;

  // External app monitoring
  checkReadingAppUsage(readingApps: string[], thresholdMinutes: number): Promise<boolean>;

  // Combined check: timer OR external app usage
  isGoalMet(goalMinutes: number, readingApps?: string[]): Promise<boolean>;

  saveTimerState(): Promise<void>;
  loadTimerState(): Promise<TimerState | null>;
};
```

**Screen: `app/reading-timer.tsx`**:

- Full-screen dark layout, reading accent color (`#A78BFA` light purple) for ring
- BookText icon (20px, reading purple) + "Reading Session" title (`title2`)
- SF Mono timer display, progress ring in reading accent
- If reading apps configured: show info text (`footnote`, `text.tertiary`) "or read in your apps for X minutes"
- Timer + Start/Pause/Reset
- Oath fallback as `caption2` text link

**Verify**: `npx tsc --noEmit`

---

### Step 19: Sleep Engine

- [x] **STEP 19 — Build sleep schedule engine with escalation**

**Goal**: Time-based app locking (bedtime → wake time) with escalation for violations.

**Files to create**:

- `src/services/habits/sleepHabit.ts`

**Read first**:

- `src/services/appGroups.ts` — `blockSelection()`, `unblockSelection()`, schedule-based blocking
- `src/store/habitStore.ts` — Habit state, sleep config
- `src/types/habits.ts` — `SleepConfig`, `SleepEscalationState`

**Service specification** (`sleepHabit.ts`):

```typescript
export const SleepHabitService = {
  // Schedule
  setupSchedule(config: SleepConfig, escalation: SleepEscalationState): void;
  getEffectiveBedtime(config: SleepConfig, escalation: SleepEscalationState): string;

  // Blocking
  shouldBeBlocked(config: SleepConfig, escalation: SleepEscalationState): boolean;
  blockForSleep(selection: string): Promise<void>;
  unblockAfterWake(selection: string): Promise<void>;

  // Escalation
  recordViolation(date: string, escalation: SleepEscalationState): SleepEscalationState;
  recordGoodNight(escalation: SleepEscalationState): SleepEscalationState;
  checkAndUpdateEscalation(config: SleepConfig, escalation: SleepEscalationState): SleepEscalationState;

  // Persistence
  saveEscalationState(state: SleepEscalationState): Promise<void>;
  loadEscalationState(): Promise<SleepEscalationState>;
};
```

**Escalation rules**:

- Violation detected: phone usage after effective bedtime → `escalationMinutes += 30` (cap at 120)
- Good night: no usage after bedtime → `goodNightStreak += 1`; if `goodNightStreak >= 3` → `escalationMinutes = max(0, escalationMinutes - 30)`, reset `goodNightStreak`
- Effective bedtime: `config.bedtime - escalationMinutes`
- Floor: effective bedtime cannot be earlier than 20:00 (8 PM)

**No screen needed** — sleep operates on schedule only. Status shown on HabitCard in home tab.

**Verify**: `npx tsc --noEmit`

---

### Step 20: Prayer Engine

- [x] **STEP 20 — Build prayer tracking service with adhan integration and prayer screen**

**Goal**: Religion-adaptable prayer tracking with per-prayer verification.

**Files to create**:

- `src/services/habits/prayerHabit.ts`
- `app/prayer-status.tsx`

**Files to modify**:

- `package.json` — Add `adhan` dependency

**Read first**:

- `src/types/habits.ts` — `PrayerConfig`, `PrayerDayStatus`, `Religion`
- `src/components/PrayerTimesList.tsx` (from Step 6) — Prayer list UI
- `src/components/ui/OathConfirmation.tsx` (from Step 5) — Per-prayer oath
- `src/store/habitStore.ts` — `completeHabit()`

**Install**: `npm install adhan` (or `yarn add adhan`)

**Service specification** (`prayerHabit.ts`):

```typescript
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

export const PrayerHabitService = {
  // Prayer schedule
  getPrayerTimesForToday(config: PrayerConfig, coordinates?: { lat: number; lng: number }): PrayerDayStatus;

  // Islam: Calculate from coordinates using adhan
  getIslamicPrayerTimes(lat: number, lng: number, method?: string): { name: string; time: Date }[];

  // Other religions: Static from config
  getStaticPrayerTimes(config: PrayerConfig): { name: string; time: string }[];

  // Verification
  confirmPrayer(prayerName: string, dayStatus: PrayerDayStatus): PrayerDayStatus;
  areAllPrayersCompleted(dayStatus: PrayerDayStatus): boolean;

  // Blocking logic
  isCurrentlyBlockedForPrayer(dayStatus: PrayerDayStatus): { blocked: boolean; currentPrayer?: string };

  // Persistence
  saveDayStatus(status: PrayerDayStatus): Promise<void>;
  loadDayStatus(date: string): Promise<PrayerDayStatus | null>;
};
```

**Islamic prayer times** (using `adhan` package):

```typescript
const coordinates = new Coordinates(lat, lng);
const params = CalculationMethod.MuslimWorldLeague(); // or user-selected method
const prayerTimes = new PrayerTimes(coordinates, new Date(), params);
// Access: prayerTimes.fajr, .dhuhr, .asr, .maghrib, .isha
```

**Screen: `app/prayer-status.tsx`**:

- Dark background (`bg.primary`), prayer gold (`#D4A017`) accent
- Title: "Today's Prayers" (`title1`) + date (`subheadline`, `text.secondary`)
- PrayerTimesList on `bg.elevated` cards with gold left-accent
- Current/next prayer highlighted with gold border
- OathConfirmation per uncompleted prayer
- Overall progress: SF Mono number "3/5" + "prayers completed" (`callout`)
- On all completed: status.success banner + auto-complete habit

**Verify**: `npx tsc --noEmit`. Test prayer time calculation with known coordinates.

---

### Step 21: Fitness Engine (HealthKit)

- [x] **STEP 21 — Create HealthKit native module and fitness service**

**Goal**: Create an Expo native module wrapping HealthKit for step count, workout, and calorie queries. Build the fitness status screen.

**Files to create**:

- `modules/healthkit/expo-module.config.json`
- `modules/healthkit/index.ts` — JS bridge
- `modules/healthkit/package.json`
- `modules/healthkit/ios/HealthKitModule.swift` — Native Swift implementation
- `src/services/habits/fitnessHabit.ts`
- `app/fitness-status.tsx`

**Files to modify**:

- `app.json` — Add HealthKit plugin config, entitlements
- `ios/Serenity/Info.plist` — Add `NSHealthShareUsageDescription`

**Read first**:

- `modules/activityReport/` — **CRITICAL**: Follow the exact Expo module pattern (expo-module.config.json, package.json, index.ts, ios/ Swift files). Copy this structure.
- `modules/screentime/index.ts` — Another bridge pattern reference
- `app.json` — Current plugin and entitlement config
- `ios/Serenity/Info.plist` — Existing plist keys

**Native module: `modules/healthkit/`**:

```typescript
// index.ts (JS bridge)
export const HealthKitModule = {
  requestAuthorization(): Promise<boolean>;
  getStepCount(dateString: string): Promise<number>;
  getWorkouts(dateString: string): Promise<{ type: string; durationMinutes: number; calories: number }[]>;
  getActiveCalories(dateString: string): Promise<number>;
  isAvailable(): boolean;
};
```

**Swift implementation**: Use `HKHealthStore`, request authorization for `.stepCount`, `.activeEnergyBurned`, `.workoutType`. Query via `HKStatisticsQuery` (steps, calories) and `HKSampleQuery` (workouts).

**Service specification** (`fitnessHabit.ts`):

```typescript
export const FitnessHabitService = {
  // Check goal
  checkGoal(config: FitnessConfig): Promise<{ current: number; goal: number; met: boolean; unit: string }>;

  // Specific queries
  getStepCount(): Promise<number>;
  getWorkoutMinutes(): Promise<number>;
  getActiveCalories(): Promise<number>;

  // Auto-check (called periodically from foreground)
  autoCheckAndComplete(habitId: string, config: FitnessConfig): Promise<boolean>;
};
```

**Screen: `app/fitness-status.tsx`**:

- Dark background (`bg.primary`), fitness orange (`#F97316`) accent
- Title: "Fitness Goal" (`title1`)
- Large ProgressRing (fitness orange stroke, `border.subtle` track) with SF Mono `statLarge` number centered
- Stats below ring: current / goal + unit in `callout` (e.g., "6,432 / 8,000 steps") — numbers in SF Mono
- Auto-refresh on focus via `useFocusEffect`
- If goal met: checkmark draw animation + green ring + auto-complete
- Source indicator: `caption1`, `text.tertiary` — "Data from Apple Health" with Heart icon

**app.json changes**:

```json
{
  "ios": {
    "infoPlist": {
      "NSHealthShareUsageDescription": "Serenity reads your fitness data to verify your daily workout goals."
    },
    "entitlements": {
      "com.apple.developer.healthkit": true
    }
  }
}
```

**Verify**: Build on physical device (`npx expo run:ios`). HealthKit only works on real devices.

---

## Phase 6: Integration

### Step 22: Shield Configuration Rework

- [x] **STEP 22 — Make shield messages dynamic based on pending habits**

**Goal**: When apps are blocked, the shield screen should tell the user WHY (which habit) and deep-link to the right action screen.

**Files to create**:

- `src/services/shieldService.ts`

**Files to modify**:

- `targets/ShieldConfiguration/` — Swift shield rendering (read habit context from UserDefaults)
- `targets/ShieldAction/` — Deep link routing based on habit type

**Read first**:

- `src/services/appGroups.ts` — **CRITICAL**: How shield config is written to UserDefaults (JSON with title, subtitle, buttonLabel, colors, etc.). How shield actions write deep-link URLs.
- `targets/ShieldConfiguration/` — All Swift files. How it reads from `UserDefaults(suiteName: "group.com.msl.serenity")`
- `targets/ShieldAction/` — How it opens `serenity://mindful-pause?groupId=...`

**Service specification** (`shieldService.ts`):

```typescript
export const ShieldService = {
  // Write shield config based on current habit state
  updateShieldForHabits(uncompletedHabits: Habit[]): Promise<void>;

  // Get shield message for a habit type
  getShieldMessage(habitType: HabitType): { title: string; subtitle: string; buttonLabel: string; deepLink: string };
};
```

**Shield messages per habit**:
| Habit | Title | Subtitle | Button | Deep Link |
|---|---|---|---|---|
| study | "Time to Focus" | "Complete your study session to unlock" | "Start Studying" | `serenity://study-timer` |
| meditation | "Find Your Calm" | "Complete your meditation to unlock" | "Start Meditating" | `serenity://meditation-timer` |
| reading | "Read First" | "Complete your reading goal to unlock" | "Start Reading" | `serenity://reading-timer` |
| fitness | "Move Your Body" | "Complete your fitness goal to unlock" | "Check Progress" | `serenity://fitness-status` |
| prayer | "Time for Prayer" | "Complete your prayer to unlock" | "View Prayers" | `serenity://prayer-status` |
| sleep | "Time to Rest" | "Your sleep schedule is active" | "I Understand" | (dismiss) |
| screentime | "Limit Reached" | "You've exceeded your daily screen time" | "I Understand" | (dismiss) |

**UserDefaults key**: `serenity_shield_config` (single key replacing per-group keys)

**Verify**: Build and test on physical device — shield should show correct habit message.

---

### Step 23: Blocking Logic Rework

- [x] **STEP 23 — Create unified blocking service, remove old group system, rework mindful-pause**

**Goal**: Replace per-group blocking with a single global blocking system that locks/unlocks based on habit completion state.

**Files to create**:

- `src/services/blockingService.ts`

**Files to modify**:

- `app/mindful-pause.tsx` — Use habit context instead of group context
- `app/_layout.tsx` — Update deep link handling for new habit screens

**Files to delete**:

- `app/create-group/` — Entire directory (index.tsx, configure.tsx, unlocks.tsx, custom-timeframe.tsx, \_layout.tsx)
- `app/edit-group/` — Entire directory ([id].tsx, \_layout.tsx)

**Read first**:

- `src/services/appGroups.ts` — **CRITICAL**: `blockSelection()`, `unblockSelection()`, `AppGroupService` API. Understand what native calls to preserve.
- `app/mindful-pause.tsx` — Current group-based logic. Will need to show pending-habit-specific messaging.
- `app/create-group/` — Understand what's being deleted (all 4 screens + layout)
- `app/edit-group/[id].tsx` — Understand what's being deleted
- `app/_layout.tsx` — Deep link handler for `serenity://mindful-pause`
- `src/store/habitStore.ts` — `areAllActiveHabitsCompleted()`, `getUncompletedHabits()`

**Service specification** (`blockingService.ts`):

```typescript
export const BlockingService = {
  // Core blocking
  evaluateAndApplyBlocking(): Promise<void>;  // Check habits → block or unblock
  lockApps(selection: string): Promise<void>;  // Activate blocking
  unlockApps(selection: string): Promise<void>; // Deactivate blocking

  // Daily lifecycle
  resetForNewDay(): Promise<void>;  // Re-block + reset all completions
  onAppForeground(): Promise<void>; // Re-evaluate blocking state

  // Habit-aware
  onHabitCompleted(habitId: string): Promise<void>; // Check if all done → unlock
};
```

**Mindful pause rework** (`app/mindful-pause.tsx`):

- Instead of group-based logic, show the first uncompleted habit
- Dynamic content based on habit type (e.g., "Complete your study session" with "Start Timer" button)
- Shield button leads here, then routes to appropriate habit screen
- Keep the beautiful visual design (video background, blur, blobs)

**Deep link changes** in `app/_layout.tsx`:

- `serenity://mindful-pause` → `app/mindful-pause.tsx` (keep)
- Add: `serenity://study-timer` → `app/study-timer.tsx`
- Add: `serenity://meditation-timer` → `app/meditation-timer.tsx`
- Add: `serenity://reading-timer` → `app/reading-timer.tsx`
- Add: `serenity://fitness-status` → `app/fitness-status.tsx`
- Add: `serenity://prayer-status` → `app/prayer-status.tsx`

**Verify**: `npx tsc --noEmit`. No more references to AppGroup CRUD flows. Deep links work.

---

### Step 24: Habit Stacking System

- [x] **STEP 24 — Implement 60-day milestone detection and automatic habit activation**

**Goal**: When a habit's streak reaches 60 days, graduate it to 'stacked' status and activate the next pending habit.

**Files to modify**:

- `src/store/habitStore.ts` — Enhance `checkAndActivateNextHabit()` logic
- `app/(tabs)/index.tsx` — Show stacking milestone celebrations
- `app/(tabs)/progress.tsx` — Show stacking timeline

**Read first**:

- `src/store/habitStore.ts` — `checkAndActivateNextHabit()` (from Step 2, enhance it)
- `src/types/habits.ts` — `Habit`, `HabitStatus`

**Stacking logic enhancement**:

```typescript
checkAndActivateNextHabit(): {
  // 1. Find active habits with streak >= 60
  // 2. For each: set status = 'stacked', set stackedAt = now
  // 3. Find next pending habit by lowest priority number
  // 4. Set to active, set activatedAt = now
  // 5. Return { graduated, activated } for UI notification
  // 6. Update global streak accordingly
}
```

**UI additions**:

- Home tab: If `checkAndActivateNextHabit()` returns results → show celebration modal: "You've built your Study habit! Time to add Fitness."
- Progress tab: Stacking timeline shows graduated habits with dates

**Verify**: `npx tsc --noEmit`. Unit test: create habit with streak 60, call check, verify state changes.

---

### Step 25: Daily Reset & Background Logic

- [x] **STEP 25 — Wire up daily reset, foreground checks, and notification scheduling**

**Goal**: Ensure the app correctly resets daily habit completions at midnight, re-evaluates blocking on foreground, and schedules reminder notifications.

**Files to modify**:

- `app/_layout.tsx` — Central lifecycle management

**Read first**:

- `app/_layout.tsx` — **CRITICAL**: Current daily reset logic (midnight timer + AppState listener). Understand: font loading, theme init, RevenueCat init, onboarding check, deep link handling.
- `src/store/habitStore.ts` — `resetDailyCompletions()`, `updateStreaks()`, `checkAndActivateNextHabit()`
- `src/services/blockingService.ts` (from Step 23) — `evaluateAndApplyBlocking()`, `onAppForeground()`, `resetForNewDay()`

**Changes to `app/_layout.tsx`**:

1. **On app launch**:
   - Load habitStore: `useHabitStore.getState().loadFromStorage()`
   - Check if new day → `resetDailyCompletions()` + `evaluateAndApplyBlocking()`
   - Check stacking milestones → `checkAndActivateNextHabit()`

2. **Midnight timer**:
   - Replace current reset logic with:
     ```typescript
     habitStore.resetDailyCompletions();
     habitStore.updateStreaks(today);
     blockingService.resetForNewDay();
     ```

3. **AppState listener** (foreground):
   - `blockingService.onAppForeground()` → re-evaluate blocking
   - For fitness: `FitnessHabitService.autoCheckAndComplete()` (if fitness active)
   - Check if new day (user left app overnight)

4. **Remove**:
   - Fox initialization (`initializeFox` calls)
   - Fox mood/evolution updates
   - Old app group daily unlock reset

5. **Deep links**: Add routes for new habit screens (from Step 23)

**Notification scheduling** (basic):

- Schedule daily reminder if habits incomplete at a configurable hour (e.g., 6 PM)
- Schedule bedtime warning 30 min before effective bedtime (if sleep habit active)
- Schedule prayer time notifications (if prayer habit active, for each prayer)
- Use `expo-notifications` (already installed) `scheduleNotificationAsync`

**Verify**: `npx tsc --noEmit`. Test on device: close app, reopen, verify state is correct.

---

## Phase 7: Cleanup & Polish

### Step 26: Analytics & Backend Update

- [x] **STEP 26 — Update PostHog events and Supabase schema for habits**

**Goal**: Track new habit-related events and update the backend data model.

**Files to modify**:

- `src/services/posthog.ts` — New event types
- `src/services/supabase.ts` — Updated onboarding data shape

**Read first**:

- `src/services/posthog.ts` — Current event definitions and typed event names
- `src/services/supabase.ts` — `OnboardingService` methods, table structure

**New PostHog events**:

```typescript
// Add to tracked events
"habit_completed"; // { habitType, method, streakCount }
"habit_stacked"; // { habitType, streakDays }
"habit_activated"; // { habitType, priority }
"streak_milestone"; // { days, habitType }
"timer_started"; // { habitType, goalMinutes }
"timer_completed"; // { habitType, durationMinutes }
"oath_confirmed"; // { habitType, context }
"prayer_confirmed"; // { prayerName, religion }
"blocking_triggered"; // { reason: habitType | 'sleep' | 'screentime_exceeded' }
"apps_unlocked"; // { allHabitsCompleted: true }
"pact_accepted"; // { habitCount }
```

**Supabase updates**:

- Update `OnboardingService.saveOnboardingData()` to handle new `OnboardingData` shape (selectedHabits, habitConfigs, etc.)
- Consider new table `habit_events` for tracking completions (future analytics). For now, just update the onboarding table schema.

**Verify**: `npx tsc --noEmit`

---

### Step 27: PROJECT.md & Final Wiring

- [x] **STEP 27 — Rewrite PROJECT.md and final cleanup pass**

**Goal**: Update the project documentation to reflect the new habit builder architecture. Clean up any remaining broken imports or unused files.

**Files to rewrite**:

- `PROJECT.md` — Complete rewrite reflecting new architecture

**Files to verify/cleanup**:

- `app/_layout.tsx` — Final pass: all imports valid, no dead code
- `app/(tabs)/_layout.tsx` — Tab icons/labels updated for habit context
- `src/services/appGroups.ts` — Either fully replaced by `blockingService.ts` + `shieldService.ts`, or cleaned of group CRUD code
- `src/components/ui/index.ts` — All new components exported
- `src/constants/index.ts` — Exports up to date
- All files: no remaining imports from deleted files

**PROJECT.md sections to update**:

1. Overview — "Habit builder" not "screen time management"
2. Architecture — Habit stores, services, engines
3. Onboarding — New flow
4. Screen list — New screens, removed screens
5. Type system — Habits, configs, streaks
6. Services — Habit engines, blocking service, shield service
7. Native integration — HealthKit addition
8. Design system — Structured Minimalism / Dark-First UI (reference `DESIGN_SYSTEM.md`)
9. State management — habitStore
10. Conventions — Any new rules

**Cleanup checklist**:

- Run `npx tsc --noEmit` — zero errors
- Run `npx expo lint` — zero errors
- Search for `FoxAvatar`, `initializeFox`, `AppGroup` — zero results
- Search for imports from deleted files — zero results
- Check `app/` directory: no orphaned route files

**Verify**: Clean compile, clean lint, PROJECT.md accurately reflects codebase.

---

## Appendix A: File Index

> **Agents**: Quick reference for finding files. All paths relative to project root.

### Files to Create (by step)

| Step | File                                          | Purpose                   |
| ---- | --------------------------------------------- | ------------------------- |
| 1    | `src/types/habits.ts`                         | Habit type system         |
| 2    | `src/store/habitStore.ts`                     | Habit Zustand store       |
| 4    | _(modify only)_                               |                           |
| 5    | `src/components/ui/ProgressRing.tsx`          | SVG circular progress     |
| 5    | `src/components/ui/TimerView.tsx`             | Timer with controls       |
| 5    | `src/components/ui/OathConfirmation.tsx`      | Hold-to-confirm component |
| 5    | `src/components/ui/StreakBadge.tsx`           | Streak display            |
| 5    | `src/components/ui/HabitCard.tsx`             | Habit status card         |
| 6    | `src/components/DailyChecklist.tsx`           | Habit list for home       |
| 6    | `src/components/HabitConfigCard.tsx`          | Config editor component   |
| 6    | `src/components/PrayerTimesList.tsx`          | Prayer times UI           |
| 8    | `app/onboarding/how-it-works.tsx`             | System explanation        |
| 8    | `app/onboarding/the-pact.tsx`                 | Commitment intro          |
| 9    | `app/onboarding/habit-selection.tsx`          | Habit picker              |
| 9    | `app/onboarding/habit-priority.tsx`           | Priority ordering         |
| 10   | `app/onboarding/config-screentime.tsx`        | Screentime config         |
| 10   | `app/onboarding/config-study.tsx`             | Study config              |
| 10   | `app/onboarding/config-fitness.tsx`           | Fitness config            |
| 10   | `app/onboarding/config-sleep.tsx`             | Sleep config              |
| 10   | `app/onboarding/config-prayer.tsx`            | Prayer config             |
| 10   | `app/onboarding/config-meditation.tsx`        | Meditation config         |
| 10   | `app/onboarding/config-reading.tsx`           | Reading config            |
| 11   | `app/onboarding/healthkit-permission.tsx`     | HealthKit permission      |
| 11   | `app/onboarding/pact-screen.tsx`              | Final pact commitment     |
| 15   | `src/services/habits/screentimeHabit.ts`      | Screentime engine         |
| 16   | `src/services/habits/studyHabit.ts`           | Study engine              |
| 16   | `app/study-timer.tsx`                         | Study timer screen        |
| 17   | `src/services/habits/meditationHabit.ts`      | Meditation engine         |
| 17   | `app/meditation-timer.tsx`                    | Meditation screen         |
| 18   | `src/services/habits/readingHabit.ts`         | Reading engine            |
| 18   | `app/reading-timer.tsx`                       | Reading screen            |
| 19   | `src/services/habits/sleepHabit.ts`           | Sleep engine              |
| 20   | `src/services/habits/prayerHabit.ts`          | Prayer engine             |
| 20   | `app/prayer-status.tsx`                       | Prayer status screen      |
| 21   | `modules/healthkit/expo-module.config.json`   | HealthKit module config   |
| 21   | `modules/healthkit/index.ts`                  | HealthKit JS bridge       |
| 21   | `modules/healthkit/package.json`              | HealthKit package         |
| 21   | `modules/healthkit/ios/HealthKitModule.swift` | HealthKit native code     |
| 21   | `src/services/habits/fitnessHabit.ts`         | Fitness engine            |
| 21   | `app/fitness-status.tsx`                      | Fitness status screen     |
| 22   | `src/services/shieldService.ts`               | Dynamic shield config     |
| 23   | `src/services/blockingService.ts`             | Unified blocking logic    |

### Files to Delete (by step)

| Step | File                                    | Reason               |
| ---- | --------------------------------------- | -------------------- |
| 3    | `src/components/FoxAvatar.tsx`          | Fox system removed   |
| 8    | `app/onboarding/name-input.tsx`         | No longer in flow    |
| 8    | `app/onboarding/name-intro.tsx`         | No longer in flow    |
| 8    | `app/onboarding/problem-selection.tsx`  | No longer in flow    |
| 8    | `app/onboarding/solution-preview.tsx`   | No longer in flow    |
| 8    | `app/onboarding/stats-intro.tsx`        | No longer in flow    |
| 8    | `app/onboarding/pause-reflect.tsx`      | No longer in flow    |
| 8    | `app/onboarding/mindful-sessions.tsx`   | No longer in flow    |
| 8    | `app/onboarding/phone-usage.tsx`        | No longer in flow    |
| 8    | `app/onboarding/usage-patterns.tsx`     | No longer in flow    |
| 8    | `app/onboarding/companion-setup.tsx`    | Fox system removed   |
| 23   | `app/create-group/_layout.tsx`          | Group system removed |
| 23   | `app/create-group/index.tsx`            | Group system removed |
| 23   | `app/create-group/configure.tsx`        | Group system removed |
| 23   | `app/create-group/unlocks.tsx`          | Group system removed |
| 23   | `app/create-group/custom-timeframe.tsx` | Group system removed |
| 23   | `app/edit-group/_layout.tsx`            | Group system removed |
| 23   | `app/edit-group/[id].tsx`               | Group system removed |

### Files to Modify (by step)

| Step | File                                | Change Summary                                                  |
| ---- | ----------------------------------- | --------------------------------------------------------------- |
| 1    | `src/types/index.ts`                | Remove FoxState, add habit exports                              |
| 3    | `src/store/appStore.ts`             | Remove fox state/actions, keep screentime + preferences         |
| 3    | `app/(tabs)/index.tsx`              | Remove fox references (rewritten in Step 12)                    |
| 3    | `app/(tabs)/progress.tsx`           | Remove fox references (rewritten in Step 13)                    |
| 3    | `app/_layout.tsx`                   | Remove fox init (fully reworked in Step 25)                     |
| 4    | `src/constants/colors.ts`           | Rebuild entire palette: dark-first, habitAccent, status signals |
| 4    | `src/constants/themes.ts`           | Rebuild dark/light themes with new token structure              |
| 4    | `src/constants/typography.ts`       | Replace Lora/Inter with SF Pro/SF Mono type scale               |
| 4    | `src/constants/spacing.ts`          | 4px-base scale, tighter radii, neutral shadows                  |
| 5    | `src/components/ui/index.ts`        | Export new components                                           |
| 7    | `src/types/onboarding.ts`           | New OnboardingData shape                                        |
| 7    | `src/store/onboardingStore.ts`      | New store actions                                               |
| 7    | `src/config/onboardingFlow.ts`      | New flow with habit screens                                     |
| 11   | `app/onboarding/app-selection.tsx`  | Change messaging                                                |
| 11   | `app/onboarding/building-plan.tsx`  | New stacking timeline content                                   |
| 12   | `app/(tabs)/index.tsx`              | Rewrite as habit dashboard                                      |
| 13   | `app/(tabs)/progress.tsx`           | Rewrite with habit streaks                                      |
| 14   | `app/(tabs)/settings.tsx`           | Add habit management                                            |
| 15   | `targets/ActivityMonitorExtension/` | Threshold event handling                                        |
| 20   | `package.json`                      | Add `adhan` dependency                                          |
| 21   | `app.json`                          | HealthKit entitlements                                          |
| 21   | `ios/Serenity/Info.plist`           | HealthKit usage description                                     |
| 22   | `targets/ShieldConfiguration/`      | Habit-context shield UI                                         |
| 22   | `targets/ShieldAction/`             | Habit-aware deep links                                          |
| 23   | `app/mindful-pause.tsx`             | Habit-aware messaging                                           |
| 23   | `app/_layout.tsx`                   | New deep link routes                                            |
| 24   | `src/store/habitStore.ts`           | Enhanced stacking logic                                         |
| 25   | `app/_layout.tsx`                   | Full lifecycle rework                                           |
| 26   | `src/services/posthog.ts`           | New events                                                      |
| 26   | `src/services/supabase.ts`          | Updated data shape                                              |
| 27   | `PROJECT.md`                        | Complete rewrite                                                |
| 27   | `app/(tabs)/_layout.tsx`            | Tab icons/labels                                                |

---

## Appendix B: Dependencies to Add

| Package | Version  | Purpose                         | Step |
| ------- | -------- | ------------------------------- | ---- |
| `adhan` | `^4.4.3` | Islamic prayer time calculation | 20   |

> **Note**: `react-native-gesture-handler`, `react-native-reanimated`, `expo-haptics`, `expo-notifications`, `react-native-svg`, `lucide-react-native` are all already installed.

---

## Appendix C: Native Capabilities to Add

| Capability                  | Config Location                                            | Step |
| --------------------------- | ---------------------------------------------------------- | ---- |
| HealthKit                   | `app.json` → `ios.entitlements`, `Info.plist`              | 21   |
| HealthKit usage description | `app.json` → `ios.infoPlist.NSHealthShareUsageDescription` | 21   |
| Location (for prayer times) | Already available via Expo Location if needed              | 20   |

---

## Appendix D: Verification Checklist Per Step

After EVERY step:

1. `npx tsc --noEmit` — Must pass (or only have expected errors from future steps)
2. Check imports — No imports from deleted/renamed files
3. Save this file — Update the step checkbox from `[ ]` to `[x]`

After completing a full phase:

1. `npx expo lint` — Must pass
2. Update the phase status in the Status Tracker table
3. Physical device test (for native features in Phases 5-6)
