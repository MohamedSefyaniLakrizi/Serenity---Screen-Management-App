import HabitConfigCard from "@/components/HabitConfigCard";
import { habitAccent } from "@/constants/colors";
import { borderRadius, spacing } from "@/constants/spacing";
import { typeScale } from "@/constants/typography";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { useThemedColors, useThemedStyles } from "@/hooks/useThemedStyles";
import { useHabitStore } from "@/store/habitStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePurchasesStore } from "@/store/purchasesStore";
import { useThemeStore } from "@/store/themeStore";
import type { Habit, HabitConfig, HabitType } from "@/types/habits";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import {
    BookOpen,
    BookText,
    Brain,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Crown,
    Dumbbell,
    FlaskConical,
    Hand,
    Moon,
    Plus,
    Settings2,
    Shield,
    Smartphone,
    Sun,
    X,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    AuthorizationStatus,
    DeviceActivitySelectionView,
    getAuthorizationStatus,
} from "react-native-device-activity";
import Purchases from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Habit meta ──────────────────────────────────────────────────────────────

const HABIT_LABELS: Record<HabitType, string> = {
  screentime: "Screen Time",
  study: "Study",
  fitness: "Fitness",
  sleep: "Sleep",
  prayer: "Prayer",
  meditation: "Meditation",
  reading: "Reading",
};

const ALL_HABIT_TYPES: HabitType[] = [
  "screentime",
  "study",
  "fitness",
  "sleep",
  "prayer",
  "meditation",
  "reading",
];

function HabitIcon({
  type,
  size = 18,
  color,
}: {
  type: HabitType;
  size?: number;
  color: string;
}) {
  const props = { size, color };
  switch (type) {
    case "screentime":
      return <Smartphone {...props} />;
    case "study":
      return <BookOpen {...props} />;
    case "fitness":
      return <Dumbbell {...props} />;
    case "sleep":
      return <Moon {...props} />;
    case "prayer":
      return <Hand {...props} />;
    case "meditation":
      return <Brain {...props} />;
    case "reading":
      return <BookText {...props} />;
  }
}

function defaultHabitConfig(type: HabitType): HabitConfig {
  switch (type) {
    case "screentime":
      return { type: "screentime", dailyLimitMinutes: 120 };
    case "study":
      return { type: "study", dailyGoalMinutes: 60 };
    case "fitness":
      return { type: "fitness", goalType: "steps", goalValue: 10000 };
    case "sleep":
      return { type: "sleep", bedtime: "22:00", wakeTime: "06:00" };
    case "prayer":
      return { type: "prayer", religion: "islam", prayerCount: 5 };
    case "meditation":
      return { type: "meditation", dailyGoalMinutes: 15 };
    case "reading":
      return { type: "reading", dailyGoalMinutes: 30 };
  }
}

