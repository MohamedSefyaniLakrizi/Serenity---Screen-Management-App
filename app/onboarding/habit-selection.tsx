import { borderRadius, spacing, typeScale } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useOnboardingStore } from "@/store/onboardingStore";
import { HabitType } from "@/types/habits";
import { router } from "expo-router";
import {
    BookOpen,
    BookText,
    Brain,
    Check,
    Dumbbell,
    HandHeart,
    Moon,
    Smartphone,
} from "lucide-react-native";
import React from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const HABITS: {
  type: HabitType;
  label: string;
  description: string;
  Icon: React.ComponentType<{
    size: number;
    color: string;
    strokeWidth: number;
  }>;
}[] = [
  {
    type: "screentime",
    label: "Screen Time",
    description: "Limit daily phone usage",
    Icon: Smartphone,
  },
  {
    type: "study",
    label: "Study / Work",
    description: "Daily focused work sessions",
    Icon: BookOpen,
  },
  {
    type: "fitness",
    label: "Fitness",
    description: "Reach your activity goals",
    Icon: Dumbbell,
  },
  {
    type: "sleep",
    label: "Sleep",
    description: "Protect your sleep routine",
    Icon: Moon,
  },
  {
    type: "prayer",
    label: "Prayer",
    description: "Daily spiritual practice",
    Icon: HandHeart,
  },
  {
    type: "meditation",
    label: "Meditation",
    description: "Daily mindfulness sessions",
    Icon: Brain,
  },
  {
    type: "reading",
    label: "Reading",
    description: "Daily reading habit",
    Icon: BookText,
  },
];

export default function HabitSelectionScreen() {
  const theme = useThemedColors();
  const { selectedHabits, selectHabit, deselectHabit } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext(
    "/onboarding/habit-selection",
  );

  const [titleAnim, subtitleAnim, gridAnim, buttonAnim] = useSequentialFadeIn(
    4,
    { duration: 350, stagger: 180 },
  );

  const toggle = (type: HabitType) => {
    if (selectedHabits.includes(type)) {
      deselectHabit(type);
    } else {
      selectHabit(type);
    }
  };

  const canContinue = selectedHabits.length > 0;

  const s = styles(theme);

  // Group habits into rows of 2 for the grid
  const rows: (typeof HABITS)[] = [];
  for (let i = 0; i < HABITS.length; i += 2) {
    rows.push(HABITS.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <StatusBar barStyle={theme.statusBar} />

      {/* Header: back + progress */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <View style={s.backIcon}>
            <Text style={s.backChevron}>‹</Text>
          </View>
        </TouchableOpacity>
        <View style={s.progressTrack}>
          <View
            style={[s.progressFill, { width: `${progressFraction * 100}%` }]}
          />
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text style={[s.title, titleAnim]}>
          Choose Your Habits
        </Animated.Text>
        <Animated.Text style={[s.subtitle, subtitleAnim]}>
          Select the habits you want to build. You'll focus on one at a time.
        </Animated.Text>

        <Animated.View style={gridAnim}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={s.row}>
              {row.map((habit) => {
                const selected = selectedHabits.includes(habit.type);
                const accentColor = theme.habitAccent[habit.type];
                const { Icon } = habit;

                return (
                  <TouchableOpacity
                    key={habit.type}
                    style={[
                      s.card,
                      selected && {
                        borderColor: accentColor,
                        backgroundColor: `${accentColor}0F`,
                      },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => toggle(habit.type)}
                  >
                    <View style={s.cardTop}>
                      <Icon
                        size={20}
                        color={selected ? accentColor : theme.text.secondary}
                        strokeWidth={1.5}
                      />
                      {selected && (
                        <Check
                          size={14}
                          color={accentColor}
                          strokeWidth={2.5}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        s.cardLabel,
                        selected && { color: theme.text.primary },
                      ]}
                    >
                      {habit.label}
                    </Text>
                    <Text style={s.cardDescription}>{habit.description}</Text>
                  </TouchableOpacity>
                );
              })}
              {/* Spacer to fill the gap when the last row has only 1 item */}
              {row.length === 1 && <View style={s.cardSpacer} />}
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <Animated.View style={[s.actions, buttonAnim]}>
        <TouchableOpacity
          style={[s.button, !canContinue && s.buttonDisabled]}
          activeOpacity={canContinue ? 0.8 : 1}
          onPress={canContinue ? navigateNext : undefined}
          disabled={!canContinue}
        >
          <Text style={[s.buttonText, !canContinue && s.buttonTextDisabled]}>
            Continue
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = (theme: ReturnType<typeof useThemedColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg.primary,
    },
    // ── Header ──────────────────────────────────
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      paddingHorizontal: spacing[6],
      paddingTop: spacing[5],
      paddingBottom: spacing[4],
    },
    backButton: {
      padding: spacing[2],
    },
    backIcon: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    backChevron: {
      fontSize: 28,
      color: theme.text.primary,
      lineHeight: 32,
    },
    progressTrack: {
      flex: 1,
      height: 4,
      backgroundColor: theme.border.default,
      borderRadius: 2,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.accent.primary,
      borderRadius: 2,
    },
    // ── Scroll ──────────────────────────────────
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing[6],
      paddingBottom: spacing[4],
    },
    // ── Text ────────────────────────────────────
    title: {
      fontFamily: "System",
      fontSize: typeScale.title1.size,
      fontWeight: typeScale.title1.weight,
      lineHeight: typeScale.title1.lineHeight,
      color: theme.text.primary,
      marginBottom: spacing[2],
    },
    subtitle: {
      fontFamily: "System",
      fontSize: typeScale.callout.size,
      fontWeight: typeScale.callout.weight,
      lineHeight: typeScale.callout.lineHeight,
      color: theme.text.secondary,
      marginBottom: spacing[6],
    },
    // ── Grid ────────────────────────────────────
    row: {
      flexDirection: "row",
      gap: spacing[3],
      marginBottom: spacing[3],
    },
    card: {
      flex: 1,
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.default,
      borderRadius: borderRadius.lg,
      padding: spacing[4],
      gap: spacing[1],
    },
    cardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing[2],
    },
    cardLabel: {
      fontFamily: "System",
      fontSize: typeScale.headline.size,
      fontWeight: typeScale.headline.weight,
      lineHeight: typeScale.headline.lineHeight,
      color: theme.text.secondary,
    },
    cardDescription: {
      fontFamily: "System",
      fontSize: typeScale.caption1.size,
      fontWeight: typeScale.caption1.weight,
      lineHeight: typeScale.caption1.lineHeight,
      color: theme.text.tertiary,
    },
    cardSpacer: {
      flex: 1,
    },
    // ── CTA ─────────────────────────────────────
    actions: {
      paddingHorizontal: spacing[6],
      paddingBottom: spacing[6],
      paddingTop: spacing[3],
    },
    button: {
      backgroundColor: theme.accent.primary,
      paddingVertical: spacing[4],
      borderRadius: borderRadius.md,
      width: "100%",
      alignItems: "center",
    },
    buttonDisabled: {
      backgroundColor: theme.bg.subtle,
    },
    buttonText: {
      color: "#FFFFFF",
      fontFamily: "System",
      fontSize: typeScale.headline.size,
      fontWeight: typeScale.headline.weight,
    },
    buttonTextDisabled: {
      color: theme.text.disabled,
    },
  });
