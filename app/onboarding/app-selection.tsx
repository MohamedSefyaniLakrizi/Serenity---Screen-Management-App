import { OnboardingHeader } from "@/components/OnboardingHeader";
import { Button } from "@/components/ui";
import { getNextStep, getProgressFraction } from "@/config/onboardingFlow";
import { spacing } from "@/constants";
import { FONTS } from "@/constants/typography";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors, useThemedStyles } from "@/hooks/useThemedStyles";
import { AppGroupService } from "@/services/appGroups";
import { useOnboardingStore } from "@/store/onboardingStore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { Briefcase, Globe, Lock, Moon, Unlock } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Modal,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    AuthorizationStatus,
    DeviceActivitySelectionView,
    getAuthorizationStatus,
    requestAuthorization,
} from "react-native-device-activity";
import AnimatedRN from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { id: "mon", label: "M" },
  { id: "tue", label: "T" },
  { id: "wed", label: "W" },
  { id: "thu", label: "T" },
  { id: "fri", label: "F" },
  { id: "sat", label: "Sa" },
  { id: "sun", label: "Su" },
];

const TIME_PRESETS = [
  {
    label: "All Day",
    start: "00:00",
    end: "23:59",
    days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    Icon: Globe,
  },
  {
    label: "Work",
    start: "09:00",
    end: "17:00",
    days: ["mon", "tue", "wed", "thu", "fri"],
    Icon: Briefcase,
  },
  {
    label: "Night",
    start: "22:00",
    end: "06:00",
    days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    Icon: Moon,
  },
];