export default function SettingsScreen() {
  const theme = useThemedColors();
  const { isDark } = useThemedStyles();
  const { themeMode, setThemeMode } = useThemeStore();
  const { resetOnboarding } = useOnboardingStore();
  const { isPro, showPaywall, restore, isPurchasing } = useRevenueCat();

  const {
    habits,
    isInitialized,
    loadFromStorage,
    getActiveHabits,
    getPendingHabits,
    updateHabitConfig,
    addHabit,
    removeHabit,
    reorderHabits,
    setBlockedApps,
    blockedAppsCount,
    blockedAppsSelection,
  } = useHabitStore();

  // Edit habit modal state
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editingConfig, setEditingConfig] = useState<HabitConfig | null>(null);

  // Add habit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedNewType, setSelectedNewType] = useState<HabitType | null>(
    null,
  );
  const [newHabitConfig, setNewHabitConfig] = useState<HabitConfig | null>(
    null,
  );

  // Blocked apps modal state
  const [showBlockedAppsModal, setShowBlockedAppsModal] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [pendingAppsCount, setPendingAppsCount] = useState(0);
  const [pendingCategoriesCount, setPendingCategoriesCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!isInitialized) loadFromStorage();
    }, [isInitialized, loadFromStorage]),
  );

  const activeHabits = getActiveHabits();
  const pendingHabits = getPendingHabits();
  const existingTypes = new Set(habits.map((h) => h.type));
  const availableTypes = ALL_HABIT_TYPES.filter((t) => !existingTypes.has(t));

  // ── Edit handlers ─────────────────────────────────────────────────────────────

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setEditingConfig(habit.config);
  };

  const handleSaveEdit = () => {
    if (!editingHabit || !editingConfig) return;
    updateHabitConfig(editingHabit.id, editingConfig);
    setEditingHabit(null);
    setEditingConfig(null);
  };

  const handleCancelEdit = () => {
    setEditingHabit(null);
    setEditingConfig(null);
  };

  // ── Remove handler ───────────────────────────────────────────────────────────────

  const handleRemoveHabit = (id: string, name: string) => {
    Alert.alert("Remove Habit", `Remove ${name}? This will clear its streak.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeHabit(id) },
    ]);
  };

  // ── Reorder handlers ───────────────────────────────────────────────────────────────

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ordered = [...pendingHabits];
    [ordered[index - 1], ordered[index]] = [ordered[index], ordered[index - 1]];
    reorderHabits([
      ...activeHabits.map((h) => h.id),
      ...ordered.map((h) => h.id),
    ]);
  };

  const handleMoveDown = (index: number) => {
    if (index === pendingHabits.length - 1) return;
    const ordered = [...pendingHabits];
    [ordered[index], ordered[index + 1]] = [ordered[index + 1], ordered[index]];
    reorderHabits([
      ...activeHabits.map((h) => h.id),
      ...ordered.map((h) => h.id),
    ]);
  };

  // ── Add habit handlers ───────────────────────────────────────────────────────────

  const handleSelectNewType = (type: HabitType) => {
    setSelectedNewType(type);
    setNewHabitConfig(defaultHabitConfig(type));
  };

  const handleAddHabit = () => {
    if (!selectedNewType || !newHabitConfig) return;
    addHabit(selectedNewType, newHabitConfig, habits.length);
    setShowAddModal(false);
    setSelectedNewType(null);
    setNewHabitConfig(null);
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setSelectedNewType(null);
    setNewHabitConfig(null);
  };

  // ── Blocked apps handlers ──────────────────────────────────────────────────────────

  const handleOpenBlockedApps = () => {
    const status = getAuthorizationStatus();
    if (status !== AuthorizationStatus.approved) {
      Alert.alert(
        "Permission Required",
        "Enable Screen Time permission in Settings → Screen Time → Serenity.",
      );
      return;
    }
    setPendingSelection(blockedAppsSelection);
    setPendingAppsCount(blockedAppsCount.apps);
    setPendingCategoriesCount(blockedAppsCount.categories);
    setShowBlockedAppsModal(true);
  };

  const handleSaveBlockedApps = () => {
    if (pendingSelection !== null) {
      setBlockedApps(pendingSelection, {
        apps: pendingAppsCount,
        categories: pendingCategoriesCount,
      });
    }
    setShowBlockedAppsModal(false);
  };

  // ── RevenueCat handlers ──────────────────────────────────────────────────────────────

  const handleUpgrade = async () => {
    await showPaywall();
  };

  const handleManageSubscription = async () => {
    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onRestoreCompleted: ({ customerInfo: info }) => {
            console.log(
              "[CustomerCenter] Restore completed:",
              info.entitlements.active,
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
      "Invalidates the local RevenueCat cache and forces free mode.",
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
                "Premium removed for this session. Restart to sync.",
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
                "@habits",
              ]);
              resetOnboarding();
            } catch {
              Alert.alert("Error", "Failed to reset app");
            }
          },
        },
      ],
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.bg.primary }]}
      edges={["top"]}
    >
      <StatusBar barStyle={theme.statusBar} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.pageTitle, { color: theme.text.primary }]}>
          Settings
        </Text>

        {/* ── Active Habits ──────────────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { color: theme.text.secondary }]}>
          Active Habits
        </Text>

        {activeHabits.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.bg.elevated,
                borderColor: theme.border.default,
              },
            ]}
          >
            <Text style={[styles.emptyText, { color: theme.text.tertiary }]}>
              No active habits yet
            </Text>
          </View>
        ) : (
          activeHabits.map((habit) => (
            <View
              key={habit.id}
              style={[
                styles.habitCard,
                {
                  backgroundColor: theme.bg.elevated,
                  borderColor: theme.border.subtle,
                },
              ]}
            >
              <View style={styles.habitRow}>
                <View
                  style={[
                    styles.habitIconWrap,
                    { backgroundColor: habitAccent[habit.type] + "1A" },
                  ]}
                >
                  <HabitIcon
                    type={habit.type}
                    color={habitAccent[habit.type]}
                  />
                </View>
                <View style={styles.habitInfo}>
                  <Text
                    style={[styles.habitName, { color: theme.text.primary }]}
                  >
                    {HABIT_LABELS[habit.type]}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: theme.status.successSubtle },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: theme.status.success },
                      ]}
                    >
                      Active
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleOpenEdit(habit)}
                  style={[
                    styles.editBtn,
                    { borderColor: theme.border.default },
                  ]}
                  accessibilityLabel={`Edit ${HABIT_LABELS[habit.type]}`}
                >
                  <Text
                    style={[
                      styles.editBtnText,
                      { color: theme.text.secondary },
                    ]}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* ── Pending Habits ─────────────────────────────────────────────── */}
        {pendingHabits.length > 0 && (
          <>
            <Text
              style={[styles.sectionHeader, { color: theme.text.secondary }]}
            >
              Up Next
            </Text>
            {pendingHabits.map((habit, index) => (
              <View
                key={habit.id}
                style={[
                  styles.habitCard,
                  {
                    backgroundColor: theme.bg.elevated,
                    borderColor: theme.border.subtle,
                  },
                ]}
              >
                <View style={styles.habitRow}>
                  <View
                    style={[
                      styles.habitIconWrap,
                      { backgroundColor: habitAccent[habit.type] + "1A" },
                    ]}
                  >
                    <HabitIcon
                      type={habit.type}
                      color={habitAccent[habit.type]}
                    />
                  </View>
                  <View style={styles.habitInfo}>
                    <Text
                      style={[styles.habitName, { color: theme.text.primary }]}
                    >
                      {HABIT_LABELS[habit.type]}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: theme.bg.subtle },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: theme.text.tertiary },
                        ]}
                      >
                        #{index + 1} in queue
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reorderBtns}>
                    <TouchableOpacity
                      onPress={() => handleMoveUp(index)}
                      disabled={index === 0}
                      style={[
                        styles.reorderBtn,
                        {
                          borderColor: theme.border.default,
                          opacity: index === 0 ? 0.3 : 1,
                        },
                      ]}
                      accessibilityLabel="Move up"
                    >
                      <ChevronUp size={16} color={theme.text.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleMoveDown(index)}
                      disabled={index === pendingHabits.length - 1}
                      style={[
                        styles.reorderBtn,
                        {
                          borderColor: theme.border.default,
                          opacity: index === pendingHabits.length - 1 ? 0.3 : 1,
                        },
                      ]}
                      accessibilityLabel="Move down"
                    >
                      <ChevronDown size={16} color={theme.text.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        handleRemoveHabit(habit.id, HABIT_LABELS[habit.type])
                      }
                      style={[
                        styles.reorderBtn,
                        {
                          borderColor: theme.status.errorSubtle,
                          backgroundColor: theme.status.errorSubtle,
                        },
                      ]}
                      accessibilityLabel={`Remove ${HABIT_LABELS[habit.type]}`}
                    >
                      <X size={16} color={theme.status.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── Add Habit button ───────────────────────────────────────────── */}
        {availableTypes.length > 0 && (
          <TouchableOpacity
            style={[styles.addHabitBtn, { borderColor: theme.border.default }]}
            onPress={() => setShowAddModal(true)}
            accessibilityLabel="Add a habit"
          >
            <Plus size={18} color={theme.text.secondary} />
            <Text
              style={[styles.addHabitText, { color: theme.text.secondary }]}
            >
              Add Habit
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Blocked Apps ───────────────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { color: theme.text.secondary }]}>
          Blocked Apps
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.bg.elevated,
              borderColor: theme.border.subtle,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cardRow}
            onPress={handleOpenBlockedApps}
            accessibilityLabel="Manage blocked apps"
          >
            <Shield size={20} color={theme.text.secondary} />
            <Text style={[styles.cardRowLabel, { color: theme.text.primary }]}>
              Manage Blocked Apps
            </Text>
            <ChevronRight size={18} color={theme.text.tertiary} />
          </TouchableOpacity>
          {(blockedAppsCount.apps > 0 || blockedAppsCount.categories > 0) && (
            <>
              <View
                style={[
                  styles.cardDivider,
                  { backgroundColor: theme.border.subtle },
                ]}
              />
              <View style={[styles.cardRow, { paddingVertical: spacing[3] }]}>
                <Text
                  style={[
                    styles.blockCountText,
                    { color: theme.text.secondary },
                  ]}
                >
                  {blockedAppsCount.apps} apps · {blockedAppsCount.categories}{" "}
                  categories blocked
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ── Appearance ─────────────────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { color: theme.text.secondary }]}>
          Appearance
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.bg.elevated,
              borderColor: theme.border.subtle,
            },
          ]}
        >
          <View style={styles.themeOptions}>
            {(
              [
                { mode: "light" as const, label: "Light", Icon: Sun },
                { mode: "dark" as const, label: "Dark", Icon: Moon },
                {
                  mode: "system" as const,
                  label: "System",
                  Icon: Smartphone,
                },
              ] as const
            ).map(({ mode, label, Icon }) => {
              const active = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeOption,
                    {
                      borderColor: active
                        ? theme.accent.primary
                        : theme.border.default,
                      borderWidth: active ? 2 : 1,
                    },
                  ]}
                  onPress={() => setThemeMode(mode)}
                  accessibilityLabel={`${label} theme`}
                >
                  <Icon
                    size={20}
                    color={active ? theme.accent.primary : theme.text.secondary}
                  />
                  <Text
                    style={[
                      styles.themeOptionLabel,
                      {
                        color: active
                          ? theme.accent.primary
                          : theme.text.secondary,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Subscription ───────────────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { color: theme.text.secondary }]}>
          Subscription
        </Text>
        <View
          style={[
            styles.card,
            styles.proCard,
            {
              backgroundColor: theme.bg.elevated,
              borderColor: isPro
                ? "rgba(245, 166, 35, 0.4)"
                : theme.border.subtle,
            },
          ]}
        >
          <View style={styles.proHeader}>
            <Crown size={22} color={isPro ? "#F5A623" : theme.text.secondary} />
            <View style={styles.proHeaderText}>
              <Text style={[styles.proTitle, { color: theme.text.primary }]}>
                Serenity Pro
              </Text>
              <Text
                style={[
                  styles.proStatus,
                  {
                    color: isPro ? theme.status.success : theme.text.tertiary,
                  },
                ]}
              >
                {isPro ? "✓ Active" : "Free plan"}
              </Text>
            </View>
          </View>

          {!isPro && (
            <>
              <Text
                style={[styles.proDescription, { color: theme.text.secondary }]}
              >
                Unlock habit stacking, advanced analytics, and more.
              </Text>
              <TouchableOpacity
                style={[styles.upgradeBtn, { opacity: isPurchasing ? 0.7 : 1 }]}
                onPress={handleUpgrade}
                disabled={isPurchasing}
                accessibilityLabel="Upgrade to Serenity Pro"
              >
                <Crown size={16} color="#fff" />
                <Text style={styles.upgradeBtnText}>
                  {isPurchasing ? "Processing…" : "Upgrade to Pro"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {isPro && (
            <TouchableOpacity
              style={[styles.cardRow, { marginTop: spacing[2] }]}
              onPress={handleManageSubscription}
              accessibilityLabel="Manage subscription"
            >
              <Settings2 size={20} color={theme.text.secondary} />
              <Text
                style={[styles.cardRowLabel, { color: theme.text.primary }]}
              >
                Manage Subscription
              </Text>
              <ChevronRight size={18} color={theme.text.tertiary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.cardRow, { marginTop: spacing[1] }]}
            onPress={handleRestorePurchases}
            disabled={isPurchasing}
            accessibilityLabel="Restore purchases"
          >
            <Shield size={20} color={theme.text.secondary} />
            <Text style={[styles.cardRowLabel, { color: theme.text.primary }]}>
              Restore Purchases
            </Text>
            <ChevronRight size={18} color={theme.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* ── Dev Tools ──────────────────────────────────────────────────── */}
        {__DEV__ && (
          <>
            <Text
              style={[styles.sectionHeader, { color: theme.text.secondary }]}
            >
              Developer
            </Text>
            <View
              style={[
                styles.card,
                styles.devCard,
                { backgroundColor: theme.bg.elevated },
              ]}
            >
              <View style={styles.devCardHeader}>
                <FlaskConical size={16} color="#9B59B6" />
                <Text style={styles.devCardTitle}>Dev Tools</Text>
              </View>
              <TouchableOpacity
                style={styles.devRow}
                onPress={() => {
                  const { router: r } = require("expo-router");
                  r.push("/mindful-pause");
                }}
                accessibilityLabel="Test mindful pause screen"
              >
                <View style={[styles.devDot, { backgroundColor: "#27AE60" }]} />
                <Text
                  style={[styles.devRowLabel, { color: theme.text.primary }]}
                >
                  Test Mindful Pause
                </Text>
                <ChevronRight size={16} color="#9B59B6" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.outlineBtn, { borderColor: theme.border.default }]}
              onPress={handleResetOnboarding}
              accessibilityLabel="Reset to onboarding"
            >
              <Text
                style={[styles.outlineBtnText, { color: theme.text.secondary }]}
              >
                Reset to Onboarding
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.outlineBtn,
                {
                  borderColor: theme.status.errorSubtle,
                  marginTop: spacing[2],
                },
              ]}
              onPress={handleRemovePremium}
              accessibilityLabel="Remove premium (dev)"
            >
              <Text
                style={[styles.outlineBtnText, { color: theme.status.error }]}
              >
                Remove Premium (Dev)
              </Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={[styles.version, { color: theme.text.tertiary }]}>
          Version 1.0.0
        </Text>
      </ScrollView>

      {/* ── Edit Habit Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={editingHabit !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelEdit}
      >
        <SafeAreaView
          style={[styles.modalRoot, { backgroundColor: theme.bg.surface }]}
          edges={["top", "bottom"]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.border.subtle },
            ]}
          >
            <TouchableOpacity
              onPress={handleCancelEdit}
              accessibilityLabel="Cancel editing"
            >
              <Text
                style={[styles.modalAction, { color: theme.text.secondary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
              {editingHabit ? HABIT_LABELS[editingHabit.type] : ""}
            </Text>
            <TouchableOpacity
              onPress={handleSaveEdit}
              accessibilityLabel="Save changes"
            >
              <Text
                style={[
                  styles.modalAction,
                  styles.modalActionPrimary,
                  { color: theme.accent.primary },
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {editingHabit && editingConfig && (
              <HabitConfigCard
                habitType={editingHabit.type}
                config={editingConfig}
                onConfigChange={setEditingConfig}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Add Habit Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelAdd}
      >
        <SafeAreaView
          style={[styles.modalRoot, { backgroundColor: theme.bg.surface }]}
          edges={["top", "bottom"]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.border.subtle },
            ]}
          >
            <TouchableOpacity
              onPress={handleCancelAdd}
              accessibilityLabel="Cancel"
            >
              <Text
                style={[styles.modalAction, { color: theme.text.secondary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
              Add Habit
            </Text>
            <TouchableOpacity
              onPress={handleAddHabit}
              disabled={!selectedNewType}
              accessibilityLabel="Add selected habit"
            >
              <Text
                style={[
                  styles.modalAction,
                  styles.modalActionPrimary,
                  {
                    color: selectedNewType
                      ? theme.accent.primary
                      : theme.text.disabled,
                  },
                ]}
              >
                Add
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text
              style={[
                styles.modalSectionLabel,
                { color: theme.text.secondary },
              ]}
            >
              Choose a habit to add to your queue:
            </Text>
            {availableTypes.map((type) => {
              const selected = selectedNewType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.habitCard,
                    {
                      backgroundColor: selected
                        ? habitAccent[type] + "1A"
                        : theme.bg.elevated,
                      borderColor: selected
                        ? habitAccent[type]
                        : theme.border.subtle,
                      borderWidth: selected ? 2 : 1,
                      marginBottom: spacing[2],
                    },
                  ]}
                  onPress={() => handleSelectNewType(type)}
                  accessibilityLabel={`Select ${HABIT_LABELS[type]}`}
                >
                  <View style={styles.habitRow}>
                    <View
                      style={[
                        styles.habitIconWrap,
                        { backgroundColor: habitAccent[type] + "1A" },
                      ]}
                    >
                      <HabitIcon type={type} color={habitAccent[type]} />
                    </View>
                    <Text
                      style={[styles.habitName, { color: theme.text.primary }]}
                    >
                      {HABIT_LABELS[type]}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {selectedNewType && newHabitConfig && (
              <>
                <Text
                  style={[
                    styles.modalSectionLabel,
                    { color: theme.text.secondary, marginTop: spacing[5] },
                  ]}
                >
                  Configure:
                </Text>
                <HabitConfigCard
                  habitType={selectedNewType}
                  config={newHabitConfig}
                  onConfigChange={setNewHabitConfig}
                />
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Blocked Apps Modal ────────────────────────────────────────────── */}
      <Modal
        visible={showBlockedAppsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBlockedAppsModal(false)}
      >
        <SafeAreaView
          style={[styles.modalRoot, { backgroundColor: theme.bg.surface }]}
          edges={["top", "bottom"]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.border.subtle },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowBlockedAppsModal(false)}
              accessibilityLabel="Cancel"
            >
              <Text
                style={[styles.modalAction, { color: theme.text.secondary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
              Blocked Apps
            </Text>
            <TouchableOpacity
              onPress={handleSaveBlockedApps}
              accessibilityLabel="Save app selection"
            >
              <Text
                style={[
                  styles.modalAction,
                  styles.modalActionPrimary,
                  { color: theme.accent.primary },
                ]}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
          <DeviceActivitySelectionView
            style={{ flex: 1 }}
            onSelectionChange={(event: any) => {
              const {
                familyActivitySelection: token,
                applicationCount: apps,
                categoryCount: cats,
              } = event?.nativeEvent ?? {};
              setPendingSelection(token ?? null);
              setPendingAppsCount(apps ?? 0);
              setPendingCategoriesCount(cats ?? 0);
            }}
            familyActivitySelection={
              pendingSelection ?? blockedAppsSelection ?? undefined
            }
            headerText="Select apps to block"
            footerText="Your selection is private and stays on-device."
            appearance={isDark ? "dark" : "light"}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[12],
  },
  pageTitle: {
    fontSize: typeScale.title1.size,
    fontWeight: typeScale.title1.weight,
    lineHeight: typeScale.title1.lineHeight,
    marginBottom: spacing[6],
  },
  sectionHeader: {
    fontSize: typeScale.title3.size,
    fontWeight: typeScale.title3.weight,
    lineHeight: typeScale.title3.lineHeight,
    marginTop: spacing[5],
    marginBottom: spacing[3],
  },

  // ── Card ─────────────────────────────────────────────────────────────────
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing[2],
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 48,
  },
  cardRowLabel: {
    fontSize: typeScale.body.size,
    lineHeight: typeScale.body.lineHeight,
    flex: 1,
  },
  cardDivider: {
    height: 1,
    marginHorizontal: spacing[4],
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingVertical: spacing[5],
    alignItems: "center",
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: typeScale.subheadline.size,
    lineHeight: typeScale.subheadline.lineHeight,
  },

  // ── Habit cards ───────────────────────────────────────────────────────────
  habitCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing[2],
    overflow: "hidden",
  },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 48,
  },
  habitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  habitInfo: {
    flex: 1,
    gap: spacing[1],
  },
  habitName: {
    fontSize: typeScale.body.size,
    fontWeight: "500",
    lineHeight: typeScale.body.lineHeight,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: typeScale.caption1.size,
    fontWeight: "600",
    lineHeight: typeScale.caption1.lineHeight,
  },

  // ── Edit button ───────────────────────────────────────────────────────────
  editBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: typeScale.footnote.size,
    fontWeight: "500",
    lineHeight: typeScale.footnote.lineHeight,
  },

  // ── Reorder buttons ───────────────────────────────────────────────────────
  reorderBtns: {
    flexDirection: "row",
    gap: spacing[1],
  },
  reorderBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Add habit button ──────────────────────────────────────────────────────
  addHabitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth * 3,
    borderStyle: "dashed",
    marginBottom: spacing[2],
    marginTop: spacing[1],
  },
  addHabitText: {
    fontSize: typeScale.subheadline.size,
    fontWeight: "500",
    lineHeight: typeScale.subheadline.lineHeight,
  },

  // ── Block count ───────────────────────────────────────────────────────────
  blockCountText: {
    fontSize: typeScale.callout.size,
    lineHeight: typeScale.callout.lineHeight,
    fontFamily: "Menlo",
    flex: 1,
  },

  // ── Appearance ────────────────────────────────────────────────────────────
  themeOptions: {
    flexDirection: "row",
    gap: spacing[2],
    padding: spacing[4],
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing[1],
  },
  themeOptionLabel: {
    fontSize: typeScale.footnote.size,
    fontWeight: "500",
    lineHeight: typeScale.footnote.lineHeight,
  },

  // ── Subscription ──────────────────────────────────────────────────────────
  proCard: {
    padding: spacing[4],
  },
  proHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  proHeaderText: {
    flex: 1,
    gap: 2,
  },
  proTitle: {
    fontSize: typeScale.body.size,
    fontWeight: "600",
    lineHeight: typeScale.body.lineHeight,
  },
  proStatus: {
    fontSize: typeScale.footnote.size,
    lineHeight: typeScale.footnote.lineHeight,
  },
  proDescription: {
    fontSize: typeScale.footnote.size,
    lineHeight: typeScale.footnote.lineHeight,
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    backgroundColor: "#F5A623",
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  upgradeBtnText: {
    fontSize: typeScale.body.size,
    fontWeight: "600",
    lineHeight: typeScale.body.lineHeight,
    color: "#fff",
  },

  // ── Dev tools ─────────────────────────────────────────────────────────────
  devCard: {
    borderColor: "rgba(155, 89, 182, 0.35)",
    padding: spacing[4],
  },
  devCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  devCardTitle: {
    fontSize: typeScale.subheadline.size,
    fontWeight: "600",
    lineHeight: typeScale.subheadline.lineHeight,
    color: "#9B59B6",
  },
  devRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  devDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  devRowLabel: {
    fontSize: typeScale.subheadline.size,
    lineHeight: typeScale.subheadline.lineHeight,
    flex: 1,
  },

  // ── Outline buttons ───────────────────────────────────────────────────────
  outlineBtn: {
    alignItems: "center",
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing[2],
  },
  outlineBtnText: {
    fontSize: typeScale.subheadline.size,
    fontWeight: "500",
    lineHeight: typeScale.subheadline.lineHeight,
  },

  // ── Version ───────────────────────────────────────────────────────────────
  version: {
    fontSize: typeScale.caption1.size,
    lineHeight: typeScale.caption1.lineHeight,
    textAlign: "center",
    marginTop: spacing[4],
  },

  // ── Modals ────────────────────────────────────────────────────────────────
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typeScale.headline.size,
    fontWeight: typeScale.headline.weight,
    lineHeight: typeScale.headline.lineHeight,
  },
  modalAction: {
    fontSize: typeScale.body.size,
    lineHeight: typeScale.body.lineHeight,
  },
  modalActionPrimary: {
    fontWeight: "600",
  },
  modalContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  modalSectionLabel: {
    fontSize: typeScale.subheadline.size,
    lineHeight: typeScale.subheadline.lineHeight,
    marginBottom: spacing[3],
  },
});
