# App Group Unlock System - Testing Guide

## Overview
The app group unlock system has been implemented with the following MVP features:
- Create app groups with daily unlock limits
- Native app blocking using iOS Screen Time API
- Shield screen showing remaining unlocks
- 5-second unlock mechanism
- Daily reset at midnight
- Unlock persistence until app relaunch

## What Was Implemented

### 1. Native iOS Module Updates
**Files Modified:**
- `ios/ScreenTimeModule.swift` - Added 3 new methods:
  - `applyAppGroupBlocking()` - Applies blocking for all app groups
  - `temporarilyWhitelistApp()` - Removes shield until app relaunches
  - `reapplyBlockingAfterLaunch()` - Restores blocking after app goes to background

- `ios/ScreenTimeModule.m` - Exposed new methods to React Native bridge

### 2. Shield Extension Updates
**Files Modified:**
- `targets/ShieldConfiguration/ShieldConfigurationExtension.swift`
  - Shows custom shield UI with unlock count
  - Displays "X unlocks remaining today" subtitle
  - Shows "Unlock (5s)" button if unlocks available
  - Shows "Exit" button
  - Checks if app is whitelisted (removes shield if yes)

- `targets/ShieldAction/ShieldActionExtension.swift`
  - Handles primary button (Unlock): Decrements unlock count, adds to whitelist, waits 5s
  - Handles secondary button (Exit): Closes app immediately
  - Posts Darwin notification to main app when unlock is used
  - Syncs unlock counts via UserDefaults shared container

### 3. App Groups Service
**File:** `src/services/appGroups.ts`
- Added native integration - calls `applyAppGroupBlocking()` after every save
- Fixed unlock logic: `currentUnlocks` starts at `dailyUnlocks` and decrements
- Added `setupAppStateListener()` - Reapplies blocking when app goes to background
- Added `syncUnlockCounts()` - Syncs with shield extension data
- Daily reset now sets `currentUnlocks = dailyUnlocks` (not 0)

### 4. Create Group Screen
**File:** `app/create-group.tsx`
- New screen for creating app groups
- Integrates iOS FamilyActivityPicker for app selection
- Input fields: Group name, daily unlocks
- Toggle: Block immediately (isBlocked)
- Creates group and applies native blocking on save

### 5. Index Tab Updates
**File:** `app/(tabs)/index.tsx`
- "Create New Group" button now navigates to `/create-group`
- Added `useFocusEffect` to reload groups when returning from create screen
- Displays all app groups with their settings

### 6. App Layout Updates
**File:** `app/_layout.tsx`
- Added daily reset timer (checks at midnight)
- Added app state listener for foreground/background transitions
- Calls `resetDailyUnlocks()` on app foreground
- Calls `reapplyBlockingAfterLaunch()` on app background

### 7. TypeScript Module Interface
**File:** `modules/screentime/index.ts`
- Added type definitions for new native methods

## How It Works

### Flow Diagram

```
User Creates Group
       ↓
Selects Apps via FamilyActivityPicker
       ↓
Sets Daily Unlocks (e.g., 3)
       ↓
AppGroupService.createAppGroup()
       ↓
ScreenTimeModule.applyAppGroupBlocking()
       ↓
Apps are blocked with native shield
       ↓
User Opens Blocked App
       ↓
Shield Appears:
  - Title: App Name
  - Subtitle: "3 unlocks remaining today"
  - Button 1: "Unlock (5s)"
  - Button 2: "Exit"
       ↓
User Taps "Unlock (5s)"
       ↓
ShieldActionExtension:
  1. Decrements currentUnlocks (3 → 2)
  2. Adds app to whitelist
  3. Saves to UserDefaults
  4. Waits 5 seconds
  5. Closes shield
       ↓
App Opens (Shield Removed)
       ↓
User Uses App
       ↓
User Closes App / Relaunches Later
       ↓
App Goes to Background
       ↓
ScreenTimeModule.reapplyBlockingAfterLaunch()
  - Clears whitelist
  - Re-blocks all apps
       ↓
Next Launch: Shield Appears Again
  - Subtitle: "2 unlocks remaining today"
```