const UNLOCK_PRESETS = [1, 2, 3, 5, 10];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppSelection() {
  const theme = useThemedColors();
  const { isDark } = useThemedStyles();
  const { updateData, screenTimePermissionGranted } = useOnboardingStore();
  const { navigateNext, progressFraction, variant } = useOnboardingNext(
    "/onboarding/app-selection",
  );

  const [screenFade] = useSequentialFadeIn(1, { duration: 300, stagger: 0 });

  // step 1: app select | 2: access control | 3: unlocks count (unlocks mode) | 3/4: when to block
  const [step, setStep] = useState(1);
  const [blockMode, setBlockMode] = useState<"unlocks" | "blocked">("unlocks");

  // Step 1
  const [isLoading, setIsLoading] = useState(true);
  const [familyActivitySelection, setFamilyActivitySelection] = useState<
    string | null
  >(null);
  const [applicationCount, setApplicationCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);

  // Step 3 (unlocks)
  const [selectedUnlocks, setSelectedUnlocks] = useState(3);
  const [customUnlocks, setCustomUnlocks] = useState("");

  // Step 3/4 (when to block)
  const [startTime, setStartTime] = useState(new Date(2024, 0, 1, 9, 0));
  const [endTime, setEndTime] = useState(new Date(2024, 0, 1, 17, 0));
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
  ]);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [saving, setSaving] = useState(false);

  const totalInternalSteps = blockMode === "unlocks" ? 4 : 3;
  const internalStepFraction = (step - 1) / Math.max(totalInternalSteps - 1, 1);

  const flowProgress = useMemo(() => {
    const ctx = { screenTimePermissionGranted };
    const nextStep = getNextStep("/onboarding/app-selection", variant, ctx);
    const nextProgress = nextStep
      ? getProgressFraction(nextStep.route, variant, ctx)
      : progressFraction;

    return (
      progressFraction +
      (nextProgress - progressFraction) * internalStepFraction
    );
  }, [
    internalStepFraction,
    progressFraction,
    screenTimePermissionGranted,
    variant,
  ]);

  // ── Time picker animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (showStartPicker || showEndPicker) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [showStartPicker, showEndPicker]);

  // ── Auth init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    try {
      const status = getAuthorizationStatus();
      if (status === AuthorizationStatus.approved) {
        updateData({ screenTimePermissionGranted: true });
        setIsLoading(false);
        return;
      }
      if (status === AuthorizationStatus.denied) {
        skipToNext();
        return;
      }
      await requestAuthorization("individual");
      const newStatus = getAuthorizationStatus();
      if (newStatus === AuthorizationStatus.approved) {
        updateData({ screenTimePermissionGranted: true });
      } else {
        skipToNext();
        return;
      }
    } catch {
      skipToNext();
      return;
    }
    setIsLoading(false);
  };

  const skipToNext = () => {
    updateData({ selectedApps: [], selectedCategories: [] });
    navigateNext();
  };

  const formatTime = (d: Date) =>
    `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

  const handlePresetSelect = (index: number) => {
    const p = TIME_PRESETS[index];
    setSelectedPreset(index);
    const [sh, sm] = p.start.split(":").map(Number);
    setStartTime(new Date(2024, 0, 1, sh, sm));
    const [eh, em] = p.end.split(":").map(Number);
    setEndTime(new Date(2024, 0, 1, eh, em));
    setSelectedDays(p.days);
  };

  const toggleDay = (id: string) => {
    setSelectedDays((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
    setSelectedPreset(null);
  };

  // ── Final create ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (selectedDays.length === 0) {
      Alert.alert("Select days", "Please select at least one day.");
      return;
    }
    setSaving(true);
    try {
      const groups = await AppGroupService.getAppGroups();
      const groupName =
        groups.length === 0 ? "Group 1" : `Group ${groups.length + 1}`;
      const unlocks =
        blockMode === "unlocks"
          ? customUnlocks
            ? parseInt(customUnlocks, 10)
            : selectedUnlocks
          : 0;
      await AppGroupService.createAppGroup(
        groupName,
        [],
        30,
        unlocks,
        true,
        familyActivitySelection || undefined,
        applicationCount,
        categoryCount,
      );
      updateData({
        selectedApps: familyActivitySelection ? [familyActivitySelection] : [],
        selectedCategories: [],
      });
      navigateNext();
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create group. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AnimatedRN.View
        style={[
          styles.container,
          { backgroundColor: theme.background },
          screenFade,
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <StatusBar barStyle={theme.statusBar} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Requesting permission…
            </Text>
          </View>
        </SafeAreaView>
      </AnimatedRN.View>
    );
  }

  // ── Step 1: App selection ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <AnimatedRN.View
        style={[
          styles.container,
          { backgroundColor: theme.background },
          screenFade,
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <StatusBar barStyle={theme.statusBar} />
          <OnboardingHeader
            progressFraction={flowProgress}
            onBack={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
          />
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Select Apps
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Choose the apps and categories you want to limit or block
            </Text>
          </View>
          <View
            style={[
              styles.pickerContainer,
              { backgroundColor: theme.background },
            ]}
          >
            <DeviceActivitySelectionView
              style={[styles.picker, { backgroundColor: theme.background }]}
              onSelectionChange={(event: any) => {
                const {
                  familyActivitySelection: token,
                  applicationCount: apps,
                  categoryCount: cats,
                } = event?.nativeEvent ?? {};
                setFamilyActivitySelection(token ?? null);
                setApplicationCount(apps ?? 0);
                setCategoryCount(cats ?? 0);
              }}
              familyActivitySelection={familyActivitySelection}
              headerText="Select apps to limit"
              footerText="Your selection is private and stays on-device"
              appearance={isDark ? "dark" : "light"}
            />
          </View>
          <View
            style={[
              styles.actions,
              {
                backgroundColor: theme.background,
                borderTopColor: theme.border,
              },
            ]}
          >
            {applicationCount + categoryCount > 0 && (
              <Text
                style={[
                  styles.selectionSummary,
                  { color: theme.textSecondary },
                ]}
              >
                {applicationCount > 0 &&
                  `${applicationCount} app${applicationCount !== 1 ? "s" : ""}`}
                {applicationCount > 0 && categoryCount > 0 && "  ·  "}
                {categoryCount > 0 &&
                  `${categoryCount} categor${categoryCount !== 1 ? "ies" : "y"}`}
              </Text>
            )}
            <Button title="Continue" onPress={() => setStep(2)} />
          </View>
        </SafeAreaView>
      </AnimatedRN.View>
    );
  }

  // ── Step 2: Access control ─────────────────────────────────────────────────
  if (step === 2) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <StatusBar barStyle={theme.statusBar} />
          <OnboardingHeader
            progressFraction={flowProgress}
            onBack={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
          />
          <View style={[styles.content, { paddingHorizontal: spacing.lg }]}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Access Control
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Choose how to limit access to the selected apps
              </Text>
            </View>
            <View style={styles.modeGrid}>
              <TouchableOpacity
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor:
                      blockMode === "unlocks" ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setBlockMode("unlocks")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.modeIcon,
                    {
                      backgroundColor:
                        blockMode === "unlocks"
                          ? theme.primaryLight
                          : theme.surfaceSecondary,
                    },
                  ]}
                >
                  <Unlock
                    size={24}
                    color={
                      blockMode === "unlocks"
                        ? theme.primary
                        : theme.textSecondary
                    }
                  />
                </View>
                <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>
                  Limited Unlocks
                </Text>
                <Text
                  style={[styles.modeSubtitle, { color: theme.textSecondary }]}
                >
                  Allow a set number of unlocks per day
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor:
                      blockMode === "blocked" ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setBlockMode("blocked")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.modeIcon,
                    {
                      backgroundColor:
                        blockMode === "blocked"
                          ? theme.primaryLight
                          : theme.surfaceSecondary,
                    },
                  ]}
                >
                  <Lock
                    size={24}
                    color={
                      blockMode === "blocked"
                        ? theme.primary
                        : theme.textSecondary
                    }
                  />
                </View>
                <Text style={[styles.modeTitle, { color: theme.textPrimary }]}>
                  Fully Blocked
                </Text>
                <Text
                  style={[styles.modeSubtitle, { color: theme.textSecondary }]}
                >
                  Block completely with no access
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={[
              styles.actions,
              {
                backgroundColor: theme.background,
                borderTopColor: theme.border,
              },
            ]}
          >
            <Button title="Continue" onPress={() => setStep(3)} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Step 3: Unlocks count (only if unlocks mode) ───────────────────────────
  if (step === 3 && blockMode === "unlocks") {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <StatusBar barStyle={theme.statusBar} />
          <OnboardingHeader
            progressFraction={flowProgress}
            onBack={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
          />
          <View style={[styles.content, { paddingHorizontal: spacing.lg }]}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Daily Unlocks
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                How many times can you unlock these apps per day?
              </Text>
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Quick Select
              </Text>
              <View style={styles.presetsGrid}>
                {UNLOCK_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetButton,
                      {
                        backgroundColor: theme.surface,
                        borderColor:
                          !customUnlocks && selectedUnlocks === preset
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedUnlocks(preset);
                      setCustomUnlocks("");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetNumber,
                        {
                          color:
                            !customUnlocks && selectedUnlocks === preset
                              ? theme.primary
                              : theme.textPrimary,
                        },
                      ]}
                    >
                      {preset}
                    </Text>
                    <Text
                      style={[
                        styles.presetLabel,
                        {
                          color:
                            !customUnlocks && selectedUnlocks === preset
                              ? theme.primary
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      unlocks
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Or Enter Custom Amount
              </Text>
              <TextInput
                style={[
                  styles.customInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: customUnlocks ? theme.primary : theme.border,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Enter number"
                placeholderTextColor={theme.textTertiary}
                value={customUnlocks}
                onChangeText={(t) => {
                  setCustomUnlocks(t);
                  if (t) setSelectedUnlocks(0);
                }}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
          <View
            style={[
              styles.actions,
              {
                backgroundColor: theme.background,
                borderTopColor: theme.border,
              },
            ]}
          >
            <Button
              title="Continue"
              onPress={() => {
                const u = customUnlocks
                  ? parseInt(customUnlocks, 10)
                  : selectedUnlocks;
                if (isNaN(u) || u < 0 || u > 100) {
                  Alert.alert("Invalid", "Enter a number between 0 and 100.");
                  return;
                }
                setStep(4);
              }}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Step 3 (blocked) or 4 (unlocks): When to block ────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar barStyle={theme.statusBar} />
        <OnboardingHeader
          progressFraction={flowProgress}
          onBack={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
        />
        <View style={[styles.content, { paddingHorizontal: spacing.lg }]}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              When to Block
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Choose a preset or customize your blocking schedule
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Quick Presets
            </Text>
            <View style={styles.presetsRow}>
              {TIME_PRESETS.map((preset, index) => {
                const active = selectedPreset === index;
                const iconColor = active ? "#fff" : theme.textSecondary;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: active ? theme.primary : theme.surface,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => handlePresetSelect(index)}
                    activeOpacity={0.7}
                  >
                    <preset.Icon size={16} color={iconColor} />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.presetChipText,
                        { color: active ? "#fff" : theme.textPrimary },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Custom Time Range
            </Text>
            <View style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text
                  style={[styles.timeLabel, { color: theme.textSecondary }]}
                >
                  Start Time
                </Text>
                <TouchableOpacity
                  style={[
                    styles.timeButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    setShowStartPicker(true);
                    setSelectedPreset(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeText, { color: theme.textPrimary }]}>
                    {formatTime(startTime)}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                style={[styles.timeSeparator, { color: theme.textSecondary }]}
              >
                to
              </Text>
              <View style={styles.timeColumn}>
                <Text
                  style={[styles.timeLabel, { color: theme.textSecondary }]}
                >
                  End Time
                </Text>
                <TouchableOpacity
                  style={[
                    styles.timeButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    setShowEndPicker(true);
                    setSelectedPreset(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeText, { color: theme.textPrimary }]}>
                    {formatTime(endTime)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Active Days
            </Text>
            <View style={styles.daysGrid}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayButton,
                    {
                      backgroundColor: selectedDays.includes(day.id)
                        ? theme.primary
                        : theme.surface,
                      borderColor: selectedDays.includes(day.id)
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                  onPress={() => toggleDay(day.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: selectedDays.includes(day.id)
                          ? "#fff"
                          : theme.textPrimary,
                      },
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View
          style={[
            styles.actions,
            { backgroundColor: theme.background, borderTopColor: theme.border },
          ]}
        >
          <Button
            title="Create Group"
            onPress={handleCreate}
            disabled={saving || selectedDays.length === 0}
          />
        </View>
      </SafeAreaView>

      {showStartPicker && (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={() => setShowStartPicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowStartPicker(false)}
          >
            <Animated.View
              style={[
                styles.pickerModal,
                {
                  backgroundColor: theme.surface,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                    <Text style={[styles.pickerDone, { color: theme.primary }]}>
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContent}>
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display="spinner"
                    onChange={(_, d) => d && setStartTime(d)}
                    textColor={theme.textPrimary}
                  />
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      )}

      {showEndPicker && (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={() => setShowEndPicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowEndPicker(false)}
          >
            <Animated.View
              style={[
                styles.pickerModal,
                {
                  backgroundColor: theme.surface,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                    <Text style={[styles.pickerDone, { color: theme.primary }]}>
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContent}>
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display="spinner"
                    onChange={(_, d) => d && setEndTime(d)}
                    textColor={theme.textPrimary}
                  />
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    fontFamily: FONTS.interMedium,
  },
  titleSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: 4,
  },
  title: { fontSize: 28, fontFamily: FONTS.loraMedium, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: FONTS.interRegular, lineHeight: 20 },
  pickerContainer: { flex: 1 },
  picker: { flex: 1 },
  selectionSummary: {
    fontSize: 13,
    fontFamily: FONTS.interRegular,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
  },
  content: { flex: 1, gap: spacing.lg, paddingTop: spacing.xs },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.interSemiBold },
  modeGrid: { flexDirection: "row", gap: spacing.md },
  modeCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    padding: spacing.md,
    gap: spacing.xs,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  modeTitle: { fontSize: 15, fontFamily: FONTS.interSemiBold },
  modeSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.interRegular,
    lineHeight: 16,
  },
  presetsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  presetButton: {
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    minWidth: 70,
  },
  presetNumber: { fontSize: 20, fontFamily: FONTS.interBold, marginBottom: 2 },
  presetLabel: { fontSize: 11, fontFamily: FONTS.interMedium },
  customInput: {
    borderRadius: 12,
    borderWidth: 2,
    padding: spacing.md,
    fontSize: 18,
    textAlign: "center",
    fontFamily: FONTS.interSemiBold,
  },
  presetsRow: { flexDirection: "row", justifyContent: "space-between" },
  presetChip: {
    width: "31.5%",
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 2,
  },
  presetChipText: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: FONTS.interSemiBold,
  },
  timeRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.md },
  timeColumn: { flex: 1, gap: 4 },
  timeLabel: { fontSize: 14, fontFamily: FONTS.interMedium },
  timeButton: {
    borderRadius: 12,
    borderWidth: 2,
    padding: spacing.md,
    alignItems: "center",
  },
  timeText: { fontSize: 20, fontFamily: FONTS.interBold },
  timeSeparator: {
    fontSize: 14,
    fontFamily: FONTS.interMedium,
    paddingBottom: spacing.md,
  },
  daysGrid: { flexDirection: "row", gap: spacing.sm },
  dayButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 14, fontFamily: FONTS.interSemiBold },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pickerModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: spacing.xl,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  pickerDone: { fontSize: 17, fontFamily: FONTS.interSemiBold },
  pickerContent: { alignItems: "center", justifyContent: "center" },
});
