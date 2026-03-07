import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus, Platform } from "react-native";
import {
  blockSelection,
  setFamilyActivitySelectionId,
  unblockSelection,
  userDefaultsSet,
} from "react-native-device-activity";

export interface AppInfo {
  name: string;
  icon: string;
  bundleId: string;
  category: string;
}

export interface AppGroupSchedule {
  /** "HH:MM" 24-hour format, e.g. "09:00" */
  startTime: string;
  /** "HH:MM" 24-hour format, e.g. "17:00" */
  endTime: string;
  /** Day IDs: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun" */
  days: string[];
  /** If true the group is active 24/7 — schedule fields are ignored */
  alwaysOn: boolean;
}

export interface AppGroup {
  id: string;
  name: string;
  apps: AppInfo[];
  /** Opaque token from react-native-device-activity FamilyActivityPicker */
  familyActivitySelection?: string;
  /** Number of individual apps selected (display only) */
  applicationCount?: number;
  /** Number of categories selected (display only) */
  categoryCount?: number;
  sessionLength: number; // in minutes, how long before popup
  dailyUnlocks: number; // how many times can check app per day
  currentUnlocks: number;
  isBlocked: boolean; // if true, sessionLength is ignored and app is immediately blocked
  /** When during the day/week this group is active */
  schedule?: AppGroupSchedule;
  createdAt: string;
  lastReset: string;
}

const STORAGE_KEY = "@app_groups";

// Apply native blocking based on current app groups
async function applyNativeBlocking(groups: AppGroup[]): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    // Unblock everything first, then re-block active groups
    for (const group of groups) {
      if (!group.familyActivitySelection && !group.id) continue;
      if (group.isBlocked) {
        blockSelection({ activitySelectionId: group.id });
      } else {
        unblockSelection({ activitySelectionId: group.id });
      }
    }
  } catch (error) {
    console.error("Error applying native blocking:", error);
  }
}

export const AppGroupService = {
  async getAppGroups(): Promise<AppGroup[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading app groups:", error);
      return [];
    }
  },

  async saveAppGroups(groups: AppGroup[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
      // Apply native blocking whenever groups are saved
      await applyNativeBlocking(groups);
    } catch (error) {
      console.error("Error saving app groups:", error);
      throw error;
    }
  },

  async createAppGroup(
    name: string,
    apps: AppInfo[],
    sessionLength: number,
    dailyUnlocks: number,
    isBlocked: boolean = false,
    familyActivitySelection?: string,
    applicationCount?: number,
    categoryCount?: number,
    schedule?: AppGroupSchedule,
  ): Promise<AppGroup> {
    const groups = await this.getAppGroups();

    const newGroup: AppGroup = {
      id: Date.now().toString(),
      name,
      apps,
      familyActivitySelection,
      applicationCount,
      categoryCount,
      sessionLength,
      dailyUnlocks,
      currentUnlocks: dailyUnlocks, // Start with full unlocks
      isBlocked,
      schedule,
      createdAt: new Date().toISOString(),
      lastReset: new Date().toISOString().split("T")[0],
    };

    groups.push(newGroup);
    await this.saveAppGroups(groups);

    // Register the selection under this group's ID so the shield extension
    // can look it up, then configure a per-group shield with a deep link
    // that opens the Mindful Pause screen in the main app.
    if (Platform.OS === "ios" && familyActivitySelection) {
      try {
        // 1. Register selection ID so extensions can look up the token
        setFamilyActivitySelectionId({
          id: newGroup.id,
          familyActivitySelection,
        });

        const deepLinkUrl = `serenity://mindful-pause?groupId=${newGroup.id}`;
        const now = new Date().toISOString();

        // 2. Write per-selection shield config (read by ShieldConfigurationExtension)
        const shieldConfig = isBlocked
          ? {
              title: "This app is blocked",
              subtitle:
                "{{applicationOrDomainDisplayName}} is off-limits right now.",
              primaryButtonLabel: "I understand",
              triggeredBy: "createAppGroup",
              updatedAt: now,
            }
          : {
              title: "Pause before you scroll",
              subtitle:
                "Take a mindful breath before opening {{applicationOrDomainDisplayName}}.",
              primaryButtonLabel: "Take a Mindful Pause",
              triggeredBy: "createAppGroup",
              updatedAt: now,
            };

        userDefaultsSet(
          `shieldConfigurationForSelection_${newGroup.id}`,
          shieldConfig,
        );

        // 3. Write per-selection actions (read by ShieldActionExtension)
        //    behavior "defer" keeps the shield open after button tap so the
        //    app can open via the deep link; "close" dismisses the shield.
        const shieldActions = {
          primary: {
            behavior: isBlocked ? "close" : "defer",
            actions: [{ type: "openUrl", url: deepLinkUrl }],
          },
        };

        userDefaultsSet(
          `shieldActionsForSelection_${newGroup.id}`,
          shieldActions,
        );
      } catch (shieldError) {
        console.warn(
          "[AppGroupService] Shield config error (non-fatal):",
          shieldError,
        );
      }
    }

    return newGroup;
  },

  async updateAppGroup(
    groupId: string,
    updates: Partial<AppGroup>,
  ): Promise<void> {
    const groups = await this.getAppGroups();
    const index = groups.findIndex((g) => g.id === groupId);

    if (index === -1) throw new Error("App group not found");

    groups[index] = { ...groups[index], ...updates };
    await this.saveAppGroups(groups);
  },

  async deleteAppGroup(groupId: string): Promise<void> {
    const groups = await this.getAppGroups();
    const filtered = groups.filter((g) => g.id !== groupId);
    await this.saveAppGroups(filtered);
  },

  async incrementUnlock(groupId: string): Promise<boolean> {
    const groups = await this.getAppGroups();
    const group = groups.find((g) => g.id === groupId);

    if (!group) return false;

    const today = new Date().toISOString().split("T")[0];
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
    const today = new Date().toISOString().split("T")[0];

    let hasChanges = false;
    groups.forEach((group) => {
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
    if (Platform.OS === "ios") {
      AppState.addEventListener(
        "change",
        async (nextAppState: AppStateStatus) => {
          if (nextAppState === "active") {
            // Re-sync blocking state when app becomes active
            const groups = await this.getAppGroups();
            await applyNativeBlocking(groups);
          }
        },
      );
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