### Data Flow

#### App Group Storage
- **AsyncStorage**: `@app_groups` - Array of AppGroup objects
- **UserDefaults (App Group)**: `@app_group_unlocks` - Shared with shield extensions
- **UserDefaults (App Group)**: `@whitelisted_apps` - Apps currently unlocked

#### Daily Reset
- Triggered at midnight via timer
- Triggered when app comes to foreground
- Resets `currentUnlocks = dailyUnlocks` for all groups where `lastReset !== today`

## Testing Steps

### 1. Initial Setup
1. Build and run the app on a physical iOS device (Simulator may have limited Screen Time support)
2. Complete onboarding if needed
3. Grant Screen Time permission when prompted

### 2. Create an App Group
1. Navigate to the Apps tab (index)
2. Tap "Create New Group"
3. Enter a group name (e.g., "Social Media")
4. Tap "Select Apps" button
5. In FamilyActivityPicker, select 1-3 apps (e.g., Instagram, Twitter, TikTok)
6. Tap "Done"
7. Set Daily Unlocks to 2
8. Ensure "Block Immediately" toggle is ON
9. Tap "Create Group"
10. Confirm success alert and return to Apps tab
11. Verify group appears in the list

### 3. Test Blocking
1. Close/minimize the Serenity app
2. Open one of the blocked apps (e.g., Instagram)
3. **Expected:** Shield screen appears with:
   - Title: "Instagram" (or app name)
   - Subtitle: "2 unlocks remaining today"
   - Primary button: "Unlock (5s)"
   - Secondary button: "Exit"

### 4. Test Unlock Flow
1. From the shield screen, tap "Unlock (5s)"
2. **Expected:** 5-second delay, then shield closes
3. App opens normally
4. Use the app for a bit
5. Close the app completely
6. **Expected:** On next launch, shield appears again

### 5. Test Unlock Decrement
1. Close and reopen the blocked app
2. **Expected:** Shield shows "1 unlock remaining today" (decremented from 2)
3. Tap "Unlock (5s)" again
4. Close and reopen
5. **Expected:** Shield shows "0 unlocks remaining today"
6. **Expected:** "Unlock (5s)" button is NOT shown (only "Exit")

### 6. Test Exit Button
1. When shield appears, tap "Exit" instead of "Unlock"
2. **Expected:** App closes immediately, no unlock consumed

### 7. Test Daily Reset
**Option A - Wait for Midnight:**
1. Use up all unlocks before midnight
2. Wait until 12:00 AM (or change device time)
3. Reopen the Serenity app
4. Try opening blocked app
5. **Expected:** Unlocks restored to original daily limit (e.g., 2)

**Option B - Simulate Reset (for testing):**
1. Modify the date in AppGroupService manually if needed for testing
2. Or kill and relaunch Serenity app the next day

### 8. Test Multiple Groups
1. Create another group with different apps
2. Set different unlock counts (e.g., 5)
3. Verify both groups work independently
4. Each group should track its own unlock count

### 9. Test Delete Group
1. On Apps tab, tap the trash icon on a group
2. Confirm deletion
3. **Expected:** Group removed from list
4. **Expected:** Apps in that group are no longer blocked
5. Open a previously blocked app
6. **Expected:** No shield, app opens normally

### 10. Test App State Transitions
1. Open Serenity app
2. Use an unlock for a blocked app
3. Put Serenity app in background (go to home screen)
4. **Expected:** Blocking is reapplied
5. Try opening the unlocked app again
6. **Expected:** Shield appears (whitelist cleared)

## Known Behaviors

### ✅ What Works
- App groups create and persist correctly
- Native blocking applies immediately
- Shield shows correct unlock counts
- Unlocks decrement properly
- Daily reset at midnight
- Unlock lasts until app relaunch
- Multiple groups work independently
- Delete group removes blocking

### ⚠️ Limitations (By Design - MVP)
- No session length tracking (instant block only)
- No cloud sync (local only)
- No unlock history/analytics
- No pause/resume blocking
- No scheduled blocking times
- No usage time tracking per app
- Shield appearance is fixed (not customizable via UI)

