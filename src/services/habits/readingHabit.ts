import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── Constants ─────────────────────────────────────────────────────────────
const TIMER_STATE_KEY = "@readingHabit_timerState";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TimerState {
  startedAt: string; // ISO timestamp when timer was started/last resumed
  pausedAt?: string; // ISO timestamp when timer was paused (undefined if running)
  totalPausedSeconds: number; // Cumulative paused duration
  goalMinutes: number;
}

// ─── In-memory state ───────────────────────────────────────────────────────

let _timerState: TimerState | null = null;

// ─── Service ───────────────────────────────────────────────────────────────

export const ReadingHabitService = {
  /**
   * Start a new timer session. Clears any previous in-memory state.
   */
  startTimer(goalMinutes: number): void {
    _timerState = {
      startedAt: new Date().toISOString(),
      totalPausedSeconds: 0,
      goalMinutes,
    };
  },

  /**
   * Pause the timer. Records the pause timestamp so elapsed time stays
   * accurate across pause/resume cycles.
   */
  pauseTimer(): void {
    if (!_timerState || _timerState.pausedAt) return;
    _timerState = {
      ..._timerState,
      pausedAt: new Date().toISOString(),
    };
  },

  /**
   * Resume a paused timer. Accumulates the paused duration and clears
   * the pausedAt marker.
   */
  resumeTimer(): void {
    if (!_timerState || !_timerState.pausedAt) return;
    const pausedSeconds = Math.floor(
      (Date.now() - new Date(_timerState.pausedAt).getTime()) / 1000,
    );
    _timerState = {
      ..._timerState,
      pausedAt: undefined,
      totalPausedSeconds: _timerState.totalPausedSeconds + pausedSeconds,
    };
  },

  /**
   * Reset the timer back to zero, clearing in-memory state.
   */
  resetTimer(): void {
    _timerState = null;
  },

  /**
   * Returns the number of seconds that have actually elapsed (excluding
   * paused time) since the timer was started.
   */
  getElapsedSeconds(): number {
    if (!_timerState) return 0;

    const startMs = new Date(_timerState.startedAt).getTime();
    const nowMs = _timerState.pausedAt
      ? new Date(_timerState.pausedAt).getTime()
      : Date.now();

    const totalElapsedSeconds = Math.floor((nowMs - startMs) / 1000);
    return Math.max(0, totalElapsedSeconds - _timerState.totalPausedSeconds);
  },

  /**
   * Returns true if the elapsed time has reached or exceeded the goal.
   */
  isComplete(goalMinutes: number): boolean {
    return ReadingHabitService.getElapsedSeconds() >= goalMinutes * 60;
  },

  /**
   * Returns whether the timer is currently running (started but not paused).
   */
  isRunning(): boolean {
    return _timerState !== null && !_timerState.pausedAt;
  },

  /**
   * Returns a snapshot of the current timer state for inspection.
   */
  getState(): TimerState | null {
    return _timerState ? { ..._timerState } : null;
  },

  // ── External app monitoring ──────────────────────────────────────────────

  /**
   * Checks whether the user has spent at least `thresholdMinutes` in any of
   * the configured reading apps today using DeviceActivity screen time data.
   *
   * Returns false on non-iOS platforms or if the ScreenTime module is
   * unavailable (graceful degradation).
   */
  async checkReadingAppUsage(
    readingApps: string[],
    thresholdMinutes: number,
  ): Promise<boolean> {
    if (Platform.OS !== "ios" || readingApps.length === 0) return false;

    try {
      // Lazy import to avoid errors on non-iOS builds
      const ScreenTime = (await import("../../../modules/screentime")).default;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const now = new Date();

      const usage = await ScreenTime.getScreenTimeData(startOfDay, now);

      const totalSeconds = readingApps.reduce((sum, bundleId) => {
        return sum + (usage[bundleId] ?? 0);
      }, 0);

      return totalSeconds >= thresholdMinutes * 60;
    } catch {
      // ScreenTime not linked or authorization not granted — degrade gracefully
      return false;
    }
  },

  /**
   * Combined check: the goal is met if the in-app timer has reached the goal
   * OR if screen time in configured reading apps meets the threshold.
   *
   * If `readingApps` is empty or undefined, only the timer check applies.
   */
  async isGoalMet(
    goalMinutes: number,
    readingApps?: string[],
  ): Promise<boolean> {
    if (ReadingHabitService.isComplete(goalMinutes)) return true;
    if (!readingApps || readingApps.length === 0) return false;
    return ReadingHabitService.checkReadingAppUsage(readingApps, goalMinutes);
  },

  // ── Persistence ─────────────────────────────────────────────────────────

  /**
   * Persists the current timer state to AsyncStorage so it survives app
   * backgrounding and brief foreground kills.
   */
  async saveTimerState(): Promise<void> {
    try {
      if (_timerState) {
        await AsyncStorage.setItem(
          TIMER_STATE_KEY,
          JSON.stringify(_timerState),
        );
      } else {
        await AsyncStorage.removeItem(TIMER_STATE_KEY);
      }
    } catch (error) {
      console.error("[readingHabit] saveTimerState error:", error);
    }
  },

  /**
   * Loads a previously saved timer state from AsyncStorage. Automatically
   * corrects for time elapsed while the app was in the background.
   */
  async loadTimerState(): Promise<TimerState | null> {
    try {
      const raw = await AsyncStorage.getItem(TIMER_STATE_KEY);
      if (!raw) return null;

      const saved = JSON.parse(raw) as TimerState;
      _timerState = saved;
      return { ...saved };
    } catch (error) {
      console.error("[readingHabit] loadTimerState error:", error);
      return null;
    }
  },

  /**
   * Clears the persisted timer state from AsyncStorage and in-memory.
   * Call after the habit is completed or explicitly reset.
   */
  async clearTimerState(): Promise<void> {
    _timerState = null;
    try {
      await AsyncStorage.removeItem(TIMER_STATE_KEY);
    } catch (error) {
      console.error("[readingHabit] clearTimerState error:", error);
    }
  },
};
