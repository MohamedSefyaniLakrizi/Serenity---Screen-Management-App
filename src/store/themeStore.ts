import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ActiveTheme = 'light' | 'dark';

interface ThemeState {
  themeMode: ThemeMode;
  activeTheme: ActiveTheme;
  
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  updateActiveTheme: (systemTheme: ActiveTheme) => void;
  loadTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@theme_mode';

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'system',
  activeTheme: 'dark',

  setThemeMode: async (mode: ThemeMode) => {
    set({ themeMode: mode });
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    
    // Update active theme based on mode
    if (mode === 'light' || mode === 'dark') {
      set({ activeTheme: mode });
    }
    // If system, the useTheme hook will handle it
  },

  updateActiveTheme: (systemTheme: ActiveTheme) => {
    const { themeMode } = get();
    if (themeMode === 'system') {
      set({ activeTheme: systemTheme });
    }
  },

  loadTheme: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
        set({ themeMode: savedMode as ThemeMode });
        
        if (savedMode !== 'system') {
          set({ activeTheme: savedMode as ActiveTheme });
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  },
}));

// Hook to use theme with system detection
export function useTheme() {
  const systemColorScheme = useColorScheme();
  const { themeMode, activeTheme, updateActiveTheme } = useThemeStore();

  // Update active theme when system theme changes
  useEffect(() => {
    if (themeMode === 'system' && systemColorScheme) {
      updateActiveTheme(systemColorScheme as ActiveTheme);
    }
  }, [systemColorScheme, themeMode, updateActiveTheme]);

  return {
    themeMode,
    activeTheme,
    isDark: activeTheme === 'dark',
    isLight: activeTheme === 'light',
  };
}
