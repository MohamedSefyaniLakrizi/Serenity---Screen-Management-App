import { borderRadius, spacing, typeScale } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useOnboardingStore } from "@/store/onboardingStore";
import { router } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
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

export default function ThePactScreen() {
  const theme = useThemedColors();
  const { updateData } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext(
    "/onboarding/the-pact",
  );

  const [iconAnim, titleAnim, body1Anim, body2Anim, buttonAnim] =
    useSequentialFadeIn(5, { duration: 350, stagger: 180 });

  const handleAccept = () => {
    updateData({ pactAccepted: true });
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
        <Animated.View style={[s.iconWrapper, iconAnim]}>
          <ShieldCheck
            size={48}
            color={theme.accent.primary}
            strokeWidth={1.5}
          />
        </Animated.View>

        <Animated.Text style={[s.title, titleAnim]}>
          This is a Commitment
        </Animated.Text>

        <Animated.Text style={[s.body, body1Anim]}>
          Your apps will be blocked every day until you complete your habits.
          There are no shortcuts.
        </Animated.Text>

        <Animated.Text style={[s.body, body2Anim]}>
          This program works because it's strict. You're making a pact with
          yourself.
        </Animated.Text>
      </View>

      {/* CTA */}
      <Animated.View style={[s.actions, buttonAnim]}>
        <TouchableOpacity
          style={s.button}
          activeOpacity={0.8}
          onPress={handleAccept}
        >
          <Text style={s.buttonText}>I Understand</Text>
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
      paddingTop: spacing[10],
      alignItems: "center",
    },
    iconWrapper: {
      marginBottom: spacing[6],
    },
    title: {
      fontFamily: "System",
      fontSize: typeScale.title1.size,
      fontWeight: typeScale.title1.weight,
      lineHeight: typeScale.title1.lineHeight,
      color: theme.text.primary,
      textAlign: "center",
      marginBottom: spacing[6],
    },
    body: {
      fontFamily: "System",
      fontSize: typeScale.body.size,
      fontWeight: typeScale.body.weight,
      lineHeight: typeScale.body.lineHeight,
      color: theme.text.secondary,
      textAlign: "center",
      marginBottom: spacing[5],
      paddingHorizontal: spacing[2],
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
