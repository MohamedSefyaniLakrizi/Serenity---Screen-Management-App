// Screen Time Module using react-native-device-activity
// Wraps Apple's FamilyControls, DeviceActivity, and ManagedSettings APIs

import { Platform } from 'react-native';
import * as ReactNativeDeviceActivity from 'react-native-device-activity';

export interface FamilyActivitySelection {
  familyActivitySelection: string | null;
  familyActivitySelectionId?: string;
}

export interface ShieldConfiguration {
  title: string;
  subtitle?: string;
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  iconSystemName?: string;
}

export interface ShieldActions {
  primary?: {
    type: 'dismiss' | 'disableBlockAllMode';
    behavior: 'close' | 'defer';
  };
  secondary?: {
    type: 'dismiss';
    behavior: 'close';
  };
}

export interface DeviceActivitySchedule {
  intervalStart: { hour: number; minute: number; second?: number };
  intervalEnd: { hour: number; minute: number; second?: number };
  repeats: boolean;
  warningTime?: { minute?: number };
}

const ScreenTime = {
  /**
   * Request Screen Time authorization from the user
   * @returns Authorization status: 'authorized', 'denied', 'notDetermined', etc.
   */
  async requestAuthorization(): Promise<string> {
    if (Platform.OS !== 'ios') {
      console.warn('[ScreenTime] Not available on this platform');
      return 'notDetermined';
    }
    
    try {
      const status = await ReactNativeDeviceActivity.requestAuthorization();
      return status;
    } catch (error) {
      console.error('[ScreenTime] Authorization error:', error);
      throw error;
    }
  },

  /**
   * Get current authorization status
   */
  async getAuthorizationStatus(): Promise<string> {
    if (Platform.OS !== 'ios') {
      return 'notDetermined';
    }
    
    try {
      return await ReactNativeDeviceActivity.getAuthorizationStatus();
    } catch (error) {
      console.error('[ScreenTime] Get status error:', error);
      return 'notDetermined';
    }
  },

  /**
   * Revoke Screen Time authorization
   */
  async revokeAuthorization(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }
    
    try {
      await ReactNativeDeviceActivity.revokeAuthorization();
    } catch (error) {
      console.error('[ScreenTime] Revoke error:', error);
      throw error;
    }
  },

  /**
   * Save a family activity selection with an ID for later reference
   */
  setFamilyActivitySelectionId(params: {
    id: string;
    familyActivitySelection: string;
  }): void {
    if (Platform.OS !== 'ios') {
      return;
    }
    
    ReactNativeDeviceActivity.setFamilyActivitySelectionId(params);
  },

  /**
   * Block apps/categories from the selection
   */
  async blockSelection(params: {
    activitySelectionId?: string;
    familyActivitySelection?: string;
    shieldId?: string;
  }): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }
    
    try {
      await ReactNativeDeviceActivity.blockSelection(params);
    } catch (error) {
      console.error('[ScreenTime] Block selection error:', error);
      throw error;
    }
  },

  /**
   * Unblock apps/categories from the selection
   */
  async unblockSelection(params: {
    activitySelectionId?: string;
    familyActivitySelection?: string;
  }): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }
    
    try {
      await ReactNativeDeviceActivity.unblockSelection(params);
    } catch (error) {
      console.error('[ScreenTime] Unblock selection error:', error);
      throw error;
    }
  },

  /**
   * Configure the shield UI that appears when apps are blocked
   */
  updateShield(config: ShieldConfiguration, actions?: ShieldActions): void {
    if (Platform.OS !== 'ios') {
      return;
    }
    
    ReactNativeDeviceActivity.updateShield(config, actions);
  },

  /**
   * Start monitoring device activity with a schedule
   */
  async startMonitoring(
    activityName: string,
    schedule: DeviceActivitySchedule,
    events?: any[]
  ): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }
    
    try {
      await ReactNativeDeviceActivity.startMonitoring(activityName, schedule, events || []);
    } catch (error) {
      console.error('[ScreenTime] Start monitoring error:', error);
      throw error;
    }
  },

  /**
   * Stop monitoring device activity
   */
  async stopMonitoring(activityName: string): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }
    
    try {
      await ReactNativeDeviceActivity.stopMonitoring(activityName);
    } catch (error) {
      console.error('[ScreenTime] Stop monitoring error:', error);
      throw error;
    }
  },

  /**
   * Configure actions for device activity events
   */
  configureActions(params: {
    activityName: string;
    callbackName: string;
    actions: any[];
  }): void {
    if (Platform.OS !== 'ios') {
      return;
    }
    
    ReactNativeDeviceActivity.configureActions(params);
  },

  /**
   * Get history of device activity events
   */
  getEvents(): any[] {
    if (Platform.OS !== 'ios') {
      return [];
    }
    
    return ReactNativeDeviceActivity.getEvents();
  },

  /**
   * Listen to device activity monitor events
   */
  onDeviceActivityMonitorEvent(callback: (event: any) => void): () => void {
    if (Platform.OS !== 'ios') {
      return () => {};
    }
    
    return ReactNativeDeviceActivity.onDeviceActivityMonitorEvent(callback);
  },
};

export default ScreenTime;

// Re-export the DeviceActivitySelectionView component
export const DeviceActivitySelectionView = ReactNativeDeviceActivity.DeviceActivitySelectionView;
 /*
 * IMPORTANT: This is a MOCK implementation for development.
 * 
 * To enable real Screen Time functionality:
 * 1. Follow the setup guide in docs/SCREEN_TIME_SETUP.md
 * 2. Add native iOS files to Xcode project
 * 3. Add Family Controls capability
 * 4. Replace this file's export with native module:
 * 
 * import { NativeModules } from 'react-native';
 * const { ScreenTime } = NativeModules;
 * export default ScreenTime;
 */
