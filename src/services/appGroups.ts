import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus, Platform } from "react-native";
import {
  blockSelection,
  setFamilyActivitySelectionId,
  unblockSelection,
  userDefaultsClearWithPrefix,
  userDefaultsRemove,
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

// ─── Serenity brand colors ─────────────────────────────────────────────────────
// Shared by createAppGroup and updateAppGroup so there is a single source of
// truth.  Format matches the getColor() helper in Shared.swift.
const SHIELD_COLORS = {
  white: { red: 255, green: 255, blue: 255, alpha: 1.0 },
  title: { red: 245, green: 244, blue: 241, alpha: 1.0 }, // #F5F4F1 warm white
  subtitle: { red: 199, green: 196, blue: 191, alpha: 1.0 }, // #C7C4BF warm grey
  // alpha MUST be 1.0 — even 0.97 lets the white system background bleed through on light mode
  background: { red: 19, green: 17, blue: 15, alpha: 1.0 }, // #13110F deep warm black
  primaryBtn: { red: 224, green: 122, blue: 95, alpha: 1.0 }, // #E07A5F terracotta
} as const;

// ─── Motivational quotes shown on the native shield ───────────────────────────
// The Swift extension picks one at random and injects it via the {{quote}}
// placeholder in the subtitle string.
const SHIELD_QUOTES: string[] = [
  '"Almost everything will work again if you unplug it for a few minutes, including you." — Anne Lamott',
  '"The present moment is the only moment available to us, and it is the door to all moments." — Thich Nhat Hanh',
  '"You have power over your mind, not outside events. Realise this and you will find strength." — Marcus Aurelius',
  '"Disconnecting from technology is the first step to reconnecting with yourself."',
  '"In the depth of winter, I finally learned that within me there lay an invincible summer." — Albert Camus',
  '"Every moment of resistance to temptation is a victory." — Frederick William Faber',
  '"What you pay attention to grows. Pay attention to what matters."',
  '"Rest is not idleness. It is the work of a different kind."',
  '"You don\'t have to scroll to feel alive."',
  '"Small disciplines repeated with consistency every day lead to great achievements." — John C. Maxwell',
];

// ─── Shield config payload builder ──────────────────────────────────────────
// Single place that produces the UserDefaults dict for ShieldConfigurationExtension.
// Called from createAppGroup, updateAppGroup, and refreshAllShieldConfigs.
function buildShieldPayload(
  isBlocked: boolean,
  triggeredBy: string,
): Record<string, unknown> {
  const now = new Date().toISOString();
  // Pick a quote here in JS so it's baked into the string — this works even
  // before a native rebuild and doesn't rely on Swift-side placeholder injection.
  const randomQuote =
    SHIELD_QUOTES[Math.floor(Math.random() * SHIELD_QUOTES.length)];
  const base = {
    titleColor: SHIELD_COLORS.title,
    subtitleColor: SHIELD_COLORS.subtitle,
    primaryButtonLabelColor: SHIELD_COLORS.white,
    primaryButtonBackgroundColor: SHIELD_COLORS.primaryBtn,
    backgroundColor: SHIELD_COLORS.background,
    // backgroundBlurStyle 2 = UIBlurEffect.Style.dark — forces a dark blur base
    // so backgroundColor blends on top of dark, not a white light-mode blur.
    backgroundBlurStyle: 2,
    iconEmoji: "🌿",
    iconSystemName: "leaf.fill", // fallback for older compiled builds
    quotes: SHIELD_QUOTES,
    triggeredBy,
    updatedAt: now,
  };
  if (isBlocked) {
    return {
      ...base,
      title: "This app is blocked",
      subtitle:
        "{applicationOrDomainDisplayName} is off-limits right now.\n\n" +
        randomQuote,
      primaryButtonLabel: "I understand",
    };
  }
  return {
    ...base,
    title: "Pause before you scroll",
    subtitle: randomQuote,
    primaryButtonLabel: "Take a Mindful Pause",
    secondaryButtonLabel: "Stay Focused",
    secondaryButtonLabelColor: SHIELD_COLORS.subtitle,
  };
}

// Apply native blocking based on current app groups
async function applyNativeBlocking(groups: AppGroup[]): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    // Block ALL groups — both full-block and limited-unlock modes show the
    // native shield. Mode differences (message, whether the user can unlock)
    // are handled in the shield config / mindful-pause screen.
    for (const group of groups) {
      if (!group.familyActivitySelection && !group.id) continue;
      blockSelection({ activitySelectionId: group.id });
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

    // Register the selection ID BEFORE saving/blocking so the native layer
    // has the token mapping available when applyNativeBlocking fires.
    if (Platform.OS === "ios" && familyActivitySelection) {
      try {
        setFamilyActivitySelectionId({
          id: newGroup.id,
          familyActivitySelection,
        });
      } catch (e) {
        console.warn(
          "[AppGroupService] setFamilyActivitySelectionId failed (non-fatal):",
          e,
        );
      }
    }

    await this.saveAppGroups(groups);

    // Configure per-group shield config and actions for the shield extension.
    if (Platform.OS === "ios" && familyActivitySelection) {
      try {
        // (selection ID already registered above)

        const deepLinkUrl = `serenity://mindful-pause?groupId=${newGroup.id}`;

        // 2. Write per-selection shield config (read by ShieldConfigurationExtension)
        const shieldConfig = buildShieldPayload(isBlocked, "createAppGroup");

        userDefaultsSet(
          `shieldConfigurationForSelection_${newGroup.id}`,
          shieldConfig,
        );
        // Also write as the global fallback so any incidentally blocked app
        // picks up Serenity branding even if the per-selection key is missed.
        userDefaultsSet("shieldConfiguration", shieldConfig);

        // 3. Write per-selection actions (read by ShieldActionExtension)
        //    type/url must be at the TOP LEVEL of the button config so that
        //    handleShieldAction() in ShieldActionExtension.swift picks them up.
        //    (executeGenericAction, which processes the "actions" array, does
        //     not handle "openUrl" — only the outer type check does.)
        const shieldActions = {
          primary: {
            type: "openUrl",
            url: deepLinkUrl,
            behavior: "defer",
          },
          // secondary button silently keeps the shield up so the user stays
          // blocked (they chose "Stay Focused").
          ...(!isBlocked
            ? {
                secondary: {
                  behavior: "defer",
                },
              }
            : {}),
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

    const merged = { ...groups[index], ...updates };
    groups[index] = merged;
    await this.saveAppGroups(groups);

    // Re-write shield config whenever isBlocked is explicitly toggled so the
    // native extension always shows the correct message and button.
    if (Platform.OS === "ios" && "isBlocked" in updates) {
      try {
        const isBlocked = merged.isBlocked;
        const deepLinkUrl = `serenity://mindful-pause?groupId=${groupId}`;

        const shieldConfig = buildShieldPayload(isBlocked, "updateAppGroup");

        userDefaultsSet(
          `shieldConfigurationForSelection_${groupId}`,
          shieldConfig,
        );
        userDefaultsSet("shieldConfiguration", shieldConfig);

        const shieldActions = {
          primary: {
            type: "openUrl",
            url: deepLinkUrl,
            behavior: "defer",
          },
          ...(!isBlocked
            ? {
                secondary: {
                  behavior: "defer",
                },
              }
            : {}),
        };
        userDefaultsSet(`shieldActionsForSelection_${groupId}`, shieldActions);
      } catch (e) {
        console.warn(
          "[AppGroupService] Shield config update failed (non-fatal):",
          e,
        );
      }
    }
  },

  async deleteAppGroup(groupId: string): Promise<void> {
    const groups = await this.getAppGroups();

    // Explicitly remove native blocking BEFORE the group disappears from state
    if (Platform.OS === "ios") {
      try {
        unblockSelection({ activitySelectionId: groupId });
      } catch (e) {
        console.warn(
          "[AppGroupService] unblock on delete failed (non-fatal):",
          e,
        );
      }
      // Clean up per-group UserDefaults entries written by createAppGroup
      try {
        userDefaultsRemove(`shieldConfigurationForSelection_${groupId}`);
        userDefaultsRemove(`shieldActionsForSelection_${groupId}`);
        // Also remove the selection ID from the shared registry
        userDefaultsClearWithPrefix(`familyActivitySelectionId_${groupId}`);
      } catch (e) {
        console.warn(
          "[AppGroupService] UserDefaults cleanup failed (non-fatal):",
          e,
        );
      }
    }

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

  // Rewrite every existing group's shield config + actions into UserDefaults.
  // Call this at app startup so that code changes to buildShieldPayload are
  // immediately reflected even for groups that were created before the update.
  async refreshAllShieldConfigs(): Promise<void> {
    if (Platform.OS !== "ios") return;
    try {
      const groups = await this.getAppGroups();
      for (const group of groups) {
        const shieldConfig = buildShieldPayload(
          group.isBlocked,
          "refreshAllShieldConfigs",
        );
        userDefaultsSet(
          `shieldConfigurationForSelection_${group.id}`,
          shieldConfig,
        );
        const deepLinkUrl = `serenity://mindful-pause?groupId=${group.id}`;
        const shieldActions = {
          primary: { type: "openUrl", url: deepLinkUrl, behavior: "defer" },
          ...(!group.isBlocked ? { secondary: { behavior: "defer" } } : {}),
        };
        userDefaultsSet(`shieldActionsForSelection_${group.id}`, shieldActions);
      }
      // Overwrite global fallback with current branding too
      userDefaultsSet(
        "shieldConfiguration",
        buildShieldPayload(false, "refreshAllShieldConfigs_fallback"),
      );
    } catch (e) {
      console.warn(
        "[AppGroupService] refreshAllShieldConfigs failed (non-fatal):",
        e,
      );
    }
  },
};

export async function getApps(): Promise<AppGroup[]> {
  return AppGroupService.getAppGroups();
}
