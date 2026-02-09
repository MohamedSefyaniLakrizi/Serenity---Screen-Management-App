# 🎯 Onboarding Flow - Complete Guide

## Overview

Serenity features a comprehensive 10-screen onboarding flow that:
- Collects user preferences and goals
- Requests necessary permissions
- Introduces the fox companion
- Stores data both locally and in Supabase
- Creates a personalized experience

## Screen Flow

### Welcome Screen (`/onboarding`)
**Purpose**: First impression and introduction
- Shows fox mascot
- Explains app purpose
- "Get Started" button
- Estimated time: 2 minutes

### Step 1: Goal Selection (`/onboarding/step1`)
**Data Collected**: `primaryGoal`
- 4 goal options:
  - Reduce Phone Usage 📱
  - Build Focus 🎯
  - Better Sleep 😴
  - Life Balance ⚖️
- Required field
- Radio card selection

### Step 2: Current Usage (`/onboarding/step2`)
**Data Collected**: `currentDailyUsageHours`
- 5 usage brackets:
  - Less than 1 hour
  - 1-2 hours
  - 3-4 hours
  - 5-6 hours
  - 7+ hours
- Helps set realistic goals
- Button-based selection

### Step 3: Daily Goal Setting (`/onboarding/step3`)
**Data Collected**: `dailyLimitHours`, `dailyLimitMinutes`
- Quick select buttons (1h, 2h, 3h, 4h)
- Custom input for hours and minutes
- Required field
- Shows reassurance message

### Step 4: Fox Naming (`/onboarding/step4`)
**Data Collected**: `foxName`
- Text input for name
- 5 suggested names
- Character limit: 20
- Shows fox image
- Required field

### Step 5: Notifications (`/onboarding/step5`)
**Data Collected**: `notificationsEnabled`
- Requests notification permissions
- Lists benefits:
  - Daily progress updates
  - Friendly reminders
  - Achievement celebrations
  - Fox check-ins
- Can skip
- Opens iOS settings if needed

### Step 6: Screen Time Permission (`/onboarding/step6`)
**Data Collected**: `screenTimePermissionGranted`
- Requests iOS Screen Time API access
- Explains data usage:
  - Track progress
  - Show app usage
  - Provide insights
  - Update fox mood
- Privacy guarantee
- Fallback to manual tracking
- Can skip

### Step 7: Usage Patterns (`/onboarding/step7`)
**Data Collected**: `whenUsePhoneMost`
- 5 time period options:
  - Morning (6 AM - 12 PM) 🌅
  - Afternoon (12 PM - 6 PM) ☀️
  - Evening (6 PM - 10 PM) 🌆
  - Late Night (10 PM - 2 AM) 🌙
  - Throughout the Day ⏰
- Required field
- Helps with reminder timing

### Step 8: Motivation (`/onboarding/step8`)
**Data Collected**: `reasonForChange`
- Multi-line text input
- Optional field
- 5 quick suggestions:
  - I want more free time
  - I feel addicted to my phone
  - I want to be more present
  - I want better sleep
  - I want to reduce anxiety

### Step 9: Analytics Consent (`/onboarding/step9`)
**Data Collected**: `analyticsEnabled`
- Toggle switch
- Explains what's collected:
  - App usage patterns
  - Feature usage
  - Device type
  - NOT personal info or screen time
- Default: enabled
- Privacy assurance

### Step 10: Complete (`/onboarding/step10`)
**Action**: Save data and initialize app
- Shows summary:
  - Selected goal
  - Daily limit
  - Fox name
- Tips for getting started
- Saves to Supabase
- Initializes fox in app store
- Navigates to main app

## Data Storage

### Local Storage (AsyncStorage)
- `onboardingCompleted`: boolean flag
- `onboardingData`: full data object
- Used for offline access
- Persists app state

### Supabase Database
- Full onboarding record
- Includes device info
- Timestamp of completion
- Used for analytics
- See `docs/SUPABASE_SETUP.md`

## Implementation Details

### State Management
**Store**: `src/store/onboardingStore.ts`
- Uses Zustand
- Auto-saves to AsyncStorage
- Tracks current step
- Validates data

**Methods**:
- `updateData()`: Update any field
- `nextStep()`: Advance step
- `previousStep()`: Go back
- `completeOnboarding()`: Save to Supabase
- `resetOnboarding()`: Clear all data

### Navigation
**Router**: Expo Router file-based
- `/onboarding` → Welcome
- `/onboarding/step1` → Step 1
- `/onboarding/step2` → Step 2
- etc.

**Flow Control**: `app/_layout.tsx`
- Checks `onboardingCompleted` flag
- Redirects to onboarding if not complete
- Redirects to home if complete

### Permission Handling

