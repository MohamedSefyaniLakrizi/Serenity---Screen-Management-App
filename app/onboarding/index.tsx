import { FONTS, spacing, typography } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useRef } from "react";
import {
  Image,
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

  // Sequential fade-in animations for all elements
  const [
    screenFade,
    mascotAnim,
    headingAnim,
    subtitleAnim,
    descriptionAnim,
    buttonAnim,
  ] = useSequentialFadeIn(6, {
    duration: 400,
    stagger: 400,
    initialDelay: 300,
  });

  return (
    <SafeAreaView style={styles(theme).container} edges={["top", "bottom"]}>
      <StatusBar barStyle={theme.statusBar} />

      <Animated.View style={[styles(theme).content, screenFade]}>
        {/* Logo Animation */}
        <Animated.View style={[mascotAnim]}>
          <LottieView
            ref={lottieRef}
            source={require("../../assets/videos/Logo-Animation.json")}
            autoPlay
            loop={false}
            style={styles(theme).mascot}
          />
          <Image
            source={require("../../assets/images/stones.png")}
            style={styles(theme).stoneImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text Content */}
        <View style={styles(theme).textContent}>
          <Animated.Text style={[styles(theme).heading, headingAnim]}>
            Take Back Control
          </Animated.Text>

          <Animated.Text style={[styles(theme).subtitle, subtitleAnim]}>
            I'm here to help you in your everyday life!
          </Animated.Text>

          <Animated.Text style={[styles(theme).description, descriptionAnim]}>
            Serenity awaits you
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Button */}
      <Animated.View style={[styles(theme).actions, buttonAnim]}>
        <TouchableOpacity
          style={styles(theme).button}
          activeOpacity={0.8}
          onPress={() => router.push("/onboarding/name-input")}
        >
          <Text style={styles(theme).buttonText}>Let's get started</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = (theme: ReturnType<typeof useThemedColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
      alignItems: "center",
    },
    mascotContainer: {
      alignItems: "center",
      marginBottom: spacing.xxl,
    },
    mascot: {
      width: 250,
      height: 250,
      alignItems: "center",
    },
    stoneImage: {
      height: 200,
      width: 200,
      marginTop: -spacing.lg,
      marginBottom: spacing.lg,
      alignSelf: "center",
    },
    textContent: {
      alignItems: "center",
    },
    heading: {
      fontSize: typography.display,
      fontFamily: FONTS.loraBold,
      color: theme.textPrimary,
      marginBottom: spacing.md,
      lineHeight: 54,
      textAlign: "center",
    },
    subtitle: {
      fontSize: typography.h3,
      fontFamily: FONTS.interMedium,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: spacing.sm,
      lineHeight: 26,
    },
    description: {
      fontSize: typography.sizes.bodyLarge,
      fontFamily: FONTS.interRegular,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 24,
    },
    actions: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
    },
    button: {
      backgroundColor: theme.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: 16,
      width: "100%",
      alignItems: "center",
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: typography.h3,
      fontFamily: FONTS.loraBold,
    },
  });
