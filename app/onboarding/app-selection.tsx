import { OnboardingHeader } from "@/components/OnboardingHeader";
import { borderRadius, spacing, typeScale } from "@/constants";
import { getNextStep, getProgressFraction } from "@/config/onboardingFlow";
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

  const s = styles(theme);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AnimatedRN.View style={[s.container, screenFade]}>
        <SafeAreaView style={s.safeArea} edges={["top"]}>
          <StatusBar barStyle={theme.statusBar} />
          <View style={s.centered}>
            <ActivityIndicator size="large" color={theme.accent.primary} />
            <Text style={s.loadingText}>Requesting permission…</Text>
          </View>
        </SafeAreaView>
      </AnimatedRN.View>
    );
  }

  // ── Step 1: App selection ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <AnimatedRN.View style={[s.container, screenFade]}>
        <SafeAreaView style={s.safeArea} edges={["top"]}>
          <StatusBar barStyle={theme.statusBar} />
          <OnboardingHeader
            progressFraction={flowProgress}
            onBack={() => (step > 1 ? setStep((prev) => prev - 1) : router.back())}
          />
          <View style={s.titleSection}>
            <Text style={s.title}>Select Apps to Block</Text>
            <Text style={s.subtitle}>
              Choose ALL apps except the essentials you need (phone, messages,
              maps). These will be blocked until you complete your daily habits.
            </Text>
          </View>
          <View style={s.pickerContainer}>
            <DeviceActivitySelectionView
              style={s.picker}
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
              headerText="Select apps to block"
              footerText="The more apps you block, the stronger your commitment."
              appearance={isDark ? "dark" : "light"}
            />
          </View>
          <View style={s.actions}>
            {applicationCount + categoryCount > 0 && (
              <Text style={s.selectionSummary}>
                {applicationCount > 0 &&
                  `${applicationCount} app${applicationCount !== 1 ? "s" : ""}`}
                {applicationCount > 0 && categoryCount > 0 && "  ·  "}
                {categoryCount > 0 &&
                  `${categoryCount} categor${categoryCount !== 1 ? "ies" : "y"}`}
              </Text>
            )}
            <TouchableOpacity
              style={s.button}
              activeOpacity={0.8}
              onPress={() => setStep(2)}
            >
              <Text style={s.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </AnimatedRN.View>
    );
  }

  // ── Step 2: Access control ─────────────────────────────────────────────────
  if (step === 2) {
    return (
      <View style={s.container}>
        <SafeAreaView style={s.safeArea} edges={["top"]}>
          <StatusBar barStyle={theme.statusBar} />
          <OnboardingHeader
            progressFraction={flowProgress}
            onBack={() => setStep((prev) => prev - 1)}
          />
          <View style={s.titleSection}>
            <Text style={s.title}>Access Control</Text>
            <Text style={s.subtitle}>
              Choose how to limit access to the selected apps
            </Text>
          </View>
          <View style={s.sections}>
            <View style={s.modeGrid}>
              <TouchableOpacity
                style={[
                  s.modeCard,
                  {
                    borderColor:
                      blockMode === "unlocks"
                        ? theme.accent.primary
                        : theme.border.default,
                  },
                ]}
                onPress={() => setBlockMode("unlocks")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    s.modeIcon,
                    {
                      backgroundColor:
                        blockMode === "unlocks"
                          ? theme.accent.subtle
                          : theme.bg.subtle,
                    },
                  ]}
                >
                  <Unlock
                    size={20}
                    strokeWidth={1.5}
                    color={
                      blockMode === "unlocks"
                        ? theme.accent.primary
                        : theme.text.secondary
                    }
                  />
                </View>
                <Text
                  style={[
                    s.modeTitle,
                    blockMode === "unlocks" && { color: theme.text.primary },
                  ]}
                >
                  Limited Unlocks
                </Text>
                <Text style={s.modeSubtitle}>
                  Allow a set number of unlocks per day
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.modeCard,
                  {
                    borderColor:
                      blockMode === "blocked"
                        ? theme.accent.primary
                        : theme.border.default,
                  },
                ]}
                onPress={() => setBlockMode("blocked")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    s.modeIcon,
                    {
                      backgroundColor:
                        blockMode === "blocked"
                          ? theme.accent.subtle
                          : theme.bg.subtle,
                    },
                  ]}
                >
                  <Lock
                    size={20}
                    strokeWidth={1.5}
                    color={
                      blockMode === "blocked"
                        ? theme.accent.primary
                        : theme.text.secondary
                    }
                  />
                </View>
                <Text
                  style={[
                    s.modeTitle,
                    blockMode === "blocked" && { color: theme.text.primary },
                  ]}
                >
                  Fully Blocked
                </Text>
                <Text style={s.modeSubtitle}>
                  Block completely with no access
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.actions}>
            <TouchableOpacity
              style={s.button}
              activeOpacity={0.8}
              onPress={() => setStep(3)}
            >
              <Text style={s.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Step 3: Unlocks count (only if unlocks mode) ───────────────────────────
  if (step === 3 && blockMode === "unlocks") {
    return (
      <View style={s.container}>
        <SafeAreaView style={s.safeArea} edges={["top"]}>
          <StatusBar barStyle={theme.statusBar} />
          <OnboardingHeader
            progressFraction={flowProgress}
            onBack={() => setStep((prev) => prev - 1)}
          />
          <View style={s.titleSection}>
            <Text style={s.title}>Daily Unlocks</Text>
            <Text style={s.subtitle}>
              How many times can you unlock these apps per day?
            </Text>
          </View>
          <View style={s.sections}>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Quick Select</Text>
              <View style={s.presetsGrid}>
                {UNLOCK_PRESETS.map((preset) => {
                  const active = !customUnlocks && selectedUnlocks === preset;
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[
                        s.presetButton,
                        {
                          borderColor: active
                            ? theme.accent.primary
                            : theme.border.default,
                          backgroundColor: active
                            ? theme.accent.subtle
                            : theme.bg.elevated,
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
                          s.presetNumber,
                          {
                            color: active
                              ? theme.accent.primary
                              : theme.text.primary,
                          },
                        ]}
                      >
                        {preset}
                      </Text>
                      <Text
                        style={[
                          s.presetLabel,
                          {
                            color: active
                              ? theme.accent.primary
                              : theme.text.secondary,
                          },
                        ]}
                      >
                        unlocks
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Or Enter Custom Amount</Text>
              <TextInput
                style={[
                  s.customInput,
                  {
                    borderColor: customUnlocks
                      ? theme.accent.primary
                      : theme.border.default,
                    color: theme.text.primary,
                  },
                ]}
                placeholder="Enter number"
                placeholderTextColor={theme.text.tertiary}
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
          <View style={s.actions}>
            <TouchableOpacity
              style={s.button}
              activeOpacity={0.8}
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
            >
              <Text style={s.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Step 3 (blocked) or 4 (unlocks): When to block ────────────────────────
  return (
    <View style={s.container}>
      <SafeAreaView style={s.safeArea} edges={["top"]}>
        <StatusBar barStyle={theme.statusBar} />
        <OnboardingHeader
          progressFraction={flowProgress}
          onBack={() => setStep((prev) => prev - 1)}
        />
        <View style={s.titleSection}>
          <Text style={s.title}>When to Block</Text>
          <Text style={s.subtitle}>
            Choose a preset or customize your blocking schedule
          </Text>
        </View>
        <View style={s.sections}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Quick Presets</Text>
            <View style={s.presetsRow}>
              {TIME_PRESETS.map((preset, index) => {
                const active = selectedPreset === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      s.presetChip,
                      {
                        backgroundColor: active
                          ? theme.accent.primary
                          : theme.bg.elevated,
                        borderColor: active
                          ? theme.accent.primary
                          : theme.border.default,
                      },
                    ]}
                    onPress={() => handlePresetSelect(index)}
                    activeOpacity={0.7}
                  >
                    <preset.Icon
                      size={16}
                      strokeWidth={1.5}
                      color={active ? "#fff" : theme.text.secondary}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        s.presetChipText,
                        { color: active ? "#fff" : theme.text.primary },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Custom Time Range</Text>
            <View style={s.timeRow}>
              <View style={s.timeColumn}>
                <Text style={s.timeLabel}>Start Time</Text>
                <TouchableOpacity
                  style={s.timeButton}
                  onPress={() => {
                    setShowStartPicker(true);
                    setSelectedPreset(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={s.timeText}>{formatTime(startTime)}</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.timeSeparator}>to</Text>
              <View style={s.timeColumn}>
                <Text style={s.timeLabel}>End Time</Text>
                <TouchableOpacity
                  style={s.timeButton}
                  onPress={() => {
                    setShowEndPicker(true);
                    setSelectedPreset(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={s.timeText}>{formatTime(endTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Active Days</Text>
            <View style={s.daysGrid}>
              {DAYS.map((day) => {
                const active = selectedDays.includes(day.id);
                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      s.dayButton,
                      {
                        backgroundColor: active
                          ? theme.accent.primary
                          : theme.bg.elevated,
                        borderColor: active
                          ? theme.accent.primary
                          : theme.border.default,
                      },
                    ]}
                    onPress={() => toggleDay(day.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        s.dayText,
                        { color: active ? "#fff" : theme.text.primary },
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
        <View style={s.actions}>
          <TouchableOpacity
            style={[
              s.button,
              (saving || selectedDays.length === 0) && s.buttonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleCreate}
            disabled={saving || selectedDays.length === 0}
          >
            <Text
              style={[
                s.buttonText,
                (saving || selectedDays.length === 0) && s.buttonTextDisabled,
              ]}
            >
              Create Group
            </Text>
          </TouchableOpacity>
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
            style={s.modalOverlay}
            onPress={() => setShowStartPicker(false)}
          >
            <Animated.View
              style={[
                s.pickerModal,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={s.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                    <Text style={s.pickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.pickerContent}>
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display="spinner"
                    onChange={(_, d) => d && setStartTime(d)}
                    textColor={theme.text.primary}
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
            style={s.modalOverlay}
            onPress={() => setShowEndPicker(false)}
          >
            <Animated.View
              style={[
                s.pickerModal,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={s.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                    <Text style={s.pickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.pickerContent}>
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display="spinner"
                    onChange={(_, d) => d && setEndTime(d)}
                    textColor={theme.text.primary}
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

const styles = (theme: ReturnType<typeof useThemedColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg.primary },
    safeArea: { flex: 1 },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing[6],
    },
    loadingText: {
      marginTop: spacing[4],
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: typeScale.subheadline.weight as any,
      color: theme.text.secondary,
    },
    titleSection: {
      paddingHorizontal: spacing[6],
      paddingTop: spacing[4],
      paddingBottom: spacing[4],
      gap: spacing[2],
    },
    title: {
      fontFamily: "System",
      fontSize: typeScale.title1.size,
      fontWeight: typeScale.title1.weight as any,
      lineHeight: typeScale.title1.lineHeight,
      letterSpacing: typeScale.title1.tracking,
      color: theme.text.primary,
    },
    subtitle: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: typeScale.subheadline.weight as any,
      lineHeight: typeScale.subheadline.lineHeight,
      color: theme.text.secondary,
    },
    pickerContainer: { flex: 1, backgroundColor: theme.bg.primary },
    picker: { flex: 1, backgroundColor: theme.bg.primary },
    selectionSummary: {
      fontFamily: "System",
      fontSize: typeScale.footnote.size,
      fontWeight: typeScale.footnote.weight as any,
      textAlign: "center",
      marginBottom: spacing[3],
      color: theme.text.secondary,
    },
    actions: {
      paddingHorizontal: spacing[6],
      paddingTop: spacing[3],
      paddingBottom: spacing[6],
      borderTopWidth: 1,
      borderTopColor: theme.border.default,
      backgroundColor: theme.bg.primary,
    },
    sections: {
      flex: 1,
      paddingHorizontal: spacing[6],
      gap: spacing[6],
      paddingTop: spacing[2],
      paddingBottom: spacing[4],
    },
    section: { gap: spacing[3] },
    sectionTitle: {
      fontFamily: "System",
      fontSize: typeScale.callout.size,
      fontWeight: "600",
      color: theme.text.primary,
    },
    modeGrid: { flexDirection: "row", gap: spacing[4] },
    modeCard: {
      flex: 1,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      padding: spacing[4],
      gap: spacing[2],
      backgroundColor: theme.bg.elevated,
    },
    modeIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing[1],
    },
    modeTitle: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: "600",
      color: theme.text.secondary,
    },
    modeSubtitle: {
      fontFamily: "System",
      fontSize: typeScale.caption1.size,
      fontWeight: typeScale.caption1.weight as any,
      lineHeight: typeScale.caption1.lineHeight,
      color: theme.text.tertiary,
    },
    presetsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[3] },
    presetButton: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      alignItems: "center",
      minWidth: 70,
    },
    presetNumber: {
      fontFamily: "Menlo",
      fontSize: typeScale.title3.size,
      fontWeight: typeScale.title3.weight as any,
      lineHeight: typeScale.title3.lineHeight,
      marginBottom: spacing[1],
    },
    presetLabel: {
      fontFamily: "System",
      fontSize: typeScale.caption2.size,
      fontWeight: typeScale.caption2.weight as any,
    },
    customInput: {
      borderRadius: borderRadius.md,
      borderWidth: 1,
      padding: spacing[4],
      fontFamily: "Menlo",
      fontSize: typeScale.title3.size,
      fontWeight: typeScale.title3.weight as any,
      textAlign: "center",
      backgroundColor: theme.bg.subtle,
    },
    presetsRow: { flexDirection: "row", gap: spacing[2] },
    presetChip: {
      flex: 1,
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[3],
      borderRadius: borderRadius.sm,
      borderWidth: 1,
    },
    presetChipText: {
      flexShrink: 1,
      fontFamily: "System",
      fontSize: typeScale.caption1.size,
      fontWeight: "600",
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing[4],
    },
    timeColumn: { flex: 1, gap: 6 },
    timeLabel: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: typeScale.subheadline.weight as any,
      color: theme.text.secondary,
    },
    timeButton: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border.default,
      padding: spacing[4],
      alignItems: "center",
      backgroundColor: theme.bg.elevated,
    },
    timeText: {
      fontFamily: "Menlo",
      fontSize: typeScale.title3.size,
      fontWeight: typeScale.title3.weight as any,
      color: theme.text.primary,
    },
    timeSeparator: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: typeScale.subheadline.weight as any,
      color: theme.text.tertiary,
      paddingBottom: spacing[4],
    },
    daysGrid: { flexDirection: "row", gap: spacing[2] },
    dayButton: {
      flex: 1,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      paddingVertical: spacing[3],
      alignItems: "center",
      justifyContent: "center",
    },
    dayText: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: "600",
    },
    button: {
      backgroundColor: theme.accent.primary,
      paddingVertical: spacing[4],
      borderRadius: borderRadius.md,
      width: "100%",
      alignItems: "center",
    },
    buttonDisabled: { backgroundColor: theme.bg.subtle },
    buttonText: {
      color: "#FFFFFF",
      fontFamily: "System",
      fontSize: typeScale.headline.size,
      fontWeight: typeScale.headline.weight as any,
    },
    buttonTextDisabled: { color: theme.text.disabled },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    pickerModal: {
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      paddingBottom: spacing[8],
      backgroundColor: theme.bg.surface,
    },
    pickerHeader: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: spacing[6],
      paddingVertical: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: theme.border.subtle,
    },
    pickerDone: {
      fontFamily: "System",
      fontSize: typeScale.headline.size,
      fontWeight: "600",
      color: theme.accent.primary,
    },
    pickerContent: { alignItems: "center", justifyContent: "center" },
  });
