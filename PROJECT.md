# Serenity — Project Documentation

> Single-source-of-truth reference for AI agents and contributors.
> Covers architecture, conventions, native integration, and current status.

---

## 1. Overview

**Serenity** is an iOS screen time management app built with React Native + Expo. Users set app-blocking groups, earn daily unlocks, and nurture a fox companion whose mood and evolution reflect their digital wellness. The app uses Apple's Screen Time / FamilyControls APIs to monitor and block apps natively.

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
| New Arch    | Enabled (`newArchEnabled: true`, React Compiler experiment on)      |

### Key Dependencies

`@expo-google-fonts/lora`, `@expo-google-fonts/inter`, `expo-blur`, `expo-linear-gradient`, `expo-image`, `expo-video`, `expo-haptics`, `react-native-svg`, `react-native-gesture-handler`, `react-native-chart-kit`, `@react-native-async-storage/async-storage`

### Dev Tooling

- ESLint 9 (flat config, `eslint-config-expo`)
- `patch-package` (postinstall hook)
- EAS CLI >= 16.32.0

---

## 3. Project Structure

```
app/                              # Expo Router file-based routing
├── _layout.tsx                   # Root: fonts, auth guard, providers, deep links
├── index.tsx                     # Redirects → /(tabs)/
├── paywall.tsx                   # RevenueCat paywall modal
├── mindful-pause.tsx             # Shield deep-link target (hold-to-unlock)
├── categories.tsx
├── settings.tsx
├── (tabs)/                       # Main tab navigator (NativeTabs)
│   ├── _layout.tsx               # 3 tabs: Apps, Progress, Settings
│   ├── index.tsx                 # Apps tab — group management
│   ├── progress.tsx              # Streaks, charts, stats
│   └── settings.tsx              # Preferences, theme, subscription
├── create-group/                 # 4-step wizard
│   ├── index.tsx                 # Step 1: DeviceActivitySelectionView
│   ├── configure.tsx             # Step 2: name, block mode
│   ├── unlocks.tsx               # Step 3: daily unlock count
│   └── custom-timeframe.tsx      # Step 4: schedule
├── edit-group/
│   └── [id].tsx                  # Edit existing group
└── onboarding/                   # 15-screen onboarding flow
    ├── _layout.tsx               # Stack + PostHog screen tracking
    └── ... (15 screens)

src/
├── components/
│   ├── ui/                       # Design system primitives
│   │   ├── Button.tsx            # 4 variants, 3 sizes
│   │   ├── Input.tsx             # Labels, errors, icons
│   │   ├── Card.tsx              # 3 variants
│   │   ├── Badge.tsx             # 4 colors, 2 sizes
│   │   └── index.ts
│   ├── FoxAvatar.tsx             # Fox companion display
│   ├── OnboardingHeader.tsx      # Progress bar + back button
│   └── DevOverlay.tsx            # DEV-only debug panel
├── config/
│   └── onboardingFlow.ts         # A/B flow variants, step ordering
├── constants/
│   ├── colors.ts                 # Full palette v2 (light + dark)
│   ├── typography.ts             # Lora + Inter, type scale
│   ├── spacing.ts                # Spacing scale, radii, shadows
│   ├── themes.ts                 # lightTheme / darkTheme objects
│   └── index.ts
├── hooks/
│   ├── useOnboardingNext.ts      # Flow-aware nav + tracking
│   ├── useOnboardingAnimation.ts # Reanimated fade-in helpers
│   ├── useRevenueCat.ts          # Paywall/subscription hook
│   └── useThemedStyles.ts        # Active theme colors
├── services/
│   ├── appGroups.ts              # Group CRUD, native blocking, shield config
│   ├── posthog.ts                # PostHog client + typed events
│   ├── purchases.ts              # RevenueCat init, offerings, purchase flow
│   └── supabase.ts               # Supabase client + OnboardingService
├── store/
│   ├── appStore.ts               # Fox state, screen time, streaks, limits
│   ├── onboardingStore.ts        # Onboarding data & step tracking
│   ├── purchasesStore.ts         # RevenueCat state, isPro, offerings
│   └── themeStore.ts             # Theme mode (light/dark/system)
├── types/
│   ├── index.ts                  # FoxState, ScreenTimeData, AppLimit, etc.
│   └── onboarding.ts             # OnboardingData, OnboardingRecord
└── utils/
    ├── categories.ts             # Bundle-ID → category mapping
    ├── events.ts                 # AppEventEmitter (ONBOARDING_COMPLETED/RESET)
    └── screentime.ts             # ScreenTime wrapper (current)

targets/                          # iOS App Extension targets
├── ActivityMonitorExtension/     # Monitors device activity intervals
├── ShieldAction/                 # Handles shield button taps
└── ShieldConfiguration/          # Renders custom block screen UI

modules/screentime/index.ts      # Legacy NativeModules wrapper (superseded)
utils/screentime.ts               # Root-level duplicate (prefer src/utils/)
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

RevenueCat iOS API key is set directly in `src/services/purchases.ts`. Replace the test key (`test_DtXiUbRpjorxKjwwuGhozpjBJyx`) with a production key before release.

---

## 5. Routing & Navigation

### Root Layout (`app/_layout.tsx`)

- Loads Lora + Inter fonts via `useFonts(fontAssets)`
- Reads `AsyncStorage('onboardingCompleted')` for routing decision
- Initializes theme + RevenueCat SDK
- Sets up daily reset timer + `AppState` listener for re-blocking
- Handles deep links (`serenity://mindful-pause?groupId=...`)
- Wraps app in `<PostHogProvider>`
- **Nav guard**: onboarding incomplete → `/onboarding/`; complete & currently in onboarding → `/paywall`

