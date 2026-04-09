import {
    CompletionMethod,
    DailyHabitCompletion,
    GlobalStreak,
    Habit,
    HabitConfig,
    HabitStatus,
    HabitStreak,
    HabitType,
} from "@/types/habits";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "@habits";

// ---------------------------------------------------------------------------
// State & Action types
// ---------------------------------------------------------------------------

interface HabitStoreState {
  habits: Habit[];
  globalStreak: GlobalStreak;
  blockedAppsSelection: string | null; // FamilyActivitySelection token
  blockedAppsCount: { apps: number; categories: number };
  isInitialized: boolean;
}

interface HabitStoreActions {
  // Lifecycle
  loadFromStorage(): Promise<void>;
  saveToStorage(): void;

  // CRUD
  addHabit(type: HabitType, config: HabitConfig, priority: number): void;
  removeHabit(id: string): void;
  updateHabitConfig(id: string, config: Partial<HabitConfig>): void;
  reorderHabits(orderedIds: string[]): void;

  // Blocked apps
  setBlockedApps(
    selection: string,
    counts: { apps: number; categories: number },
  ): void;

  // Daily completion
  completeHabit(id: string, method: CompletionMethod): void;
  resetDailyCompletions(): void;

  // Streak
  updateStreaks(date: string): void;

  // Stacking
  checkAndActivateNextHabit(): {
    graduated: Habit | null;
    activated: Habit | null;
  } | null;

  // Queries
  getActiveHabits(): Habit[];
  getPendingHabits(): Habit[];
  getStackedHabits(): Habit[];
  areAllActiveHabitsCompleted(): boolean;
  getUncompletedHabits(): Habit[];
  getHabitById(id: string): Habit | undefined;
}

type HabitStore = HabitStoreState & HabitStoreActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function makeDefaultStreak(): HabitStreak {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastUpdated: today(),
    history: [],
  };
}

function makeDefaultGlobalStreak(): GlobalStreak {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastUpdated: today(),
    history: [],
  };
}

