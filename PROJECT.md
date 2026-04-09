# Serenity — Project Documentation

> Single-source-of-truth reference for AI agents and contributors.
> Covers architecture, conventions, native integration, and current status.

---

## 1. Overview

**Serenity** is an iOS habit-builder app that uses app blocking as leverage. Users select the habits they want to build (screen time, study, fitness, sleep, prayer, meditation, reading), configure each one, and choose which apps to block. Their selected apps stay blocked by Apple's Screen Time APIs until they complete their daily habits. Habits are stacked one at a time: lock in the first for 60 days, then add the next.

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Bundle ID      | `com.msl.serenity`                     |
| Apple Team ID  | `TL9UW7M88J`                           |
| App Group      | `group.com.msl.serenity`               |
| URL Scheme     | `serenity://`                          |
| EAS Project ID | `06c17db4-6c27-45ba-8387-4a83f8ff95d3` |
| Platform       | iOS only (no Android)                  |

---

## 2. Tech Stack

| Layer       | Technology                                                          |
| ----------- | ------------------------------------------------------------------- |
| Framework   | React Native 0.81 + Expo SDK 54                                     |
| Language    | TypeScript 5.9 (strict)                                             |
| Navigation  | Expo Router 6 (file-based, typed routes)                            |
| State       | Zustand 5 + AsyncStorage persistence                                |
| Styling     | StyleSheet + design-system constants (no styling library)           |
| Animation   | Reanimated 4.1, Lottie 7.3                                          |
| Icons       | `lucide-react-native` exclusively — **no emojis in UI**             |
| Backend     | Supabase (analytics/backup, non-blocking)                           |
| Payments    | RevenueCat (`react-native-purchases` + `react-native-purchases-ui`) |
| Analytics   | PostHog (`posthog-react-native`)                                    |
| Screen Time | `react-native-device-activity` 0.5.1 (patched)                      |
| Health      | Custom HealthKit native module (`modules/healthkit/`)               |
| New Arch    | Enabled (`newArchEnabled: true`, React Compiler experiment on)      |

### Key Dependencies

`expo-blur`, `expo-linear-gradient`, `expo-image`, `expo-video`, `expo-haptics`, `react-native-svg`, `react-native-gesture-handler`, `@react-native-async-storage/async-storage`, `@react-native-community/datetimepicker`

### Dev Tooling

- ESLint 9 (flat config, `eslint-config-expo`)
- `patch-package` (postinstall hook)
- EAS CLI >= 16.32.0

---

## 3. Project Structure

