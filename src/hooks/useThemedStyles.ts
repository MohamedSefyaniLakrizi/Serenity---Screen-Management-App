import { darkTheme, lightTheme } from '@/constants/themes';
import { useTheme } from '@/store/themeStore';

/**
 * Hook to get themed colors based on current active theme
 */
export function useThemedColors() {
  const { activeTheme } = useTheme();
  return activeTheme === 'dark' ? darkTheme : lightTheme;
}

/**
 * Hook to get themed styles with additional theme info
 */
export function useThemedStyles() {
  const { activeTheme, isDark, isLight } = useTheme();
  const colors = activeTheme === 'dark' ? darkTheme : lightTheme;
  
  return {
    colors,
    isDark,
    isLight,
    theme: activeTheme,
  };
}
