import { OnboardingService } from '@/services/supabase';
import { OnboardingData } from '@/types/onboarding';
import { appEvents, EVENTS } from '@/utils/events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { create } from 'zustand';

interface OnboardingState extends OnboardingData {
  currentStep: number;
  totalSteps: number;
  
  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateData: (data: Partial<OnboardingData>) => void;
  completeOnboarding: () => Promise<{ success: boolean; error?: string }>;
  resetOnboarding: () => void;
  loadFromStorage: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  // Initial state
  currentStep: 0,
  totalSteps: 10,
  primaryProblem: undefined,
  primaryGoal: null,
  dailyLimitHours: null,
  dailyLimitMinutes: null,
  notificationsEnabled: false,
  screenTimePermissionGranted: false,
  currentDailyUsageHours: null,
  currentDailyUsageRange: null,
  problemApps: [],
  selectedApps: [],
  selectedCategories: [],
  selectionType: 'categories',
  whenUsePhoneMost: null,
  reasonForChange: null,
  analyticsEnabled: true,
  completedAt: null,

  // Actions
  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  nextStep: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep < totalSteps - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  previousStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  updateData: (data: Partial<OnboardingData>) => {
    set(data);
    // Auto-save to AsyncStorage
    const state = get();
    AsyncStorage.setItem('onboardingData', JSON.stringify(state)).catch(console.error);
  },

  completeOnboarding: async () => {
    const state = get();
    const completedAt = new Date().toISOString();
    
    console.log('🎯 Starting onboarding completion...');
    
    // Update local state first
    set({ completedAt });
    
    // ALWAYS mark onboarding as complete in AsyncStorage FIRST
    try {
      console.log('💾 Saving completion to AsyncStorage...');
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      await AsyncStorage.setItem('onboardingData', JSON.stringify(get()));
      console.log('✅ AsyncStorage save successful');
      
      // Emit event for immediate UI update
      appEvents.emit(EVENTS.ONBOARDING_COMPLETED);
      console.log('📢 Emitted onboarding completed event');
    } catch (error) {
      console.error('❌ Error saving to AsyncStorage:', error);
    }
    
    // Prepare data for Supabase
    const onboardingRecord = {
      primary_goal: state.primaryGoal,
      daily_limit_hours: state.dailyLimitHours,
      daily_limit_minutes: state.dailyLimitMinutes,
      notifications_enabled: state.notificationsEnabled,
      screen_time_permission_granted: state.screenTimePermissionGranted,
      current_daily_usage_hours: state.currentDailyUsageHours,
      problem_apps: state.problemApps,
      selected_apps: state.selectedApps,
      selected_categories: state.selectedCategories,
      selection_type: state.selectionType,
      when_use_phone_most: state.whenUsePhoneMost,
      reason_for_change: state.reasonForChange,
      analytics_enabled: state.analyticsEnabled,
      completed_at: completedAt,
      device_platform: Platform.OS,
      device_version: Constants.expoConfig?.version || '1.0.0',
      name: state.name,
      email: state.email,
    };

    // Try to save to Supabase, but don't block on it
    try {
      console.log('☁️ Attempting to save to Supabase...');
      const result = await OnboardingService.saveOnboardingData(onboardingRecord);
      if (result.success) {
        console.log('✅ Supabase save successful');
      } else {
        console.log('⚠️ Supabase save failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Supabase save error:', error);
    }

    // Always return success since local save is what matters
    console.log('✅ Onboarding completion finished');
    return { success: true };
  },

  resetOnboarding: () => {
    set({
      currentStep: 0,
      primaryGoal: null,
      dailyLimitHours: null,
      dailyLimitMinutes: null,
      notificationsEnabled: false,
      screenTimePermissionGranted: false,
      currentDailyUsageHours: null,
      currentDailyUsageRange: null,
      problemApps: [],
      whenUsePhoneMost: null,
      reasonForChange: null,
      analyticsEnabled: true,
      completedAt: null,
    });
    AsyncStorage.removeItem('onboardingCompleted');
    AsyncStorage.removeItem('onboardingData');
    
    // Emit event for immediate UI update
    appEvents.emit(EVENTS.ONBOARDING_RESET);
    console.log('📢 Emitted onboarding reset event');
  },

  loadFromStorage: async () => {
    try {
      const savedData = await AsyncStorage.getItem('onboardingData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        set(parsed);
      }
    } catch (error) {
      console.error('Error loading onboarding data from storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      await AsyncStorage.setItem('onboardingData', JSON.stringify(get()));
    } catch (error) {
      console.error('Error saving onboarding data to storage:', error);
    }
  },
}));
