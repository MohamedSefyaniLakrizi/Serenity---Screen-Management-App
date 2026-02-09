import { Card } from "@/components/ui";
import { borderRadius, colors, spacing, typography } from "@/constants";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useAppStore } from "@/store/appStore";
import { Award, Flame, TrendingDown, TrendingUp } from "lucide-react-native";
import { useEffect } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

export default function ProgressScreen() {
  const themedColors = useThemedColors();
  const { streakData, weeklyData, todayData, userPreferences, loadFromStorage } = useAppStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Mock data for demonstration
  const getMockWeeklyData = () => {
    // In a real app, this would come from weeklyData store
    return {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        data: [95, 110, 85, 120, 75, 130, 65], // minutes per day
      }],
    };
  };

  const calculateWeeklyAverage = () => {
    const data = getMockWeeklyData().datasets[0].data;
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    return Math.round(avg);
  };

  const calculateWeeklyTrend = () => {
    const data = getMockWeeklyData().datasets[0].data;
    const firstHalf = data.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const secondHalf = data.slice(4).reduce((a, b) => a + b, 0) / 3;
    return secondHalf < firstHalf ? "down" : "up";
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const screenWidth = Dimensions.get("window").width;
  const currentStreak = streakData?.currentStreak || 0;
  const longestStreak = streakData?.longestStreak || 0;
  const weeklyAvg = calculateWeeklyAverage();
  const trend = calculateWeeklyTrend();
  const dailyLimit = userPreferences?.dailyLimit || 120;

  // Mock achievements
  const achievements = [
    { id: 1, title: "First Day", icon: "🎯", unlocked: true, description: "Started your journey" },
    { id: 2, title: "Week Warrior", icon: "💪", unlocked: currentStreak >= 7, description: "7 day streak" },
    { id: 3, title: "Under Limit", icon: "✨", unlocked: true, description: "Stayed under daily limit" },
    { id: 4, title: "Month Master", icon: "👑", unlocked: currentStreak >= 30, description: "30 day streak" },
    { id: 5, title: "Fox Evolution", icon: "🦊", unlocked: currentStreak >= 8, description: "Fox evolved to Teen" },
    { id: 6, title: "Majestic Fox", icon: "🔥", unlocked: currentStreak >= 31, description: "Fox evolved to Adult" },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themedColors.textPrimary }]}>Your Progress</Text>
          <Text style={[styles.subtitle, { color: themedColors.textSecondary }]}>Track your achievements</Text>
        </View>

        {/* Streak Cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Flame size={32} color={colors.primary} />
            <Text style={[styles.statValue, { color: themedColors.textPrimary }]}>{currentStreak}</Text>
            <Text style={[styles.statLabel, { color: themedColors.textSecondary }]}>Current Streak</Text>
          </Card>

          <Card style={styles.statCard}>
            <Award size={32} color={colors.success} />
            <Text style={[styles.statValue, { color: themedColors.textPrimary }]}>{longestStreak}</Text>
            <Text style={[styles.statLabel, { color: themedColors.textSecondary }]}>Best Streak</Text>
          </Card>
        </View>

        {/* Weekly Usage Chart */}
        <Card style={styles.chartCard}>
          <Text style={[styles.sectionTitle, { color: themedColors.textPrimary }]}>Weekly Screen Time</Text>
          <LineChart
            data={getMockWeeklyData()}
            width={screenWidth - spacing.lg * 4}
            height={220}
            chartConfig={{
              backgroundColor: themedColors.surface,
              backgroundGradientFrom: themedColors.surface,
              backgroundGradientTo: themedColors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `${colors.primary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
              labelColor: (opacity = 1) => `${themedColors.textPrimary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
              style: {
                borderRadius: borderRadius.medium,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />

          {/* Weekly Stats */}
          <View style={styles.weeklyStats}>
            <View style={styles.weeklyStat}>
              <Text style={[styles.weeklyStatValue, { color: themedColors.textPrimary }]}>{formatTime(weeklyAvg)}</Text>
              <Text style={[styles.weeklyStatLabel, { color: themedColors.textSecondary }]}>Daily Average</Text>
            </View>
            <View style={[styles.weeklyStatDivider, { backgroundColor: themedColors.border }]} />
            <View style={styles.weeklyStat}>
              <View style={styles.trendContainer}>
                {trend === "down" ? (
                  <TrendingDown size={20} color={colors.success} />
                ) : (
                  <TrendingUp size={20} color={colors.warning} />
                )}
                <Text style={[
                  styles.weeklyStatValue,
                  { color: trend === "down" ? colors.success : colors.warning }
                ]}>
                  {trend === "down" ? "Improving" : "Rising"}
                </Text>
              </View>
              <Text style={[styles.weeklyStatLabel, { color: themedColors.textSecondary }]}>Trend</Text>
            </View>
          </View>
        </Card>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: themedColors.textPrimary }]}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                style={achievement.unlocked ? styles.achievementCard : ({ ...styles.achievementCard, ...styles.achievementLocked } as any)}
              >
                <Text style={[
                  styles.achievementIcon,
                  !achievement.unlocked && styles.achievementIconLocked,
                ]}>
                  {achievement.icon}
                </Text>
                <Text style={[
                  styles.achievementTitle,
                  { color: themedColors.textPrimary },
                  !achievement.unlocked && styles.achievementTextLocked,
                ]}>
                  {achievement.title}
                </Text>
                <Text style={[
                  styles.achievementDescription,
                  { color: themedColors.textSecondary },
                  !achievement.unlocked && styles.achievementTextLocked,
                ]}>
                  {achievement.description}
                </Text>
                {achievement.unlocked && (
                  <View style={styles.unlockedBadge}>
                    <Text style={styles.unlockedText}>✓</Text>
                  </View>
                )}
              </Card>
            ))}
          </View>
        </View>

        {/* Daily Goal Progress */}
        <Card style={styles.goalCard}>
          <Text style={[styles.sectionTitle, { color: themedColors.textPrimary }]}>Daily Goal</Text>
          <Text style={[styles.goalDescription, { color: themedColors.textSecondary }]}>
            Stay under {formatTime(dailyLimit)} per day to maintain your streak
          </Text>
          <View style={styles.goalIndicator}>
            <Text style={styles.goalEmoji}>🎯</Text>
            <Text style={[styles.goalText, { color: themedColors.textPrimary }]}>
              {currentStreak > 0 ? 
                `You're doing great! Keep it up!` : 
                `Start today to begin your streak!`
              }
            </Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textGray,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: typography.semibold,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: spacing.lg,
  },
  statValue: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginTop: spacing.sm,
    marginBottom: spacing.xs / 2,
  },
  statLabel: {
    fontSize: typography.small,
    color: colors.textGray,
    textAlign: "center",
  },

  // Chart
  chartCard: {
    marginBottom: spacing.lg,
  },
  chart: {
    marginVertical: spacing.xs,
    borderRadius: borderRadius.medium,
  },
  weeklyStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  weeklyStat: {
    alignItems: "center",
    flex: 1,
  },
  weeklyStatDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  weeklyStatValue: {
    fontSize: typography.h3,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginBottom: spacing.xs / 2,
  },
  weeklyStatLabel: {
    fontSize: typography.small,
    color: colors.textGray,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  // Achievements
  achievementsSection: {
    marginBottom: spacing.lg,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  achievementCard: {
    width: "30%",
    minWidth: 100,
    alignItems: "center",
    padding: spacing.md,
    position: "relative",
  },
  achievementLocked: {
    opacity: 0.5,
    backgroundColor: colors.surface,
  },
  achievementIcon: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  achievementIconLocked: {
    opacity: 0.4,
  },
  achievementTitle: {
    fontSize: typography.small,
    fontWeight: typography.semibold,
    color: colors.textDark,
    textAlign: "center",
    marginBottom: spacing.xxs,
  },
  achievementDescription: {
    fontSize: typography.tiny,
    color: colors.textGray,
    textAlign: "center",
  },
  achievementTextLocked: {
    opacity: 0.6,
  },
  unlockedBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  unlockedText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: typography.bold,
  },

  // Goal Card
  goalCard: {
    backgroundColor: colors.primaryLight,
  },
  goalDescription: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  goalIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
  },
  goalEmoji: {
    fontSize: 32,
  },
  goalText: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: typography.medium,
    color: colors.textDark,
  },
});
