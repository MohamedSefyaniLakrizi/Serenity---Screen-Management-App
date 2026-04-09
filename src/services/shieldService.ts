import { Habit, HabitType } from "@/types/habits";
import { Platform } from "react-native";
import { userDefaultsSet } from "react-native-device-activity";

// ─── Shield message definitions per habit type ──────────────────────────────
interface ShieldMessage {
  title: string;
  subtitle: string;
  buttonLabel: string;
  /** Deep link URL. Empty string means dismiss-only (no navigation). */
  deepLink: string;
}

const SHIELD_MESSAGES: Record<HabitType, ShieldMessage> = {
  study: {
    title: "Time to Focus",
    subtitle: "Complete your study session to unlock",
    buttonLabel: "Start Studying",
    deepLink: "serenity://study-timer",
  },
  meditation: {
    title: "Find Your Calm",
    subtitle: "Complete your meditation to unlock",
    buttonLabel: "Start Meditating",
    deepLink: "serenity://meditation-timer",
  },
  reading: {
    title: "Read First",
    subtitle: "Complete your reading goal to unlock",
    buttonLabel: "Start Reading",
    deepLink: "serenity://reading-timer",
  },
  fitness: {
    title: "Move Your Body",
    subtitle: "Complete your fitness goal to unlock",
    buttonLabel: "Check Progress",
    deepLink: "serenity://fitness-status",
  },
  prayer: {
    title: "Time for Prayer",
    subtitle: "Complete your prayer to unlock",
    buttonLabel: "View Prayers",
    deepLink: "serenity://prayer-status",
  },
  sleep: {
    title: "Time to Rest",
    subtitle: "Your sleep schedule is active",
    buttonLabel: "I Understand",
    deepLink: "",
  },
  screentime: {
    title: "Limit Reached",
    subtitle: "You've exceeded your daily screen time",
    buttonLabel: "I Understand",
    deepLink: "",
  },
};

// ─── Design system color tokens (dark theme) ────────────────────────────────
// Format matches getColor() in Shared.swift: { red, green, blue, alpha } 0–255
const SHIELD_COLORS = {
  /** text.primary — #F5F5F5 */
  title: { red: 245, green: 245, blue: 245, alpha: 1.0 },
  /** text.secondary dark — #A1A1AA (zinc-400) */
  subtitle: { red: 161, green: 161, blue: 170, alpha: 1.0 },
  /** pure white for button label */
  white: { red: 255, green: 255, blue: 255, alpha: 1.0 },
  /** bg.primary — #0A0A0A dark OLED black */
  background: { red: 10, green: 10, blue: 10, alpha: 1.0 },
  /** accent.primary — #E07A5F terracotta */
  primaryBtn: { red: 224, green: 122, blue: 95, alpha: 1.0 },
} as const;

// ─── UserDefaults keys ───────────────────────────────────────────────────────
// SERENITY_HABIT_SHIELD_KEY is checked FIRST by ShieldConfigurationExtension so
// habit-specific messages always take priority over old per-group configs.
const SERENITY_HABIT_SHIELD_KEY = "serenity_shield_config";
const SERENITY_HABIT_ACTIONS_KEY = "serenity_habit_actions";
// Fallback keys already read by the react-native-device-activity extensions.
const FALLBACK_SHIELD_KEY = "shieldConfiguration";
const FALLBACK_ACTIONS_KEY = "shieldActions";

export const ShieldService = {
  /** Return the shield message config for a given habit type. */
  getShieldMessage(habitType: HabitType): ShieldMessage {
    return SHIELD_MESSAGES[habitType];
  },

  /**
   * Write shield config and action to UserDefaults so the native
   * ShieldConfigurationExtension and ShieldActionExtension can display
   * the right habit-specific message and deep link.
   *
   * Writes to both the new `serenity_shield_config` key (read first by the
   * updated Swift extension) and the existing `shieldConfiguration` fallback
   * key so older builds remain compatible.
   */
  async updateShieldForHabits(uncompletedHabits: Habit[]): Promise<void> {
    if (Platform.OS !== "ios") return;

    // Use the highest-priority uncompleted habit (list is sorted by priority)
    const primaryHabit = uncompletedHabits[0];
    if (!primaryHabit) return;

    const message = this.getShieldMessage(primaryHabit.type);
    const now = new Date().toISOString();

    const shieldConfig = {
      title: message.title,
      subtitle: message.subtitle,
      titleColor: SHIELD_COLORS.title,
      subtitleColor: SHIELD_COLORS.subtitle,
      primaryButtonLabel: message.buttonLabel,
      primaryButtonLabelColor: SHIELD_COLORS.white,
      primaryButtonBackgroundColor: SHIELD_COLORS.primaryBtn,
      backgroundColor: SHIELD_COLORS.background,
      // backgroundBlurStyle 2 = UIBlurEffect.Style.dark
      backgroundBlurStyle: 2,
      updatedAt: now,
    };

    const isDismissOnly = !message.deepLink;
    const shieldActions = {
      primary: isDismissOnly
        ? { behavior: "close" }
        : { type: "openUrl", url: message.deepLink, behavior: "defer" },
    };

    try {
      // Primary keys (read first by updated Swift extensions)
      userDefaultsSet(SERENITY_HABIT_SHIELD_KEY, shieldConfig);
      userDefaultsSet(SERENITY_HABIT_ACTIONS_KEY, shieldActions);
      // Fallback keys (backward-compatible with react-native-device-activity)
      userDefaultsSet(FALLBACK_SHIELD_KEY, shieldConfig);
      userDefaultsSet(FALLBACK_ACTIONS_KEY, shieldActions);
    } catch (e) {
      console.warn(
        "[ShieldService] Failed to update shield config (non-fatal):",
        e,
      );
    }
  },
};
