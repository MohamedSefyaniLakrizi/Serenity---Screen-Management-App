/**
 * Prayer Status Screen
 *
 * Shows today's prayer schedule with per-prayer oath confirmation.
 * Supports all religions (Islamic times auto-calculated from GPS,
 * all others from user config). When all prayers are confirmed, the
 * habit is marked complete and the screen auto-navigates back.
 *
 * Navigation: push from home tab when prayer habit card is pressed.
 * Route: /prayer-status
 */

import PrayerTimesList from "@/components/PrayerTimesList";
import { habitAccent } from "@/constants/colors";
import { borderRadius, spacing } from "@/constants/spacing";
import { FONTS, typeScale } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { PrayerHabitService } from "@/services/habits/prayerHabit";
import { useHabitStore } from "@/store/habitStore";
import type { PrayerConfig, PrayerDayStatus } from "@/types/habits";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { CheckCircle, Hand } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRAYER_COLOR = habitAccent.prayer; // #D4A017

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrayerStatusScreen() {
  const theme = useThemedColors();
  const router = useRouter();
  const { getActiveHabits, completeHabit } = useHabitStore();

  // Resolve the active prayer habit
  const prayerHabit = getActiveHabits().find((h) => h.type === "prayer");
  const prayerConfig =
    prayerHabit?.config.type === "prayer"
      ? (prayerHabit.config as PrayerConfig)
      : null;

  const todayISO = new Date().toISOString().split("T")[0];

  // ── Prayer day state ─────────────────────────────────────────────────
  const [dayStatus, setDayStatus] = useState<PrayerDayStatus | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const didLoadRef = useRef(false);

  // ── Completion animation ──────────────────────────────────────────────
  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0.5);

  const checkAnimStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  // ── Format today's date for display ──────────────────────────────────
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ── Load or generate today's prayer schedule ──────────────────────────
  useEffect(() => {
    if (didLoadRef.current || !prayerConfig) return;
    didLoadRef.current = true;

    (async () => {
      // Try to load persisted state first
      const saved = await PrayerHabitService.loadDayStatus(todayISO);
      if (saved) {
        setDayStatus(saved);
        if (PrayerHabitService.areAllPrayersCompleted(saved)) {
          handleCompletion(false, false);
        }
        return;
      }

      // Build fresh schedule — request location for Islamic prayers
      let coordinates: { lat: number; lng: number } | undefined;
      if (prayerConfig.religion === "islam") {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            coordinates = {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
            };
          }
        } catch {
          // Fall back to default times if location unavailable
        }
      }

      const fresh = PrayerHabitService.getPrayerTimesForToday(
        prayerConfig,
        coordinates,
      );
      setDayStatus(fresh);
      await PrayerHabitService.saveDayStatus(fresh);
    })();
  }, [prayerConfig, todayISO]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────

  const handlePrayerConfirmed = useCallback(
    async (prayerName: string) => {
      if (!dayStatus) return;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const updated = PrayerHabitService.confirmPrayer(prayerName, dayStatus);
      setDayStatus(updated);
      await PrayerHabitService.saveDayStatus(updated);

      // Check if all prayers are now done
      if (PrayerHabitService.areAllPrayersCompleted(updated)) {
        handleCompletion(true, true);
      }
    },
    [dayStatus], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleCompletion = useCallback(
    (markHabit: boolean, persist: boolean) => {
      setIsCompleted(true);

      checkOpacity.value = withTiming(1, { duration: 300 });
      checkScale.value = withTiming(1, { duration: 400 });

      if (markHabit && prayerHabit) {
        completeHabit(prayerHabit.id, "oath");
      }

      setTimeout(() => {
        router.back();
      }, 1800);
    },
    [prayerHabit, completeHabit, router, checkOpacity, checkScale],
  );

  // ── Derived values ────────────────────────────────────────────────────

  const completedCount =
    dayStatus?.prayers.filter((p) => p.completed).length ?? 0;
  const totalCount = dayStatus?.prayers.length ?? 0;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg.primary }]}
    >
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Hand size={20} strokeWidth={1.5} color={PRAYER_COLOR} />
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            {"Today's Prayers"}
          </Text>
          <Text style={[styles.headerDate, { color: theme.text.secondary }]}>
            {formattedDate}
          </Text>
        </View>

        {/* ── Progress summary ─────────────────────────────────────── */}
        {!isCompleted && dayStatus && (
          <View
            style={[
              styles.progressCard,
              {
                backgroundColor: theme.bg.elevated,
                borderColor: theme.border.subtle,
              },
            ]}
          >
            <Text
              style={[
                styles.progressCount,
                { color: PRAYER_COLOR, fontFamily: FONTS.mono },
              ]}
            >
              {completedCount}/{totalCount}
            </Text>
            <Text
              style={[styles.progressLabel, { color: theme.text.secondary }]}
            >
              prayers completed
            </Text>
          </View>
        )}

        {/* ── Completion view ─────────────────────────────────────── */}
        {isCompleted ? (
          <Animated.View style={[styles.completionView, checkAnimStyle]}>
            <CheckCircle
              size={80}
              strokeWidth={1.5}
              color={theme.status.success}
            />
            <Text
              style={[styles.completionText, { color: theme.status.success }]}
            >
              All prayers complete!
            </Text>
          </Animated.View>
        ) : (
          /* ── Prayer list ─────────────────────────────────────────── */
          dayStatus && (
            <PrayerTimesList
              prayers={dayStatus.prayers}
              onPrayerConfirmed={handlePrayerConfirmed}
              habitColor={PRAYER_COLOR}
            />
          )
        )}

        {/* ── Loading state ────────────────────────────────────────── */}
        {!dayStatus && !isCompleted && (
          <View style={styles.loadingView}>
            <Text style={[styles.loadingText, { color: theme.text.tertiary }]}>
              Loading prayer times…
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    gap: spacing[6],
  },
  header: {
    alignItems: "center",
    gap: spacing[2],
  },
  headerTitle: {
    fontFamily: FONTS.text,
    fontSize: typeScale.title1.size,
    fontWeight: typeScale.title1.weight,
    lineHeight: typeScale.title1.lineHeight,
    textAlign: "center",
    marginTop: spacing[2],
  },
  headerDate: {
    fontFamily: FONTS.text,
    fontSize: typeScale.subheadline.size,
    fontWeight: typeScale.subheadline.weight,
    lineHeight: typeScale.subheadline.lineHeight,
    textAlign: "center",
  },
  progressCard: {
    alignItems: "center",
    gap: spacing[1],
    paddingVertical: spacing[5],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  progressCount: {
    fontSize: typeScale.statMedium.size,
    fontWeight: typeScale.statMedium.weight,
    lineHeight: typeScale.statMedium.lineHeight,
  },
  progressLabel: {
    fontFamily: FONTS.text,
    fontSize: typeScale.callout.size,
    fontWeight: typeScale.callout.weight,
    lineHeight: typeScale.callout.lineHeight,
  },
  completionView: {
    alignItems: "center",
    gap: spacing[4],
    paddingVertical: spacing[12],
  },
  completionText: {
    fontFamily: FONTS.text,
    fontSize: typeScale.title2.size,
    fontWeight: typeScale.title2.weight,
    lineHeight: typeScale.title2.lineHeight,
  },
  loadingView: {
    alignItems: "center",
    paddingVertical: spacing[12],
  },
  loadingText: {
    fontFamily: FONTS.text,
    fontSize: typeScale.callout.size,
    fontWeight: typeScale.callout.weight,
    lineHeight: typeScale.callout.lineHeight,
  },
});
