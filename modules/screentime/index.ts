import { NativeModules, Platform } from 'react-native';

export interface FamilyActivitySelection {
  applications: Array<{
    bundleId: string;
    name: string;
    category: string;
    categoryName: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  webDomains: string[];
}

interface ScreenTimeModule {
  requestAuthorization(): Promise<boolean>;
  presentActivityPicker(): Promise<FamilyActivitySelection>;
  getInstalledApps(): Promise<Array<{
    bundleId: string;
    name: string;
    icon: string;
    category: string;
    categoryName: string;
  }>>;
  getAppCategories(): Promise<Array<{
    id: string;
    name: string;
    icon: string;
    appCount?: number;
  }>>;
  isAppBlocked(bundleId: string): Promise<boolean>;
  setBlockedApps(bundleIds: string[]): Promise<void>;
  setBlockedCategories(categoryIds: string[]): Promise<void>;
  removeBlockedApps(bundleIds: string[]): Promise<void>;
  getScreenTimeData(startDate: Date, endDate: Date): Promise<{
    [bundleId: string]: number; // Duration in seconds
  }>;
  applyAppGroupBlocking(appGroups: any[]): Promise<void>;
  temporarilyWhitelistApp(bundleId: string): Promise<void>;
  reapplyBlockingAfterLaunch(): Promise<void>;
}

const LINKING_ERROR =
  `The package 'screentime' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- Run 'cd ios && pod install'\n", default: '' }) +
  '- You have added the required capabilities in Xcode\n' +
  '- You rebuilt the app after installing the package';

const ScreenTime: ScreenTimeModule = NativeModules.ScreenTime
  ? NativeModules.ScreenTime
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export default ScreenTime;

/**
 * Screen Time API Utilities
 * 
 * iOS Requirements:
 * 1. Add Family Controls capability in Xcode
 * 2. Add Screen Time capability in Xcode
 * 3. Add to Info.plist:
 *    <key>NSFamilyControlsUsageDescription</key>
 *    <string>Serenity needs access to Screen Time to help you manage your app usage</string>
 * 
 * Frameworks needed:
 * - FamilyControls (for authorization)
 * - DeviceActivity (for monitoring)
 * - ManagedSettings (for blocking apps)
 */

export const ScreenTimeUtils = {
  /**
   * Request authorization to access Screen Time data
   */
  async requestAuthorization(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.warn('Screen Time is only available on iOS');
      return false;
    }
    
    try {
      const granted = await ScreenTime.requestAuthorization();
      return granted;
    } catch (error) {
      console.error('Error requesting Screen Time authorization:', error);
      return false;
    }
  },

  /**
   * Present native iOS FamilyActivityPicker for app/category selection
   */
  async presentActivityPicker(): Promise<FamilyActivitySelection | null> {
    if (Platform.OS !== 'ios') {
      console.warn('FamilyActivityPicker is only available on iOS');
      return null;
    }
    
    try {
      const selection = await ScreenTime.presentActivityPicker();
      return selection;
    } catch (error) {
      console.error('Error presenting activity picker:', error);
      return null;
    }
  },

  /**
   * Get list of installed apps on the device
   */
  async getInstalledApps() {
    if (Platform.OS !== 'ios') {
      return [];
    }
    
    try {
      const apps = await ScreenTime.getInstalledApps();
      return apps;
    } catch (error) {
      console.error('Error getting installed apps:', error);
      return [];
    }
  },

  /**
   * Get iOS app categories
   */
  async getAppCategories() {
    if (Platform.OS !== 'ios') {
      return [];
    }
    
    try {
      const categories = await ScreenTime.getAppCategories();
      return categories;
    } catch (error) {
      console.error('Error getting app categories:', error);
      return [];
    }
  },

  /**
   * Block specified apps
   */
  async blockApps(bundleIds: string[]) {
    if (Platform.OS !== 'ios') {
      return;
    }
    
    try {
      await ScreenTime.setBlockedApps(bundleIds);
    } catch (error) {
      console.error('Error blocking apps:', error);
      throw error;
    }
  },

  /**
   * Block specified app categories
   */
  async blockCategories(categoryIds: string[]) {
    if (Platform.OS !== 'ios') {
      return;
    }
    
    try {
      await ScreenTime.setBlockedCategories(categoryIds);
    } catch (error) {
      console.error('Error blocking categories:', error);
      throw error;
    }
  },

  /**
   * Unblock specified apps
   */
  async unblockApps(bundleIds: string[]) {
    if (Platform.OS !== 'ios') {
      return;
    }
    
    try {
      await ScreenTime.removeBlockedApps(bundleIds);
    } catch (error) {
      console.error('Error unblocking apps:', error);
      throw error;
    }
  },

  /**
   * Get screen time data for a date range
   */
  async getScreenTimeData(startDate: Date, endDate: Date) {
    if (Platform.OS !== 'ios') {
      return {};
    }
    
    try {
      const data = await ScreenTime.getScreenTimeData(startDate, endDate);
      return data;
    } catch (error) {
      console.error('Error getting screen time data:', error);
      return {};
    }
  },
};
