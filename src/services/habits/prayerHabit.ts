/**
 * Prayer Habit Service
 *
 * Handles prayer time calculation (Islamic via adhan, plus other religions),
 * per-prayer oath confirmation tracking, blocking logic, and daily state
 * persistence.
 *
 * Islamic prayers are calculated from GPS coordinates using the adhan library.
 * All other religions use static user-configured times.
 */

import type {
    PrayerConfig,
    PrayerDayStatus,
    Religion
} from "@/types/habits";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";

// ─── Constants ─────────────────────────────────────────────────────────────

const DAY_STATUS_KEY_PREFIX = "@prayerHabit_dayStatus_";

// ─── Helpers ───────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function minutesFromMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Map a user-supplied calculationMethod string to the corresponding adhan
 * CalculationParameters factory. Falls back to MuslimWorldLeague.
 */
function getCalculationParams(method?: string) {
  switch (method) {
    case "Egyptian":
      return CalculationMethod.Egyptian();
    case "Karachi":
      return CalculationMethod.Karachi();
    case "UmmAlQura":
      return CalculationMethod.UmmAlQura();
    case "Dubai":
      return CalculationMethod.Dubai();
    case "MoonsightingCommittee":
      return CalculationMethod.MoonsightingCommittee();
    case "NorthAmerica":
      return CalculationMethod.NorthAmerica();
    case "Kuwait":
      return CalculationMethod.Kuwait();
    case "Qatar":
      return CalculationMethod.Qatar();
    case "Singapore":
      return CalculationMethod.Singapore();
    case "Tehran":
      return CalculationMethod.Tehran();
    case "Turkey":
      return CalculationMethod.Turkey();
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
}

/**
 * Default prayer times per religion (if no customTimes are provided).
 * Times are HH:mm strings.
 */
function getDefaultPrayerNames(
  religion: Religion,
): { name: string; time: string }[] {
  switch (religion) {
    case "islam":
      // Placeholder — will be replaced by live adhan calculation
      return [
        { name: "Fajr", time: "05:00" },
        { name: "Dhuhr", time: "13:00" },
        { name: "Asr", time: "15:30" },
        { name: "Maghrib", time: "18:30" },
        { name: "Isha", time: "20:00" },
      ];
    case "judaism":
      return [
        { name: "Shacharit", time: "07:00" },
        { name: "Mincha", time: "14:00" },
        { name: "Maariv", time: "20:00" },
      ];
    case "christianity":
      return [{ name: "Daily Prayer", time: "08:00" }];
    case "buddhism":
    case "hinduism":
    case "other":
      return [{ name: "Prayer 1", time: "08:00" }];
  }
}

// ─── Service ───────────────────────────────────────────────────────────────

export const PrayerHabitService = {
  /**
   * Build today's PrayerDayStatus from the habit config.
   * For Islam, coordinates are required for accurate times.
   * For other religions, static times from config.customTimes are used,
   * falling back to religion defaults.
   */
  getPrayerTimesForToday(
    config: PrayerConfig,
    coordinates?: { lat: number; lng: number },
  ): PrayerDayStatus {
    const date = todayISO();

    if (config.religion === "islam" && coordinates) {
      const prayers = PrayerHabitService.getIslamicPrayerTimes(
        coordinates.lat,
        coordinates.lng,
        config.calculationMethod,
      );
      return {
        date,
        prayers: prayers.map(({ name, time }) => ({
          name,
          time,
          completed: false,
        })),
      };
    }

    const prayers = PrayerHabitService.getStaticPrayerTimes(config);
    return {
      date,
      prayers: prayers.map(({ name, time }) => ({
        name,
        time,
        completed: false,
      })),
    };
  },

  /**
   * Calculate Islamic prayer times using the adhan library.
   * Returns an array of { name, time } objects.
   */
  getIslamicPrayerTimes(
    lat: number,
    lng: number,
    method?: string,
  ): { name: string; time: string }[] {
    const coordinates = new Coordinates(lat, lng);
    const params = getCalculationParams(method);
    const prayerTimes = new PrayerTimes(coordinates, new Date(), params);

    return [
      { name: "Fajr", time: formatTime(prayerTimes.fajr) },
      { name: "Dhuhr", time: formatTime(prayerTimes.dhuhr) },
      { name: "Asr", time: formatTime(prayerTimes.asr) },
      { name: "Maghrib", time: formatTime(prayerTimes.maghrib) },
      { name: "Isha", time: formatTime(prayerTimes.isha) },
    ];
  },

  /**
   * Build a static prayer schedule from the config's customTimes array or
   * religion-specific defaults.
   */
  getStaticPrayerTimes(config: PrayerConfig): { name: string; time: string }[] {
    if (config.customTimes && config.customTimes.length > 0) {
      return config.customTimes.map((time, i) => ({
        name: `Prayer ${i + 1}`,
        time,
      }));
    }

    const defaults = getDefaultPrayerNames(config.religion);
    // Respect prayerCount from config — slice defaults or pad if needed
    const count = config.prayerCount ?? defaults.length;
    const result: { name: string; time: string }[] = [];
    for (let i = 0; i < count; i++) {
      result.push(defaults[i] ?? { name: `Prayer ${i + 1}`, time: "08:00" });
    }
    return result;
  },

  /**
   * Mark a specific prayer as confirmed.
   * Returns an updated PrayerDayStatus (immutable update).
   */
  confirmPrayer(
    prayerName: string,
    dayStatus: PrayerDayStatus,
  ): PrayerDayStatus {
    return {
      ...dayStatus,
      prayers: dayStatus.prayers.map((p) =>
        p.name === prayerName
          ? { ...p, completed: true, completedAt: new Date().toISOString() }
          : p,
      ),
    };
  },

  /**
   * Returns true when every prayer in the day's status is confirmed.
   */
  areAllPrayersCompleted(dayStatus: PrayerDayStatus): boolean {
    return dayStatus.prayers.every((p) => p.completed);
  },

  /**
   * Determine whether the user should currently be blocked for prayer.
   *
   * Blocking logic:
   * - Find the prayer whose scheduled time has passed and is not yet confirmed.
   * - If such a prayer exists, apps are blocked.
   * - Once confirmed (or all are done), apps are unblocked.
   */
  isCurrentlyBlockedForPrayer(dayStatus: PrayerDayStatus): {
    blocked: boolean;
    currentPrayer?: string;
  } {
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    // Find first prayer that is due (time has passed) and not completed
    const duePrayer = dayStatus.prayers.find((p) => {
      if (p.completed) return false;
      const prayerMinutes = minutesFromMidnight(p.time);
      return nowMinutes >= prayerMinutes;
    });

    if (duePrayer) {
      return { blocked: true, currentPrayer: duePrayer.name };
    }
    return { blocked: false };
  },

  // ── Persistence ──────────────────────────────────────────────────────

  async saveDayStatus(status: PrayerDayStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${DAY_STATUS_KEY_PREFIX}${status.date}`,
        JSON.stringify(status),
      );
    } catch {
      // Silently fail — offline-first, state will be recalculated on next launch
    }
  },

  async loadDayStatus(date: string): Promise<PrayerDayStatus | null> {
    try {
      const raw = await AsyncStorage.getItem(`${DAY_STATUS_KEY_PREFIX}${date}`);
      if (!raw) return null;
      return JSON.parse(raw) as PrayerDayStatus;
    } catch {
      return null;
    }
  },
};
