import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Constants ─────────────────────────────────────────────────────────────
const TIMER_STATE_KEY = "@meditationHabit_timerState";

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

export const MeditationHabitService = {
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
    return MeditationHabitService.getElapsedSeconds() >= goalMinutes * 60;
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
      console.error("[meditationHabit] saveTimerState error:", error);
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
      console.error("[meditationHabit] loadTimerState error:", error);
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
      console.error("[meditationHabit] clearTimerState error:", error);
    }
  },
};