```
app/                              # Expo Router file-based routing
├── _layout.tsx                   # Root: init, auth guard, providers, deep links
├── index.tsx                     # Redirects → /(tabs)
├── paywall.tsx                   # RevenueCat paywall modal
├── mindful-pause.tsx             # Shield deep-link target — shows active habit
├── (tabs)/                       # Main tab navigator (NativeTabs)
│   ├── _layout.tsx               # 3 tabs: Today, Progress, Settings
│   ├── index.tsx                 # Today tab — DailyChecklist
│   ├── progress.tsx              # Streaks, charts, habit history
│   └── settings.tsx              # Habit config, theme, subscription
└── onboarding/                   # 18-screen onboarding flow
    ├── _layout.tsx               # Stack + PostHog screen tracking
    └── ... (18 screens)

src/
├── components/
│   ├── ui/                       # Design system primitives
│   │   ├── Button.tsx            # 4 variants, 3 sizes
│   │   ├── Input.tsx             # Labels, errors, icons
│   │   ├── Card.tsx              # 3 variants
│   │   ├── Badge.tsx             # 4 color variants, 2 sizes
│   │   ├── OathConfirmation.tsx  # Pact commitment component
│   │   └── index.ts
│   ├── DailyChecklist.tsx        # Main habit list with completion state
│   ├── HabitConfigCard.tsx       # Per-habit edit card (used in settings)
│   ├── OnboardingHeader.tsx      # Progress bar + back button
│   └── DevOverlay.tsx            # DEV-only debug panel
├── config/
│   └── onboardingFlow.ts         # A/B flow variants, step ordering, PostHog flag
├── constants/
│   ├── colors.ts                 # Structured minimalism palette (dark-first)
│   ├── typography.ts             # SF Pro + Menlo, HIG-aligned type scale
│   ├── spacing.ts                # Numeric spacing scale, border radius, shadows
│   ├── themes.ts                 # darkTheme / lightTheme objects
│   └── index.ts                  # Re-exports: spacing, borderRadius, typeScale, FONTS
├── hooks/
│   ├── useOnboardingNext.ts      # Flow-aware nav + PostHog tracking
│   ├── useOnboardingAnimation.ts # Reanimated sequential fade-in helpers
│   ├── useRevenueCat.ts          # Paywall / subscription hook
│   └── useThemedStyles.ts        # useThemedColors() + useThemedStyles()
├── services/
│   ├── blockingService.ts        # evaluateAndApplyBlocking, lockApps, unlockApps
│   ├── shieldService.ts          # updateShieldForHabits, getShieldMessage per habit
│   ├── notificationService.ts    # Schedule, cancel, refresh notification triggers
│   ├── habits/                   # Per-habit completion engines
│   │   ├── screenTimeHabit.ts
│   │   ├── studyHabit.ts
│   │   ├── fitnessHabit.ts
│   │   ├── sleepHabit.ts
│   │   ├── prayerHabit.ts
│   │   ├── meditationHabit.ts
│   │   └── readingHabit.ts
│   ├── posthog.ts                # PostHog client + typed events
│   ├── purchases.ts              # RevenueCat init, offerings, purchase flow
│   └── supabase.ts               # Supabase client + OnboardingService
├── store/
│   ├── habitStore.ts             # Habits, blocked apps, daily completion, stacking
│   ├── appStore.ts               # ScreenTimeData, device-level preferences
│   ├── onboardingStore.ts        # Onboarding data & step tracking
│   ├── purchasesStore.ts         # RevenueCat state, isPro, offerings
│   └── themeStore.ts             # Theme mode (light/dark/system)
├── types/
│   ├── habits.ts                 # HabitType, Habit, HabitConfig, CompletionMethod
│   ├── index.ts                  # ScreenTimeData and other shared types
│   └── onboarding.ts             # OnboardingData, OnboardingRecord
└── utils/
    ├── events.ts                 # AppEventEmitter (ONBOARDING_COMPLETED/RESET)
    └── screentime.ts             # ScreenTime wrapper (@ts-nocheck legacy)

targets/                          # iOS App Extension targets
├── ActivityMonitorExtension/     # Monitors device activity intervals
├── DeviceActivityReport/         # Reports usage data
├── ShieldAction/                 # Handles shield button taps → opens deep link
└── ShieldConfiguration/          # Renders custom block screen UI per habit

modules/
├── activityReport/               # Custom Expo module for DeviceActivityReport
├── healthkit/                    # Custom HealthKit bridge (step count, workouts)
└── screentime/                   # Legacy ScreenTime NativeModules wrapper
patches/react-native-device-activity+0.5.1.patch  # Adds appearance prop
```

---

## 4. Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=       # Supabase project URL
EXPO_PUBLIC_SUPABASE_KEY=       # Supabase anon key
EXPO_PUBLIC_POSTHOG_API_KEY=    # PostHog project API key
EXPO_PUBLIC_POSTHOG_HOST=       # PostHog host (default: https://us.i.posthog.com)
```

RevenueCat iOS API key is set directly in `src/services/purchases.ts`.

---

## 5. Routing & Navigation

### Root Layout (`app/_layout.tsx`)

- Loads `habitStore` and runs `BlockingService.onAppForeground()` on startup
- Calls `checkAndActivateNextHabit()` to advance habit stacking after load
- Refreshes notification schedule on start
- Configures RevenueCat SDK (non-fatal if fails)
- Handles deep links (`serenity://mindful-pause`, `serenity://study-timer`, etc.)
- Wraps app in `<PostHogProvider>`
- **Nav guard**: onboarding incomplete → `/onboarding`; complete & in onboarding → `/paywall`

### Tab Navigator (`app/(tabs)/_layout.tsx`)

Uses `expo-router/unstable-native-tabs` (`NativeTabs`) with 3 tabs:

- **Today** (`index.tsx`) — DailyChecklist showing active habits with completion state
- **Progress** (`progress.tsx`) — Streaks, completion history, charts
- **Settings** (`settings.tsx`) — Per-habit config editing, theme, subscription