function makeDailyCompletion(): DailyHabitCompletion {
  return {
    date: today(),
    completed: false,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useHabitStore = create<HabitStore>((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  habits: [],
  globalStreak: makeDefaultGlobalStreak(),
  blockedAppsSelection: null,
  blockedAppsCount: { apps: 0, categories: 0 },
  isInitialized: false,

  // ── Persistence ─────────────────────────────────────────────────────────

  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<HabitStoreState>;
        set({
          habits: parsed.habits ?? [],
          globalStreak: parsed.globalStreak ?? makeDefaultGlobalStreak(),
          blockedAppsSelection: parsed.blockedAppsSelection ?? null,
          blockedAppsCount: parsed.blockedAppsCount ?? {
            apps: 0,
            categories: 0,
          },
        });
      }
    } catch (error) {
      console.error("[habitStore] loadFromStorage error:", error);
    } finally {
      set({ isInitialized: true });
    }
  },

  saveToStorage: () => {
    const { habits, globalStreak, blockedAppsSelection, blockedAppsCount } =
      get();
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        habits,
        globalStreak,
        blockedAppsSelection,
        blockedAppsCount,
      }),
    ).catch((error) => {
      console.error("[habitStore] saveToStorage error:", error);
    });
  },

  // ── CRUD ────────────────────────────────────────────────────────────────

  addHabit: (type: HabitType, config: HabitConfig, priority: number) => {
    const { habits } = get();

    // First habit is immediately active; subsequent ones are pending
    const hasActiveHabit = habits.some((h) => h.status === "active");
    const status: HabitStatus = hasActiveHabit ? "pending" : "active";

    const now = nowISO();
    const newHabit: Habit = {
      id: generateId(),
      type,
      status,
      priority,
      config,
      streak: makeDefaultStreak(),
      dailyCompletion: makeDailyCompletion(),
      activatedAt: status === "active" ? now : undefined,
      createdAt: now,
    };

    set({ habits: [...habits, newHabit] });
    get().saveToStorage();
  },

  removeHabit: (id: string) => {
    const { habits } = get();
    set({ habits: habits.filter((h) => h.id !== id) });
    get().saveToStorage();
  },

  updateHabitConfig: (id: string, config: Partial<HabitConfig>) => {
    const { habits } = get();
    set({
      habits: habits.map((h) =>
        h.id === id
          ? { ...h, config: { ...h.config, ...config } as HabitConfig }
          : h,
      ),
    });
    get().saveToStorage();
  },

  reorderHabits: (orderedIds: string[]) => {
    const { habits } = get();
    const reordered = orderedIds
      .map((id, index) => {
        const habit = habits.find((h) => h.id === id);
        return habit ? { ...habit, priority: index } : null;
      })
      .filter((h): h is Habit => h !== null);

    // Preserve any habits not in orderedIds at the end
    const included = new Set(orderedIds);
    const rest = habits
      .filter((h) => !included.has(h.id))
      .map((h, i) => ({ ...h, priority: reordered.length + i }));

    set({ habits: [...reordered, ...rest] });
    get().saveToStorage();
  },

  // ── Blocked apps ────────────────────────────────────────────────────────

  setBlockedApps: (
    selection: string,
    counts: { apps: number; categories: number },
  ) => {
    set({ blockedAppsSelection: selection, blockedAppsCount: counts });
    get().saveToStorage();
  },

  // ── Daily completion ─────────────────────────────────────────────────────

  completeHabit: (id: string, method: CompletionMethod) => {
    const { habits } = get();
    const now = nowISO();
    const dateStr = now.split("T")[0];

    set({
      habits: habits.map((h) =>
        h.id === id
          ? {
              ...h,
              dailyCompletion: {
                date: dateStr,
                completed: true,
                completedAt: now,
                method,
              },
            }
          : h,
      ),
    });
    get().saveToStorage();
  },

  resetDailyCompletions: () => {
    const { habits } = get();
    const dateStr = today();
    set({
      habits: habits.map((h) => ({
        ...h,
        dailyCompletion: { date: dateStr, completed: false },
      })),
    });
    get().saveToStorage();
  },

  // ── Streaks ──────────────────────────────────────────────────────────────

  updateStreaks: (date: string) => {
    const { habits, globalStreak } = get();

    const updatedHabits = habits.map((h) => {
      if (h.status !== "active") return h;

      const { streak, dailyCompletion } = h;
      const completedToday =
        dailyCompletion.completed && dailyCompletion.date === date;

      if (streak.lastUpdated === date) return h; // already updated today

      let currentStreak = streak.currentStreak;
      const history = [...streak.history];

      if (completedToday) {
        currentStreak += 1;
        history.push(date);
      } else {
        currentStreak = 0;
      }

      const longestStreak = Math.max(streak.longestStreak, currentStreak);

      return {
        ...h,
        streak: {
          currentStreak,
          longestStreak,
          lastUpdated: date,
          history: history.slice(-365),
        },
      };
    });

    // Global streak: all active habits completed today
    const activeHabits = updatedHabits.filter((h) => h.status === "active");
    const allCompleted =
      activeHabits.length > 0 &&
      activeHabits.every(
        (h) => h.dailyCompletion.completed && h.dailyCompletion.date === date,
      );

    let newGlobal = { ...globalStreak };
    if (newGlobal.lastUpdated !== date) {
      const globalHistory = [...newGlobal.history];
      if (allCompleted) {
        newGlobal.currentStreak += 1;
        globalHistory.push(date);
      } else {
        newGlobal.currentStreak = 0;
      }
      newGlobal.longestStreak = Math.max(
        newGlobal.longestStreak,
        newGlobal.currentStreak,
      );
      newGlobal.lastUpdated = date;
      newGlobal.history = globalHistory.slice(-365);
    }

    set({ habits: updatedHabits, globalStreak: newGlobal });
    get().saveToStorage();
  },

  // ── Stacking ──────────────────────────────────────────────────────────────

  checkAndActivateNextHabit: () => {
    const { habits } = get();
    const now = nowISO();

    // Find first active habit that has hit the 60-day streak threshold
    const graduating = habits.find(
      (h) => h.status === "active" && h.streak.currentStreak >= 60,
    );

    if (!graduating) return null;

    // Find first pending habit sorted by priority
    const nextPending = [...habits]
      .filter((h) => h.status === "pending")
      .sort((a, b) => a.priority - b.priority)[0];

    const updatedHabits = habits.map((h) => {
      if (h.id === graduating.id) {
        return { ...h, status: "stacked" as HabitStatus, stackedAt: now };
      }
      if (nextPending && h.id === nextPending.id) {
        return { ...h, status: "active" as HabitStatus, activatedAt: now };
      }
      return h;
    });

    set({ habits: updatedHabits });
    get().saveToStorage();

    return {
      graduated: {
        ...graduating,
        status: "stacked" as HabitStatus,
        stackedAt: now,
      },
      activated: nextPending
        ? { ...nextPending, status: "active" as HabitStatus, activatedAt: now }
        : null,
    };
  },

  // ── Queries ────────────────────────────────────────────────────────────

  getActiveHabits: () => get().habits.filter((h) => h.status === "active"),

  getPendingHabits: () =>
    [...get().habits.filter((h) => h.status === "pending")].sort(
      (a, b) => a.priority - b.priority,
    ),

  getStackedHabits: () => get().habits.filter((h) => h.status === "stacked"),

  areAllActiveHabitsCompleted: () => {
    const active = get().habits.filter((h) => h.status === "active");
    if (active.length === 0) return false;
    return active.every((h) => h.dailyCompletion.completed);
  },

  getUncompletedHabits: () =>
    get().habits.filter(
      (h) => h.status === "active" && !h.dailyCompletion.completed,
    ),

  getHabitById: (id: string) => get().habits.find((h) => h.id === id),
}));
