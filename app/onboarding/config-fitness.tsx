import { borderRadius, spacing, typeScale } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useOnboardingStore } from "@/store/onboardingStore";
import { FitnessGoalType } from "@/types/habits";
import { router } from "expo-router";
import { Activity, Dumbbell, Flame, Minus, Plus } from "lucide-react-native";
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

type GoalOption = {
  type: FitnessGoalType;
  label: string;
  description: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  Icon: React.ComponentType<{
    size: number;
    color: string;
    strokeWidth: number;
  }>;
};

const GOAL_OPTIONS: GoalOption[] = [
  {
    type: "steps",
    label: "Steps",
    description: "Daily step count",
    unit: "steps",
    min: 1000,
    max: 30000,
    step: 1000,
    defaultValue: 8000,
    Icon: Activity,
  },
  {
    type: "workout",
    label: "Workout",
    description: "Active exercise time",
    unit: "min",
    min: 15,
    max: 120,
    step: 15,
    defaultValue: 30,
    Icon: Dumbbell,
  },
  {
    type: "calories",
    label: "Calories",
    description: "Active energy burned",
    unit: "kcal",
    min: 100,
    max: 1000,
    step: 50,
    defaultValue: 300,
    Icon: Flame,
  },
];

export default function ConfigFitnessScreen() {
  const theme = useThemedColors();
  const { setHabitConfig } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext(
    "/onboarding/config-fitness",
  );

  const [selectedType, setSelectedType] = useState<FitnessGoalType>("steps");
  const [values, setValues] = useState<Record<FitnessGoalType, number>>({
    steps: 8000,
    workout: 30,
    calories: 300,
  });

  const [titleAnim, subtitleAnim, typeAnim, stepperAnim, infoAnim, buttonAnim] =
    useSequentialFadeIn(6, { duration: 300, stagger: 180 });

  const currentOption = GOAL_OPTIONS.find((o) => o.type === selectedType)!;
  const currentValue = values[selectedType];

  const decrement = () => {
    setValues((v) => ({
      ...v,
      [selectedType]: Math.max(
        currentOption.min,
        v[selectedType] - currentOption.step,
      ),
    }));
  };
  const increment = () => {
    setValues((v) => ({
      ...v,
      [selectedType]: Math.min(
        currentOption.max,
        v[selectedType] + currentOption.step,
      ),
    }));
  };

  const handleSelectType = (type: FitnessGoalType) => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    setHabitConfig("fitness", {
      type: "fitness",
      goalType: selectedType,
      goalValue: currentValue,
    });
    navigateNext();
  };

  const s = styles(theme);
  const accentColor = theme.habitAccent.fitness;

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
        <Animated.Text style={[s.title, titleAnim]}>Fitness Goal</Animated.Text>
        <Animated.Text style={[s.subtitle, subtitleAnim]}>
          What fitness target do you want to hit each day?
        </Animated.Text>

        {/* Goal type selector */}
        <Animated.View style={[s.typeSelector, typeAnim]}>
          {GOAL_OPTIONS.map((option) => {
            const selected = option.type === selectedType;
            const { Icon } = option;
            return (
              <TouchableOpacity
                key={option.type}
                style={[
                  s.typeCard,
                  selected && {
                    borderColor: accentColor,
                    backgroundColor: `${accentColor}10`,
                  },
                ]}
                activeOpacity={0.75}
                onPress={() => handleSelectType(option.type)}
              >
                <Icon
                  size={20}
                  color={selected ? accentColor : theme.text.secondary}
                  strokeWidth={1.5}
                />
                <Text
                  style={[
                    s.typeLabel,
                    selected && { color: theme.text.primary },
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={s.typeDescription}>{option.description}</Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Value stepper */}
        <Animated.View style={[s.stepperWrapper, stepperAnim]}>
          <TouchableOpacity
            style={[
              s.stepperBtn,
              {
                borderColor: `${accentColor}40`,
                backgroundColor: `${accentColor}15`,
              },
              currentValue <= currentOption.min && s.stepperBtnDisabled,
            ]}
            onPress={decrement}
            activeOpacity={0.7}
            disabled={currentValue <= currentOption.min}
          >
            <Minus
              size={22}
              color={
                currentValue <= currentOption.min
                  ? theme.text.disabled
                  : accentColor
              }
              strokeWidth={2}
            />
          </TouchableOpacity>

          <View style={s.stepperValue}>
            <Text style={s.stepperNumber}>{currentValue.toLocaleString()}</Text>
            <Text style={s.stepperUnit}>{currentOption.unit}</Text>
          </View>

          <TouchableOpacity
            style={[
              s.stepperBtn,
              {
                borderColor: `${accentColor}40`,
                backgroundColor: `${accentColor}15`,
              },
              currentValue >= currentOption.max && s.stepperBtnDisabled,
            ]}
            onPress={increment}
            activeOpacity={0.7}
            disabled={currentValue >= currentOption.max}
          >
            <Plus
              size={22}
              color={
                currentValue >= currentOption.max
                  ? theme.text.disabled
                  : accentColor
              }
              strokeWidth={2}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Info card */}
        <Animated.View style={[s.infoCard, infoAnim]}>
          <Text style={s.infoText}>
            Serenity will read your fitness data from{" "}
            <Text style={s.infoHighlight}>Apple Health</Text> to verify your
            goal automatically. No manual logging needed.
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
    typeSelector: {
      flexDirection: "row",
      gap: spacing[3],
      marginBottom: spacing[8],
    },
    typeCard: {
      flex: 1,
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.default,
      borderRadius: borderRadius.lg,
      padding: spacing[3],
      alignItems: "center",
      gap: spacing[1],
    },
    typeLabel: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: "600",
      color: theme.text.secondary,
      marginTop: spacing[1],
    },
    typeDescription: {
      fontFamily: "System",
      fontSize: typeScale.caption2.size,
      fontWeight: typeScale.caption2.weight,
      color: theme.text.tertiary,
      textAlign: "center",
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
