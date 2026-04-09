import { borderRadius, spacing, typeScale } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { router } from "expo-router";
import { Layers, Target, TrendingUp } from "lucide-react-native";
import React from "react";
import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const CARDS = [
  {
    icon: Target,
    title: "Choose Your Habits",
    description:
      "Pick from 7 life-changing habits — screen time, study, fitness, sleep, prayer, meditation, or reading.",
  },
  {
    icon: Layers,
    title: "Build One at a Time",
    description:
      "Focus entirely on your top priority for 60 days. Your apps stay blocked until you complete it each day.",
  },
  {
    icon: TrendingUp,
    title: "Stack & Grow",
    description:
      "After 60 days your habit is locked in. Then Serenity adds the next one on top, building a permanent stack.",
  },
] as const;

export default function HowItWorksScreen() {
  const theme = useThemedColors();
  const { navigateNext, navigatePrev, progressFraction } = useOnboardingNext(
    "/onboarding/how-it-works",
  );

  const [card1Anim, card2Anim, card3Anim, buttonAnim] = useSequentialFadeIn(4, {
    duration: 350,
    stagger: 200,
  });

  const cardAnims = [card1Anim, card2Anim, card3Anim];

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
        <Text style={s.title}>How It Works</Text>
        <Text style={s.subtitle}>
          Serenity is a habit-building system, not just a screen time tracker.
        </Text>

        <View style={s.cards}>
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <Animated.View key={card.title} style={[s.card, cardAnims[i]]}>
                <Icon
                  size={20}
                  color={theme.text.secondary}
                  strokeWidth={1.5}
                />
                <View style={s.cardText}>
                  <Text style={s.cardTitle}>{card.title}</Text>
                  <Text style={s.cardDescription}>{card.description}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* CTA */}
      <Animated.View style={[s.actions, buttonAnim]}>
        <TouchableOpacity
          style={s.button}
          activeOpacity={0.8}
          onPress={navigateNext}
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
    cards: {
      gap: spacing[3],
    },
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[4],
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.subtle,
      borderRadius: borderRadius.lg,
      padding: spacing[5],
    },
    cardText: {
      flex: 1,
      gap: spacing[1],
    },
    cardTitle: {
      fontFamily: "System",
      fontSize: typeScale.headline.size,
      fontWeight: typeScale.headline.weight,
      lineHeight: typeScale.headline.lineHeight,
      color: theme.text.primary,
    },
    cardDescription: {
      fontFamily: "System",
      fontSize: typeScale.callout.size,
      fontWeight: typeScale.callout.weight,
      lineHeight: typeScale.callout.lineHeight,
      color: theme.text.secondary,
    },
    actions: {
      paddingHorizontal: spacing[6],
      paddingBottom: spacing[6],
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
