# React Native Device Activity Setup Guide

## Overview
This app now uses **`react-native-device-activity`** to integrate with Apple's Screen Time APIs, replacing the custom native module implementation. This package provides:

- ✅ **FamilyControls API** - App/category selection
- ✅ **ManagedSettings API** - Blocking capabilities  
- ✅ **DeviceActivity API** - Activity monitoring
- ✅ **ShieldConfiguration API** - Custom block screens

## Installation

### 1. Install the Package

```bash
npm install react-native-device-activity
# or
yarn add react-native-device-activity
```

### 2. Configure app.json

Add the Expo plugin configuration:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "15.1"
          }
        }
      ],
      [
        "react-native-device-activity",
        {
          "appleTeamId": "YOUR_TEAM_ID",
          "appGroup": "group.YOUR_APP_GROUP_NAME"
        }
      ]
    ]
  }
}
```

**Important:**
- Replace `YOUR_TEAM_ID` with your Apple Developer Team ID
- Replace `YOUR_APP_GROUP_NAME` with your app group identifier (e.g., `group.com.yourcompany.serenity`)

### 3. Generate Native Projects

```bash
npx expo prebuild --platform ios
```

### 4. Verify Xcode Targets

Open the iOS project in Xcode:

```bash
cd ios
open Serenity.xcworkspace
```

Verify these targets exist:
- ✅ **Serenity** (main app)
- ✅ **ActivityMonitorExtension**
- ✅ **ShieldAction**  
- ✅ **ShieldConfiguration**

### 5. Request Apple Entitlements

**CRITICAL:** You need Apple's approval for Family Controls (Distribution) entitlement:

1. Go to: https://developer.apple.com/contact/request/family-controls-distribution
2. Request approval for ALL bundle identifiers:
   - `com.yourcompany.serenity`
   - `com.yourcompany.serenity.ActivityMonitor`
   - `com.yourcompany.serenity.ShieldAction`
   - `com.yourcompany.serenity.ShieldConfiguration`

⚠️ **Note:** Until approved, you can only build locally in Xcode (no TestFlight or App Store).

### 6. Enable Capabilities Manually

Once approved, go to https://developer.apple.com/account/resources/identifiers/list

For EACH bundle identifier above:
1. Select the identifier
2. Click "Edit"
3. Under "Additional Capabilities"
4. Enable "Family Controls (Distribution)"
5. Save

## Usage in the App

### Step 6: App Selection

The onboarding step 6 now uses the native `DeviceActivitySelectionView`:

```typescript
import ScreenTime, { DeviceActivitySelectionView } from '@/utils/screentime';

// Request authorization
await ScreenTime.requestAuthorization();

// Render native selection UI
<DeviceActivitySelectionView
  onSelectionChange={(event) => {
    const selection = event.nativeEvent.familyActivitySelection;
    setFamilyActivitySelection(selection);
  }}
  familyActivitySelection={familyActivitySelection}
  style={{ flex: 1 }}
/>

// Save selection with an ID
ScreenTime.setFamilyActivitySelectionId({
  id: "my_selection",
  familyActivitySelection: selection,
});
```

### Blocking Apps

```typescript
// Block immediately
await ScreenTime.blockSelection({
  activitySelectionId: "my_selection",
  shieldId: "custom_shield",
});

// Or schedule blocking
await ScreenTime.startMonitoring(
  "evening_block",
  {
    intervalStart: { hour: 19, minute: 0 },
    intervalEnd: { hour: 23, minute: 59 },
    repeats: true,
  },
  []
);
```

### Custom Shield UI

```typescript
ScreenTime.updateShield(
  {
    title: "Time for a Break!",
    subtitle: "These apps are unavailable",
    primaryButtonLabel: "OK",
    iconSystemName: "moon.stars.fill",
  },
  {
    primary: {
      type: "dismiss",
      behavior: "close",
    },
  }
);
```

## API Reference

### Authorization
- `requestAuthorization()` - Request Screen Time permission
- `getAuthorizationStatus()` - Check current status
- `revokeAuthorization()` - Revoke permission

### Selection Management
- `setFamilyActivitySelectionId({ id, familyActivitySelection })` - Save selection
- `blockSelection({ activitySelectionId, shieldId })` - Block apps
- `unblockSelection({ activitySelectionId })` - Unblock apps

### Scheduling
- `startMonitoring(name, schedule, events)` - Start scheduled monitoring
- `stopMonitoring(name)` - Stop monitoring
- `configureActions({ activityName, callbackName, actions })` - Configure event actions

### Shield Customization
- `updateShield(config, actions)` - Customize block screen

### Event Tracking
- `getEvents()` - Get event history
- `onDeviceActivityMonitorEvent(callback)` - Listen to events

## Key Differences from Custom Implementation

| Feature | Custom Module | react-native-device-activity |
|---------|--------------|------------------------------|
| App Selection | Modal picker | Embedded native view |
| Configuration | Manual Swift code | Config-driven via plugin |
| Extensions | Manual setup | Auto-generated |
| Type Safety | Basic | Full TypeScript support |
| Maintenance | High | Low (package handles it) |
| Mock Data | Required for dev | ❌ Not needed |

## Benefits

1. **No Mock Data**: Real apps from device immediately
2. **Automatic Setup**: Plugin handles native configuration
3. **Full Feature Set**: Access to all Screen Time APIs
4. **Type Safety**: Complete TypeScript definitions
5. **Maintained**: Active package with regular updates
6. **Examples**: Comprehensive documentation and examples

## Troubleshooting

### "Not authorized" errors
- Make sure you called `requestAuthorization()` first
- Check authorization status with `getAuthorizationStatus()`
- User may have denied permission in Settings

### Selection view crashes
- This is a known iOS issue with the native view
- Provide a fallback UI or reload option
- Test on physical device (more stable than simulator)

### Events not firing
- Disable Low Power Mode
- Check device storage (needs free space)
- Restart device
- Update to latest iOS version

### Build errors
- Ensure all 4 bundle IDs have entitlements
- Run `npx expo prebuild` after config changes
- Clean build folder in Xcode

## Resources

- [Package Docs](https://www.npmjs.com/package/react-native-device-activity)
- [GitHub Repo](https://github.com/Kingstinct/react-native-device-activity)
- [Apple WWDC Session](https://developer.apple.com/videos/play/wwdc2021/10123/)
- [Request Entitlements](https://developer.apple.com/contact/request/family-controls-distribution)

## Migration from Custom Module

The custom Swift files (`ScreenTimeModule.swift`, `ScreenTimeModule.m`) can now be removed. The package handles everything:

**Old approach:**
```typescript
const selection = await ScreenTime.presentActivityPicker();
// Returns parsed apps/categories
```

**New approach:**
```typescript
<DeviceActivitySelectionView
  onSelectionChange={(event) => {
    // Get selection token directly
    setSelection(event.nativeEvent.familyActivitySelection);
  }}
/>
```

The selection is now a token string that can be used directly with the blocking APIs, no parsing needed.
