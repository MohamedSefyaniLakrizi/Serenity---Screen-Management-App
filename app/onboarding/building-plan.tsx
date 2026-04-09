import { borderRadius, spacing, typeScale } from "@/constants";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useOnboardingStore } from "@/store/onboardingStore";
import { HabitType } from "@/types/habits";
import { router } from "expo-router";
import {
  BookOpen,
  BookText,
  Brain,
  Dumbbell,
  HandHeart,
  Moon,
  Smartphone,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Config ───────────────────────────────────────────────────────────────────

const REDIRECT_MS = 5000;

const HABIT_META: Record<
  HabitType,
  {
    label: string;
    Icon: React.ComponentType<{
      size: number;
      color: string;
      strokeWidth: number;
    }>;
  }
> = {
  screentime: { label: "Screen Time", Icon: Smartphone },
  study: { label: "Study / Work", Icon: BookOpen },
  fitness: { label: "Fitness", Icon: Dumbbell },
  sleep: { label: "Sleep", Icon: Moon },
  prayer: { label: "Prayer", Icon: HandHeart },
  meditation: { label: "Meditation", Icon: Brain },
  reading: { label: "Reading", Icon: BookText },
};

// ─── Habit timeline card ──────────────────────────────────────────────────────

function HabitTimelineCard({
  type,
  index,
  isFirst,
  theme,
  startDate,
}: {
  type: HabitType;
  index: number;
  isFirst: boolean;
  theme: ReturnType<typeof useThemedColors>;
  startDate: Date;
}) {
  const meta = HABIT_META[type];
  const { Icon } = meta;
  const accentColor = theme.habitAccent[type];

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(
      200 + index * 150,
      withTiming(1, { duration: 400 }),
    );
    translateY.value = withDelay(
      200 + index * 150,
      withSpring(0, { damping: 16, stiffness: 120 }),
    );
  }, []);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Estimated start: index * 60 days from the start date
  const estimatedStart = new Date(startDate);
  estimatedStart.setDate(estimatedStart.getDate() + index * 60);
  const dateLabel = isFirst
    ? "Starting now"
    : estimatedStart.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

  const barWidth = useSharedValue(isFirst ? 0 : 0);
  const barFillWidth = useSharedValue(0);

  useEffect(() => {
    if (isFirst) {
      barFillWidth.value = withDelay(
        600 + index * 150,
        withTiming(40, { duration: 1200 }),
      );
    }
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barFillWidth.value}%` as any,
  }));

  const s = styles(theme);

  return (
    <Animated.View
      style={[s.habitCard, isFirst && s.habitCardFirst, wrapStyle]}
    >
      <View
        style={[
          s.habitAccentBar,
          { backgroundColor: isFirst ? accentColor : theme.border.subtle },
        ]}
      />
      <View
        style={[
          s.habitIconBox,
          { backgroundColor: `${accentColor}${isFirst ? "20" : "10"}` },
        ]}
      >
        <Icon
          size={16}
          color={isFirst ? accentColor : theme.text.tertiary}
          strokeWidth={1.5}
        />
      </View>
      <View style={s.habitBody}>
        <View style={s.habitRow}>
          <Text
            style={[
              s.habitLabel,
              { color: isFirst ? theme.text.primary : theme.text.tertiary },
            ]}
          >
            {meta.label}
          </Text>
          <Text
            style={[
              s.habitDate,
              {
                color: isFirst ? theme.accent.primary : theme.text.tertiary,
                fontVariant: ["tabular-nums"],
              },
            ]}
          >
            {dateLabel}
          </Text>
        </View>
        {isFirst && (
          <>
            <Text style={[s.habitSubtitle, { color: theme.text.secondary }]}>
              60 days to build this habit
            </Text>
            <View
              style={[
                s.progressTrack,
                { backgroundColor: theme.border.default },
              ]}
            >
              <Animated.View
                style={[
                  s.progressFill,
                  { backgroundColor: accentColor },
                  barStyle,
                ]}
              />
            </View>
          </>
        )}
        {!isFirst && (
          <Text style={[s.habitSubtitle, { color: theme.text.tertiary }]}>
            Coming up next
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BuildingPlanScreen() {
  const theme = useThemedColors();
  const { completeOnboarding, habitPriority } = useOnboardingStore();
  const mountedRef = useRef(true);
  const today = new Date();

  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(16);

  useEffect(() => {
    titleOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(
      100,
      withSpring(0, { damping: 16, stiffness: 110 }),
    );
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  useEffect(() => {
    mountedRef.current = true;
    const redirect = setTimeout(async () => {
      try {
        await completeOnboarding();
      } catch (err) {
        console.error("building-plan completion error:", err);
      } finally {
        if (mountedRef.current) router.replace("/paywall");
      }
    }, REDIRECT_MS);

    return () => {
      mountedRef.current = false;
      clearTimeout(redirect);
    };
  }, []);

  const s = styles(theme);

  // Fallback if no habits were selected
  const habits =
    habitPriority.length > 0 ? habitPriority : (["screentime"] as HabitType[]);

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <StatusBar barStyle={theme.statusBar} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <Animated.View style={[s.header, titleStyle]}>
          <Text style={[s.title, { color: theme.text.primary }]}>
            Your Habit Plan
          </Text>
          <Text style={[s.subtitle, { color: theme.text.secondary }]}>
            One habit at a time. 60 days each. Stack as you go.
          </Text>
        </Animated.View>

        {/* Timeline */}
        <View style={s.timeline}>
          {habits.map((type, i) => (
            <HabitTimelineCard
              key={type}
              type={type}
              index={i}
              isFirst={i === 0}
              theme={theme}
              startDate={today}
            />
          ))}
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
      paddingTop: spacing[12],
      paddingBottom: spacing[10],
    },
    header: {
      marginBottom: spacing[8],
    },
    title: {
      fontFamily: "System",
      fontSize: typeScale.title1.size,
      fontWeight: typeScale.title1.weight,
      lineHeight: typeScale.title1.lineHeight,
      marginBottom: spacing[2],
    },
    subtitle: {
      fontFamily: "System",
      fontSize: typeScale.callout.size,
      fontWeight: typeScale.callout.weight,
      lineHeight: typeScale.callout.lineHeight,
    },
    timeline: {
      gap: spacing[3],
    },
    // ── Habit card ─────────────────────────────────
    habitCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[3],
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.subtle,
      borderRadius: borderRadius.lg,
      padding: spacing[4],
      opacity: 0.55,
    },
    habitCardFirst: {
      borderColor: theme.border.default,
      opacity: 1,
    },
    habitAccentBar: {
      width: 3,
      height: 40,
      borderRadius: 2,
      alignSelf: "center",
    },
    habitIconBox: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    habitBody: {
      flex: 1,
      gap: spacing[1],
    },
    habitRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    habitLabel: {
      fontFamily: "System",
      fontSize: typeScale.callout.size,
      fontWeight: "600",
      lineHeight: typeScale.callout.lineHeight,
    },
    habitDate: {
      fontFamily: "Menlo",
      fontSize: typeScale.caption1.size,
      fontWeight: typeScale.caption1.weight,
      lineHeight: typeScale.caption1.lineHeight,
    },
    habitSubtitle: {
      fontFamily: "System",
      fontSize: typeScale.footnote.size,
      fontWeight: typeScale.footnote.weight,
      lineHeight: typeScale.footnote.lineHeight,
    },
    progressTrack: {
      height: 3,
      borderRadius: 2,
      overflow: "hidden",
      marginTop: spacing[2],
    },
    progressFill: {
      height: "100%",
      borderRadius: 2,
    },
  });
