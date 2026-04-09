import { borderRadius, spacing, typeScale } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors } from "@/hooks/useThemedStyles";
import LottieView from "lottie-react-native";
import React, { useRef } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const theme = useThemedColors();
  const lottieRef = useRef<LottieView>(null);
  const { navigateNext } = useOnboardingNext("/onboarding");

  const [logoAnim, titleAnim, subtitleAnim, buttonAnim] = useSequentialFadeIn(
    4,
    { duration: 400, stagger: 200, initialDelay: 300 },
  );

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <StatusBar barStyle={theme.statusBar} />

      <View style={s.content}>
        {/* Logo */}
        <Animated.View style={[s.logoWrapper, logoAnim]}>
          <LottieView
            ref={lottieRef}
            source={require("../../assets/videos/Logo-Animation.json")}
            autoPlay
            loop={false}
            style={s.lottie}
          />
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[s.title, titleAnim]}>
          Build Habits That Stick
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[s.subtitle, subtitleAnim]}>
          Serenity blocks your apps until you complete your daily habits. One
          habit at a time. Two months to build it. Then stack the next.
        </Animated.Text>
      </View>

      {/* CTA */}
      <Animated.View style={[s.actions, buttonAnim]}>
        <TouchableOpacity
          style={s.button}
          activeOpacity={0.8}
          onPress={navigateNext}
        >
          <Text style={s.buttonText}>Get Started</Text>
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
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: spacing[6],
      alignItems: "center",
    },
    logoWrapper: {
      alignItems: "center",
      marginBottom: spacing[8],
    },
    lottie: {
      width: 200,
      height: 200,
    },
    title: {
      fontFamily: "System",
      fontSize: typeScale.display.size,
      fontWeight: typeScale.display.weight,
      lineHeight: typeScale.display.lineHeight,
      color: theme.text.primary,
      textAlign: "center",
      marginBottom: spacing[4],
    },
    subtitle: {
      fontFamily: "System",
      fontSize: typeScale.callout.size,
      fontWeight: typeScale.callout.weight,
      lineHeight: typeScale.callout.lineHeight,
      color: theme.text.secondary,
      textAlign: "center",
      paddingHorizontal: spacing[4],
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
