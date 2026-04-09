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
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const MIN_MINUTES = 15;
const MAX_MINUTES = 480;
const STEP = 15;

export default function ConfigStudyScreen() {
  const theme = useThemedColors();
  const { setHabitConfig } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext(
    "/onboarding/config-study",
  );

  const [goalMinutes, setGoalMinutes] = useState(60);
  const [workLabel, setWorkLabel] = useState("");

  const [
    titleAnim,
    subtitleAnim,
    stepperAnim,
    labelAnim,
    infoAnim,
    buttonAnim,
  ] = useSequentialFadeIn(6, { duration: 300, stagger: 180 });

  const decrement = () =>
    setGoalMinutes((m) => Math.max(MIN_MINUTES, m - STEP));
  const increment = () =>
    setGoalMinutes((m) => Math.min(MAX_MINUTES, m + STEP));

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) return `${h} ${h === 1 ? "hour" : "hours"}`;
    return `${h}h ${m}m`;
  };

  const handleContinue = () => {
    setHabitConfig("study", {
      type: "study",
      dailyGoalMinutes: goalMinutes,
      workLabel: workLabel.trim() || undefined,
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
          Daily Study Goal
        </Animated.Text>
        <Animated.Text style={[s.subtitle, subtitleAnim]}>
          How much focused work do you want to complete each day?
        </Animated.Text>

        {/* Duration stepper */}
        <Animated.View style={[s.stepperWrapper, stepperAnim]}>
          <TouchableOpacity
            style={[
              s.stepperBtn,
              goalMinutes <= MIN_MINUTES && s.stepperBtnDisabled,
            ]}
            onPress={decrement}
            activeOpacity={0.7}
            disabled={goalMinutes <= MIN_MINUTES}
          >
            <Minus
              size={22}
              color={
                goalMinutes <= MIN_MINUTES
                  ? theme.text.disabled
                  : theme.accent.primary
              }
              strokeWidth={2}
            />
          </TouchableOpacity>

          <View style={s.stepperValue}>
            <Text style={s.stepperNumber}>{formatMinutes(goalMinutes)}</Text>
            <Text style={s.stepperUnit}>per day</Text>
          </View>

          <TouchableOpacity
            style={[
              s.stepperBtn,
              goalMinutes >= MAX_MINUTES && s.stepperBtnDisabled,
            ]}
            onPress={increment}
            activeOpacity={0.7}
            disabled={goalMinutes >= MAX_MINUTES}
          >
            <Plus
              size={22}
              color={
                goalMinutes >= MAX_MINUTES
                  ? theme.text.disabled
                  : theme.accent.primary
              }
              strokeWidth={2}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Optional label */}
        <Animated.View style={[s.labelSection, labelAnim]}>
          <Text style={s.labelTitle}>What are you studying? (optional)</Text>
          <TextInput
            style={s.textInput}
            placeholder="e.g. University, Work Project, Side Hustle"
            placeholderTextColor={theme.text.tertiary}
            value={workLabel}
            onChangeText={setWorkLabel}
            maxLength={50}
            returnKeyType="done"
          />
        </Animated.View>

        {/* Info card */}
        <Animated.View style={[s.infoCard, infoAnim]}>
          <Text style={s.infoText}>
            {"You'll need to complete"}{" "}
            <Text style={s.infoHighlight}>{formatMinutes(goalMinutes)}</Text> of
            focused work using the in-app timer to unlock your apps each day.
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
    stepperWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[6],
      marginBottom: spacing[8],
    },
    stepperBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
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
      alignItems: "center",
      minWidth: 120,
    },
    stepperNumber: {
      fontFamily: "Menlo",
      fontSize: typeScale.statSmall.size,
      fontWeight: typeScale.statSmall.weight,
      color: theme.text.primary,
      lineHeight: typeScale.statSmall.lineHeight,
    },
    stepperUnit: {
      fontFamily: "System",
      fontSize: typeScale.footnote.size,
      fontWeight: typeScale.footnote.weight,
      color: theme.text.secondary,
      marginTop: spacing[1],
    },
    labelSection: {
      marginBottom: spacing[6],
      gap: spacing[2],
    },
    labelTitle: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: "500",
      color: theme.text.secondary,
    },
    textInput: {
      backgroundColor: theme.bg.subtle,
      borderWidth: 1,
      borderColor: theme.border.default,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      fontFamily: "System",
      fontSize: typeScale.body.size,
      fontWeight: typeScale.body.weight,
      color: theme.text.primary,
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
