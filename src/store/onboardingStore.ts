import { OnboardingService } from "@/services/supabase";
import { HabitConfig, HabitType } from "@/types/habits";
import { OnboardingData } from "@/types/onboarding";
import { appEvents, EVENTS } from "@/utils/events";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { create } from "zustand";

const STORAGE_KEY = "@onboarding";

const defaultData: OnboardingData = {
  selectedHabits: [],
  habitPriority: [],
  habitConfigs: {},
  selectedApps: [],
  selectedCategories: [],
  familyActivitySelection: undefined,
  screenTimePermissionGranted: false,
  notificationsEnabled: false,
  healthKitPermissionGranted: false,
  locationPermissionGranted: false,
  pactAccepted: false,
  analyticsEnabled: true,
  completedAt: undefined,
};

interface OnboardingState extends OnboardingData {
  // Actions
  updateData: (data: Partial<OnboardingData>) => void;
  selectHabit: (type: HabitType) => void;
  deselectHabit: (type: HabitType) => void;
  setHabitPriority: (ordered: HabitType[]) => void;
  setHabitConfig: (type: HabitType, config: HabitConfig) => void;
  completeOnboarding: () => Promise<{ success: boolean; error?: string }>;
  resetOnboarding: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...defaultData,

  updateData: (data: Partial<OnboardingData>) => {
    set(data);
    get().saveToStorage();
  },

  selectHabit: (type: HabitType) => {
    const { selectedHabits, habitPriority } = get();
    if (selectedHabits.includes(type)) return;
    const updated = [...selectedHabits, type];
    set({
      selectedHabits: updated,
      habitPriority: [...habitPriority, type],
    });
    get().saveToStorage();
  },

  deselectHabit: (type: HabitType) => {
    const { selectedHabits, habitPriority } = get();
    set({
      selectedHabits: selectedHabits.filter((h) => h !== type),
      habitPriority: habitPriority.filter((h) => h !== type),
    });
    get().saveToStorage();
  },

  setHabitPriority: (ordered: HabitType[]) => {
    set({ habitPriority: ordered });
    get().saveToStorage();
  },

  setHabitConfig: (type: HabitType, config: HabitConfig) => {
    const { habitConfigs } = get();
    set({ habitConfigs: { ...habitConfigs, [type]: config } });
    get().saveToStorage();
  },

  completeOnboarding: async () => {
    const state = get();
    const completedAt = new Date().toISOString();

    console.log("🎯 Starting onboarding completion...");

    // Update local state first
    set({ completedAt });

    // ALWAYS mark onboarding as complete in AsyncStorage FIRST
    try {
      console.log("💾 Saving completion to AsyncStorage...");
      await AsyncStorage.setItem("onboardingCompleted", "true");
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get() }));
      console.log("✅ AsyncStorage save successful");

      // Emit event for immediate UI update
      appEvents.emit(EVENTS.ONBOARDING_COMPLETED);
      console.log("📢 Emitted onboarding completed event");
    } catch (error) {
      console.error("❌ Error saving to AsyncStorage:", error);
    }

    // Prepare data for Supabase
    const onboardingRecord = {
      selected_habits: state.selectedHabits,
      habit_priority: state.habitPriority,
      habit_configs: state.habitConfigs as Record<string, unknown>,
      selected_apps: state.selectedApps,
      selected_categories: state.selectedCategories,
      family_activity_selection: state.familyActivitySelection,
      screen_time_permission_granted: state.screenTimePermissionGranted,
      notifications_enabled: state.notificationsEnabled,
      health_kit_permission_granted: state.healthKitPermissionGranted,
      location_permission_granted: state.locationPermissionGranted,
      pact_accepted: state.pactAccepted,
      analytics_enabled: state.analyticsEnabled,
      completed_at: completedAt,
      device_platform: Platform.OS,
      device_version: Constants.expoConfig?.version ?? "1.0.0",
    };

    // Try to save to Supabase, but don't block on it
    try {
      console.log("☁️ Attempting to save to Supabase...");
      const result =
        await OnboardingService.saveOnboardingData(onboardingRecord);
      if (result.success) {
        console.log("✅ Supabase save successful");
      } else {
        console.log("⚠️ Supabase save failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Supabase save error:", error);
    }

    // Always return success since local save is what matters
    console.log("✅ Onboarding completion finished");
    return { success: true };
  },

  resetOnboarding: () => {
    set({ ...defaultData });
    AsyncStorage.removeItem("onboardingCompleted");
    AsyncStorage.removeItem(STORAGE_KEY);

    appEvents.emit(EVENTS.ONBOARDING_RESET);
    console.log("📢 Emitted onboarding reset event");
  },

  loadFromStorage: async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        set(parsed);
      }
    } catch (error) {
      console.error("Error loading onboarding data from storage:", error);
    }
  },

  saveToStorage: () => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get())).catch(
      console.error,
    );
  },
}));