### Tab Navigator (`app/(tabs)/_layout.tsx`)

Uses `expo-router/unstable-native-tabs` (`NativeTabs`) with 3 tabs: **Apps**, **Progress**, **Settings**.

### Key Flows

- **Create Group**: 4-step wizard (select apps → configure → unlocks → timeframe)
- **Edit Group**: Dynamic route `[id].tsx`
- **Mindful Pause**: Full-screen modal via deep link from shield extension
- **Paywall**: Full-screen RevenueCat paywall shown after onboarding completion

---

## 6. State Management (Zustand)

| Store                | File                           | Key State                                                      |
| -------------------- | ------------------------------ | -------------------------------------------------------------- |
| `useAppStore`        | `src/store/appStore.ts`        | Fox mood/evolution/happiness, screen time, streaks, app limits |
| `useOnboardingStore` | `src/store/onboardingStore.ts` | Form data, step tracking, Supabase save                        |
| `usePurchasesStore`  | `src/store/purchasesStore.ts`  | CustomerInfo, isPro, current offering                          |
| `useThemeStore`      | `src/store/themeStore.ts`      | Theme mode (light/dark/system)                                 |

All stores persist to AsyncStorage via manual `loadFromStorage`/`saveToStorage` methods.

### Fox Evolution System

- **Baby** (days 1–7) → **Teen** (days 8–30) → **Adult** (day 31+)
- Evolution keyed on `streakData.currentStreak`
- Mood (happy/neutral/sad/sleeping) derived from daily usage vs. daily limit
- Happiness meter (0–100): adjusts ±10/15 based on usage percentage

### Event System (`src/utils/events.ts`)

`AppEventEmitter` for decoupled communication:

- `ONBOARDING_COMPLETED` → triggers nav guard update
- `ONBOARDING_RESET` → resets onboarding state

---

## 7. Services

### Supabase (`src/services/supabase.ts`)

- Client from `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_KEY`
- `OnboardingService.saveOnboardingData()` — non-blocking insert after onboarding
- Table: `onboarding` with RLS policies
- **Offline-first**: app works fully without Supabase

### RevenueCat (`src/services/purchases.ts`)

- Entitlement: `"Serenity Pro"` | Products: `monthly`, `yearly`, `lifetime`
- `useRevenueCat()` hook exposes: `showPaywall()`, `showPaywallIfNeeded()`, `restore()`
- Paywall UI via `react-native-purchases-ui` (remote-configured from RC dashboard)

### PostHog (`src/services/posthog.ts`)

- Disabled in `__DEV__` by default
- Feature flag: `onboarding-flow-variant` — **flow controlled remotely from PostHog platform**
  - Flag **payload** = JSON array of step names → defines the exact screen order (e.g. `["welcome","name-input","screentime-permission","daily-goal","building-plan"]`)
  - Flag **value** = legacy variant key string (`"default"` / `"permissions-first"`) for backward compat
  - `null` / missing payload → falls back to hard-coded `FLOW_VARIANTS.default`
- `STEP_REGISTRY` maps every screen name to its route; PostHog payloads reference these names
- `useRemoteOnboardingFlow()` resolves the active step list at runtime; `useOnboardingNext()` consumes it
- Tracked events: `onboarding_screen_view`, `onboarding_step_completed`, `onboarding_step_back`, `onboarding_completed`

### App Groups Service (`src/services/appGroups.ts`)