### Key Screens

- **Mindful Pause** (`app/mindful-pause.tsx`) — opened via deep link from shield; shows primary uncompleted habit and routes to its action screen
- **Paywall** (`app/paywall.tsx`) — RevenueCat paywall, shown after onboarding
- **Habit timers** (`app/study-timer.tsx`, `app/meditation-timer.tsx`, `app/reading-timer.tsx`) — in-app timers that mark habits complete
- **Status screens** (`app/fitness-status.tsx`, `app/prayer-status.tsx`) — manual completion screens

---

## 6. State Management (Zustand)

| Store                | File                           | Key State                                                              |
| -------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| `useHabitStore`      | `src/store/habitStore.ts`      | Active habits, blocked apps, daily completion, streaks, stacking state |
| `useAppStore`        | `src/store/appStore.ts`        | ScreenTimeData, device-level preferences                               |
| `useOnboardingStore` | `src/store/onboardingStore.ts` | Onboarding form data, Supabase save                                    |
| `usePurchasesStore`  | `src/store/purchasesStore.ts`  | CustomerInfo, isPro, current offering                                  |
| `useThemeStore`      | `src/store/themeStore.ts`      | Theme mode (light/dark/system)                                         |

All stores persist to AsyncStorage via manual `loadFromStorage`/`saveToStorage` methods.

### Habit Types (`src/types/habits.ts`)

`HabitType`: `'screentime' | 'study' | 'fitness' | 'sleep' | 'prayer' | 'meditation' | 'reading'`

Each `Habit` has: `id`, `type`, `config` (type-specific), `status` (pending/active/graduated), `priority`, streak data, daily completion state.

### Habit Stacking

- Users set priority order during onboarding
- Only the **highest-priority active habit** is enforced on any given day
- On 60-day streak: habit graduates → next pending habit activates automatically
- `checkAndActivateNextHabit()` runs on startup and after habit completion

### Event System (`src/utils/events.ts`)

- `ONBOARDING_COMPLETED` → triggers nav guard update
- `ONBOARDING_RESET` → resets onboarding and habit state

---

## 7. Services

### Blocking (`src/services/blockingService.ts`)

Core blocking logic. Called on startup, after habit completion, and on app foreground.

- `evaluateAndApplyBlocking()` — checks active habits → calls lockApps or unlockApps
- `lockApps(selection)` — writes shield config, activates DeviceActivity monitoring
- `unlockApps()` — removes all monitoring and shield configs
- `onAppForeground()` — re-evaluates state on resume

### Shield (`src/services/shieldService.ts`)

Controls what appears on the block screen when a user opens a blocked app.

- `updateShieldForHabits(uncompletedHabits)` — writes per-habit shield messages to UserDefaults
- `getShieldMessage(habitType)` — returns `{ title, subtitle, buttonLabel, deepLink }` for each habit type

### Notifications (`src/services/notificationService.ts`)

- Schedules daily reminders based on habit configs
- `refreshSchedule()` — cancels old triggers and reschedules based on current habits

### Habit Engines (`src/services/habits/`)

Each engine handles a specific habit type's completion logic:

- **screentime**: compares against daily limit from HealthKit/DeviceActivity data
- **study**: validates in-app timer session
- **fitness**: reads step count / workout data from HealthKit
- **sleep**: validates sleep window from HealthKit
- **prayer**: manual confirmation with prayer time config
- **meditation**: validates in-app calm timer session
- **reading**: validates in-app reading timer session

### Supabase (`src/services/supabase.ts`)

- Non-blocking onboarding analytics insert
- **Offline-first**: app works fully without Supabase

### RevenueCat (`src/services/purchases.ts`)

- Entitlement: `"Serenity Pro"` | Products: `monthly`, `yearly`, `lifetime`
- `useRevenueCat()` hook: `showPaywall()`, `showPaywallIfNeeded()`, `restore()`

### PostHog (`src/services/posthog.ts`)

- Disabled in `__DEV__` by default
- Feature flag: `onboarding-flow-variant` — flow controlled remotely from PostHog
- Tracked events: `onboarding_screen_view`, `onboarding_step_completed`, `onboarding_completed`

---

## 8. Native iOS Integration

### Apple Frameworks Used

