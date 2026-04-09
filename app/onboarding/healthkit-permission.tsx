import { borderRadius, spacing, typeScale } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useOnboardingStore } from "@/store/onboardingStore";
import { router } from "expo-router";
import { Activity, ChevronLeft, ShieldCheck } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HealthKitPermissionScreen() {
  const theme = useThemedColors();
  const { updateData } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext(
    "/onboarding/healthkit-permission",
  );
  const [isLoading, setIsLoading] = useState(false);

  const [iconAnim, titleAnim, subtitleAnim, featureAnim, buttonAnim] =
    useSequentialFadeIn(5, { duration: 300, stagger: 200 });

  const requestHealthKitPermission = async () => {
    if (Platform.OS !== "ios") {
      navigateNext();
      return;
    }
    setIsLoading(true);
    try {
      // HealthKit native module will be added in Step 21.
      // For now, record the request and proceed.
      updateData({ healthKitPermissionGranted: true });
      navigateNext();
    } catch (error) {
      console.error("Error requesting HealthKit permission:", error);
      Alert.alert(
        "Permission Error",
        "Unable to request Apple Health access. You can enable it later in Settings.",
        [
          {
            text: "Skip for Now",
            onPress: () => {
              updateData({ healthKitPermissionGranted: false });
              navigateNext();
            },
          },
          { text: "Try Again", onPress: requestHealthKitPermission },
        ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const skip = () => {
    updateData({ healthKitPermissionGranted: false });
    navigateNext();
  };

  const s = styles(theme);

  return (
    <Animated.View style={[s.container, iconAnim]}>
      <SafeAreaView style={s.safeArea} edges={["top"]}>
        <StatusBar barStyle={theme.statusBar} />

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={theme.text.primary} strokeWidth={2} />
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <View
              style={[s.progressFill, { width: `${progressFraction * 100}%` }]}
            />
          </View>
        </View>

        {/* Content */}
        <View style={s.content}>
          {/* Icon badge */}
          <Animated.View style={[s.badgeRow, iconAnim]}>
            <View style={s.badge}>
              <ShieldCheck
                size={22}
                color={theme.accent.primary}
                strokeWidth={1.5}
              />
            </View>
            <View style={[s.badge, s.badgeSecondary]}>
              <Activity
                size={22}
                color={theme.habitAccent.fitness}
                strokeWidth={1.5}
              />
            </View>
          </Animated.View>

          <Animated.Text style={[s.title, titleAnim]}>
            Connect Apple Health
          </Animated.Text>
          <Animated.Text style={[s.subtitle, subtitleAnim]}>
            Serenity needs to read your fitness data to verify your workout
            {"goals and unlock your apps when you're done."}
          </Animated.Text>

          {/* Feature list */}
          <Animated.View style={[s.featureList, featureAnim]}>
            {[
              "Track steps, workouts, and active calories",
              "Auto-unlock when your fitness goal is met",
              "Your data stays private — never shared",
            ].map((item) => (
              <View key={item} style={s.featureItem}>
                <View
                  style={[
                    s.featureDot,
                    { backgroundColor: theme.habitAccent.fitness },
                  ]}
                />
                <Text style={s.featureText}>{item}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* CTA */}
        <Animated.View style={[s.actions, buttonAnim]}>
          <TouchableOpacity
            style={[s.button, isLoading && s.buttonDisabled]}
            activeOpacity={0.8}
            onPress={requestHealthKitPermission}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.buttonText}>Allow Access</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.skipButton}
            onPress={skip}
            activeOpacity={0.7}
          >
            <Text style={s.skipText}>Skip for Now</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = (theme: ReturnType<typeof useThemedColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg.primary,
    },
    safeArea: {
      flex: 1,
    },
    // ── Header ──────────────────────────────────
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
    // ── Content ─────────────────────────────────
    content: {
      flex: 1,
      paddingHorizontal: spacing[6],
      paddingTop: spacing[8],
      gap: spacing[4],
    },
    badgeRow: {
      flexDirection: "row",
      gap: spacing[3],
      marginBottom: spacing[2],
    },
    badge: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: `${theme.accent.primary}55`,
      backgroundColor: `${theme.accent.primary}15`,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeSecondary: {
      borderColor: `${theme.habitAccent.fitness}55`,
      backgroundColor: `${theme.habitAccent.fitness}15`,
    },
    title: {
      fontFamily: "System",
      fontSize: typeScale.title1.size,
      fontWeight: typeScale.title1.weight,
      lineHeight: typeScale.title1.lineHeight,
      color: theme.text.primary,
    },
    subtitle: {
      fontFamily: "System",
      fontSize: typeScale.callout.size,
      fontWeight: typeScale.callout.weight,
      lineHeight: typeScale.callout.lineHeight,
      color: theme.text.secondary,
    },
    featureList: {
      gap: spacing[3],
      marginTop: spacing[4],
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    featureDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    featureText: {
      fontFamily: "System",
      fontSize: typeScale.callout.size,
      fontWeight: typeScale.callout.weight,
      lineHeight: typeScale.callout.lineHeight,
      color: theme.text.secondary,
      flex: 1,
    },
    // ── Actions ─────────────────────────────────
    actions: {
      paddingHorizontal: spacing[6],
      paddingBottom: spacing[8],
      paddingTop: spacing[4],
      gap: spacing[3],
    },
    button: {
      backgroundColor: theme.accent.primary,
      paddingVertical: spacing[4],
      borderRadius: borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: "#FFFFFF",
      fontFamily: "System",
      fontSize: typeScale.headline.size,
      fontWeight: typeScale.headline.weight,
    },
    skipButton: {
      alignItems: "center",
      paddingVertical: spacing[2],
    },
    skipText: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: typeScale.subheadline.weight,
      color: theme.text.tertiary,
    },
  });
