# 🛠️ Development Tips & Best Practices

## Running the App

### Start Development Server
```bash
npm start
```

### Run on iOS Simulator
```bash
npm run ios
```

### Common Commands
```bash
npm run android      # Run on Android emulator
npm run web         # Run in web browser
npm run lint        # Check code quality
```

## Code Organization Tips

### Component Creation
1. Create component file in appropriate folder
2. Export from index.ts for clean imports
3. Follow design system for styling
4. Add TypeScript props interface

### Naming Conventions
- **Components**: PascalCase (`FoxAvatar.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useFoxMood.ts`)
- **Utils**: camelCase (`formatTime.ts`)
- **Constants**: SCREAMING_SNAKE_CASE for values

### Import Order
```tsx
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. React Native imports
import { View, Text, StyleSheet } from 'react-native';

// 3. Third-party libraries
import { useStore } from 'zustand';

// 4. Internal imports (using @ alias)
import { colors, spacing } from '@/constants';
import { Button, Card } from '@/components/ui';
import { FoxAvatar } from '@/components/fox';

// 5. Types
import type { FoxMood } from '@/types';
```

## Performance Best Practices

### Memoization
```tsx
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive calculations
const calculation = useMemo(() => expensiveOperation(data), [data]);

// Memoize callbacks passed to children
const handlePress = useCallback(() => {
  console.log('pressed');
}, []);

// Memoize components that don't change often
export default memo(MyComponent);
```

### List Optimization
```tsx
import { FlatList } from 'react-native';

// Use FlatList for long lists
<FlatList
  data={apps}
  renderItem={({ item }) => <AppItem app={item} />}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

### Image Optimization
```tsx
import { Image } from 'expo-image';

// Use expo-image instead of react-native Image
<Image
  source={{ uri: foxImageUrl }}
  style={styles.fox}
  contentFit="contain"
  transition={200}
/>
```

## State Management Patterns

### Using the Store
```tsx
import { useAppStore } from '@/store/appStore';

function MyComponent() {
  // Select only what you need
  const fox = useAppStore((state) => state.fox);
  const updateFoxMood = useAppStore((state) => state.updateFoxMood);
  
  // Avoid selecting entire state
  // ❌ const state = useAppStore();
  // ✅ const { fox, updateFoxMood } = useAppStore();
  
  return <FoxAvatar fox={fox} />;
}
```

### Local State vs Global State
- **Local (useState)**: Component-specific UI state, form inputs
- **Global (Zustand)**: User data, fox state, screen time data, preferences

## Styling Tips

### StyleSheet Best Practices
```tsx
const styles = StyleSheet.create({
  // Use design system constants
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: borderRadius.large,
  },
  
  // Composition over duplication
  text: {
    fontSize: typography.body,
    color: colors.textDark,
  },
  textBold: {
    fontWeight: typography.bold,
  },
});

// Usage: <Text style={[styles.text, styles.textBold]}>Bold text</Text>
```

### Responsive Design
```tsx
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    // Percentage-based sizing
    width: '90%',
    
    // Platform-specific
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    
    // Dynamic sizing
    minHeight: height * 0.3,
  },
});
```

## Animation Guidelines

### Using Reanimated
```tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

function AnimatedComponent() {
  const opacity = useSharedValue(0);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(opacity.value),
    };
  });
  
  return <Animated.View style={animatedStyle} />;
}
```

### Keep Animations Smooth
- Target 60 FPS
- Use `useNativeDriver: true` when possible
- Avoid animating layout properties
- Prefer transform and opacity

## Error Handling

### Async Operations
```tsx
async function loadData() {
  try {
    const data = await fetchData();
    setData(data);
  } catch (error) {
    console.error('Failed to load data:', error);
    // Show user-friendly error message
    Alert.alert('Error', 'Failed to load data. Please try again.');
  }
}
```

### Type Guards
```tsx
function isFoxState(value: unknown): value is FoxState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'mood' in value
  );
}
```

## Testing Approach

### Component Testing
```tsx
// Add testID for testing
<Button
  title="Start"
  onPress={handleStart}
  testID="start-button"
/>

// Test with Expo SDK
// expo install jest-expo @testing-library/react-native
```

### Manual Testing Checklist
- [ ] Test on different screen sizes
- [ ] Test with slow animations enabled
- [ ] Test with VoiceOver/accessibility
- [ ] Test offline behavior
- [ ] Test with empty/error states
- [ ] Test with maximum data

## Debugging Tips

### React Native Debugger
```bash
# Open dev menu: Cmd+D (iOS) or Cmd+M (Android)
# Options:
# - Reload
# - Debug Remote JS
# - Show Inspector
# - Show Performance Monitor
```

### Console Logging
```tsx
// Color-coded logs
console.log('Info:', data);
console.warn('Warning:', warning);
console.error('Error:', error);

// Object inspection
console.log('Fox state:', JSON.stringify(fox, null, 2));
```

### Network Debugging
```tsx
// Use Flipper for network inspection
// Or expo's network inspector
import { Network } from 'expo-network';

const networkState = await Network.getNetworkStateAsync();
console.log('Network:', networkState);
```

## Git Workflow

### Commit Messages
```bash
# Format: <type>: <description>

feat: Add onboarding welcome screen
fix: Resolve fox animation glitch
style: Update button colors to match design
refactor: Simplify state management logic
docs: Update README with setup instructions
```

### Branching Strategy
```bash
main            # Production-ready code
├── develop     # Integration branch
    ├── feature/onboarding
    ├── feature/fox-animations
    └── fix/button-padding
```

## Useful Resources

### Documentation
- [React Native](https://reactnative.dev/docs/getting-started)
- [Expo](https://docs.expo.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Zustand](https://docs.pmnd.rs/zustand)

### Design Inspiration
- [Dribbble - Mobile UI](https://dribbble.com/tags/mobile-ui)
- [Mobbin - App Patterns](https://mobbin.com/)

### Tools
- [React Native Directory](https://reactnative.directory/) - Find libraries
- [Expo Snack](https://snack.expo.dev/) - Online playground
- [Lottie Files](https://lottiefiles.com/) - Free animations

## Quick Reference

### Design System
```tsx
// Colors
colors.primary      // #FF7A3D - Orange
colors.background   // #FFF8F0 - Cream
colors.textDark     // #2D2D2D - Dark text

// Typography
typography.h1       // 32px
typography.body     // 16px
typography.small    // 14px

// Spacing
spacing.sm          // 16px
spacing.md          // 20px
spacing.lg          // 24px

// Border Radius
borderRadius.small  // 12px
borderRadius.medium // 16px
borderRadius.large  // 20px
```

### Common Patterns
```tsx
// Full screen container
<View style={{ flex: 1, padding: spacing.lg }}>

// Centered content
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

// Card with content
<Card>
  <Text style={{ fontSize: typography.h2 }}>Title</Text>
</Card>

// Button group
<View style={{ gap: spacing.sm }}>
  <Button title="Primary" onPress={...} />
  <Button title="Secondary" variant="secondary" onPress={...} />
</View>
```

---

**Remember**: Write clean, maintainable code. When in doubt, refer back to the design system! 🎨
