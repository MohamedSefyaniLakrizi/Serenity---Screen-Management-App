import { borderRadius, spacing, typeScale } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useOnboardingStore } from "@/store/onboardingStore";
import { router } from "expo-router";
import { BookText, Minus, Plus } from "lucide-react-native";
import React, { useState } from "react";
import {
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const MIN_MINUTES = 10;
const MAX_MINUTES = 120;
const STEP = 5;

export default function ConfigReadingScreen() {
  const theme = useThemedColors();
  const { setHabitConfig } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext(
    "/onboarding/config-reading",
  );

  const [goalMinutes, setGoalMinutes] = useState(20);
  const [trackApps, setTrackApps] = useState(false);

  const [
    titleAnim,
    subtitleAnim,
    stepperAnim,
    toggleAnim,
    infoAnim,
    buttonAnim,
  ] = useSequentialFadeIn(6, { duration: 300, stagger: 180 });

  const decrement = () =>
    setGoalMinutes((m) => Math.max(MIN_MINUTES, m - STEP));
  const increment = () =>
    setGoalMinutes((m) => Math.min(MAX_MINUTES, m + STEP));

  const handleContinue = () => {
    setHabitConfig("reading", {
      type: "reading",
      dailyGoalMinutes: goalMinutes,
      readingApps: [],
    });
    navigateNext();
  };

  const s = styles(theme);
  const accentColor = theme.habitAccent.reading;

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
          Daily Reading
        </Animated.Text>
        <Animated.Text style={[s.subtitle, subtitleAnim]}>
          How much do you want to read each day?
        </Animated.Text>

        {/* Stepper */}
        <Animated.View style={[s.stepperWrapper, stepperAnim]}>
          <TouchableOpacity
            style={[
              s.stepperBtn,
              {
                borderColor: `${accentColor}40`,
                backgroundColor: `${accentColor}15`,
              },
              goalMinutes <= MIN_MINUTES && s.stepperBtnDisabled,
            ]}
            onPress={decrement}
            activeOpacity={0.7}
            disabled={goalMinutes <= MIN_MINUTES}
          >
            <Minus
              size={22}
              color={
                goalMinutes <= MIN_MINUTES ? theme.text.disabled : accentColor
              }
              strokeWidth={2}
            />
          </TouchableOpacity>

          <View style={s.stepperValue}>
            <Text style={[s.stepperNumber, { color: accentColor }]}>
              {goalMinutes}
            </Text>
            <Text style={s.stepperUnit}>
              {goalMinutes === 1 ? "minute" : "minutes"} / day
            </Text>
          </View>

          <TouchableOpacity
            style={[
              s.stepperBtn,
              {
                borderColor: `${accentColor}40`,
                backgroundColor: `${accentColor}15`,
              },
              goalMinutes >= MAX_MINUTES && s.stepperBtnDisabled,
            ]}
            onPress={increment}
            activeOpacity={0.7}
            disabled={goalMinutes >= MAX_MINUTES}
          >
            <Plus
              size={22}
              color={
                goalMinutes >= MAX_MINUTES ? theme.text.disabled : accentColor
              }
              strokeWidth={2}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Track reading apps toggle */}
        <Animated.View style={[s.toggleCard, toggleAnim]}>
          <View style={s.toggleContent}>
            <BookText size={20} color={accentColor} strokeWidth={1.5} />
            <View style={s.toggleText}>
              <Text style={s.toggleTitle}>Track reading apps</Text>
              <Text style={s.toggleDescription}>
                Automatically complete via Kindle, Apple Books, etc.
              </Text>
            </View>
          </View>
          <Switch
            value={trackApps}
            onValueChange={setTrackApps}
            trackColor={{
              false: theme.border.strong,
              true: `${accentColor}80`,
            }}
            thumbColor={trackApps ? accentColor : theme.text.tertiary}
          />
        </Animated.View>

        {trackApps && (
          <View style={s.appHintCard}>
            <Text style={s.appHintText}>
              You can select specific reading apps in Settings after setup.
            </Text>
          </View>
        )}

        {/* Info card */}
        <Animated.View style={[s.infoCard, infoAnim]}>
          <Text style={s.infoText}>
            Use the in-app reading timer to log{" "}
            <Text style={s.infoHighlight}>{goalMinutes} minutes</Text> of
            reading each day. Your apps unlock once you finish.
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
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
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
      fontSize: typeScale.statMedium.size,
      fontWeight: typeScale.statMedium.weight,
      lineHeight: typeScale.statMedium.lineHeight,
    },
    stepperUnit: {
      fontFamily: "System",
      fontSize: typeScale.footnote.size,
      fontWeight: typeScale.footnote.weight,
      color: theme.text.secondary,
      marginTop: spacing[1],
    },
    toggleCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.default,
      borderRadius: borderRadius.lg,
      padding: spacing[4],
      marginBottom: spacing[3],
    },
    toggleContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      flex: 1,
    },
    toggleText: {
      flex: 1,
      gap: spacing[1],
    },
    toggleTitle: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: "600",
      color: theme.text.primary,
    },
    toggleDescription: {
      fontFamily: "System",
      fontSize: typeScale.caption1.size,
      fontWeight: typeScale.caption1.weight,
      color: theme.text.tertiary,
    },
    appHintCard: {
      backgroundColor: theme.bg.subtle,
      borderRadius: borderRadius.md,
      padding: spacing[3],
      marginBottom: spacing[3],
    },
    appHintText: {
      fontFamily: "System",
      fontSize: typeScale.caption1.size,
      fontWeight: typeScale.caption1.weight,
      color: theme.text.secondary,
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
