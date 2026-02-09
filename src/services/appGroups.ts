import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, NativeModules, Platform } from 'react-native';

const { ScreenTimeModule } = NativeModules;

export interface AppInfo {
  name: string;
  icon: string;
  bundleId: string;
  category: string;
}

export interface AppGroup {
  id: string;
  name: string;
  apps: AppInfo[];
  sessionLength: number; // in minutes, how long before popup
  dailyUnlocks: number; // how many times can check app per day
  currentUnlocks: number;
  isBlocked: boolean; // if true, sessionLength is ignored and app is immediately blocked
  createdAt: string;
  lastReset: string;
}

const STORAGE_KEY = '@app_groups';

// Apply native blocking based on current app groups
async function applyNativeBlocking(groups: AppGroup[]): Promise<void> {
  if (Platform.OS === 'ios' && ScreenTimeModule) {
    try {
      await ScreenTimeModule.applyAppGroupBlocking(groups);
    } catch (error) {
      console.error('Error applying native blocking:', error);
    }
  }
}

export const AppGroupService = {
  async getAppGroups(): Promise<AppGroup[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading app groups:', error);
      return [];
    }
  },

  async saveAppGroups(groups: AppGroup[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
      // Apply native blocking whenever groups are saved
      await applyNativeBlocking(groups);
    } catch (error) {
      console.error('Error saving app groups:', error);
      throw error;
    }
  },

  async createAppGroup(
    name: string,
    apps: AppInfo[],
    sessionLength: number,
    dailyUnlocks: number,
    isBlocked: boolean = false
  ): Promise<AppGroup> {
    const groups = await this.getAppGroups();
    
    const newGroup: AppGroup = {
      id: Date.now().toString(),
      name,
      apps,
      sessionLength,
      dailyUnlocks,
      currentUnlocks: dailyUnlocks, // Start with full unlocks
      isBlocked,
      createdAt: new Date().toISOString(),
      lastReset: new Date().toISOString().split('T')[0],
    };
    
    groups.push(newGroup);
    await this.saveAppGroups(groups);
    return newGroup;
  },

  async updateAppGroup(groupId: string, updates: Partial<AppGroup>): Promise<void> {
    const groups = await this.getAppGroups();
    const index = groups.findIndex(g => g.id === groupId);
    
    if (index === -1) throw new Error('App group not found');
    
    groups[index] = { ...groups[index], ...updates };
    await this.saveAppGroups(groups);
  },

  async deleteAppGroup(groupId: string): Promise<void> {
    const groups = await this.getAppGroups();
    const filtered = groups.filter(g => g.id !== groupId);
    await this.saveAppGroups(filtered);
  },

  async incrementUnlock(groupId: string): Promise<boolean> {
    const groups = await this.getAppGroups();
    const group = groups.find(g => g.id === groupId);
    
    if (!group) return false;
    
    const today = new Date().toISOString().split('T')[0];
    if (group.lastReset !== today) {
      group.currentUnlocks = group.dailyUnlocks;
      group.lastReset = today;
    }
    
    if (group.currentUnlocks <= 0) return false;
    
    group.currentUnlocks--;
    await this.saveAppGroups(groups);
    return true;
  },

  async resetDailyUnlocks(): Promise<void> {
    const groups = await this.getAppGroups();
    const today = new Date().toISOString().split('T')[0];
    
    let hasChanges = false;
    groups.forEach(group => {
      if (group.lastReset !== today) {
        group.currentUnlocks = group.dailyUnlocks;
        group.lastReset = today;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      await this.saveAppGroups(groups);
    }
  },

  // Setup listener for app state changes to reapply blocking after launch
  setupAppStateListener(): void {
    if (Platform.OS === 'ios' && ScreenTimeModule) {
      AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
        if (nextAppState === 'background') {
          // When app goes to background, reapply blocking for next launch
          try {
            await ScreenTimeModule.reapplyBlockingAfterLaunch();
          } catch (error) {
            console.error('Error reapplying blocking:', error);
          }
        }
      });
    }
  },

  // Sync local unlock counts with what shield extension tracked
  async syncUnlockCounts(): Promise<void> {
    // This would be called when app comes to foreground
    // to sync any unlocks that happened while app was closed
    const groups = await this.getAppGroups();
    await this.saveAppGroups(groups);
  },
};

export async function getApps(): Promise<AppGroup[]> {
  return AppGroupService.getAppGroups();
}