- CRUD for `AppGroup` objects in AsyncStorage key `@app_groups`
- Each group holds: name, apps, `familyActivitySelection` token, session length, daily unlocks, schedule, block state
- On save → calls `blockSelection`/`unblockSelection` via device-activity bridge
- Writes per-group shield config to `UserDefaults` for `ShieldConfiguration` extension
- Shield button deep-links: `serenity://mindful-pause?groupId=<id>`
- Daily unlock reset at midnight + on app foreground

---

## 8. Native iOS Integration

### Apple Frameworks Used

- **FamilyControls** — authorization & activity picker
- **ManagedSettings** — app blocking / shield display
- **DeviceActivity** — scheduled monitoring
- **ManagedSettingsUI** — shield configuration customization

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

**Patch** (`patches/react-native-device-activity+0.5.1.patch`): Adds an `appearance` prop (`'light' | 'dark' | 'unspecified'`) to `DeviceActivitySelectionView` so the native picker respects the app's theme.

### App Extension Targets

| Extension                | Bundle ID                                   | Purpose                                                         |
| ------------------------ | ------------------------------------------- | --------------------------------------------------------------- |
| ActivityMonitorExtension | `com.msl.serenity.ActivityMonitorExtension` | Monitors device activity intervals, executes configured actions |
| ShieldAction             | `com.msl.serenity.ShieldAction`             | Handles shield button taps (open deep link, unblock, whitelist) |
| ShieldConfiguration      | `com.msl.serenity.ShieldConfiguration`      | Renders custom block screen (title, subtitle, buttons, colors)  |

All 3 extensions share `group.com.msl.serenity` app group for UserDefaults data exchange with the main app.

### Entitlements (`app.json`)

```json
{
  "com.apple.developer.family-controls": true,
  "com.apple.security.application-groups": ["group.com.msl.serenity"]
}
```

### Shield → App Deep Link Flow

1. User taps a button on the shield screen of a blocked app
2. `ShieldActionExtension` opens URL `serenity://mindful-pause?groupId=X`
3. Root layout routes to `app/mindful-pause.tsx`
4. **Limited groups**: hold-to-unlock (5 sec) | **Blocked groups**: motivational dismiss

### Critical Notes

- **Physical device required** — Screen Time APIs do not work in the simulator
- **FamilyControls entitlement** must be approved by Apple for all 4 bundle IDs before distribution
  - Request at: https://developer.apple.com/contact/request/family-controls-distribution
  - Until approved: local Xcode builds only — no TestFlight or App Store
- `REACT_NATIVE_DEVICE_ACTIVITY_APP_GROUP` build variable must match the app group in native targets

---

## 9. Design System

### Colors (`src/constants/colors.ts`)

Muted, breathable tones inspired by Calm, Oura, and Headspace. Every color passes WCAG AA contrast.

| Role                  | Token                                 | Light                    | Dark      |
| --------------------- | ------------------------------------- | ------------------------ | --------- |
| Brand / CTAs          | `primary`                             | `#E07A5F` (Terracotta)   | same      |
| Secondary actions     | `secondary`                           | `#7C6D9E` (Dusty Violet) | same      |
| Progress / highlights | `accent`                              | `#6B9E8F` (Sage)         | same      |
| Page background       | `background` / `backgroundDark`       | `#F8F7F4`                | `#13110F` |
| Card surface          | `surface` / `surfaceDark`             | `#FFFFFF`                | `#1E1B18` |
| Headings              | `textPrimary` / `textDarkPrimary`     | `#1C1917`                | `#F5F4F1` |
| Body copy             | `textSecondary` / `textDarkSecondary` | `#57534E`                | `#C7C4BF` |
| Success               | `success`                             | `#4A9E7F`                | same      |
| Error                 | `error`                               | `#C0504A`                | same      |
| Warning               | `warning`                             | `#C49A3C`                | same      |
| Info                  | `info`                                | `#4A7FA5`                | same      |

Full palette also includes: `primaryLight/Dark/Subtle`, `secondaryLight/Subtle`, `accentLight/Subtle`, all status `Light`/`Subtle` variants, `borderStrong`/`borderDark`, `divider`, warm shadow tokens, and overlay presets.

### Typography (`src/constants/typography.ts`)

- **Lora** (serif) — Display/H1 headings only (Bold, SemiBold, Medium, Regular)
- **Inter** (sans-serif) — all other UI text (Regular, Medium, SemiBold, Bold)
- Scale: Display 1 (48) → Display 2 (36) → H1 (28) → H2 (22) → H3 (18) → Body Large (16) → Body (14) → Caption (12) → Label (11)
- Fonts loaded via `useFonts(fontAssets)` with `@expo-google-fonts/*`