- **FamilyControls** — authorization & app picker
- **ManagedSettings** — app blocking / shield display
- **DeviceActivity** — scheduled monitoring and interval tracking
- **ManagedSettingsUI** — shield UI customization
- **HealthKit** — step count, workout, sleep data (via custom module)

### react-native-device-activity (v0.5.1, patched)

Primary native bridge. Expo plugin config in `app.json`:

```json
[
  "react-native-device-activity",
  {
    "appleTeamId": "TL9UW7M88J",
    "appGroup": "group.com.msl.serenity"
  }
]
```

**Patch** (`patches/react-native-device-activity+0.5.1.patch`): Adds `appearance` prop to `DeviceActivitySelectionView`.

### App Extension Targets

| Extension                | Bundle ID                                   | Purpose                                                       |
| ------------------------ | ------------------------------------------- | ------------------------------------------------------------- |
| ActivityMonitorExtension | `com.msl.serenity.ActivityMonitorExtension` | Monitors device activity intervals, executes blocking actions |
| DeviceActivityReport     | `com.msl.serenity.DeviceActivityReport`     | Reports usage data back to the app                            |
| ShieldAction             | `com.msl.serenity.ShieldAction`             | Handles shield button taps → opens deep link to habit screen  |
| ShieldConfiguration      | `com.msl.serenity.ShieldConfiguration`      | Renders custom block screen with habit-specific messaging     |

All extensions share `group.com.msl.serenity` app group for UserDefaults data exchange.

### Shield → Habit Deep Link Flow

1. User opens a blocked app; the shield screen appears
2. Shield button URL: `serenity://mindful-pause` (no group ID needed)
3. Root layout routes to `app/mindful-pause.tsx`
4. Screen shows the primary uncompleted habit and a CTA to the habit's action screen
5. On habit completion → `BlockingService.evaluateAndApplyBlocking()` → apps unlock

### Critical Notes

- **Physical device required** — Screen Time APIs do not work in Simulator
- **FamilyControls entitlement** must be approved by Apple before TestFlight/App Store distribution
  - Request at: https://developer.apple.com/contact/request/family-controls-distribution
- `REACT_NATIVE_DEVICE_ACTIVITY_APP_GROUP` build variable must match the app group in native targets

---

## 9. Design System

**Aesthetic**: Structured Minimalism — high-contrast dark-first, surgical whitespace, zero decoration.

### Colors (`src/constants/colors.ts`)

Dark-first palette with zinc neutrals and a single warm accent.

| Role            | Token                  | Value     |
| --------------- | ---------------------- | --------- |
| Brand / CTAs    | `accent.primary`       | `#E07A5F` |
| Page background | `theme.bg.primary`     | `#0A0A0A` |
| Card surface    | `theme.bg.elevated`    | `#141414` |
| Subtle surface  | `theme.bg.subtle`      | `#252528` |
| Heading text    | `theme.text.primary`   | `#F5F5F5` |
| Body text       | `theme.text.secondary` | `#A1A1AA` |
| Muted text      | `theme.text.tertiary`  | `#71717A` |
| Border          | `theme.border.default` | `#27272A` |
| Success         | `status.success`       | `#22C55E` |
| Error           | `status.error`         | `#EF4444` |

Habit accent colors are in `habitAccent` (one per `HabitType`).

### Typography (`src/constants/typography.ts`)

- **System (SF Pro)** via `FONTS.display` / `FONTS.text` — all UI text
- **Menlo** via `FONTS.mono` — code / numbers
- Scale follows Apple HIG: `largeTitle`(34) → `title1`(28) → `title2`(22) → `title3`(20) → `headline`(17/600) → `body`(17) → `callout`(16) → `subheadline`(15) → `footnote`(13) → `caption1`(12) → `caption2`(11)
- Access via `typeScale.body.size`, `typeScale.title1.weight`, etc.
- **No external fonts loaded at runtime** — SF Pro is built into iOS

### Spacing (`src/constants/spacing.ts`)

Numeric key map: `spacing[1]`=4, `spacing[2]`=8, `spacing[3]`=12, `spacing[4]`=16, `spacing[5]`=20, `spacing[6]`=24, `spacing[8]`=32, `spacing[10]`=40, `spacing[12]`=48

