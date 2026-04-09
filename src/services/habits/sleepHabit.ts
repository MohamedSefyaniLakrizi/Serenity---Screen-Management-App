import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {
    blockSelection,
    setFamilyActivitySelectionId,
    startMonitoring,
    stopMonitoring,
    unblockSelection,
    userDefaultsGet,
    userDefaultsSet,
} from "react-native-device-activity";

import { SleepConfig, SleepEscalationState } from "@/types/habits";

// ─── Constants ─────────────────────────────────────────────────────────────
const ACTIVITY_NAME = "sleepSchedule";
const SELECTION_ID = "sleepHabit";
const ESCALATION_KEY = "@sleepHabit_escalation";
/**
 * UserDefaults key written by the ActivityMonitorExtension (or by the JS
 * layer on app foreground) when phone usage is detected during the sleep
 * window.  Format: ISO timestamp string.
 */
const VIOLATION_FLAG_KEY = "sleepHabit_violationAt";

// Effective bedtime cannot go earlier than 20:00 (8 PM).
const EARLIEST_BEDTIME_HOUR = 20;

// ─── Shield branding ───────────────────────────────────────────────────────
const SHIELD_COLORS = {
  white: { red: 255, green: 255, blue: 255, alpha: 1.0 },
  title: { red: 245, green: 244, blue: 241, alpha: 1.0 }, // #F5F4F1 warm white
  subtitle: { red: 199, green: 196, blue: 191, alpha: 1.0 }, // #C7C4BF warm grey
  background: { red: 19, green: 17, blue: 15, alpha: 1.0 }, // #13110F deep warm black
  primaryBtn: { red: 224, green: 122, blue: 95, alpha: 1.0 }, // #E07A5F terracotta
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Parse a "HH:mm" string into hour and minute numbers. */
function parseTime(hhMm: string): { hour: number; minute: number } {
  const [h, m] = hhMm.split(":").map(Number);
  return { hour: h, minute: m };
}

/** Subtract `minutes` from a "HH:mm" time string, returning "HH:mm". */
function subtractMinutesFromTime(hhMm: string, minutes: number): string {
  const [h, m] = hhMm.split(":").map(Number);
  let total = h * 60 + m - minutes;
  // Clamp to 0:00 minimum before the 8 PM floor is applied by the caller.
  total = Math.max(0, total);
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Current local time as "HH:mm". */
function currentHHmm(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/** Today's date as "YYYY-MM-DD". */
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

/** Yesterday's date as "YYYY-MM-DD". */
function yesterdayStr(): string {
  return new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
}

// ─── Service ───────────────────────────────────────────────────────────────

export const SleepHabitService = {
  // ── Schedule / compute ────────────────────────────────────────────────

  /**
   * Compute the effective bedtime by subtracting escalation minutes from the
   * scheduled bedtime.  The result is floored at {@link EARLIEST_BEDTIME_HOUR}:00
   * (20:00 / 8 PM) so the schedule never becomes unreasonably strict.
   */
  getEffectiveBedtime(
    config: SleepConfig,
    escalation: SleepEscalationState,
  ): string {
    const raw = subtractMinutesFromTime(
      config.bedtime,
      escalation.escalationMinutes,
    );
    const { hour, minute } = parseTime(raw);
    const floorMin = EARLIEST_BEDTIME_HOUR * 60;
    if (hour * 60 + minute < floorMin) {
      return `${String(EARLIEST_BEDTIME_HOUR).padStart(2, "0")}:00`;
    }
    return raw;
  },

  /**
   * Returns `true` when the current local time falls inside the sleep window
   * (effectiveBedtime → wakeTime, which typically spans midnight).
   */
  shouldBeBlocked(
    config: SleepConfig,
    escalation: SleepEscalationState,
  ): boolean {
    const now = currentHHmm();
    const effectiveBedtime = SleepHabitService.getEffectiveBedtime(
      config,
      escalation,
    );
    const { wakeTime } = config;

    const { hour: nowH, minute: nowM } = parseTime(now);
    const { hour: bedH, minute: bedM } = parseTime(effectiveBedtime);
    const { hour: wakeH, minute: wakeM } = parseTime(wakeTime);

    const nowMin = nowH * 60 + nowM;
    const bedMin = bedH * 60 + bedM;
    const wakeMin = wakeH * 60 + wakeM;

    if (bedMin <= wakeMin) {
      // Same-day window (unusual — e.g. nap mode)
      return nowMin >= bedMin && nowMin < wakeMin;
    }
    // Normal case: window spans midnight (e.g. 22:00 → 07:00)
    return nowMin >= bedMin || nowMin < wakeMin;
  },

  // ── Native scheduling ─────────────────────────────────────────────────

  /**
   * Set up DeviceActivity schedule monitoring for the sleep window.
   *
   * - `intervalDidStart` (bedtime)  → block the selection
   * - `intervalDidEnd`   (wake time) → unblock the selection
   *
   * Pass `selection` (the opaque FamilyActivitySelection token from the habit
   * store) so the native layer can map SELECTION_ID to the actual app set.
   * If `selection` is empty the scheduling still fires but blocking won't
   * target any apps — callers should ensure a valid selection is available.
   */
  async setupSchedule(
    config: SleepConfig,
    escalation: SleepEscalationState,
    selection?: string,
  ): Promise<void> {
    if (Platform.OS !== "ios") return;

    try {
      // Register selection ID ↔ FamilyActivitySelection mapping.
      if (selection) {
        setFamilyActivitySelectionId({
          id: SELECTION_ID,
          familyActivitySelection: selection,
        });
      }

      const effectiveBedtime = SleepHabitService.getEffectiveBedtime(
        config,
        escalation,
      );
      const start = parseTime(effectiveBedtime);
      const end = parseTime(config.wakeTime);

      // Pre-configure native extension actions:
      // intervalDidStart (bedtime) → block
      userDefaultsSet(`actions_for_${ACTIVITY_NAME}_intervalDidStart`, [
        { type: "blockSelection", familyActivitySelectionId: SELECTION_ID },
      ]);
      // intervalDidEnd (wake time) → unblock
      userDefaultsSet(`actions_for_${ACTIVITY_NAME}_intervalDidEnd`, [
        { type: "unblockSelection", familyActivitySelectionId: SELECTION_ID },
      ]);

      // Shield config for this selection
      userDefaultsSet(
        `shieldConfigurationForSelection_${SELECTION_ID}`,
        buildSleepShield(config.wakeTime),
      );

      // Start schedule-based monitoring (no threshold events — just interval callbacks)
      await startMonitoring(
        ACTIVITY_NAME,
        {
          intervalStart: { hour: start.hour, minute: start.minute, second: 0 },
          intervalEnd: { hour: end.hour, minute: end.minute, second: 0 },
          repeats: true,
        },
        [],
      );
    } catch (error) {
      console.error("[SleepHabitService] setupSchedule error:", error);
      throw error;
    }
  },

  /**
   * Stop the sleep schedule monitoring (e.g., when the habit is removed or
   * the config changes before re-scheduling).
   */
  stopSchedule(): void {
    if (Platform.OS !== "ios") return;
    try {
      stopMonitoring([ACTIVITY_NAME]);
    } catch (error) {
      console.error("[SleepHabitService] stopSchedule error:", error);
    }
  },

  // ── Blocking ──────────────────────────────────────────────────────────

  /**
   * Immediately block the selection.  Call when the app is foregrounded
   * inside the sleep window and the schedule callback may not have fired yet.
   */
  async blockForSleep(selection: string): Promise<void> {
    if (Platform.OS !== "ios") return;
    try {
      setFamilyActivitySelectionId({
        id: SELECTION_ID,
        familyActivitySelection: selection,
      });
      blockSelection({ activitySelectionId: SELECTION_ID });
    } catch (error) {
      console.error("[SleepHabitService] blockForSleep error:", error);
    }
  },

  /**
   * Unblock the selection after the user's wake time.
   * Called from the main app on foreground when past wakeTime.
   */
  async unblockAfterWake(_selection: string): Promise<void> {
    if (Platform.OS !== "ios") return;
    try {
      unblockSelection({ activitySelectionId: SELECTION_ID });
    } catch (error) {
      console.error("[SleepHabitService] unblockAfterWake error:", error);
    }
  },

  // ── Escalation ────────────────────────────────────────────────────────

  /**
   * Record that the user violated their sleep schedule on `date` (YYYY-MM-DD).
   * Adds 30 min of escalation (capped at 120), resets the good-night streak.
   *
   * Note: `effectiveBedtime` in the returned state is left empty — callers
   * should update it via `getEffectiveBedtime()` after recording.
   */
  recordViolation(
    date: string,
    escalation: SleepEscalationState,
  ): SleepEscalationState {
    return {
      violations: [...escalation.violations, date],
      escalationMinutes: Math.min(120, escalation.escalationMinutes + 30),
      goodNightStreak: 0,
      effectiveBedtime: escalation.effectiveBedtime,
    };
  },

  /**
   * Record a successful night (no phone usage after effective bedtime).
   * After 3 consecutive good nights, escalation decreases by 30 minutes.
   *
   * Note: `effectiveBedtime` in the returned state is left as-is.
   */
  recordGoodNight(escalation: SleepEscalationState): SleepEscalationState {
    const newStreak = escalation.goodNightStreak + 1;
    if (newStreak >= 3) {
      return {
        ...escalation,
        escalationMinutes: Math.max(0, escalation.escalationMinutes - 30),
        goodNightStreak: 0,
      };
    }
    return {
      ...escalation,
      goodNightStreak: newStreak,
    };
  },

  /**
   * Check the violation flag written by the native layer (or by the JS app
   * foreground handler) and update the escalation state accordingly.
   *
   * - If a violation was recorded last night and is not yet reflected in
   *   `escalation.violations`, `recordViolation()` is applied.
   * - The returned state always has a fresh `effectiveBedtime` computed from
   *   `config.bedtime` minus the final `escalationMinutes`.
   *
   * Call on every app foreground event or app launch.
   */
  checkAndUpdateEscalation(
    config: SleepConfig,
    escalation: SleepEscalationState,
  ): SleepEscalationState {
    let updated = { ...escalation };

    if (Platform.OS === "ios") {
      try {
        const violationAt = userDefaultsGet(VIOLATION_FLAG_KEY) as
          | string
          | null
          | undefined;

        if (violationAt) {
          const violationDay = violationAt.split("T")[0];
          const today = todayStr();
          const yesterday = yesterdayStr();

          // A violation recorded today or yesterday that hasn't been captured yet
          if (
            (violationDay === today || violationDay === yesterday) &&
            !escalation.violations.includes(violationDay)
          ) {
            updated = SleepHabitService.recordViolation(violationDay, updated);
          }
        }
      } catch (error) {
        console.error(
          "[SleepHabitService] checkAndUpdateEscalation error:",
          error,
        );
      }
    }

    // Always refresh the cached effectiveBedtime
    updated.effectiveBedtime = SleepHabitService.getEffectiveBedtime(
      config,
      updated,
    );
    return updated;
  },

  // ── Persistence ───────────────────────────────────────────────────────

  async saveEscalationState(state: SleepEscalationState): Promise<void> {
    try {
      await AsyncStorage.setItem(ESCALATION_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("[SleepHabitService] saveEscalationState error:", error);
    }
  },

  async loadEscalationState(): Promise<SleepEscalationState> {
    try {
      const raw = await AsyncStorage.getItem(ESCALATION_KEY);
      if (raw) return JSON.parse(raw) as SleepEscalationState;
    } catch (error) {
      console.error("[SleepHabitService] loadEscalationState error:", error);
    }
    return {
      violations: [],
      escalationMinutes: 0,
      goodNightStreak: 0,
      effectiveBedtime: "",
    };
  },

  /**
   * Write the violation flag to UserDefaults from the JS side.
   * Call this when the app comes to the foreground inside the sleep window
   * (i.e., `shouldBeBlocked()` returns true on app resume).
   */
  markViolationNow(): void {
    if (Platform.OS !== "ios") return;
    try {
      userDefaultsSet(VIOLATION_FLAG_KEY, new Date().toISOString());
    } catch (error) {
      console.error("[SleepHabitService] markViolationNow error:", error);
    }
  },
};

// ─── Shield config builder ─────────────────────────────────────────────────

function buildSleepShield(wakeTime: string): Record<string, unknown> {
  return {
    title: "Sleep Time 🌙",
    subtitle: `It's time to rest. Your apps will unlock at ${wakeTime}.\n\nHonour your commitment — your future self will thank you.`,
    primaryButtonLabel: "I understand",
    titleColor: SHIELD_COLORS.title,
    subtitleColor: SHIELD_COLORS.subtitle,
    primaryButtonLabelColor: SHIELD_COLORS.white,
    primaryButtonBackgroundColor: SHIELD_COLORS.primaryBtn,
    backgroundColor: SHIELD_COLORS.background,
    // backgroundBlurStyle 2 = UIBlurEffect.Style.dark
    backgroundBlurStyle: 2,
    iconSystemName: "moon.zzz.fill",
    triggeredBy: "sleepHabit",
    updatedAt: new Date().toISOString(),
  };
}
