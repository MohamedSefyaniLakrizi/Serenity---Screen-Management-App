import { borderRadius, spacing, typeScale } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useOnboardingStore } from "@/store/onboardingStore";
import { HabitType } from "@/types/habits";
import { router } from "expo-router";
import {
    ArrowDown,
    ArrowUp,
    BookOpen,
    BookText,
    Brain,
    Dumbbell,
    HandHeart,
    Moon,
    Smartphone,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const HABIT_ICONS: Record<
  HabitType,
  React.ComponentType<{ size: number; color: string; strokeWidth: number }>
> = {
  screentime: Smartphone,
  study: BookOpen,
  fitness: Dumbbell,
  sleep: Moon,
  prayer: HandHeart,
  meditation: Brain,
  reading: BookText,
};

const HABIT_LABELS: Record<HabitType, string> = {
  screentime: "Screen Time",
  study: "Study / Work",
  fitness: "Fitness",
  sleep: "Sleep",
  prayer: "Prayer",
  meditation: "Meditation",
  reading: "Reading",
};

export default function HabitPriorityScreen() {
  const theme = useThemedColors();
  const { habitPriority, setHabitPriority } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext(
    "/onboarding/habit-priority",
  );

  const [order, setOrder] = useState<HabitType[]>(
    habitPriority.length > 0 ? [...habitPriority] : [],
  );

  const [titleAnim, subtitleAnim, listAnim, noteAnim, buttonAnim] =
    useSequentialFadeIn(5, { duration: 350, stagger: 150 });

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...order];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setOrder(next);
  };

  const moveDown = (index: number) => {
    if (index === order.length - 1) return;
    const next = [...order];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setOrder(next);
  };

  const handleContinue = () => {
    setHabitPriority(order);
    navigateNext();
  };

  const s = styles(theme);

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

      {/* Content */}
      <View style={s.content}>
        <Animated.Text style={[s.title, titleAnim]}>
          Set Your Priority
        </Animated.Text>
        <Animated.Text style={[s.subtitle, subtitleAnim]}>
          {"Your #1 habit is what you'll build first for 60 days."}
        </Animated.Text>

        <Animated.View style={[s.list, listAnim]}>
          {order.map((type, index) => {
            const Icon = HABIT_ICONS[type];
            const accentColor = theme.habitAccent[type];
            const isFirst = index === 0;
            const isLast = index === order.length - 1;

            return (
              <View
                key={type}
                style={[s.habitRow, isFirst && { borderColor: accentColor }]}
              >
                {/* Position badge */}
                <View
                  style={[
                    s.badge,
                    isFirst
                      ? { backgroundColor: accentColor }
                      : { backgroundColor: theme.bg.subtle },
                  ]}
                >
                  <Text
                    style={[
                      s.badgeText,
                      !isFirst && { color: theme.text.tertiary },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>

                {/* Icon */}
                <Icon
                  size={20}
                  color={isFirst ? accentColor : theme.text.secondary}
                  strokeWidth={1.5}
                />

                {/* Label */}
                <Text
                  style={[
                    s.habitLabel,
                    isFirst && {
                      color: theme.text.primary,
                      fontWeight: "600" as const,
                    },
                  ]}
                >
                  {HABIT_LABELS[type]}
                </Text>

                {/* Reorder controls */}
                <View style={s.arrowButtons}>
                  <TouchableOpacity
                    onPress={() => moveUp(index)}
                    disabled={index === 0}
                    style={[s.arrowBtn, index === 0 && s.arrowBtnDisabled]}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <ArrowUp
                      size={16}
                      color={
                        index === 0 ? theme.text.disabled : theme.text.secondary
                      }
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveDown(index)}
                    disabled={isLast}
                    style={[s.arrowBtn, isLast && s.arrowBtnDisabled]}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <ArrowDown
                      size={16}
                      color={
                        isLast ? theme.text.disabled : theme.text.secondary
                      }
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </Animated.View>

        <Animated.Text style={[s.note, noteAnim]}>
          After 60 days your first habit is locked in. Serenity will
          automatically add #2 on top.
        </Animated.Text>
      </View>

      {/* CTA */}
      <Animated.View style={[s.actions, buttonAnim]}>
        <TouchableOpacity
          style={s.button}
          activeOpacity={0.8}
          onPress={handleContinue}
        >
          <Text style={s.buttonText}>Continue</Text>
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
    // ── Content ─────────────────────────────────
    content: {
      flex: 1,
      paddingHorizontal: spacing[6],
      paddingTop: spacing[4],
    },
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
    // ── Habit list ──────────────────────────────
    list: {
      gap: spacing[2],
    },
    habitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.default,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing[4],
      paddingHorizontal: spacing[4],
    },
    badge: {
      width: 24,
      height: 24,
      borderRadius: borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      fontFamily: "System",
      fontSize: typeScale.caption1.size,
      fontWeight: "700",
      color: "#FFFFFF",
      lineHeight: 14,
    },
    habitLabel: {
      flex: 1,
      fontFamily: "System",
      fontSize: typeScale.headline.size,
      fontWeight: typeScale.headline.weight,
      lineHeight: typeScale.headline.lineHeight,
      color: theme.text.secondary,
    },
    arrowButtons: {
      flexDirection: "row",
      gap: spacing[1],
    },
    arrowBtn: {
      padding: spacing[1],
    },
    arrowBtnDisabled: {
      opacity: 0.3,
    },
    // ── Note ────────────────────────────────────
    note: {
      marginTop: spacing[5],
      fontFamily: "System",
      fontSize: typeScale.footnote.size,
      fontWeight: typeScale.footnote.weight,
      lineHeight: typeScale.footnote.lineHeight,
      color: theme.text.tertiary,
      textAlign: "center",
      paddingHorizontal: spacing[4],
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
    buttonText: {
      color: "#FFFFFF",
      fontFamily: "System",
      fontSize: typeScale.headline.size,
      fontWeight: typeScale.headline.weight,
    },
  });