Border radius: `borderRadius.sm`=6, `borderRadius.md`=10, `borderRadius.lg`=14, `borderRadius.xl`=20, `borderRadius.full`=9999

### Themes (`src/constants/themes.ts`)

`darkTheme` and `lightTheme` consumed via `useThemedColors()`. Shape:

```typescript
{
  bg: { primary, elevated, surface, subtle, hover },
  text: { primary, secondary, tertiary, disabled },
  accent: { primary, hover, subtle, glow },
  status: { success, warning, error, info },
  habitAccent: Record<HabitType, string>,
  border: { subtle, default, strong },
  statusBar: 'light-content' | 'dark-content',
}
```

### UI Components (`src/components/ui/`)

| Component | Variants / Notes                                       |
| --------- | ------------------------------------------------------ |
| `Button`  | primary, secondary, outline, ghost · sizes: sm, md, lg |
| `Input`   | label, error message, helper text, icon support        |
| `Card`    | default, elevated, outlined · `padding` as number      |
| `Badge`   | primary, secondary, success, error · sizes: sm, md     |

---

## 10. Onboarding

### Architecture (`src/config/onboardingFlow.ts`)

- **18-screen default flow** — controlled by PostHog feature flag
- `STEP_REGISTRY` — canonical map: step name → `OnboardingStep` (route + optional `skipWhen`)
- `FLOW_VARIANTS.default` — hard-coded fallback (PostHog unavailable)
- `skipWhen(ctx)` callbacks skip config screens for habits not selected by the user
- `useOnboardingNext()` hook: `navigateNext()`, `navigatePrev()`, `progressFraction`

### Default Flow Order

1. `/onboarding` (welcome)
2. `/onboarding/how-it-works`
3. `/onboarding/the-pact`
4. `/onboarding/habit-selection`
5. `/onboarding/habit-priority`
6. `/onboarding/config-screentime` _(skipped if screentime not selected)_
7. `/onboarding/config-study` _(skipped if study not selected)_
8. `/onboarding/config-fitness` _(skipped if fitness not selected)_
9. `/onboarding/config-sleep` _(skipped if sleep not selected)_
10. `/onboarding/config-prayer` _(skipped if prayer not selected)_
11. `/onboarding/config-meditation` _(skipped if meditation not selected)_
12. `/onboarding/config-reading` _(skipped if reading not selected)_
13. `/onboarding/app-selection` (FamilyControls picker + access control wizard)
14. `/onboarding/screentime-permission`
15. `/onboarding/notification-permission`
16. `/onboarding/healthkit-permission` _(skipped if fitness not selected)_
17. `/onboarding/pact-screen`
18. `/onboarding/building-plan` → redirect to `/paywall`

### Data Collected (`src/types/onboarding.ts`)

`selectedHabits`, `habitPriority`, `habitConfigs` (per-type config), `familyActivitySelection` (opaque token), `screenTimePermissionGranted`, `notificationsEnabled`, `healthKitPermissionGranted`, `pactAccepted`, `analyticsEnabled`

### Completion Flow

1. Onboarding data saved to AsyncStorage immediately (offline-first)
2. `ONBOARDING_COMPLETED` event emitted → nav guard redirects to `/paywall`
3. Data saved to Supabase asynchronously (non-blocking, best-effort)

---

## 11. Mindful Pause (`app/mindful-pause.tsx`)

- Opened via deep link `serenity://mindful-pause` from shield button
- Reads the first uncompleted habit from `habitStore`
- Displays habit-specific shield message from `ShieldService.getShieldMessage()`
- CTA routes to the appropriate habit action screen (study timer, meditation timer, etc.)
- Visual design: nature video background + animated gradient blobs + BlurView overlay + Lottie logo
- `sleep` and `screentime` habits dismiss only (no action screen)

---

## 12. Build & Deployment

### EAS Profiles (`eas.json`)

| Profile       | Distribution | Notes                                 |
| ------------- | ------------ | ------------------------------------- |
| `development` | internal     | Dev client, prebuild caching disabled |
| `preview`     | internal     | Internal testing                      |
| `production`  | internal     | Auto-increment version from remote    |

- App version source: `remote`
- All app extensions declared in `app.json` under `extra.eas.build.experimental.ios.appExtensions`

### npm Scripts

