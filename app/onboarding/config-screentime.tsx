import { borderRadius, spacing, typeScale } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useOnboardingStore } from "@/store/onboardingStore";
import { router } from "expo-router";
import { Minus, Plus } from "lucide-react-native";
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

const HOURS_MIN = 0;
const HOURS_MAX = 16;
const MINUTES_OPTIONS = [0, 15, 30, 45];

export default function ConfigScreentimeScreen() {
  const theme = useThemedColors();
  const { setHabitConfig } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext(
    "/onboarding/config-screentime",
  );

  const [hours, setHours] = useState(2);
  const [minuteIndex, setMinuteIndex] = useState(0); // index into MINUTES_OPTIONS

  const [titleAnim, subtitleAnim, controlsAnim, infoAnim, buttonAnim] =
    useSequentialFadeIn(5, { duration: 300, stagger: 180 });

  const minutes = MINUTES_OPTIONS[minuteIndex];
  const totalMinutes = hours * 60 + minutes;

  const decrementHours = () => setHours((h) => Math.max(HOURS_MIN, h - 1));
  const incrementHours = () => setHours((h) => Math.min(HOURS_MAX, h + 1));
  const decrementMins = () => setMinuteIndex((i) => Math.max(0, i - 1));
  const incrementMins = () =>
    setMinuteIndex((i) => Math.min(MINUTES_OPTIONS.length - 1, i + 1));

  const formatLimit = () => {
    if (hours === 0 && minutes === 0) return "0 minutes";
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hr" : "hrs"}`);
    if (minutes > 0) parts.push(`${minutes} min`);
    return parts.join(" ");
  };

  const handleContinue = () => {
    setHabitConfig("screentime", {
      type: "screentime",
      dailyLimitMinutes: Math.max(15, totalMinutes),
    });
    navigateNext();
  };

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <StatusBar barStyle={theme.statusBar} />

      {/* Header */}
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
          Daily Screen Limit
        </Animated.Text>
        <Animated.Text style={[s.subtitle, subtitleAnim]}>
          How many hours of screen time do you want to allow each day?
        </Animated.Text>

        {/* Steppers */}
        <Animated.View style={[s.steppers, controlsAnim]}>
          {/* Hours stepper */}
          <View style={s.stepperGroup}>
            <Text style={s.stepperLabel}>Hours</Text>
            <View style={s.stepperRow}>
              <TouchableOpacity
                style={[
                  s.stepperBtn,
                  hours <= HOURS_MIN && s.stepperBtnDisabled,
                ]}
                onPress={decrementHours}
                activeOpacity={0.7}
                disabled={hours <= HOURS_MIN}
              >
                <Minus
                  size={20}
                  color={
                    hours <= HOURS_MIN
                      ? theme.text.disabled
                      : theme.accent.primary
                  }
                  strokeWidth={2}
                />
              </TouchableOpacity>
              <View style={s.stepperValue}>
                <Text style={s.stepperNumber}>{hours}</Text>
              </View>
              <TouchableOpacity
                style={[
                  s.stepperBtn,
                  hours >= HOURS_MAX && s.stepperBtnDisabled,
                ]}
                onPress={incrementHours}
                activeOpacity={0.7}
                disabled={hours >= HOURS_MAX}
              >
                <Plus
                  size={20}
                  color={
                    hours >= HOURS_MAX
                      ? theme.text.disabled
                      : theme.accent.primary
                  }
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.stepperDivider} />

          {/* Minutes stepper */}
          <View style={s.stepperGroup}>
            <Text style={s.stepperLabel}>Minutes</Text>
            <View style={s.stepperRow}>
              <TouchableOpacity
                style={[s.stepperBtn, minuteIndex <= 0 && s.stepperBtnDisabled]}
                onPress={decrementMins}
                activeOpacity={0.7}
                disabled={minuteIndex <= 0}
              >
                <Minus
                  size={20}
                  color={
                    minuteIndex <= 0
                      ? theme.text.disabled
                      : theme.accent.primary
                  }
                  strokeWidth={2}
                />
              </TouchableOpacity>
              <View style={s.stepperValue}>
                <Text style={s.stepperNumber}>{minutes}</Text>
              </View>
              <TouchableOpacity
                style={[
                  s.stepperBtn,
                  minuteIndex >= MINUTES_OPTIONS.length - 1 &&
                    s.stepperBtnDisabled,
                ]}
                onPress={incrementMins}
                activeOpacity={0.7}
                disabled={minuteIndex >= MINUTES_OPTIONS.length - 1}
              >
                <Plus
                  size={20}
                  color={
                    minuteIndex >= MINUTES_OPTIONS.length - 1
                      ? theme.text.disabled
                      : theme.accent.primary
                  }
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Info card */}
        <Animated.View style={[s.infoCard, infoAnim]}>
          <Text style={s.infoText}>
            Your apps will stay open until you exceed{" "}
            <Text style={s.infoHighlight}>{formatLimit()}</Text> of screen time.
            After that, they'll be blocked for the rest of the day.
          </Text>
        </Animated.View>
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
    content: {
      flex: 1,
      paddingHorizontal: spacing[6],
      paddingTop: spacing[6],
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
      marginBottom: spacing[8],
    },
    steppers: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[6],
      marginBottom: spacing[8],
    },
    stepperGroup: {
      alignItems: "center",
      gap: spacing[3],
    },
    stepperLabel: {
      fontFamily: "System",
      fontSize: typeScale.footnote.size,
      fontWeight: typeScale.footnote.weight,
      color: theme.text.tertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
    },
    stepperBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${theme.accent.primary}15`,
      borderWidth: 1,
      borderColor: `${theme.accent.primary}40`,
      justifyContent: "center",
      alignItems: "center",
    },
    stepperBtnDisabled: {
      backgroundColor: theme.bg.subtle,
      borderColor: theme.border.default,
    },
    stepperValue: {
      minWidth: 64,
      alignItems: "center",
    },
    stepperNumber: {
      fontFamily: "Menlo",
      fontSize: typeScale.statMedium.size,
      fontWeight: typeScale.statMedium.weight,
      color: theme.text.primary,
      lineHeight: typeScale.statMedium.lineHeight,
    },
    stepperDivider: {
      width: 1,
      height: 72,
      backgroundColor: theme.border.default,
    },
    infoCard: {
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.default,
      borderRadius: borderRadius.lg,
      padding: spacing[4],
    },
    infoText: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: typeScale.subheadline.weight,
      lineHeight: typeScale.subheadline.lineHeight,
      color: theme.text.secondary,
    },
    infoHighlight: {
      color: theme.text.primary,
      fontWeight: "600",
    },
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
