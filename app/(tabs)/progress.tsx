import { colors, spacing } from "@/constants";
import { FONTS } from "@/constants/typography";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useAppStore } from "@/store/appStore";
import { Award, ChevronRight, Crown, Flame, Target } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityReportView } from "activity-report";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const theme = useThemedColors();
  const { isPro, showPaywall } = useRevenueCat();
  const { streakData, userPreferences, loadFromStorage } = useAppStore();
  const [period, setPeriod] = useState<"day" | "week">("week");

  useEffect(() => {
    loadFromStorage();
  }, []);

  const currentStreak = streakData?.currentStreak || 0;
  const longestStreak = streakData?.longestStreak || 0;
  const dailyLimit = userPreferences?.dailyLimit || 120;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  // Today's date label
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <StatusBar barStyle={theme.statusBar} />

        {/* ── Header ── */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
            Progress
          </Text>
          <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
            {dateLabel}
          </Text>
        </View>

        {/* Upgrade Banner for free users */}
        {!isPro && (
          <TouchableOpacity
            onPress={() => showPaywall()}
            style={[styles.upgradeBanner, { marginHorizontal: spacing.lg }]}
            activeOpacity={0.8}
          >
            <View style={styles.upgradeBannerContent}>
              <Crown size={20} color="#fff" />
              <View style={styles.upgradeBannerText}>
                <Text style={styles.upgradeBannerTitle}>Upgrade to Serenity Pro</Text>
                <Text style={styles.upgradeBannerSubtitle}>Unlimited groups, flexible blocking & more</Text>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Period toggle ── */}
        <View style={[styles.periodToggle, { marginHorizontal: spacing.lg }]}>
          <View
            style={[
              styles.toggleTrack,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                { backgroundColor: theme.primary },
                period === "day"
                  ? styles.toggleThumbLeft
                  : styles.toggleThumbRight,
              ]}
            />
            <Text
              onPress={() => setPeriod("day")}
              style={[
                styles.toggleLabel,
                {
                  color:
                    period === "day" ? "#fff" : theme.textSecondary,
                  fontFamily: FONTS.interMedium,
                },
              ]}
            >
              Today
            </Text>
            <Text
              onPress={() => setPeriod("week")}
              style={[
                styles.toggleLabel,
                {
                  color:
                    period === "week" ? "#fff" : theme.textSecondary,
                  fontFamily: FONTS.interMedium,
                },
              ]}
            >
              This Week
            </Text>
          </View>
        </View>

        {/* ── Native DeviceActivityReport ── */}
        {Platform.OS === "ios" ? (
          <ActivityReportView period={period} style={styles.reportView} />
        ) : (
          <View style={[styles.reportView, styles.unsupportedContainer]}>
            <Text
              style={[
                styles.unsupportedText,
                { color: theme.textSecondary },
              ]}
            >
              Screen Time reports are only available on iOS.
            </Text>
          </View>
        )}

        {/* ── Streak row ── */}
        <View
          style={[
            styles.streakRow,
            { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
          ]}
        >
          <View
            style={[
              styles.streakCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View
              style={[styles.streakIconWrap, { backgroundColor: "#FFF3E8" }]}
            >
              <Flame size={22} color={theme.primary} />
            </View>
            <Text
              style={[
                styles.streakValue,
                { color: theme.textPrimary, fontFamily: FONTS.loraMedium },
              ]}
            >
              {currentStreak}
            </Text>
            <Text
              style={[
                styles.streakLabel,
                {
                  color: theme.textSecondary,
                  fontFamily: FONTS.interRegular,
                },
              ]}
            >
              Current Streak
            </Text>
          </View>

          <View
            style={[
              styles.streakCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View
              style={[styles.streakIconWrap, { backgroundColor: "#F0FFF4" }]}
            >
              <Award size={22} color="#48BB78" />
            </View>
            <Text
              style={[
                styles.streakValue,
                { color: theme.textPrimary, fontFamily: FONTS.loraMedium },
              ]}
            >
              {longestStreak}
            </Text>
            <Text
              style={[
                styles.streakLabel,
                {
                  color: theme.textSecondary,
                  fontFamily: FONTS.interRegular,
                },
              ]}
            >
              Best Streak
            </Text>
          </View>

          <View
            style={[
              styles.streakCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View
              style={[styles.streakIconWrap, { backgroundColor: "#EBF8FF" }]}
            >
              <Target size={22} color="#4299E1" />
            </View>
            <Text
              style={[
                styles.streakValue,
                { color: theme.textPrimary, fontFamily: FONTS.loraMedium },
              ]}
            >
              {formatTime(dailyLimit)}
            </Text>
            <Text
              style={[
                styles.streakLabel,
                {
                  color: theme.textSecondary,
                  fontFamily: FONTS.interRegular,
                },
              ]}
            >
              Daily Goal
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  screenTitle: {
    fontSize: 28,
    fontFamily: FONTS.loraMedium,
    letterSpacing: -0.5,
  },
  dateLabel: {
    fontSize: 14,
    fontFamily: FONTS.interRegular,
  },

  // Upgrade banner
  upgradeBanner: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  upgradeBannerContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  upgradeBannerText: {
    flex: 1,
  },
  upgradeBannerTitle: {
    fontSize: 15,
    fontFamily: FONTS.interSemiBold,
    color: "#fff",
    marginBottom: 2,
  },
  upgradeBannerSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.interRegular,
    color: "rgba(255,255,255,0.8)",
  },

  // Period toggle
  periodToggle: {
    marginBottom: spacing.md,
  },
  toggleTrack: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    height: 36,
    position: "relative",
  },
  toggleThumb: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50%",
    borderRadius: 10,
  },
  toggleThumbLeft: { left: 0 },
  toggleThumbRight: { left: "50%" },
  toggleLabel: {
    flex: 1,
    textAlign: "center",
    lineHeight: 36,
    fontSize: 13,
    zIndex: 1,
  },

  // Native report view fills remaining vertical space
  reportView: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 16,
    overflow: "hidden",
  },

  // Unsupported platform placeholder
  unsupportedContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  unsupportedText: {
    fontSize: 14,
    fontFamily: FONTS.interRegular,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },

  // Streak row
  streakRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  streakCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    gap: 6,
    alignItems: "center",
  },
  streakIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  streakValue: {
    fontSize: 20,
    marginTop: 2,
  },
  streakLabel: {
    fontSize: 11,
    textAlign: "center",
  },
});