| Script         | Command                                              |
| -------------- | ---------------------------------------------------- |
| `npm start`    | `expo start`                                         |
| `npm run ios`  | `expo run:ios`                                       |
| `npm run lint` | `expo lint`                                          |
| `postinstall`  | `patch-package` (auto-applies device-activity patch) |

---

## 13. Conventions & Rules

1. **Path alias**: `@/*` → `./src/*` — all imports from `src/` use `@/`
2. **No emojis in UI** — `lucide-react-native` icons only
3. **Platform guards**: all Screen Time / FamilyControls API calls wrapped in `Platform.OS === 'ios'` checks
4. **Offline-first**: critical data in AsyncStorage; Supabase is best-effort
5. **Themed styling**: use `useThemedColors()` for the active palette; avoid hard-coded colors
6. **Spacing**: use numeric keys (`spacing[4]`) or inline numbers; no named keys (`.sm`, `.lg`)
7. **Typography**: use `typeScale` constants; no magic font sizes
8. **AsyncStorage keys**: `@onboarding`, `@habits`, `@theme_mode`, `@blocked_apps`
9. **Event-driven nav**: use `appEvents` emitter to decouple state changes from navigation
10. **Animations**: Reanimated 4 for all transitions; `useSequentialFadeIn` for onboarding screens
11. **File-based routing**: Expo Router with typed routes experiment enabled
12. **Deep linking**: `serenity://mindful-pause` → `app/mindful-pause.tsx`; `serenity://study-timer` → `app/study-timer.tsx`; etc.

---

## 14. Current Status

### Completed

- New habit-builder architecture (habitStore, 7 habit types, stacking system)
- Blocking service + shield service wired to habit state
- Notification service for habit reminders
- 18-screen onboarding with PostHog A/B testing and per-habit config
- Design system rewrite (Structured Minimalism / dark-first, SF Pro, numeric spacing)
- All UI components updated to new token API
- HealthKit custom native module
- FamilyControls app selection with multi-step access control wizard
- Mindful Pause updated for habit-based messaging
- Per-habit action screens (study/meditation/reading timers, fitness/prayer status)
- Tab navigator (Today / Progress / Settings)
- RevenueCat subscription with paywall
- Supabase onboarding analytics
- Dark / light / system theme support
- Deep linking from shield extension to habit screens

### Not Yet Done

- Real screen time data on Progress screen (mock data currently)
- Habit streak charts with real historical data
- User authentication (currently device-specific / anonymous)
- Android support
- Comprehensive test suite

---

## 15. File Quick Reference

| What                                | Where                                 |
| ----------------------------------- | ------------------------------------- |
| Root layout / providers / nav guard | `app/_layout.tsx`                     |
| Tab navigator                       | `app/(tabs)/_layout.tsx`              |
| Daily checklist (main screen)       | `app/(tabs)/index.tsx`                |
| Progress & streaks                  | `app/(tabs)/progress.tsx`             |
| Habit settings                      | `app/(tabs)/settings.tsx`             |
| Mindful Pause screen                | `app/mindful-pause.tsx`               |
| Paywall screen                      | `app/paywall.tsx`                     |
| Onboarding flow config              | `src/config/onboardingFlow.ts`        |
| Habit types & configs               | `src/types/habits.ts`                 |
| Color palette                       | `src/constants/colors.ts`             |
| Typography scale                    | `src/constants/typography.ts`         |
| Spacing scale                       | `src/constants/spacing.ts`            |
| Theme objects                       | `src/constants/themes.ts`             |
| Habit state                         | `src/store/habitStore.ts`             |
| Onboarding state                    | `src/store/onboardingStore.ts`        |
| Purchases state                     | `src/store/purchasesStore.ts`         |
| Theme state                         | `src/store/themeStore.ts`             |
| Blocking service                    | `src/services/blockingService.ts`     |
| Shield service                      | `src/services/shieldService.ts`       |
| Notification service                | `src/services/notificationService.ts` |
| Habit engines                       | `src/services/habits/`                |
| RevenueCat service                  | `src/services/purchases.ts`           |
| Supabase service                    | `src/services/supabase.ts`            |
| PostHog service                     | `src/services/posthog.ts`             |
| App event emitter                   | `src/utils/events.ts`                 |

---
