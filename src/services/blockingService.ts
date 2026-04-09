import { ShieldService } from "@/services/shieldService";
import { useHabitStore } from "@/store/habitStore";
import { Platform } from "react-native";
import {
    blockSelection,
    setFamilyActivitySelectionId,
    unblockSelection,
} from "react-native-device-activity";

/**
 * Fixed activity-selection ID used for the single global blocking rule.
 * The actual FamilyActivitySelection token is registered under this ID via
 * setFamilyActivitySelectionId and looked up by the native layer on
 * blockSelection / unblockSelection calls.
 */
const GLOBAL_BLOCKING_ID = "serenity_global";

export const BlockingService = {
  /**
   * Evaluate current habit completion state and apply or lift blocking.
   * Call this on app foreground, after habit completion, and after daily reset.
   */
  async evaluateAndApplyBlocking(): Promise<void> {
    if (Platform.OS !== "ios") return;

    const store = useHabitStore.getState();
    const { blockedAppsSelection } = store;
    if (!blockedAppsSelection) return;

    const allDone = store.areAllActiveHabitsCompleted();
    if (allDone) {
      await this.unlockApps(blockedAppsSelection);
    } else {
      const uncompleted = store.getUncompletedHabits();
      await ShieldService.updateShieldForHabits(uncompleted);
      await this.lockApps(blockedAppsSelection);
    }
  },

  /**
   * Register the FamilyActivitySelection token with the native layer and
   * activate blocking for all selected apps / categories.
   *
   * @param selection - Opaque FamilyActivitySelection token from the native picker.
   */
  async lockApps(selection: string): Promise<void> {
    if (Platform.OS !== "ios") return;
    try {
      // Register the opaque token under our stable global ID so that
      // blockSelection can look it up without needing the raw token each time.
      setFamilyActivitySelectionId({
        id: GLOBAL_BLOCKING_ID,
        familyActivitySelection: selection,
      });
      blockSelection({ activitySelectionId: GLOBAL_BLOCKING_ID });
    } catch (e) {
      console.warn("[BlockingService] lockApps failed (non-fatal):", e);
    }
  },

  /**
   * Lift the global blocking shield so all apps become accessible.
   *
   * @param _selection - Unused; kept for API symmetry with lockApps.
   */
  async unlockApps(_selection: string): Promise<void> {
    if (Platform.OS !== "ios") return;
    try {
      unblockSelection({ activitySelectionId: GLOBAL_BLOCKING_ID });
    } catch (e) {
      console.warn("[BlockingService] unlockApps failed (non-fatal):", e);
    }
  },

  /**
   * Re-block apps at the start of a new day.
   * Call this AFTER habitStore.resetDailyCompletions() so shield messaging
   * reflects the newly-reset (incomplete) habit state.
   */
  async resetForNewDay(): Promise<void> {
    if (Platform.OS !== "ios") return;
    const store = useHabitStore.getState();
    const { blockedAppsSelection } = store;
    if (!blockedAppsSelection) return;

    const uncompleted = store.getUncompletedHabits();
    await ShieldService.updateShieldForHabits(uncompleted);
    await this.lockApps(blockedAppsSelection);
  },

  /**
   * Re-evaluate and apply blocking when the app returns to the foreground.
   */
  async onAppForeground(): Promise<void> {
    await this.evaluateAndApplyBlocking();
  },

  /**
   * Re-evaluate blocking after a habit has been completed.
   * Unlocks apps if all active habits are now done for the day.
   */
  async onHabitCompleted(_habitId: string): Promise<void> {
    await this.evaluateAndApplyBlocking();
  },
};
