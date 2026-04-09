import { Platform } from "react-native";
import {
    blockSelection,
    getEvents,
    setFamilyActivitySelectionId,
    startMonitoring,
    stopMonitoring,
    unblockSelection,
    userDefaultsGet,
    userDefaultsSet,
} from "react-native-device-activity";

// ─── Constants ─────────────────────────────────────────────────────────────
const ACTIVITY_NAME = "screentimeLimit";
const EVENT_NAME = "screentimeLimitReached";
const SELECTION_ID = "screentimeHabit";
const THRESHOLD_FLAG_KEY = "screentimeHabit_thresholdReachedAt";

// ─── Shield branding ───────────────────────────────────────────────────────
// Must be kept in sync with the dark-first Serenity palette (see DESIGN_SYSTEM.md)
const SHIELD_COLORS = {
  white: { red: 255, green: 255, blue: 255, alpha: 1.0 },
  title: { red: 245, green: 244, blue: 241, alpha: 1.0 }, // #F5F4F1 warm white
  subtitle: { red: 199, green: 196, blue: 191, alpha: 1.0 }, // #C7C4BF warm grey
  background: { red: 19, green: 17, blue: 15, alpha: 1.0 }, // #13110F deep warm black
  primaryBtn: { red: 224, green: 122, blue: 95, alpha: 1.0 }, // #E07A5F terracotta
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────

function minutesToDateComponents(minutes: number): {
  hour: number;
  minute: number;
  second: number;
} {
  return {
    hour: Math.floor(minutes / 60),
    minute: minutes % 60,
    second: 0,
  };
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// ─── Service ───────────────────────────────────────────────────────────────

export const ScreentimeHabitService = {
  /**
   * Start DeviceActivity monitoring for the day.
   * Apps are OPEN by default. When usage exceeds `limitMinutes`, the
   * ActivityMonitorExtension fires `eventDidReachThreshold`, executes the
   * pre-configured `blockSelection` action, and writes the threshold flag.
   *
   * Call once at the start of each day (or when habit is first configured).
   */
  async startDailyMonitoring(
    limitMinutes: number,
    selection: string,
  ): Promise<void> {
    if (Platform.OS !== "ios") return;

    try {
      // 1. Register the opaque FamilyActivitySelection token with a stable ID
      setFamilyActivitySelectionId({
        id: SELECTION_ID,
        familyActivitySelection: selection,
      });

      // 2. Pre-configure the action the extension will run when the threshold fires.
      //    Key format: actions_for_{activityName}_{callbackName}_{eventName}
      userDefaultsSet(
        `actions_for_${ACTIVITY_NAME}_eventDidReachThreshold_${EVENT_NAME}`,
        [{ type: "blockSelection", familyActivitySelectionId: SELECTION_ID }],
      );

      // 3. Pre-configure the unblock action that fires at midnight (intervalDidEnd).
      //    This auto-resets blocking at end of day; the new day's monitoring
      //    is restarted by resetForNewDay() called from the main app.
      userDefaultsSet(`actions_for_${ACTIVITY_NAME}_intervalDidEnd`, [
        { type: "unblockSelection", familyActivitySelectionId: SELECTION_ID },
      ]);

      // 4. Write a limit-exceeded shield config for this selection so the
      //    native ShieldConfigurationExtension shows Serenity branding.
      const shieldConfig = {
        title: "Screen Limit Reached",
        subtitle:
          "You've hit your daily screen time limit.\nCome back tomorrow — your streak depends on it.",
        primaryButtonLabel: "I understand",
        titleColor: SHIELD_COLORS.title,
        subtitleColor: SHIELD_COLORS.subtitle,
        primaryButtonLabelColor: SHIELD_COLORS.white,
        primaryButtonBackgroundColor: SHIELD_COLORS.primaryBtn,
        backgroundColor: SHIELD_COLORS.background,
        // backgroundBlurStyle 2 = UIBlurEffect.Style.dark
        backgroundBlurStyle: 2,
        iconSystemName: "clock.badge.xmark",
        triggeredBy: "screentimeHabit",
        updatedAt: new Date().toISOString(),
      };

      userDefaultsSet(
        `shieldConfigurationForSelection_${SELECTION_ID}`,
        shieldConfig,
      );
      // Also write as the app-wide fallback shield so any incidentally blocked
      // app picks up Serenity branding even if the per-selection key is missed.
      userDefaultsSet("shieldConfiguration", shieldConfig);

      // 5. Start monitoring: midnight → 23:59, repeating daily, with threshold event
      await startMonitoring(
        ACTIVITY_NAME,
        {
          intervalStart: { hour: 0, minute: 0, second: 0 },
          intervalEnd: { hour: 23, minute: 59, second: 59 },
          repeats: true,
        },
        [
          {
            familyActivitySelection: selection,
            threshold: minutesToDateComponents(limitMinutes),
            eventName: EVENT_NAME,
            // Do not count usage from before monitoring started
            includesPastActivity: false,
          },
        ],
      );
    } catch (error) {
      console.error(
        "[ScreentimeHabitService] startDailyMonitoring error:",
        error,
      );
      throw error;
    }
  },

  /**
   * Called from JS when the threshold-reached notification arrives (app is
   * foregrounded after the extension fired). Ensures blocking is applied and
   * writes the explicit timestamp flag so `getStatus()` can return instantly
   * without scanning the events log.
   */
  async onThresholdReached(): Promise<void> {
    if (Platform.OS !== "ios") return;

    try {
      // Defensive: ensure selection is blocked (extension action may have already
      // handled this, but this is a no-op if already blocked).
      blockSelection({ activitySelectionId: SELECTION_ID });

      // Write the explicit timestamp flag. The Swift extension also writes this
      // flag via persistToUserDefaults; this JS write is the fallback for when
      // the app is already running when the threshold fires.
      userDefaultsSet(THRESHOLD_FLAG_KEY, new Date().toISOString());
    } catch (error) {
      console.error(
        "[ScreentimeHabitService] onThresholdReached error:",
        error,
      );
    }
  },

  /**
   * Called at midnight (or on app launch the next day) to reset state for the
   * new day: stop the previous monitoring interval, unblock selections, clear
   * the threshold flag, and restart fresh monitoring.
   */
  async resetForNewDay(limitMinutes: number, selection: string): Promise<void> {
    if (Platform.OS !== "ios") return;

    try {
      stopMonitoring([ACTIVITY_NAME]);
      unblockSelection({ activitySelectionId: SELECTION_ID });
      // Clear the explicit threshold flag so getStatus() returns clean state
      userDefaultsSet(THRESHOLD_FLAG_KEY, null);
      await this.startDailyMonitoring(limitMinutes, selection);
    } catch (error) {
      console.error("[ScreentimeHabitService] resetForNewDay error:", error);
      throw error;
    }
  },

  /**
   * Returns the current status synchronously by checking:
   *  1. The explicit threshold flag written by the Swift extension / onThresholdReached()
   *  2. The generic events log written by persistToUserDefaults in the extension
   *
   * `usageMinutes` is only approximate — an exact value requires a full
   * DeviceActivityReport query (out of scope for this step). When the limit has
   * been exceeded we return `limitMinutes` as the usage so the UI can show
   * "limit reached".
   */
  getStatus(limitMinutes: number): {
    usageMinutes: number;
    limitMinutes: number;
    exceeded: boolean;
  } {
    if (Platform.OS !== "ios") {
      return { usageMinutes: 0, limitMinutes, exceeded: false };
    }

    try {
      // Check explicit flag written by native extension / onThresholdReached()
      const flaggedAt = userDefaultsGet<string>(THRESHOLD_FLAG_KEY);
      const flagExceeded = flaggedAt ? isToday(new Date(flaggedAt)) : false;

      // Cross-check via generic events log (written by persistToUserDefaults)
      const events = getEvents(ACTIVITY_NAME);
      const eventExceeded = events.some(
        (e) =>
          e.callbackName === "eventDidReachThreshold" &&
          e.eventName === EVENT_NAME &&
          isToday(e.lastCalledAt),
      );

      const exceeded = flagExceeded || eventExceeded;

      return {
        // Return limitMinutes as usage when exceeded (exact usage requires
        // DeviceActivityReport — to be implemented in a future step).
        usageMinutes: exceeded ? limitMinutes : 0,
        limitMinutes,
        exceeded,
      };
    } catch (error) {
      console.error("[ScreentimeHabitService] getStatus error:", error);
      return { usageMinutes: 0, limitMinutes, exceeded: false };
    }
  },
};
