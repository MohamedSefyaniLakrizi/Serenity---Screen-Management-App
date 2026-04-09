import { Button, Card, Input } from "@/components/ui";
import { borderRadius, colors, spacing, typography } from "@/constants";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useAppStore } from "@/store/appStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePurchasesStore } from "@/store/purchasesStore";
import { useThemeStore } from "@/store/themeStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
    Bell,
    ChevronRight,
    Crown,
    FlaskConical,
    Info,
    Moon,
    Settings2,
    Shield,
    Smartphone,
    Sun,
    User,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Purchases from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";

export default function SettingsScreen() {
  const { userPreferences, setUserPreferences, loadFromStorage } =
    useAppStore();
  const { themeMode, setThemeMode } = useThemeStore();
  const { resetOnboarding } = useOnboardingStore();
  const themedColors = useThemedColors();

  // RevenueCat
  const { isPro, customerInfo, showPaywall, restore, isPurchasing } =
    useRevenueCat();

  const [dailyLimit, setDailyLimit] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState("");

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (userPreferences) {
      setDailyLimit((userPreferences.dailyLimit || 120).toString());
      setNotifications(userPreferences.notificationsEnabled);
      setReminderFrequency(
        (userPreferences.reminderFrequency || 30).toString(),
      );
    }
  }, [userPreferences]);

  const saveSettings = () => {
    const limitNum = parseInt(dailyLimit);
    const freqNum = parseInt(reminderFrequency);

    if (isNaN(limitNum) || limitNum <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid daily limit");
      return;
    }

    if (isNaN(freqNum) || freqNum <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid reminder frequency");
      return;
    }

    setUserPreferences({
      dailyLimit: limitNum,
      notificationsEnabled: notifications,
      reminderFrequency: freqNum,
    });

    Alert.alert("Success", "Settings saved successfully!");
  };

  // -------------------------------------------------------------------------
  // RevenueCat handlers
  // -------------------------------------------------------------------------

  const handleUpgrade = async () => {
    await showPaywall();
  };

  const handleManageSubscription = async () => {
    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onRestoreCompleted: ({ customerInfo }) => {
            console.log(
              "[CustomerCenter] Restore completed:",
              customerInfo.entitlements.active,
            );
          },
          onRestoreFailed: ({ error }) => {
            console.error("[CustomerCenter] Restore failed:", error);
          },
          onShowingManageSubscriptions: () => {
            console.log("[CustomerCenter] Showing manage subscriptions");
          },
          onFeedbackSurveyCompleted: ({ feedbackSurveyOptionId }) => {
            console.log(
              "[CustomerCenter] Feedback survey:",
              feedbackSurveyOptionId,
            );
          },
        },
      });
    } catch (err) {
      console.error("[CustomerCenter] Error:", err);
    }
  };

  const handleRestorePurchases = async () => {
    const result = await restore();
    if (result.success) {
      const hasEntitlement =
        result.customerInfo?.entitlements.active["Serenity Pro"];
      Alert.alert(
        "Purchases Restored",
        hasEntitlement
          ? "Welcome back! Serenity Pro has been restored."
          : "No previous purchases found for this account.",
      );
    } else {
      Alert.alert(
        "Restore Failed",
        "Could not restore purchases. Please try again.",
      );
    }
  };

  const handleRemovePremium = async () => {
    Alert.alert(
      "Remove Premium (Dev)",
      "This will invalidate the local RevenueCat cache and force the app into non-premium mode. Useful for testing paywalls.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await Purchases.invalidateCustomerInfoCache();
              usePurchasesStore.setState({ isPro: false, customerInfo: null });
              Alert.alert(
                "Done",
                "Premium removed for this session. Restart or re-fetch to sync with RevenueCat.",
              );
            } catch (err) {
              console.error("[Dev] removePremium error:", err);
              Alert.alert("Error", "Could not remove premium.");
            }
          },
        },
      ],
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      "Reset Onboarding",
      "This will clear all data and return you to onboarding. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "onboardingCompleted",
                "onboardingData",
                "userPreferences",
                "todayData",
                "streakData",
                "@app_groups",
                "@theme_mode",
              ]);
              // Use the store's reset method — emits ONBOARDING_RESET event
              // which causes _layout.tsx to navigate to onboarding automatically
              resetOnboarding();
            } catch (error) {
              Alert.alert("Error", "Failed to reset app");
            }
          },
        },
      ],
    );
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minutes`;
    return `${hours} hour${hours > 1 ? "s" : ""} ${mins > 0 ? `${mins} min` : ""}`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themedColors.background }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themedColors.textPrimary }]}>
            Settings
          </Text>
          <Text
            style={[styles.subtitle, { color: themedColors.textSecondary }]}
          >
            Manage your preferences
          </Text>
        </View>

        {/* Upgrade Banner for free users */}
        {!isPro && (
          <TouchableOpacity
            onPress={handleUpgrade}
            style={styles.upgradeBanner}
            activeOpacity={0.8}
          >
            <View style={styles.upgradeBannerContent}>
              <Crown size={20} color="#fff" />
              <View style={styles.upgradeBannerText}>
                <Text style={styles.upgradeBannerTitle}>Upgrade to Serenity Pro</Text>
                <Text style={styles.upgradeBannerSubtitle}>Unlimited groups, flexible blocking & more</Text>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>
        )}

        {/* Theme Selection */}
        <Card style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: themedColors.textPrimary }]}
          >
            Appearance
          </Text>
          <Text
            style={[
              styles.sectionDescription,
              { color: themedColors.textSecondary },
            ]}
          >
            Choose your preferred theme
          </Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { borderColor: themedColors.border },
                themeMode === "light" && {
                  borderColor: themedColors.primary,
                  borderWidth: 2,
                },
              ]}
              onPress={() => setThemeMode("light")}
            >
              <Sun
                size={24}
                color={
                  themeMode === "light"
                    ? themedColors.primary
                    : themedColors.textSecondary
                }
              />
              <Text
                style={[
                  styles.themeOptionText,
                  {
                    color:
                      themeMode === "light"
                        ? themedColors.primary
                        : themedColors.textSecondary,
                  },
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { borderColor: themedColors.border },
                themeMode === "dark" && {
                  borderColor: themedColors.primary,
                  borderWidth: 2,
                },
              ]}
              onPress={() => setThemeMode("dark")}
            >
              <Moon
                size={24}
                color={
                  themeMode === "dark"
                    ? themedColors.primary
                    : themedColors.textSecondary
                }
              />
              <Text
                style={[
                  styles.themeOptionText,
                  {
                    color:
                      themeMode === "dark"
                        ? themedColors.primary
                        : themedColors.textSecondary,
                  },
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { borderColor: themedColors.border },
                themeMode === "system" && {
                  borderColor: themedColors.primary,
                  borderWidth: 2,
                },
              ]}
              onPress={() => setThemeMode("system")}
            >
              <Smartphone
                size={24}
                color={
                  themeMode === "system"
                    ? themedColors.primary
                    : themedColors.textSecondary
                }
              />
              <Text
                style={[
                  styles.themeOptionText,
                  {
                    color:
                      themeMode === "system"
                        ? themedColors.primary
                        : themedColors.textSecondary,
                  },
                ]}
              >
                System
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Daily Limit */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Screen Time Goal</Text>
          <Text style={styles.sectionDescription}>
            Set your daily screen time limit in minutes
          </Text>
          <Input
            value={dailyLimit}
            onChangeText={setDailyLimit}
            keyboardType="numeric"
            placeholder="120"
            style={styles.input}
          />
          <Text style={styles.helperText}>
            Current: {formatTime(parseInt(dailyLimit) || 120)}
          </Text>
        </Card>

        {/* Notifications */}
        <Card style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Bell size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingDescription}>
                  Get reminders and updates
                </Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {/* Reminder Frequency */}
        {notifications && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Reminder Frequency</Text>
            <Text style={styles.sectionDescription}>
              How often to remind you (in minutes)
            </Text>
            <Input
              value={reminderFrequency}
              onChangeText={setReminderFrequency}
              keyboardType="numeric"
              placeholder="30"
              style={styles.input}
            />
            <Text style={styles.helperText}>
              Current: Every {reminderFrequency || 30} minutes
            </Text>
          </Card>
        )}

        {/* Goal Selection */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Your Goal</Text>
          <Text style={styles.settingDescription}>
            Current goal:{" "}
            {userPreferences?.goal?.replace("-", " ").toUpperCase() ||
              "Not set"}
          </Text>
          <Text style={styles.helperText}>
            To change your goal, reset the app and go through onboarding again
          </Text>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* Serenity Pro / Subscription                                         */}
        {/* ------------------------------------------------------------------ */}
        <Card style={{ ...styles.section, ...styles.proCard }}>
          {/* Status row */}
          <View style={styles.proHeader}>
            <Crown
              size={22}
              color={isPro ? "#F5A623" : themedColors.textSecondary}
            />
            <View style={styles.proHeaderText}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: themedColors.textPrimary, marginBottom: 0 },
                ]}
              >
                Serenity Pro
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: isPro ? "#4CAF50" : themedColors.textSecondary },
                ]}
              >
                {isPro ? "✓ Active" : "Free plan"}
              </Text>
            </View>
          </View>

          {!isPro && (
            <>
              <Text
                style={[
                  styles.sectionDescription,
                  { color: themedColors.textSecondary, marginTop: spacing.sm },
                ]}
              >
                Unlock unlimited app groups, advanced analytics, and more.
              </Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
                disabled={isPurchasing}
                accessibilityLabel="Upgrade to Serenity Pro"
              >
                <Crown size={16} color="#fff" />
                <Text style={styles.upgradeButtonText}>
                  {isPurchasing ? "Processing…" : "Upgrade to Pro"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {isPro && (
            <TouchableOpacity
              style={styles.linkItem}
              onPress={handleManageSubscription}
              accessibilityLabel="Manage subscription"
            >
              <Settings2 size={20} color={themedColors.textSecondary} />
              <Text
                style={[styles.linkText, { color: themedColors.textPrimary }]}
              >
                Manage Subscription
              </Text>
              <ChevronRight size={20} color={themedColors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Restore is always available */}
          <TouchableOpacity
            style={[styles.linkItem, { marginTop: spacing.xs }]}
            onPress={handleRestorePurchases}
            disabled={isPurchasing}
            accessibilityLabel="Restore purchases"
          >
            <Shield size={20} color={themedColors.textSecondary} />
            <Text
              style={[styles.linkText, { color: themedColors.textPrimary }]}
            >
              Restore Purchases
            </Text>
            <ChevronRight size={20} color={themedColors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Quick Links */}
        <View style={styles.linksSection}>
          <TouchableOpacity style={styles.linkItem}>
            <User size={20} color={colors.textSecondary} />
            <Text style={styles.linkText}>Account Information</Text>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkItem}>
            <Shield size={20} color={colors.textSecondary} />
            <Text style={styles.linkText}>Privacy & Security</Text>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkItem}>
            <Info size={20} color={colors.textSecondary} />
            <Text style={styles.linkText}>About Serenity</Text>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <Button
          title="Save Changes"
          onPress={saveSettings}
          style={styles.saveButton}
        />

        {/* ------------------------------------------------------------------ */}
        {/* DEV: Mindful Pause Testing                                           */}
        {/* ------------------------------------------------------------------ */}
        {__DEV__ && (
          <Card style={StyleSheet.flatten([styles.section, styles.devCard])}>
            <View style={styles.devHeader}>
              <FlaskConical size={18} color="#9B59B6" />
              <Text style={[styles.sectionTitle, styles.devTitle]}>
                Dev: Shield Screen Testing
              </Text>
            </View>
            <Text
              style={[styles.sectionDescription, { marginBottom: spacing.md }]}
            >
              Directly open the Mindful Pause screen in each mode without
              needing a real blocked app.
            </Text>

            {/* Limited app row */}
            <TouchableOpacity
              style={styles.devRow}
              onPress={() =>
                router.push("/mindful-pause?groupId=__dev_limited__")
              }
              accessibilityLabel="Test limited app shield"
            >
              <View style={[styles.devDot, { backgroundColor: "#27AE60" }]} />
              <View style={styles.devRowText}>
                <Text style={styles.devRowTitle}>Limited app (hold 5 s)</Text>
                <Text style={styles.devRowDesc}>
                  Social Media group — 2 unlocks remaining today
                </Text>
              </View>
              <ChevronRight size={18} color="#9B59B6" />
            </TouchableOpacity>

            <View style={styles.devDivider} />

            {/* Blocked app row */}
            <TouchableOpacity
              style={styles.devRow}
              onPress={() =>
                router.push("/mindful-pause?groupId=__dev_blocked__")
              }
              accessibilityLabel="Test blocked app shield"
            >
              <View style={[styles.devDot, { backgroundColor: "#E74C3C" }]} />
              <View style={styles.devRowText}>
                <Text style={styles.devRowTitle}>Blocked app (close only)</Text>
                <Text style={styles.devRowDesc}>
                  Games group — permanently blocked
                </Text>
              </View>
              <ChevronRight size={18} color="#9B59B6" />
            </TouchableOpacity>

            {/* Zero-unlocks edge case */}
            <View style={styles.devDivider} />
            <TouchableOpacity
              style={styles.devRow}
              onPress={() =>
                router.push("/mindful-pause?groupId=__dev_no_unlocks__")
              }
              accessibilityLabel="Test no unlocks remaining"
            >
              <View style={[styles.devDot, { backgroundColor: "#F39C12" }]} />
              <View style={styles.devRowText}>
                <Text style={styles.devRowTitle}>No unlocks left</Text>
                <Text style={styles.devRowDesc}>
                  Limited group at 0 remaining — same blocked UI + random quote
                </Text>
              </View>
              <ChevronRight size={18} color="#9B59B6" />
            </TouchableOpacity>
          </Card>
        )}

        {/* Reset Button — dev builds only */}
        {__DEV__ && (
          <Button
            title="Reset to Onboarding"
            variant="outline"
            onPress={handleResetOnboarding}
            style={styles.resetButton}
          />
        )}

        {/* Remove Premium — dev builds only */}
        {__DEV__ && (
          <Button
            title="Remove Premium (Dev)"
            variant="outline"
            onPress={handleRemovePremium}
            style={StyleSheet.flatten([
              styles.resetButton,
              { borderColor: "#E74C3C", marginTop: 0 },
            ])}
          />
        )}

        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  upgradeBanner: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  upgradeBannerContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.sm,
  },
  upgradeBannerText: {
    flex: 1,
  },
  upgradeBannerTitle: {
    fontSize: 15,
    fontWeight: typography.semibold,
    color: "#fff",
    marginBottom: 2,
  },
  upgradeBannerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  title: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginBottom: spacing.xs / 2,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textGray,
  },

  // Sections
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.small,
    color: colors.textGray,
    marginBottom: spacing.md,
  },
  helperText: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
  input: {
    marginBottom: spacing.xs,
  },

  // Setting Row
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.textDark,
    marginBottom: spacing.xxs,
  },
  settingDescription: {
    fontSize: typography.small,
    color: colors.textGray,
  },

  // Theme Options
  themeOptions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  themeOptionText: {
    fontSize: typography.small,
    fontWeight: typography.medium,
  },

  // Links
  linksSection: {
    marginBottom: spacing.xl,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.xs,
  },
  linkText: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textDark,
    fontWeight: typography.medium,
  },

  // Buttons
  saveButton: {
    marginBottom: spacing.md,
  },
  resetButton: {
    marginBottom: spacing.lg,
  },

  // Serenity Pro card
  proCard: {
    borderWidth: 1,
    borderColor: "rgba(245, 166, 35, 0.3)",
  },
  proHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  proHeaderText: {
    flex: 1,
    gap: 2,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: "#F5A623",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: typography.body,
    fontWeight: typography.semibold,
  },

  // Dev testing card
  devCard: {
    borderWidth: 1,
    borderColor: "rgba(155, 89, 182, 0.35)",
    backgroundColor: "rgba(155, 89, 182, 0.04)",
  },
  devHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  devTitle: {
    color: "#9B59B6",
    marginBottom: 0,
  },
  devRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  devDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  devRowText: {
    flex: 1,
  },
  devRowTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.textDark,
  },
  devRowDesc: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  devDivider: {
    height: 1,
    backgroundColor: "rgba(155, 89, 182, 0.15)",
    marginVertical: 2,
  },

  // Version
  version: {
    fontSize: typography.small,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
