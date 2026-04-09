/**
 * Notification Service
 *
 * Schedules and manages local push notifications for daily habit reminders.
 * Notifications are only scheduled when the user has granted permission.
 *
 * Reminder strategy:
 *  - One daily reminder fires at a fixed time (default 09:00) if the user
 *    still has uncompleted habits for the day.
 *  - A separate "midnight reset" notification is NOT needed — the app handles
 *    reset logic internally via AppState / the midnight timer.
 */

import { useHabitStore } from "@/store/habitStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Identifier used to cancel/replace the daily reminder. */
const DAILY_REMINDER_ID = "serenity_daily_reminder";

/** AsyncStorage key that persists the scheduled notification identifier. */
const STORED_NOTIFICATION_KEY = "@daily_reminder_notification_id";

// ─── Service ──────────────────────────────────────────────────────────────────

export const NotificationService = {
  /**
   * Schedule (or reschedule) the daily habit reminder.
   * Cancels any previously scheduled reminder first to avoid duplicates.
   *
   * @param hour   Hour in 24-hour format (default: 9 = 09:00)
   * @param minute Minute (default: 0)
   */
  async scheduleDailyReminder(hour = 9, minute = 0): Promise<void> {
    if (Platform.OS !== "ios") return;

    // Check permission
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    // Build notification content based on current habit state
    const store = useHabitStore.getState();
    const uncompleted = store.getUncompletedHabits();
    const total = store.getActiveHabits().length;

    // Nothing to remind about if there are no active habits
    if (total === 0) return;

    const habitWord = uncompleted.length === 1 ? "habit" : "habits";
    const title =
      uncompleted.length === total
        ? "Start your habits"
        : `${uncompleted.length} ${habitWord} remaining`;
    const body =
      uncompleted.length === total
        ? "Your apps are blocked until you complete today's habits."
        : `Complete your ${habitWord} to fully unlock your apps today.`;

    // Cancel any existing reminder before scheduling a fresh one
    await NotificationService.cancelDailyReminder();

    // Schedule repeating daily trigger at the given hour/minute
    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title,
        body,
        sound: true,
        // Deep-link into the app home tab on tap
        data: { url: "serenity://tabs/index" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });

    await AsyncStorage.setItem(STORED_NOTIFICATION_KEY, notificationId);
  },

  /**
   * Cancel the currently scheduled daily reminder (if any).
   */
  async cancelDailyReminder(): Promise<void> {
    if (Platform.OS !== "ios") return;
    try {
      // Cancel by well-known identifier (works if the OS still has it)
      await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    } catch {
      // Ignore — notification may not exist yet
    }
    // Also try cancelling via stored ID in case identifier changed
    try {
      const storedId = await AsyncStorage.getItem(STORED_NOTIFICATION_KEY);
      if (storedId && storedId !== DAILY_REMINDER_ID) {
        await Notifications.cancelScheduledNotificationAsync(storedId);
      }
    } catch {
      // Non-fatal
    }
  },

  /**
   * Re-evaluate the notification schedule based on the current habit state.
   * - If all habits are completed: cancel the reminder for today.
   * - Otherwise: ensure a reminder is scheduled.
   *
   * Call this after habit completions, daily reset, and on app foreground.
   */
  async refreshSchedule(): Promise<void> {
    if (Platform.OS !== "ios") return;

    const store = useHabitStore.getState();
    const allDone = store.areAllActiveHabitsCompleted();

    if (allDone) {
      // No need to remind — user already finished everything
      await NotificationService.cancelDailyReminder();
    } else {
      // Reschedule so the content reflects the current uncompleted count
      await NotificationService.scheduleDailyReminder();
    }
  },
};
