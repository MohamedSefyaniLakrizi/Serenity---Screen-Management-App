import { ScreenTimeData, StreakData, UserPreferences } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface AppState {
  // User
  userPreferences: UserPreferences | null;

  // Screen Time
  todayData: ScreenTimeData | null;
  weeklyData: ScreenTimeData[];

  // Streaks
  streakData: StreakData | null;

  // Actions
  setUserPreferences: (prefs: Partial<UserPreferences>) => void;
  updateScreenTimeData: (data: ScreenTimeData) => void;

  // Streaks
  updateStreak: (goalMet: boolean) => void;

  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  userPreferences: null,
  todayData: null,
  weeklyData: [],
  streakData: null,

  setUserPreferences: (prefs: Partial<UserPreferences>) => {
    const current = get().userPreferences;
    if (!current) return;
    set({ userPreferences: { ...current, ...prefs } });
    get().saveToStorage();
  },

  updateScreenTimeData: (data: ScreenTimeData) => {
    set({ todayData: data });
    get().saveToStorage();
  },

  updateStreak: (goalMet: boolean) => {
    const { streakData } = get();
    if (!streakData) return;

    const today = new Date().toISOString().split('T')[0];

    // Don't update if already updated today
    if (streakData.lastUpdated === today) return;

    let newStreak = streakData.currentStreak;
    let history = [...streakData.streakHistory];

    if (goalMet) {
      newStreak += 1;
      history.push(today);
    } else {
      newStreak = 0;
      history = [];
    }

    const longestStreak = Math.max(streakData.longestStreak, newStreak);

    const updated: StreakData = {
      currentStreak: newStreak,
      longestStreak,
      lastUpdated: today,
      streakHistory: history.slice(-365),
    };

    set({ streakData: updated });
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const [prefsData, todayDataStr, streakDataStr] = await Promise.all([
        AsyncStorage.getItem('userPreferences'),
        AsyncStorage.getItem('todayData'),
        AsyncStorage.getItem('streakData'),
      ]);

      set({
        userPreferences: prefsData ? JSON.parse(prefsData) : null,
        todayData: todayDataStr ? JSON.parse(todayDataStr) : null,
        streakData: streakDataStr ? JSON.parse(streakDataStr) : null,
      });
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const { userPreferences, todayData, streakData } = get();

      await Promise.all([
        AsyncStorage.setItem('userPreferences', JSON.stringify(userPreferences)),
        AsyncStorage.setItem('todayData', JSON.stringify(todayData)),
        AsyncStorage.setItem('streakData', JSON.stringify(streakData)),
      ]);
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },
}));
