import { AppLimit, CategoryLimit, FoxEvolutionStage, FoxState, ScreenTimeData, StreakData, UserGoal, UserPreferences } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface AppState {
  // User & Fox
  fox: FoxState | null;
  userPreferences: UserPreferences | null;
  
  // Screen Time
  todayData: ScreenTimeData | null;
  weeklyData: ScreenTimeData[];
  appLimits: AppLimit[];
  categoryLimits: CategoryLimit[];
  
  // Streaks
  streakData: StreakData | null;
  
  // Actions
  initializeFox: (name: string, goal: UserGoal) => void;
  updateFoxMood: () => void;
  updateFoxEvolution: () => void;
  setUserPreferences: (prefs: Partial<UserPreferences>) => void;
  updateScreenTimeData: (data: ScreenTimeData) => void;
  
  // App Limits
  setAppLimit: (bundleId: string, appName: string, timeLimit: number, maxUnlocks: number) => void;
  incrementAppUnlock: (bundleId: string) => boolean; // returns true if unlock allowed
  removeAppLimit: (bundleId: string) => void;
  
  // Category Limits
  setCategoryLimit: (category: CategoryLimit) => void;
  incrementCategoryUnlock: (category: string) => boolean;
  
  // Streaks
  updateStreak: (goalMet: boolean) => void;
  getEvolutionStage: () => FoxEvolutionStage;
  
  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  fox: null,
  userPreferences: null,
  todayData: null,
  weeklyData: [],
  appLimits: [],
  categoryLimits: [],
  streakData: null,

  initializeFox: (name: string, goal: UserGoal) => {
    const newFox: FoxState = {
      name,
      mood: 'happy',
      happiness: 100,
      evolutionStage: 'baby',
      lastFed: null,
      createdAt: new Date(),
    };

    const newStreak: StreakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      streakHistory: [],
    };

    const newPrefs: UserPreferences = {
      goal,
      dailyLimit: 120, // 2 hours default
      notificationsEnabled: true,
      reminderFrequency: 30,
      onboardingCompleted: true,
    };

    set({ fox: newFox, userPreferences: newPrefs, streakData: newStreak });
    get().saveToStorage();
  },

  getEvolutionStage: (): FoxEvolutionStage => {
    const { streakData } = get();
    if (!streakData) return 'baby';
    
    const streak = streakData.currentStreak;
    if (streak >= 31) return 'adult';
    if (streak >= 8) return 'teen';
    return 'baby';
  },

  updateFoxEvolution: () => {
    const { fox } = get();
    if (!fox) return;

    const newStage = get().getEvolutionStage();
    if (fox.evolutionStage !== newStage) {
      set({ fox: { ...fox, evolutionStage: newStage } });
      get().saveToStorage();
    }
  },

  updateFoxMood: () => {
    const { fox, todayData, userPreferences } = get();
    if (!fox || !todayData || !userPreferences) return;

    let happiness = fox.happiness;
    
    // Calculate happiness based on goal adherence
    const usagePercentage = (todayData.totalUsage / userPreferences.dailyLimit) * 100;
    
    if (usagePercentage <= 80) {
      happiness = Math.min(100, happiness + 10);
    } else if (usagePercentage > 120) {
      happiness = Math.max(0, happiness - 15);
    }

    // Determine mood based on happiness
    let mood: FoxState['mood'] = 'neutral';
    if (happiness >= 70) mood = 'happy';
    else if (happiness <= 30) mood = 'sad';

    set({ fox: { ...fox, happiness, mood } });
    get().saveToStorage();
  },

  setUserPreferences: (prefs: Partial<UserPreferences>) => {
    const current = get().userPreferences;
    if (!current) return;
    
    set({ userPreferences: { ...current, ...prefs } });
    get().saveToStorage();
  },

  updateScreenTimeData: (data: ScreenTimeData) => {
    set({ todayData: data });
    get().updateFoxMood();
    get().saveToStorage();
  },

  setAppLimit: (bundleId: string, appName: string, timeLimit: number, maxUnlocks: number) => {
    const { appLimits } = get();
    const existing = appLimits.find(l => l.bundleId === bundleId);
    
    if (existing) {
      // Update existing limit
      const updated = appLimits.map(l =>
        l.bundleId === bundleId
          ? { ...l, timeLimit, maxUnlocks, appName }
          : l
      );
      set({ appLimits: updated });
    } else {
      // Add new limit
      const newLimit: AppLimit = {
        bundleId,
        appName,
        timeLimit,
        maxUnlocks,
        currentUnlocks: 0,
        lastReset: new Date().toISOString().split('T')[0],
      };
      set({ appLimits: [...appLimits, newLimit] });
    }
    
    get().saveToStorage();
  },

  incrementAppUnlock: (bundleId: string): boolean => {
    const { appLimits } = get();
    const limit = appLimits.find(l => l.bundleId === bundleId);
    
    if (!limit) return true; // No limit set, allow
    
    const today = new Date().toISOString().split('T')[0];
    
    // Reset if it's a new day
    if (limit.lastReset !== today) {
      const updated = appLimits.map(l =>
        l.bundleId === bundleId
          ? { ...l, currentUnlocks: 1, lastReset: today }
          : l
      );
      set({ appLimits: updated });
      get().saveToStorage();
      return true;
    }
    
    // Check if unlocks are available
    if (limit.currentUnlocks >= limit.maxUnlocks) {
      return false; // No unlocks left
    }
    
    // Increment unlock count
    const updated = appLimits.map(l =>
      l.bundleId === bundleId
        ? { ...l, currentUnlocks: l.currentUnlocks + 1 }
        : l
    );
    set({ appLimits: updated });
    get().saveToStorage();
    return true;
  },

  removeAppLimit: (bundleId: string) => {
    const { appLimits } = get();
    set({ appLimits: appLimits.filter(l => l.bundleId !== bundleId) });
    get().saveToStorage();
  },

  setCategoryLimit: (categoryLimit: CategoryLimit) => {
    const { categoryLimits } = get();
    const existing = categoryLimits.find(c => c.category === categoryLimit.category);
    
    if (existing) {
      const updated = categoryLimits.map(c =>
        c.category === categoryLimit.category ? categoryLimit : c
      );
      set({ categoryLimits: updated });
    } else {
      set({ categoryLimits: [...categoryLimits, categoryLimit] });
    }
    
    get().saveToStorage();
  },

  incrementCategoryUnlock: (category: string): boolean => {
    const { categoryLimits } = get();
    const limit = categoryLimits.find(c => c.category === category);
    
    if (!limit) return true;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Reset if new day
    if (limit.lastReset !== today) {
      const updated = categoryLimits.map(c =>
        c.category === category
          ? { ...c, currentUnlocks: 1, lastReset: today }
          : c
      );
      set({ categoryLimits: updated });
      get().saveToStorage();
      return true;
    }
    
    if (limit.currentUnlocks >= limit.maxUnlocks) {
      return false;
    }
    
    const updated = categoryLimits.map(c =>
      c.category === category
        ? { ...c, currentUnlocks: c.currentUnlocks + 1 }
        : c
    );
    set({ categoryLimits: updated });
    get().saveToStorage();
    return true;
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
      streakHistory: history.slice(-365), // Keep last year only
    };
    
    set({ streakData: updated });
    get().updateFoxEvolution(); // Check if fox should evolve
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const [foxData, prefsData, todayDataStr, appLimitsData, categoryLimitsData, streakDataStr] = await Promise.all([
        AsyncStorage.getItem('fox'),
        AsyncStorage.getItem('userPreferences'),
        AsyncStorage.getItem('todayData'),
        AsyncStorage.getItem('appLimits'),
        AsyncStorage.getItem('categoryLimits'),
        AsyncStorage.getItem('streakData'),
      ]);

      set({
        fox: foxData ? JSON.parse(foxData) : null,
        userPreferences: prefsData ? JSON.parse(prefsData) : null,
        todayData: todayDataStr ? JSON.parse(todayDataStr) : null,
        appLimits: appLimitsData ? JSON.parse(appLimitsData) : [],
        categoryLimits: categoryLimitsData ? JSON.parse(categoryLimitsData) : [],
        streakData: streakDataStr ? JSON.parse(streakDataStr) : null,
      });
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const { fox, userPreferences, todayData, appLimits, categoryLimits, streakData } = get();
      
      await Promise.all([
        AsyncStorage.setItem('fox', JSON.stringify(fox)),
        AsyncStorage.setItem('userPreferences', JSON.stringify(userPreferences)),
        AsyncStorage.setItem('todayData', JSON.stringify(todayData)),
        AsyncStorage.setItem('appLimits', JSON.stringify(appLimits)),
        AsyncStorage.setItem('categoryLimits', JSON.stringify(categoryLimits)),
        AsyncStorage.setItem('streakData', JSON.stringify(streakData)),
      ]);
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },
}));
