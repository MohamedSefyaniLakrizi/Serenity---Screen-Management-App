# FamilyControls Implementation Guide

## Overview
The ScreenTime module has been completely rewritten to use Apple's **FamilyActivityPicker** from the FamilyControls framework. This provides real app selection with actual app names, icons, categories, and the ability to block apps and categories natively.

## Key Changes

### 1. Native Module (ScreenTimeModule.swift)
**Location:** `ios/ScreenTimeModule.swift`

#### New Features:
- **FamilyActivityPicker Integration**: Uses SwiftUI to present Apple's native app/category picker
- **Real App Data**: Gets actual app names, bundle IDs, and categories from the device
- **Category Tokens**: Uses native `ActivityCategory` tokens for proper category management
- **Application Tokens**: Uses `ApplicationToken` for proper app identification
- **Web Domain Support**: Can also select and block web domains

#### Key Methods:
```swift
// Present the native picker UI
func presentActivityPicker() -> Promise<FamilyActivitySelection>

// Apply restrictions based on selection
func applyRestrictions(restrictionsData)

// Remove all restrictions
func removeRestrictions()

// Legacy methods for direct control
func setBlockedApps(bundleIds)
func setBlockedCategories(categoryIds)
```

#### How It Works:
1. Creates a `FamilyActivitySelection` binding
2. Presents `FamilyActivityPicker` in a SwiftUI `NavigationView`
3. User selects apps/categories/websites
4. Selection is processed and returned to React Native
5. Apps are identified by their real `ApplicationToken` objects
6. Categories use native `ActivityCategory` enums

### 2. TypeScript Interface (screentime.ts)
**Location:** `utils/screentime.ts`

#### New Interface:
```typescript
interface FamilyActivitySelection {
  applications: App[];      // Selected apps with real data
  categories: Category[];    // Selected categories
  webDomains: string[];     // Selected web domains
}

// Present native picker
ScreenTime.presentActivityPicker(): Promise<FamilyActivitySelection>

// Apply the current selection as restrictions
ScreenTime.applyRestrictions(): Promise<boolean>

// Remove all restrictions
ScreenTime.removeRestrictions(): Promise<boolean>
```

### 3. Step 6 UI (step6.tsx)
**Location:** `app/onboarding/step6.tsx`

#### New Approach:
- Single button to open native FamilyActivityPicker
- Displays selected items in organized sections:
  - **Categories** - Shows selected app categories
  - **Apps** - Shows individually selected apps
  - **Web Domains** - Shows selected websites
- No more mock data or manual scrolling lists
- Real app icons and names from iOS

#### User Flow:
1. Tap "Select Apps & Categories" button
2. Native picker opens (full iOS system UI)
3. User selects apps, categories, or websites
4. Tap "Done" in picker
5. Selected items display in organized sections
6. Tap "Continue" to proceed

## Benefits

### ✅ Real Data
- No more placeholder emojis or mock apps
- Actual app names from the device
- Real bundle identifiers
- Accurate category assignments

### ✅ Native Experience
- Uses Apple's official FamilyActivityPicker UI
- Consistent with Screen Time settings
- Searchable app list
- System-provided app icons (when available)

### ✅ Proper Integration
- Uses official FamilyControls APIs
- Token-based identification (more reliable)
- Supports web domain blocking
- Future-proof with iOS updates

### ✅ Simpler Code
- No need to manually list all installed apps
- No complex filtering/sorting logic
- Less maintenance overhead
- Leverages system capabilities

## Implementation Details

### SwiftUI Integration
The module now includes a SwiftUI view that hosts the `FamilyActivityPicker`:

```swift
struct FamilyActivityPickerView: View {
  @Binding var selection: FamilyActivitySelection
  var onDismiss: () -> Void
  
  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Select Apps & Categories")
        .toolbar {
          // Cancel and Done buttons
        }
    }
  }
}
```

### Data Flow
```
User taps button
    ↓
React Native calls presentActivityPicker()
    ↓
Swift presents UIHostingController with FamilyActivityPicker
    ↓
User makes selection in native UI
    ↓
onDismiss callback processes selection
    ↓
Selection data returned to React Native
    ↓
UI updates with selected items
```

### Blocking Apps
When user continues, the selection can be applied:

```typescript
// In your app logic
const selection = await ScreenTime.presentActivityPicker();

// Apply blocks
await ScreenTime.applyRestrictions();

// Or use legacy methods for specific control
await ScreenTime.setBlockedApps(selection.applications.map(a => a.bundleId));
await ScreenTime.setBlockedCategories(selection.categories.map(c => c.id));
```

## Testing Checklist

- [ ] Authorization request works
- [ ] Picker opens when button tapped
- [ ] Can select individual apps
- [ ] Can select categories
- [ ] Can select web domains
- [ ] Selection displays correctly after picker closes
- [ ] Continue button only enables with selection
- [ ] Data passes to next step correctly
- [ ] Apps actually get blocked on device

## Requirements

### iOS Entitlements
Make sure your `Info.plist` and entitlements include:
```xml
<key>com.apple.developer.family-controls</key>
<true/>
```

### Minimum iOS Version
- iOS 15.0+ (for FamilyControls framework)
- iOS 16.0+ recommended for best experience

### Privacy Description
Add to `Info.plist`:
```xml
<key>NSFamilyControlsUsageDescription</key>
<string>We need access to manage app usage and screen time.</string>
```

## Known Limitations

1. **App Icons**: The native tokens don't provide direct access to app icons. We use category-based emojis as fallbacks.
2. **App List**: `getInstalledApps()` now only returns apps from the current selection, not all device apps.
3. **iOS Only**: FamilyControls is iOS-only; Android would need a different implementation.

## Migration Notes

### From Old Implementation
The old implementation used mock data and manual app lists. The new implementation:
- ✅ Removes ~200 lines of mock app data
- ✅ Removes category counting logic
- ✅ Removes filtering and sorting code
- ✅ Uses official Apple APIs instead of workarounds

### Data Structure Changes
```typescript
// Old
selectedApps: string[]        // Array of bundle IDs
selectedCategories: string[]  // Array of category IDs

// New
selectedApps: App[]          // Full app objects with metadata
selectedCategories: Category[]  // Full category objects
webDomains: string[]         // NEW: web domain support
```

## Future Enhancements

1. **Shield Configuration**: Customize the block screen that appears when apps are blocked
2. **Device Activity Monitoring**: Track actual screen time usage
3. **Schedule Management**: Set time-based restrictions
4. **Multiple Schedules**: Different blocks for different times/days

## Resources

- [FamilyControls Documentation](https://developer.apple.com/documentation/familycontrols)
- [FamilyActivityPicker](https://developer.apple.com/documentation/familycontrols/familyactivitypicker)
- [ManagedSettings](https://developer.apple.com/documentation/managedSettings)
- [ShieldConfiguration](https://developer.apple.com/documentation/managedSettings/shieldconfiguration)