**Notifications** (Step 5):
```typescript
import * as Notifications from 'expo-notifications';
const { status } = await Notifications.requestPermissionsAsync();
```

**Screen Time** (Step 6):
- Currently opens iOS Settings
- Placeholder for native module
- Falls back to manual tracking

## Customization Guide

### Adding a New Question

1. **Create new screen**:
```typescript
// app/onboarding/step11.tsx
export default function Step11() {
  const { updateData } = useOnboardingStore();
  
  const handleContinue = () => {
    updateData({ newField: value });
    router.push('/onboarding/step12');
  };
  
  return (
    // Your UI
  );
}
```

2. **Update types**:
```typescript
// src/types/onboarding.ts
export interface OnboardingData {
  // ... existing fields
  newField: string | null;
}
```

3. **Update store**:
```typescript
// src/store/onboardingStore.ts
// Add to initial state
newField: null,
```

4. **Update Supabase schema**:
```sql
ALTER TABLE onboarding ADD COLUMN new_field TEXT;
```

5. **Update totalSteps**:
```typescript
totalSteps: 11, // was 10
```

### Changing Question Order

Simply rename the files:
- `step2.tsx` → `step3.tsx`
- `step3.tsx` → `step2.tsx`

Update router.push() calls accordingly.

### Skipping Screens

Make any screen optional:
```typescript
const handleSkip = () => {
  router.push('/onboarding/step8'); // Skip to next
};

<Button title="Skip" variant="ghost" onPress={handleSkip} />
```

### Custom Validation

```typescript
const isValid = () => {
  return foxName.length >= 3 && foxName.length <= 20;
};

<Button 
  title="Continue" 
  onPress={handleContinue}
  disabled={!isValid()}
/>
```

## Testing

### Manual Test Checklist
- [ ] Complete full flow
- [ ] Test skip buttons
- [ ] Try back navigation
- [ ] Test with/without permissions
- [ ] Check data in Supabase
- [ ] Verify AsyncStorage
- [ ] Test re-opening app
- [ ] Clear data and retry

### Reset Onboarding
```typescript
// In any component
import { useOnboardingStore } from '@/store/onboardingStore';

const { resetOnboarding } = useOnboardingStore();
resetOnboarding(); // Clears all data
```

Or via AsyncStorage:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('onboardingCompleted');
await AsyncStorage.removeItem('onboardingData');
```

## Best Practices

### UX Guidelines
1. **Keep it short**: Users lose attention after 2-3 minutes
2. **Show progress**: Display "Step X of 10"
3. **Allow skipping**: Don't force optional questions
4. **Provide defaults**: Quick select options
5. **Explain benefits**: Tell users why you need permissions

### Technical Guidelines
1. **Save incrementally**: Don't lose data if user exits
2. **Validate inputs**: Check before allowing continue
3. **Handle errors gracefully**: Don't block on Supabase errors
4. **Test offline**: Ensure app works without network
5. **Privacy first**: Be transparent about data usage

## Analytics

### Key Metrics to Track
- Completion rate (started vs completed)
- Drop-off points (which screen loses users)
- Time to complete
- Goal distribution
- Permission grant rates
- Average daily limits set

### Supabase Queries

**Completion Rate**:
```sql
SELECT 
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) * 100.0 / COUNT(*) as completion_rate
FROM onboarding;
```

**Drop-off Analysis**:
Track last_step_completed field (would need to add)

**Goal Popularity**:
```sql
SELECT primary_goal, COUNT(*) 
FROM onboarding 
WHERE completed_at IS NOT NULL
GROUP BY primary_goal;
```

## Troubleshooting

### Onboarding loops/repeats
- Check AsyncStorage has `onboardingCompleted` = 'true'
- Verify `_layout.tsx` routing logic
- Clear app cache and retry

### Data not saving to Supabase
- Check environment variables
- Verify Supabase table exists
- Check RLS policies
- Look for console errors

### Permissions not working
- iOS simulator may not support all permissions
- Test on physical device
- Check Info.plist entries (for native modules)

## Future Enhancements

### Potential Additions
1. **Profile Picture**: Let users upload/choose avatar
2. **Tutorial**: Interactive app tour
3. **Problem Apps**: Select specific apps to limit
4. **Reminder Times**: Custom notification schedule
5. **Friend Referral**: Enter referral code
6. **Social Proof**: Show how many users joined
7. **Testimonials**: Display user success stories
8. **Gamification**: Earn points for completion
9. **A/B Testing**: Test different question orders
10. **Video Introduction**: Fox companion intro video

## Resources

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Supabase Docs](https://supabase.com/docs)
- [AsyncStorage Docs](https://react-native-async-storage.github.io/async-storage/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

---

**Need Help?** Check the main README or open an issue!
