# Font Setup Instructions

## Required Fonts

The Serenity app uses two custom font families:
- **Poppins** (for headings, buttons, and UI elements)
- **Inter** (for body text and general content)

## Installation Steps

### Option 1: Using Google Fonts (Recommended for now)

For development, we can temporarily use system fonts while we set up proper custom fonts.

**Update `app/_layout.tsx`** to remove the font loading temporarily:

```tsx
// Comment out the useFonts hook and font imports
// const [fontsLoaded] = useFonts({ ... });

// Instead, return Stack directly
```

### Option 2: Add Custom Font Files

1. **Create fonts directory:**
   ```
   assets/fonts/
   ```

2. **Download and add font files:**
   
   **Poppins:**
   - Poppins-Regular.ttf
   - Poppins-Medium.ttf
   - Poppins-SemiBold.ttf
   - Poppins-Bold.ttf
   
   **Inter:**
   - Inter-Regular.ttf
   - Inter-Medium.ttf
   - Inter-SemiBold.ttf
   - Inter-Bold.ttf

3. **Download sources:**
   - Poppins: https://fonts.google.com/specimen/Poppins
   - Inter: https://fonts.google.com/specimen/Inter

4. **Update app.json** to include fonts:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-font",
           {
             "fonts": [
               "./assets/fonts/Poppins-Regular.ttf",
               "./assets/fonts/Poppins-Medium.ttf",
               "./assets/fonts/Poppins-SemiBold.ttf",
               "./assets/fonts/Poppins-Bold.ttf",
               "./assets/fonts/Inter-Regular.ttf",
               "./assets/fonts/Inter-Medium.ttf",
               "./assets/fonts/Inter-SemiBold.ttf",
               "./assets/fonts/Inter-Bold.ttf"
             ]
           }
         ]
       ]
     }
   }
   ```

### Option 3: Use expo-google-fonts (Easiest)

```bash
npm install @expo-google-fonts/poppins @expo-google-fonts/inter
```

Then update `app/_layout.tsx`:

```tsx
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

const [fontsLoaded] = useFonts({
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
});
```

## Current Status

The app currently references custom fonts but they are not yet loaded. You'll need to choose one of the options above to properly load fonts before running the app.

## Temporary Workaround

For immediate testing, I'll create a version of `_layout.tsx` without custom fonts.
