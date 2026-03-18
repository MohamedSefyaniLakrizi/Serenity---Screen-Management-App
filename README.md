# Serenity — Screen Management App 🦊

Serenity is an **iOS digital wellbeing app** that helps people reduce distracting screen time using real app blocking, intentional unlocks, and a playful fox companion that reflects daily habits.

## Why Serenity

Most screen-time tools only report usage. Serenity is built to **change behavior**:

- Create focused app groups and schedules
- Block selected apps with iOS Screen Time APIs
- Earn limited daily unlocks instead of endless overrides
- Use a “Mindful Pause” hold-to-unlock step before re-entry
- Track streaks and progress through a companion-based system

## How the App Works

1. **Onboarding (15 screens)** captures goals and setup context.
2. **Create Group flow (4 steps)** selects apps, configures mode, unlock count, and timeframe.
3. **Native enforcement** applies blocking through FamilyControls / ManagedSettings / DeviceActivity.
4. **Progress + gamification** updates streaks, usage metrics, and fox state.
5. **Monetization** uses RevenueCat for premium limits and paywall flows.

## Tech Stack

- **Framework:** React Native 0.81 + Expo SDK 54 (Expo Router)
- **Language:** TypeScript (strict)
- **State:** Zustand + AsyncStorage persistence
- **Styling:** React Native StyleSheet + design-system constants
- **Animations/UI:** Reanimated, Lottie, expo-image, expo-blur, expo-linear-gradient
- **Analytics & Backend:** PostHog, Supabase (non-blocking/offline-friendly)
- **Subscriptions:** RevenueCat (`react-native-purchases`, `react-native-purchases-ui`)
- **Native Screen Time Bridge:** `react-native-device-activity` (patched)

## Project Structure

```text
app/                 # Routes and screen flows (tabs, onboarding, create/edit group)
src/components/      # Reusable UI and feature components
src/store/           # Zustand stores (app, onboarding, purchases, theme)
src/services/        # App groups, purchases, analytics, supabase
src/hooks/           # Flow, animations, theme, RevenueCat hooks
targets/             # iOS extensions (monitor, shield action/config)
```

## Run Locally

### Prerequisites

- Node.js 18+
- npm
- Xcode + iOS Simulator (iOS only)

### Install & start

```bash
npm install
npm start
```

### Useful scripts

```bash
npm run ios     # Run iOS build
npm run lint    # Lint project
```

## Current Scope

- ✅ iOS-first app (Android not implemented)
- ✅ Core flows: onboarding, group setup, native blocking, mindful pause, paywall integration
- 🚧 Some progress data and parts of polish/animations are still evolving

---
