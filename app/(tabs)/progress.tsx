import { spacing } from "@/constants";
import { FONTS } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useAppStore } from "@/store/appStore";
import { Award, Clock, Flame, Target } from "lucide-react-native";
import { useEffect } from "react";
import { Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Mock data ────────────────────────────────────────────────────────────────

const DAILY_DATA = [
  { day: "Mon", minutes: 112 },
  { day: "Tue", minutes: 95 },
  { day: "Wed", minutes: 148 },
  { day: "Thu", minutes: 82 },
  { day: "Fri", minutes: 75 },
  { day: "Sat", minutes: 134 },
  { day: "Sun", minutes: 64 },
];

const APP_USAGE = [
  { name: "Instagram", iconUrl: "https://www.google.com/s2/favicons?domain=instagram.com&sz=128", minutes: 22 },
  { name: "YouTube",   iconUrl: "https://www.google.com/s2/favicons?domain=youtube.com&sz=128",   minutes: 18 },
  { name: "X (Twitter)", iconUrl: "https://www.google.com/s2/favicons?domain=x.com&sz=128",       minutes: 12 },
  { name: "Safari",    iconUrl: "https://www.google.com/s2/favicons?domain=apple.com&sz=128",     minutes: 9  },
  { name: "TikTok",    iconUrl: "https://www.google.com/s2/favicons?domain=tiktok.com&sz=128",    minutes: 7  },
  { name: "Messages",  iconUrl: "https://www.google.com/s2/favicons?domain=messages.google.com&sz=128", minutes: 5 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const theme = useThemedColors();
  const { streakData, userPreferences, loadFromStorage } = useAppStore();
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    loadFromStorage();
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const currentStreak = streakData?.currentStreak || 0;
  const longestStreak = streakData?.longestStreak || 0;
  const dailyLimit = userPreferences?.dailyLimit || 120;

  // Today is Sunday (last entry) for demonstration
  const todayMinutes = DAILY_DATA[DAILY_DATA.length - 1].minutes;

  const weeklyAvg = Math.round(DAILY_DATA.reduce((s, d) => s + d.minutes, 0) / DAILY_DATA.length);
  const maxMinutes = Math.max(...DAILY_DATA.map((d) => d.minutes));
  const maxAppMinutes = Math.max(...APP_USAGE.map((a) => a.minutes));

  const goalPct = Math.min(todayMinutes / dailyLimit, 1);
  const barWidth = (screenWidth - spacing.lg * 2 - spacing.md * 2 - (DAILY_DATA.length - 1) * 6) / DAILY_DATA.length;

  // Today's date label
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      <SafeAreaView edges={["top"]}>
        <StatusBar barStyle={theme.statusBar} />

        {/* ── Header ── */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Progress</Text>
          <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>{dateLabel}</Text>
        </View>

        {/* ── Today at a Glance ── */}
        <View style={[styles.glanceCard, { backgroundColor: theme.primary, marginHorizontal: spacing.lg }]}>
          <View style={styles.glanceTop}>
            <View>
              <Text style={styles.glanceLabel}>Today's Screen Time</Text>
              <Text style={styles.glanceTime}>{formatTime(todayMinutes)}</Text>
            </View>
          </View>

          {/* Goal bar */}
          <View style={styles.goalBarWrap}>
            <View style={[styles.goalBarTrack, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
              <View style={[styles.goalBarFill, { width: `${goalPct * 100}%`, backgroundColor: "#fff" }]} />
            </View>
            <View style={styles.goalBarLabels}>
              <View style={styles.goalBarLabelLeft}>
                <Target size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.goalBarText}>Daily goal: {formatTime(dailyLimit)}</Text>
              </View>
              <Text style={styles.goalBarText}>{Math.round(goalPct * 100)}%</Text>
            </View>
          </View>
        </View>

        {/* ── Daily Comparison ── */}
        <View style={[styles.section, { marginHorizontal: spacing.lg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Daily Comparison</Text>
            <View style={styles.avgPill}>
              <Clock size={12} color={theme.textTertiary} />
              <Text style={[styles.avgText, { color: theme.textTertiary }]}>avg {formatTime(weeklyAvg)}</Text>
            </View>
          </View>

          <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Avg line hint */}
            <View style={[styles.avgLine, {
              bottom: 38 + (weeklyAvg / maxMinutes) * 130,
              borderColor: theme.border,
            }]} />

            <View style={styles.barsRow}>
              {DAILY_DATA.map((item, index) => {
                const isToday = index === DAILY_DATA.length - 1;
                const barH = Math.max(8, (item.minutes / maxMinutes) * 130);
                const barColor = isToday ? theme.primary : theme.surfaceSecondary;
                const textColor = isToday ? theme.primary : theme.textTertiary;
                return (
                  <View key={item.day} style={[styles.barColumn, { width: barWidth }]}>
                    <Text style={[styles.barValue, { color: textColor, fontFamily: FONTS.interMedium }]}>
                      {isToday ? formatTime(item.minutes) : ""}
                    </Text>
                    <View style={[styles.bar, { height: barH, backgroundColor: barColor, borderRadius: barWidth / 4 }]} />
                    <Text style={[styles.barDay, { color: textColor, fontFamily: FONTS.interMedium }]}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Usage per App ── */}
        <View style={[styles.section, { marginHorizontal: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Usage by App</Text>
          <View style={[styles.appCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {APP_USAGE.map((app, index) => {
              const pct = app.minutes / maxAppMinutes;
              return (
                <View key={app.name} style={[styles.appRow, index < APP_USAGE.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
                  <Image source={{ uri: app.iconUrl }} style={styles.appIcon} />
                  <View style={styles.appInfo}>
                    <View style={styles.appNameRow}>
                      <Text style={[styles.appName, { color: theme.textPrimary, fontFamily: FONTS.interSemiBold }]}>{app.name}</Text>
                      <Text style={[styles.appTime, { color: theme.textSecondary, fontFamily: FONTS.interMedium }]}>{formatTime(app.minutes)}</Text>
                    </View>
                    <View style={[styles.appBarTrack, { backgroundColor: theme.surfaceSecondary }]}>
                      <View style={[styles.appBarFill, { width: `${pct * 100}%`, backgroundColor: theme.primary }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Streak ── */}
        <View style={[styles.streakRow, { marginHorizontal: spacing.lg }]}>
          <View style={[styles.streakCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.streakIconWrap, { backgroundColor: "#FFF3E8" }]}>
              <Flame size={22} color={theme.primary} />
            </View>
            <Text style={[styles.streakValue, { color: theme.textPrimary, fontFamily: FONTS.loraMedium }]}>{currentStreak}</Text>
            <Text style={[styles.streakLabel, { color: theme.textSecondary, fontFamily: FONTS.interRegular }]}>Current Streak</Text>
          </View>
          <View style={[styles.streakCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.streakIconWrap, { backgroundColor: "#F0FFF4" }]}>
              <Award size={22} color="#48BB78" />
            </View>
            <Text style={[styles.streakValue, { color: theme.textPrimary, fontFamily: FONTS.loraMedium }]}>{longestStreak}</Text>
            <Text style={[styles.streakLabel, { color: theme.textSecondary, fontFamily: FONTS.interRegular }]}>Best Streak</Text>
          </View>
          <View style={[styles.streakCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.streakIconWrap, { backgroundColor: "#EBF8FF" }]}>
              <Target size={22} color="#4299E1" />
            </View>
            <Text style={[styles.streakValue, { color: theme.textPrimary, fontFamily: FONTS.loraMedium }]}>{formatTime(weeklyAvg)}</Text>
            <Text style={[styles.streakLabel, { color: theme.textSecondary, fontFamily: FONTS.interRegular }]}>Weekly Avg</Text>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </SafeAreaView>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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

  // Glance card
  glanceCard: {
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  glanceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  glanceLabel: {
    fontSize: 13,
    fontFamily: FONTS.interMedium,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 4,
  },
  glanceTime: {
    fontSize: 40,
    fontFamily: FONTS.loraBold,
    color: "#fff",
    letterSpacing: -1,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trendPct: {
    fontSize: 12,
    fontFamily: FONTS.interSemiBold,
  },
  goalBarWrap: { gap: 6 },
  goalBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  goalBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  goalBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalBarLabelLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  goalBarText: {
    fontSize: 11,
    fontFamily: FONTS.interMedium,
    color: "rgba(255,255,255,0.75)",
  },

  // Sections
  section: { marginBottom: spacing.lg, gap: spacing.sm },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.loraMedium,
    letterSpacing: -0.3,
  },
  avgPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "transparent",
  },
  avgText: { fontSize: 12, fontFamily: FONTS.interRegular },

  // Bar chart
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    paddingBottom: spacing.sm,
    position: "relative",
    overflow: "hidden",
  },
  avgLine: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 175,
  },
  barColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  barValue: { fontSize: 10, height: 14, textAlign: "center" },
  bar: { width: "100%" },
  barDay: { fontSize: 11 },

  // App usage
  appCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  appIcon: { width: 32, height: 32, borderRadius: 8 },
  appInfo: { flex: 1, gap: 6 },
  appNameRow: { flexDirection: "row", justifyContent: "space-between" },
  appName: { fontSize: 14 },
  appTime: { fontSize: 13 },
  appBarTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  appBarFill: { height: "100%", borderRadius: 2 },

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