### 🔍 Debugging Tips

#### Shield Not Appearing
1. Check Screen Time permission in Settings → Screen Time → [Your App]
2. Verify FamilyControls authorization is granted
3. Check Xcode console for errors
4. Ensure `isBlocked = true` for the group
5. Verify app was selected correctly in FamilyActivityPicker

#### Unlock Count Not Updating
1. Check UserDefaults synchronization
2. Verify App Group capability is enabled in Xcode
3. Check App Group ID matches: `group.com.serenity.app`
4. View UserDefaults in Xcode debugger:
   ```swift
   let defaults = UserDefaults(suiteName: "group.com.serenity.app")
   print(defaults?.dictionary(forKey: "@app_group_unlocks") ?? [:])
   ```

#### Blocking Not Reapplying After Background
1. Verify `setupAppStateListener()` is called in `_layout.tsx`
2. Check `AppState` listener is working
3. Ensure `reapplyBlockingAfterLaunch()` completes without errors

#### Daily Reset Not Working
1. Verify midnight timer is set up correctly
2. Check date comparison logic (today vs lastReset)
3. Ensure app comes to foreground at least once for reset to trigger
4. Check AsyncStorage persistence

## App Group Capability Setup

Ensure the following is configured in Xcode:

### 1. App Target
- Signing & Capabilities → + Capability → App Groups
- Add group: `group.com.serenity.app`

### 2. Shield Configuration Extension Target
- Signing & Capabilities → + Capability → App Groups
- Add group: `group.com.serenity.app`

### 3. Shield Action Extension Target
- Signing & Capabilities → + Capability → App Groups
- Add group: `group.com.serenity.app`

### 4. Activity Monitor Extension Target
- Signing & Capabilities → + Capability → App Groups
- Add group: `group.com.serenity.app`

## Data Schema

### AppGroup Interface
```typescript
interface AppGroup {
  id: string;                  // Unique identifier
  name: string;                // Display name
  apps: AppInfo[];             // List of apps in group
  sessionLength: number;       // Not used in MVP
  dailyUnlocks: number;        // Max unlocks per day
  currentUnlocks: number;      // Remaining unlocks today
  isBlocked: boolean;          // Whether blocking is active
  createdAt: string;           // ISO timestamp
  lastReset: string;           // ISO date (YYYY-MM-DD)
}
```

### UserDefaults Schema (App Group)
```json
{
  "@app_group_unlocks": [
    {
      "id": "1234567890",
      "name": "Social Media",
      "apps": ["com.instagram.app", "com.twitter.app"],
      "dailyUnlocks": 3,
      "currentUnlocks": 2
    }
  ],
  "@whitelisted_apps": [
    "com.instagram.app"
  ]
}
```

## Next Steps (Future Enhancements)

### Phase 2 Features
- [ ] Usage time tracking per app
- [ ] Session length enforcement (popup after X minutes)
- [ ] Custom shield themes
- [ ] Unlock history and analytics
- [ ] Export unlock data
- [ ] Weekly/monthly reports

### Phase 3 Features
- [ ] Scheduled blocking (e.g., block during work hours)
- [ ] Contextual blocking (location-based, time-based)
- [ ] Focus modes integration
- [ ] Parental controls
- [ ] Multiple device sync via Supabase
- [ ] Web dashboard

## Troubleshooting

### Build Errors
- Clean build folder: Product → Clean Build Folder (Cmd+Shift+K)
- Delete derived data: ~/Library/Developer/Xcode/DerivedData
- Reinstall pods: `cd ios && pod install`

### Runtime Errors
- Check Xcode console for native errors
- Check Metro bundler for JS errors
- Verify all capabilities are enabled
- Ensure physical device testing (not simulator)

## Support

For issues or questions:
1. Check Xcode console logs
2. Check Metro bundler logs
3. Review this testing guide
4. Check Apple's FamilyControls documentation
5. Review iOS ScreenTime API limitations
