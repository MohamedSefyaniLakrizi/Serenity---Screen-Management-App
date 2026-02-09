# iOS Screen Time Integration Setup

## Overview
This guide explains how to set up Screen Time functionality in your Expo app to:
- Request Screen Time authorization
- Get installed apps on the device
- Block/unblock apps with a custom shield screen
- Track screen time data

## Prerequisites
- Expo SDK 50+ with custom native code (bare workflow or custom dev client)
- iOS 15.0+
- Apple Developer account

## Setup Steps

### 1. Add Required Capabilities in Xcode

1. Open your project in Xcode: `open ios/Serenity.xcworkspace`
2. Select your app target
3. Go to "Signing & Capabilities" tab
4. Click "+ Capability" and add:
   - **Family Controls**
   - **Screen Time** (if available)

### 2. Update Info.plist

Add the following to your `ios/Serenity/Info.plist`:

```xml
<key>NSFamilyControlsUsageDescription</key>
<string>Serenity needs access to Screen Time to help you manage your app usage and build healthier digital habits</string>
```

### 3. Add Native Files to Xcode Project

The following files need to be added to your Xcode project:

**Main Module:**
- `ios/ScreenTimeModule.swift` - Core native module implementation
- `ios/ScreenTimeModule.m` - Bridge file for React Native

**Shield Extension (for blocking screen):**
- `ios/ShieldConfigurationExtension/ShieldConfigurationExtension.swift`
- `ios/ShieldConfigurationExtension/Info.plist`

#### Adding Shield Configuration Extension:

1. In Xcode, go to File → New → Target
2. Select "App Extension" → "Shield Configuration Extension"
3. Name it "ShieldConfigurationExtension"
4. Ensure it's part of your app target
5. Replace the generated files with the ones provided

### 4. Update Podfile

Add the following to your `ios/Podfile`:

```ruby
target 'Serenity' do
  # ... existing config
  
  # Add Screen Time frameworks
  pod 'FamilyControls'
  pod 'ManagedSettings'
  pod 'DeviceActivity'
end
```

Run `cd ios && pod install` after updating.

### 5. Configure App Groups (Required for Shield Extension)

1. In Xcode, select your main app target
2. Go to Signing & Capabilities
3. Add "App Groups" capability
4. Create a new app group: `group.com.yourcompany.serenity`
5. Repeat for the ShieldConfigurationExtension target

### 6. Build Settings

Ensure both your main app and Shield Extension targets have:
- iOS Deployment Target: 15.0 or higher
- Swift Language Version: 5.0

### 7. Rebuild the App

After all changes:

```bash
cd ios
pod install
cd ..
npx expo run:ios
```

## Usage in React Native

### Request Authorization

```typescript
import ScreenTime from '@/modules/screentime';

const granted = await ScreenTime.requestAuthorization();
if (granted) {
  console.log('Screen Time access granted');
}
```

### Get Installed Apps

```typescript
const apps = await ScreenTime.getInstalledApps();
// Returns: [{ bundleId: 'com.app.name', name: 'App Name' }]
```

### Block Apps

```typescript
const bundleIds = ['com.burbn.instagram', 'com.zhiliaoapp.musically'];
await ScreenTime.setBlockedApps(bundleIds);
```

### Unblock Apps

```typescript
await ScreenTime.removeBlockedApps(['com.burbn.instagram']);
```

## How App Blocking Works

When a user tries to open a blocked app:

1. iOS intercepts the app launch
2. Shows your custom shield screen (defined in ShieldConfigurationExtension.swift)
3. User sees a blocking screen with:
   - Custom message: "Take a moment"
   - Subtitle explaining the block
   - "Continue to app" button (allows access)
   - "Go back" button (closes attempt)

The shield configuration uses Serenity's branding:
- Dark background: #2D2D2D
- Primary button color: #FF7A3D (orange)
- Custom messaging for mindful reflection

## Important Notes

### Limitations

1. **Can't get ALL installed apps programmatically**: iOS restricts full app list access. Users must select apps through FamilyActivityPicker (native UI component).

2. **Shield button behavior**: The "Continue to app" button on the shield screen allows access - iOS doesn't provide a way to fully block access, only to show a screen first.

3. **Requires parent/guardian mode**: For full blocking, the app needs to be in "parent mode" with Screen Time restrictions.

4. **Extension limitations**: Shield configuration runs in a separate extension process with limited resources.

### Alternative Approach for Step 5 (App Selection)

Since we can't get all apps programmatically, consider:

**Option A**: Use FamilyActivityPicker (recommended)
```swift
// Shows native iOS app picker
import FamilyControls

FamilyActivityPicker(selection: $selection)
```

**Option B**: Provide common apps list (current implementation)
- Pre-populate with popular apps (Instagram, TikTok, etc.)
- Users select from this curated list

**Option C**: Manual entry
- Allow users to type app names
- Match against bundle IDs

## Testing

1. **Test on real device**: Screen Time APIs don't work in simulator
2. **Test authorization flow**: Ensure permission dialog appears
3. **Test app blocking**: Block an app and try to open it
4. **Test shield screen**: Verify custom branding appears

## Troubleshooting

**Authorization fails:**
- Check Info.plist has NSFamilyControlsUsageDescription
- Verify capabilities are added in Xcode
- Ensure iOS 15.0+ device

**Apps don't block:**
- Verify authorization status is `.approved`
- Check shield extension is properly configured
- Ensure app groups are set up correctly

**Module not found:**
- Run `cd ios && pod install`
- Clean build folder in Xcode
- Rebuild app with `npx expo run:ios`

## Resources

- [Apple Family Controls Documentation](https://developer.apple.com/documentation/familycontrols)
- [Screen Time API WWDC Session](https://developer.apple.com/videos/play/wwdc2021/10123/)
- [Managed Settings Documentation](https://developer.apple.com/documentation/managedsettings)
