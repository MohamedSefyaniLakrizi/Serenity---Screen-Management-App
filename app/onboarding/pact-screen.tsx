import OathConfirmation from "@/components/ui/OathConfirmation";
import { borderRadius, spacing, typeScale } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useOnboardingStore } from "@/store/onboardingStore";
import type { HabitType } from "@/types/habits";
import {
    BookOpen,
    BookText,
    Brain,
    Dumbbell,
    HandHeart,
    Moon,
    Shield,
    Smartphone,
} from "lucide-react-native";
import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Habit metadata ───────────────────────────────────────────────────────────

const HABIT_META: Record<
  HabitType,
  {
    label: string;
    Icon: React.ComponentType<{
      size: number;
      color: string;
      strokeWidth: number;
    }>;
    goalSummary: (config: Record<string, unknown>) => string;
  }
> = {
  screentime: {
    label: "Screen Time",
    Icon: Smartphone,
    goalSummary: (c) => {
      const mins = (c.dailyLimitMinutes as number) ?? 120;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return h > 0
        ? `Limit ${h}h${m > 0 ? ` ${m}m` : ""} daily`
        : `Limit ${m}m daily`;
    },
  },
  study: {
    label: "Study / Work",
    Icon: BookOpen,
    goalSummary: (c) => `${c.dailyGoalMinutes ?? 60}m focused work daily`,
  },
  fitness: {
    label: "Fitness",
    Icon: Dumbbell,
    goalSummary: (c) => {
      const type = c.goalType as string;
      const val = c.goalValue as number;
      if (type === "steps")
        return `${val?.toLocaleString() ?? 8000} steps daily`;
      if (type === "calories") return `${val ?? 300} active kcal daily`;
      return `${val ?? 30}m workout daily`;
    },
  },
  sleep: {
    label: "Sleep",
    Icon: Moon,
    goalSummary: (c) =>
      `Bedtime ${c.bedtime ?? "22:00"} · Wake ${c.wakeTime ?? "07:00"}`,
  },
  prayer: {
    label: "Prayer",
    Icon: HandHeart,
    goalSummary: (c) => `${c.prayerCount ?? 5} prayers daily`,
  },
  meditation: {
    label: "Meditation",
    Icon: Brain,
    goalSummary: (c) => `${c.dailyGoalMinutes ?? 10}m meditation daily`,
  },
  reading: {
    label: "Reading",
    Icon: BookText,
    goalSummary: (c) => `${c.dailyGoalMinutes ?? 20}m reading daily`,
  },
};