### Spacing (`src/constants/spacing.ts`)

- Scale: `xxs`(4) → `xs`(8) → `sm`(16) → `md`(20) → `lg`(24) → `xl`(32) → `xxl`(40)
- Border radius: `small`(12) → `medium`(16) → `large`(20) → `xlarge`(24) → `full`(9999)
- Shadow presets with warm tint `rgba(255, 122, 61, 0.2)`

### Themes (`src/constants/themes.ts`)

`lightTheme` and `darkTheme` objects consumed via `useThemedColors()` hook.

### UI Components (`src/components/ui/`)

| Component | Variants / Notes                                       |
| --------- | ------------------------------------------------------ |
| `Button`  | primary, secondary, outline, ghost · sizes: sm, md, lg |
| `Input`   | label, error message, helper text, icon support        |
| `Card`    | default, elevated, outlined                            |
| `Badge`   | 4 color variants · sizes: sm, md                       |

---

## 10. Onboarding

### Architecture (`src/config/onboardingFlow.ts`)

- **15-screen flow** — step order is decided from the **PostHog platform** (no code release needed)
- `STEP_REGISTRY` — canonical map of every screen name → `OnboardingStep` (route + name + optional `skipWhen`)
- `FLOW_VARIANTS` — hard-coded fallback variants; used when PostHog is unavailable or payload is absent
- `useRemoteOnboardingFlow()` — reads the PostHog flag payload as a JSON array of step names and builds the live step list; falls back to variant key string, then to `default`
- `useOnboardingNext()` hook: `navigateNext()`, `navigatePrev()`, `progressFraction`
- Steps can be conditionally skipped via `skipWhen(ctx)` callbacks (applied even on remotely-defined flows)

#### PostHog Feature Flag Setup

1. Create flag with key `onboarding-flow-variant`
2. For each experiment variant, set the **Payload** to a JSON array of step names:
   ```json
   [
     "welcome",
     "name-input",
     "problem-selection",
     "screentime-permission",
     "notification-permission",
     "daily-goal",
     "app-selection",
     "building-plan"
   ]
   ```
3. Valid step names (see `STEP_REGISTRY`): `welcome`, `name-input`, `name-intro`, `problem-selection`, `solution-preview`, `stats-intro`, `pause-reflect`, `mindful-sessions`, `screentime-permission`, `notification-permission`, `phone-usage`, `daily-goal`, `app-selection`, `usage-patterns`, `building-plan`
4. Leave payload empty / `null` for the control group (uses app default flow)

### Default Flow Order

1. Welcome → 2. Name Input → 3. Name Intro → 4. Problem Selection → 5. Solution Preview → 6. Stats Intro → 7. Pause & Reflect → 8. Mindful Sessions → 9. Screen Time Permission → 10. Notification Permission → 11. Phone Usage → 12. Daily Goal → 13. App Selection → 14. Usage Patterns → 15. Building Plan

### Data Collected (`src/types/onboarding.ts`)

`primaryProblem`, `primaryGoal`, `foxName`, `dailyLimitHours`, `dailyLimitMinutes`, `notificationsEnabled`, `screenTimePermissionGranted`, `currentDailyUsageRange`, `problemApps`, `selectedApps`, `selectedCategories`, `whenUsePhoneMost`, `reasonForChange`, `analyticsEnabled`

### Completion Flow

1. Data saved to AsyncStorage immediately (offline-first)
2. `ONBOARDING_COMPLETED` event emitted → nav guard redirects to `/paywall`
3. Data saved to Supabase asynchronously (non-blocking, best-effort)

### Testing / Reset

- Use `DevOverlay` component (visible in `__DEV__`) to reset onboarding
- Or call `useOnboardingStore().resetOnboarding()` programmatically

---

## 11. Mindful Pause (`app/mindful-pause.tsx`)

- Opened via deep link `serenity://mindful-pause?groupId=<id>` from shield button
- **Limited groups**: user must hold a button for 5 seconds (haptic rhythm + countdown phrases) to unlock; decrements daily unlock count on success
- **Blocked groups**: shows motivational quote; single tap dismisses (shield stays active)
- Visual design: nature video background, animated gradient blobs, `BlurView` overlay, Lottie logo animation, Lora serif headings

---

## 12. Build & Deployment

### EAS Profiles (`eas.json`)

| Profile       | Distribution | Notes                                 |
| ------------- | ------------ | ------------------------------------- |
| `development` | internal     | Dev client, prebuild caching disabled |
| `preview`     | internal     | Internal testing                      |
| `production`  | internal     | Auto-increment version from remote    |

