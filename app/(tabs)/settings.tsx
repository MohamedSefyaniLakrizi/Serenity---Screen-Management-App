import { Button, Card, Input } from "@/components/ui";
import { borderRadius, colors, spacing, typography } from "@/constants";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useAppStore } from "@/store/appStore";
import { useThemeStore } from "@/store/themeStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Bell, ChevronRight, Info, Moon, Shield, Smartphone, Sun, User } from "lucide-react-native";
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

export default function SettingsScreen() {
  const router = useRouter();
  const { userPreferences, setUserPreferences, loadFromStorage } = useAppStore();
  const { themeMode, setThemeMode } = useThemeStore();
  const themedColors = useThemedColors();
  
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
      setReminderFrequency((userPreferences.reminderFrequency || 30).toString());
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

  const handleResetOnboarding = () => {
    Alert.alert(
      "Reset App",
      "This will clear all data and return you to onboarding. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'onboardingCompleted',
                'onboardingData',
                'fox',
                'userPreferences',
                'todayData',
                'appLimits',
                'categoryLimits',
                'streakData',
                '@app_groups',
                '@theme_mode',
              ]);
              router.replace('/onboarding/' as any);
            } catch (error) {
              Alert.alert("Error", "Failed to reset app");
            }
          },
        },
      ]
    );
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minutes`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins} min` : ''}`;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themedColors.textPrimary }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: themedColors.textSecondary }]}>Manage your preferences</Text>
        </View>

        {/* Theme Selection */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themedColors.textPrimary }]}>Appearance</Text>
          <Text style={[styles.sectionDescription, { color: themedColors.textSecondary }]}>
            Choose your preferred theme
          </Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { borderColor: themedColors.border },
                themeMode === 'light' && { borderColor: themedColors.primary, borderWidth: 2 }
              ]}
              onPress={() => setThemeMode('light')}
            >
              <Sun size={24} color={themeMode === 'light' ? themedColors.primary : themedColors.textSecondary} />
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === 'light' ? themedColors.primary : themedColors.textSecondary }
              ]}>
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { borderColor: themedColors.border },
                themeMode === 'dark' && { borderColor: themedColors.primary, borderWidth: 2 }
              ]}
              onPress={() => setThemeMode('dark')}
            >
              <Moon size={24} color={themeMode === 'dark' ? themedColors.primary : themedColors.textSecondary} />
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === 'dark' ? themedColors.primary : themedColors.textSecondary }
              ]}>
                Dark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { borderColor: themedColors.border },
                themeMode === 'system' && { borderColor: themedColors.primary, borderWidth: 2 }
              ]}
              onPress={() => setThemeMode('system')}
            >
              <Smartphone size={24} color={themeMode === 'system' ? themedColors.primary : themedColors.textSecondary} />
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === 'system' ? themedColors.primary : themedColors.textSecondary }
              ]}>
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
            Current goal: {userPreferences?.goal?.replace('-', ' ').toUpperCase() || 'Not set'}
          </Text>
          <Text style={styles.helperText}>
            To change your goal, reset the app and go through onboarding again
          </Text>
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

        {/* Reset Button */}
        <Button
          title="Reset App"
          variant="outline"
          onPress={handleResetOnboarding}
          style={styles.resetButton}
        />

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
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Version
  version: {
    fontSize: typography.small,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
