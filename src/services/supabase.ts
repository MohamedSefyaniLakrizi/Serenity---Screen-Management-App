import { OnboardingRecord } from '@/types/onboarding';
import { createClient } from '@supabase/supabase-js';

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