- App version source: `remote`
- All 3 app extensions declared in `app.json` under `extra.eas.build.experimental.ios.appExtensions`

### npm Scripts

| Script         | Command                                              |
| -------------- | ---------------------------------------------------- |
| `npm start`    | `expo start`                                         |
| `npm run ios`  | `expo run:ios`                                       |
| `npm run lint` | `expo lint`                                          |
| `postinstall`  | `patch-package` (auto-applies device-activity patch) |

---

## 13. Conventions & Rules

1. **Path alias**: `@/*` → `./src/*` — all imports from `src/` must use `@/`
2. **No emojis in UI** — `lucide-react-native` icons exclusively
3. **Platform guards**: all Screen Time / FamilyControls calls wrapped in `Platform.OS !== 'ios'` checks
4. **Offline-first**: critical data in AsyncStorage; Supabase is best-effort
5. **Themed styling**: use `useThemedColors()` to get the active palette; styles are functions of theme
6. **AsyncStorage keys**: `onboardingCompleted`, `onboardingData`, `@app_groups`, `@theme_mode`
7. **Event-driven nav**: use `appEvents` emitter to decouple state changes from navigation
8. **Animations**: Reanimated 4 for all transitions; `useOnboardingAnimation` for sequential fade-ins
9. **Composition**: `OnboardingHeader` is reused across onboarding and create-group flows
10. **File-based routing**: Expo Router with typed routes experiment enabled
11. **Deep linking**: always route `serenity://mindful-pause?groupId=...` → `app/mindful-pause.tsx`

---

## 14. Current Status

### Completed

- Design system (colors, typography, spacing, themes, 4 base UI components)
- Zustand stores with AsyncStorage persistence
- 15-screen onboarding with PostHog A/B testing
- Supabase onboarding analytics
- Screen Time integration + 3 iOS app extensions
- App group CRUD with native blocking
- Mindful Pause (hold-to-unlock + blocked mode)
- RevenueCat subscription system with paywall
- Dark / light / system theme support
- Progress screen (currently mock data)
- Settings screen with subscription management
- Fox companion with evolution (Baby → Teen → Adult) and mood system
- Deep linking from shield extension to main app
- PostHog analytics
- Daily unlock reset (midnight + foreground)

### Not Yet Done

- Real screen time data on Progress screen (uses mock data)
- Fox illustrations for all evolution stages (currently single default image)
- Lottie animations for fox mood transitions
- User authentication (currently device-specific / anonymous)
- Push notifications for reminders
- Android support
- Comprehensive test suite

---

## 15. File Quick Reference

| What                                | Where                                              |
| ----------------------------------- | -------------------------------------------------- |
| Root layout / providers / nav guard | `app/_layout.tsx`                                  |
| Tab navigator                       | `app/(tabs)/_layout.tsx`                           |
| Mindful Pause screen                | `app/mindful-pause.tsx`                            |
| Paywall screen                      | `app/paywall.tsx`                                  |
| Onboarding flow config              | `src/config/onboardingFlow.ts`                     |
| Color palette                       | `src/constants/colors.ts`                          |
| Typography scale                    | `src/constants/typography.ts`                      |
| Spacing scale                       | `src/constants/spacing.ts`                         |
| Theme objects                       | `src/constants/themes.ts`                          |
| Fox + app state                     | `src/store/appStore.ts`                            |
| Onboarding state                    | `src/store/onboardingStore.ts`                     |
| Purchases state                     | `src/store/purchasesStore.ts`                      |
| Theme state                         | `src/store/themeStore.ts`                          |
| App group service                   | `src/services/appGroups.ts`                        |
| Screen Time wrapper (current)       | `src/utils/screentime.ts`                          |
| Screen Time wrapper (legacy)        | `modules/screentime/index.ts`                      |
| RevenueCat service                  | `src/services/purchases.ts`                        |
| Supabase service                    | `src/services/supabase.ts`                         |
| PostHog service                     | `src/services/posthog.ts`                          |
| App event emitter                   | `src/utils/events.ts`                              |
| Shield config extension             | `targets/ShieldConfiguration/`                     |
| Shield action extension             | `targets/ShieldAction/`                            |
| Activity monitor extension          | `targets/ActivityMonitorExtension/`                |
| Device-activity patch               | `patches/react-native-device-activity+0.5.1.patch` |
| Expo / EAS config                   | `app.json`, `eas.json`                             |
| TypeScript config                   | `tsconfig.json`                                    |