const OATH_TEXT =
  "I commit to building these habits. I understand my apps will be blocked until I complete them each day. I will uphold this pact.";

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PactScreen() {
  const theme = useThemedColors();
  const { habitPriority, habitConfigs, updateData } = useOnboardingStore();
  const { navigateNext } = useOnboardingNext("/onboarding/pact-screen");

  const [iconAnim, titleAnim, subtitleAnim, listAnim] = useSequentialFadeIn(4, {
    duration: 350,
    stagger: 180,
  });

  const handlePactConfirmed = () => {
    updateData({ pactAccepted: true });
    navigateNext();
  };

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <StatusBar barStyle={theme.statusBar} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shield icon */}
        <View style={s.iconAnimWrapper}>
          {/* @ts-ignore - Animated.View wrapper inline for sequential fade */}
        </View>
        <View style={s.iconWrapper}>
          <View style={s.shieldBadge}>
            <Shield size={32} color={theme.accent.primary} strokeWidth={1.5} />
          </View>
        </View>

        {/* Title */}
        <Text style={[s.title, { color: theme.text.primary }]}>Your Pact</Text>

        {/* Subtitle */}
        <Text style={[s.subtitle, { color: theme.text.secondary }]}>
          Review your commitment before sealing it.
        </Text>

        {/* Habit summary card */}
        {habitPriority.length > 0 && (
          <View style={s.summaryCard}>
            <Text style={[s.summaryHeader, { color: theme.text.secondary }]}>
              {"HABITS YOU'RE COMMITTING TO"}
            </Text>
            {habitPriority.map((type, index) => {
              const meta = HABIT_META[type];
              if (!meta) return null;
              const { Icon } = meta;
              const config = (habitConfigs[type] ?? {}) as Record<
                string,
                unknown
              >;
              const accentColor = theme.habitAccent[type];

              return (
                <View key={type} style={s.habitRow}>
                  <View
                    style={[s.habitAccentBar, { backgroundColor: accentColor }]}
                  />
                  <View
                    style={[
                      s.habitIconBox,
                      { backgroundColor: `${accentColor}18` },
                    ]}
                  >
                    <Icon size={16} color={accentColor} strokeWidth={1.5} />
                  </View>
                  <View style={s.habitInfo}>
                    <Text style={[s.habitLabel, { color: theme.text.primary }]}>
                      {index + 1}. {meta.label}
                    </Text>
                    <Text
                      style={[s.habitGoal, { color: theme.text.secondary }]}
                    >
                      {meta.goalSummary(config)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Separator */}
        <View style={[s.separator, { backgroundColor: theme.border.subtle }]} />

        {/* Oath confirmation */}
        <View style={s.oathSection}>
          <OathConfirmation
            oathText={OATH_TEXT}
            onConfirmed={handlePactConfirmed}
            holdDurationMs={5000}
            habitColor={theme.accent.primary}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = (theme: ReturnType<typeof useThemedColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg.primary,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing[6],
      paddingTop: spacing[10],
      paddingBottom: spacing[10],
    },
    iconAnimWrapper: {
      display: "none",
    },
    iconWrapper: {
      alignItems: "center",
      marginBottom: spacing[6],
    },
    shieldBadge: {
      width: 72,
      height: 72,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: `${theme.accent.primary}50`,
      backgroundColor: `${theme.accent.primary}12`,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontFamily: "System",
      fontSize: typeScale.display.size,
      fontWeight: typeScale.display.weight,
      lineHeight: typeScale.display.lineHeight,
      textAlign: "center",
      marginBottom: spacing[3],
    },
    subtitle: {
      fontFamily: "System",
      fontSize: typeScale.callout.size,
      fontWeight: typeScale.callout.weight,
      lineHeight: typeScale.callout.lineHeight,
      textAlign: "center",
      marginBottom: spacing[8],
    },
    // ── Summary card ──────────────────────────────
    summaryCard: {
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.default,
      borderRadius: borderRadius.lg,
      overflow: "hidden",
      marginBottom: spacing[6],
    },
    summaryHeader: {
      fontFamily: "System",
      fontSize: typeScale.caption2.size,
      fontWeight: "600",
      lineHeight: typeScale.caption2.lineHeight,
      letterSpacing: 0.8,
      paddingHorizontal: spacing[4],
      paddingTop: spacing[4],
      paddingBottom: spacing[3],
    },
    habitRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderTopWidth: 1,
      borderTopColor: theme.border.subtle,
      gap: spacing[3],
    },
    habitAccentBar: {
      width: 3,
      height: 36,
      borderRadius: 2,
    },
    habitIconBox: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    habitInfo: {
      flex: 1,
      gap: 2,
    },
    habitLabel: {
      fontFamily: "System",
      fontSize: typeScale.callout.size,
      fontWeight: "600",
      lineHeight: typeScale.callout.lineHeight,
    },
    habitGoal: {
      fontFamily: "System",
      fontSize: typeScale.footnote.size,
      fontWeight: typeScale.footnote.weight,
      lineHeight: typeScale.footnote.lineHeight,
    },
    // ── Separator ─────────────────────────────────
    separator: {
      height: 1,
      marginBottom: spacing[8],
    },
    // ── Oath section ──────────────────────────────
    oathSection: {
      paddingBottom: spacing[4],
    },
  });
