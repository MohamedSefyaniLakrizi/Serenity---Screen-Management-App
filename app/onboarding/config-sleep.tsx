import { borderRadius, spacing, typeScale } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useOnboardingStore } from "@/store/onboardingStore";
import { router } from "expo-router";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import React, { useState } from "react";
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

type TimeField = "bedtimeHour" | "bedtimeMinute" | "wakeHour" | "wakeMinute";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatTime(hour: number, minute: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${pad(minute)} ${period}`;
}

export default function ConfigSleepScreen() {
  const theme = useThemedColors();
  const { setHabitConfig } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext(
    "/onboarding/config-sleep",
  );

  const [bedtimeHour, setBedtimeHour] = useState(22);
  const [bedtimeMinute, setBedtimeMinute] = useState(0);
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMinute, setWakeMinute] = useState(0);

  const [titleAnim, subtitleAnim, bedtimeAnim, wakeAnim, infoAnim, buttonAnim] =
    useSequentialFadeIn(6, { duration: 300, stagger: 180 });

  const adjustField = (field: TimeField, delta: number) => {
    if (field === "bedtimeHour") {
      setBedtimeHour((h) => (h + delta + 24) % 24);
    } else if (field === "bedtimeMinute") {
      setBedtimeMinute((m) => (m + delta * 15 + 60) % 60);
    } else if (field === "wakeHour") {
      setWakeHour((h) => (h + delta + 24) % 24);
    } else if (field === "wakeMinute") {
      setWakeMinute((m) => (m + delta * 15 + 60) % 60);
    }
  };

  const handleContinue = () => {
    setHabitConfig("sleep", {
      type: "sleep",
      bedtime: `${pad(bedtimeHour)}:${pad(bedtimeMinute)}`,
      wakeTime: `${pad(wakeHour)}:${pad(wakeMinute)}`,
    });
    navigateNext();
  };

  const s = styles(theme);
  const accentColor = theme.habitAccent.sleep;

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

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text style={[s.title, titleAnim]}>
          Sleep Schedule
        </Animated.Text>
        <Animated.Text style={[s.subtitle, subtitleAnim]}>
          Set your bedtime and wake time. Your apps will lock at bedtime and
          unlock when you wake up.
        </Animated.Text>

        {/* Bedtime picker */}
        <Animated.View style={[s.timeCard, bedtimeAnim]}>
          <Text style={s.timeCardLabel}>Bedtime</Text>
          <View style={s.timePicker}>
            <TimeColumn
              value={bedtimeHour}
              onIncrement={() => adjustField("bedtimeHour", 1)}
              onDecrement={() => adjustField("bedtimeHour", -1)}
              accentColor={accentColor}
              theme={theme}
              s={s}
            />
            <Text style={s.timeSeparator}>:</Text>
            <TimeColumn
              value={bedtimeMinute}
              onIncrement={() => adjustField("bedtimeMinute", 1)}
              onDecrement={() => adjustField("bedtimeMinute", -1)}
              accentColor={accentColor}
              theme={theme}
              s={s}
            />
          </View>
          <Text style={s.timeDisplay}>
            {formatTime(bedtimeHour, bedtimeMinute)}
          </Text>
        </Animated.View>

        {/* Wake time picker */}
        <Animated.View style={[s.timeCard, wakeAnim]}>
          <Text style={s.timeCardLabel}>Wake Time</Text>
          <View style={s.timePicker}>
            <TimeColumn
              value={wakeHour}
              onIncrement={() => adjustField("wakeHour", 1)}
              onDecrement={() => adjustField("wakeHour", -1)}
              accentColor={accentColor}
              theme={theme}
              s={s}
            />
            <Text style={s.timeSeparator}>:</Text>
            <TimeColumn
              value={wakeMinute}
              onIncrement={() => adjustField("wakeMinute", 1)}
              onDecrement={() => adjustField("wakeMinute", -1)}
              accentColor={accentColor}
              theme={theme}
              s={s}
            />
          </View>
          <Text style={s.timeDisplay}>{formatTime(wakeHour, wakeMinute)}</Text>
        </Animated.View>

        {/* Info card */}
        <Animated.View style={[s.infoCard, infoAnim]}>
          <Text style={s.infoText}>
            If you use your phone after bedtime, the lock will move{" "}
            <Text style={s.infoHighlight}>30 minutes earlier</Text> the next
            day. Three good nights in a row and it resets.
          </Text>
        </Animated.View>
      </ScrollView>

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

type StylesType = ReturnType<typeof styles>;
type ThemeType = ReturnType<typeof useThemedColors>;

function TimeColumn({
  value,
  onIncrement,
  onDecrement,
  accentColor,
  theme,
  s,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  accentColor: string;
  theme: ThemeType;
  s: StylesType;
}) {
  return (
    <View style={s.timeColumn}>
      <TouchableOpacity
        onPress={onIncrement}
        activeOpacity={0.7}
        style={s.timeArrow}
      >
        <ChevronUp size={20} color={accentColor} strokeWidth={2} />
      </TouchableOpacity>
      <Text style={s.timeValue}>{pad(value)}</Text>
      <TouchableOpacity
        onPress={onDecrement}
        activeOpacity={0.7}
        style={s.timeArrow}
      >
        <ChevronDown size={20} color={accentColor} strokeWidth={2} />
      </TouchableOpacity>
    </View>
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing[6],
      paddingTop: spacing[6],
      paddingBottom: spacing[4],
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
    timeCard: {
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.default,
      borderRadius: borderRadius.lg,
      padding: spacing[5],
      marginBottom: spacing[4],
      alignItems: "center",
      gap: spacing[3],
    },
    timeCardLabel: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: "600",
      color: theme.text.secondary,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    timePicker: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    timeColumn: {
      alignItems: "center",
      gap: spacing[2],
    },
    timeArrow: {
      padding: spacing[2],
    },
    timeValue: {
      fontFamily: "Menlo",
      fontSize: typeScale.statMedium.size,
      fontWeight: typeScale.statMedium.weight,
      color: theme.text.primary,
      lineHeight: typeScale.statMedium.lineHeight,
      minWidth: 64,
      textAlign: "center",
    },
    timeSeparator: {
      fontFamily: "Menlo",
      fontSize: typeScale.statMedium.size,
      fontWeight: "700",
      color: theme.text.secondary,
      marginBottom: spacing[2],
    },
    timeDisplay: {
      fontFamily: "System",
      fontSize: typeScale.footnote.size,
      fontWeight: typeScale.footnote.weight,
      color: theme.text.tertiary,
    },
    infoCard: {
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.default,
      borderRadius: borderRadius.lg,
      padding: spacing[4],
      marginTop: spacing[2],
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
