import { OnboardingData, OnboardingRecord } from '@/types/onboarding';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Supabase service for onboarding data
 */
export class OnboardingService {
  /**
   * Map an in-app OnboardingData object to the snake_case Supabase record shape.
   */
  static toRecord(data: OnboardingData, userId?: string): Omit<OnboardingRecord, 'id' | 'created_at'> {
    return {
      user_id: userId,
      selected_habits: data.selectedHabits,
      habit_priority: data.habitPriority,
      habit_configs: data.habitConfigs as Record<string, unknown>,
      selected_apps: data.selectedApps,
      selected_categories: data.selectedCategories,
      family_activity_selection: data.familyActivitySelection,
      screen_time_permission_granted: data.screenTimePermissionGranted,
      notifications_enabled: data.notificationsEnabled,
      health_kit_permission_granted: data.healthKitPermissionGranted,
      location_permission_granted: data.locationPermissionGranted,
      pact_accepted: data.pactAccepted,
      analytics_enabled: data.analyticsEnabled,
      completed_at: data.completedAt,
      device_platform: Platform.OS,
      device_version: Platform.Version?.toString() ?? '',
    };
  }

  /**
   * Save an OnboardingData object to Supabase (maps camelCase → snake_case automatically).
   */
  static async saveOnboarding(
    data: OnboardingData,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const record = OnboardingService.toRecord(data, userId);
    return OnboardingService.saveOnboardingData(record);
  }

  /**
   * Save onboarding data to Supabase
   */
  static async saveOnboardingData(data: Partial<OnboardingRecord>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('onboarding')
        .insert([data]);

      if (error) {
        console.error('Error saving onboarding data:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error saving onboarding data:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Update existing onboarding data
   */
  static async updateOnboardingData(
    id: string,
    data: Partial<OnboardingRecord>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('onboarding')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('Error updating onboarding data:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error updating onboarding data:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get onboarding data by ID
   */
  static async getOnboardingData(id: string): Promise<{ data: OnboardingRecord | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('onboarding')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching onboarding data:', error);
        return { data: null, error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching onboarding data:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }
}
