import { Button } from "@/components/ui";
import { spacing } from "@/constants";
import { FONTS } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import {
  AppGroup,
  AppGroupSchedule,
  AppGroupService,
} from "@/services/appGroups";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import {
  Briefcase,
  ChevronLeft,
  Clock,
  Folder,
  Globe,
  Lock,
  Moon,
  Unlock,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
  setFamilyActivitySelectionId,
  userDefaultsSet,
} from "react-native-device-activity";
import { SafeAreaView } from "react-native-safe-area-context";

const UNLOCK_PRESETS = [1, 2, 3, 5, 10];

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

function parseTimeString(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2024, 0, 1, h, m);
}

function formatTimeDate(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function formatTimeDisplay(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export default function EditGroupScreen() {
  const theme = useThemedColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [group, setGroup] = useState<AppGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable state
  const [groupName, setGroupName] = useState("");
  const [blockMode, setBlockMode] = useState<"unlocks" | "blocked">("unlocks");
  const [selectedUnlocks, setSelectedUnlocks] = useState(3);
  const [customUnlocks, setCustomUnlocks] = useState("");
  const [familyActivitySelection, setFamilyActivitySelection] = useState<
    string | null
  >(null);
  const [applicationCount, setApplicationCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);

  // Schedule state
  const [startTime, setStartTime] = useState(new Date(2024, 0, 1, 9, 0));
  const [endTime, setEndTime] = useState(new Date(2024, 0, 1, 17, 0));
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
    "sun",
  ]);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // App picker modal
  const [showPicker, setShowPicker] = useState(false);
  const [pickerAuthorized, setPickerAuthorized] = useState<boolean | null>(
    null,
  );
  // Temporary selection state while picker is open
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [pendingAppCount, setPendingAppCount] = useState(0);
  const [pendingCatCount, setPendingCatCount] = useState(0);

  const slideAnim = useRef(new Animated.Value(0)).current;

  // Load group on mount
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const groups = await AppGroupService.getAppGroups();
        const found = groups.find((g) => g.id === id) ?? null;
        if (found) {
          setGroup(found);
          setGroupName(found.name);
          setBlockMode(found.isBlocked ? "blocked" : "unlocks");
          setSelectedUnlocks(found.dailyUnlocks || 3);
          setFamilyActivitySelection(found.familyActivitySelection ?? null);
          setApplicationCount(found.applicationCount ?? found.apps.length);
          setCategoryCount(found.categoryCount ?? 0);
          // Load schedule
          if (found.schedule) {
            setStartTime(parseTimeString(found.schedule.startTime));
            setEndTime(parseTimeString(found.schedule.endTime));
            setSelectedDays(found.schedule.days);
          }
        }
      } catch (e) {
        console.error("Error loading group:", e);
        Alert.alert("Error", "Failed to load group");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Animate picker modal in/out
  useEffect(() => {
    if (showPicker) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [showPicker, slideAnim]);

  const checkPickerAuth = async () => {
    if (Platform.OS !== "ios") return;
    const status = getAuthorizationStatus();
    if (status === AuthorizationStatus.approved) {
      setPickerAuthorized(true);
    } else {
      setPickerAuthorized(false);
    }
  };

  const openPicker = async () => {
    // Pre-populate pending state with current values
    setPendingSelection(familyActivitySelection);
    setPendingAppCount(applicationCount);
    setPendingCatCount(categoryCount);
    await checkPickerAuth();
    setShowPicker(true);
  };

  const handlePickerSelectionChange = (event: any) => {
    const {
      familyActivitySelection: token,
      applicationCount: apps,
      categoryCount: cats,
    } = event?.nativeEvent ?? {};
    setPendingSelection(token ?? null);
    setPendingAppCount(apps ?? 0);
    setPendingCatCount(cats ?? 0);
  };

  const confirmPickerSelection = () => {
    setFamilyActivitySelection(pendingSelection);
    setApplicationCount(pendingAppCount);
    setCategoryCount(pendingCatCount);
    setShowPicker(false);
  };

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId],
    );
    setSelectedPreset(null);
  };

  const handlePresetSelect = (index: number) => {
    const preset = TIME_PRESETS[index];
    setSelectedPreset(index);
    const [sh, sm] = preset.start.split(":").map(Number);
    const [eh, em] = preset.end.split(":").map(Number);
    setStartTime(new Date(2024, 0, 1, sh, sm));
    setEndTime(new Date(2024, 0, 1, eh, em));
    setSelectedDays(preset.days);
  };

  const handleSave = async () => {
    if (!group) return;
    if (!groupName.trim()) {
      Alert.alert("Validation Error", "Please enter a group name");
      return;
    }

    const isBlocked = blockMode === "blocked";
    const unlocks = customUnlocks
      ? parseInt(customUnlocks, 10)
      : selectedUnlocks;

    if (!isBlocked && (isNaN(unlocks) || unlocks < 0 || unlocks > 100)) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid number of unlocks (0–100)",
      );
      return;
    }

    setSaving(true);
    try {
      const schedule: AppGroupSchedule = {
        startTime: formatTimeDate(startTime),
        endTime: formatTimeDate(endTime),
        days: selectedDays,
        alwaysOn: false,
      };

      await AppGroupService.updateAppGroup(group.id, {
        name: groupName.trim(),
        isBlocked,
        dailyUnlocks: isBlocked ? 0 : unlocks,
        currentUnlocks: isBlocked ? 0 : unlocks,
        familyActivitySelection: familyActivitySelection ?? undefined,
        applicationCount,
        categoryCount,
        schedule,
      });

      // Update shield config if on iOS
      if (Platform.OS === "ios" && familyActivitySelection) {
        try {
          setFamilyActivitySelectionId({
            id: group.id,
            familyActivitySelection,
          });

          const deepLinkUrl = `serenity://mindful-pause?groupId=${group.id}`;
          const now = new Date().toISOString();

          const shieldConfig = isBlocked
            ? {
                title: "This app is blocked",
                subtitle:
                  "{{applicationOrDomainDisplayName}} is off-limits right now.",
                primaryButtonLabel: "I understand",
                triggeredBy: "updateAppGroup",
                updatedAt: now,
              }
            : {
                title: "Pause before you scroll",
                subtitle:
                  "Take a mindful breath before opening {{applicationOrDomainDisplayName}}.",
                primaryButtonLabel: "Take a Mindful Pause",
                triggeredBy: "updateAppGroup",
                updatedAt: now,
              };

          userDefaultsSet(
            `shieldConfigurationForSelection_${group.id}`,
            shieldConfig,
          );

          const shieldActions = {
            primary: {
              behavior: isBlocked ? "close" : "defer",
              actions: [{ type: "openUrl", url: deepLinkUrl }],
            },
          };
          userDefaultsSet(
            `shieldActionsForSelection_${group.id}`,
            shieldActions,
          );
        } catch (shieldErr) {
          console.warn(
            "[EditGroup] Shield config error (non-fatal):",
            shieldErr,
          );
        }
      }

      router.back();
    } catch (e) {
      console.error("Error saving group:", e);
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectionParts: string[] = [];
  if (applicationCount > 0)
    selectionParts.push(
      `${applicationCount} app${applicationCount === 1 ? "" : "s"}`,
    );
  if (categoryCount > 0)
    selectionParts.push(
      `${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}`,
    );
  const selectionSummary =
    selectionParts.length > 0 ? selectionParts.join("  ·  ") : "No selection";

  const totalPending = pendingAppCount + pendingCatCount;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text
          style={{
            color: theme.textSecondary,
            textAlign: "center",
            marginTop: 100,
          }}
        >
          Loading…
        </Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text
          style={{
            color: theme.textSecondary,
            textAlign: "center",
            marginTop: 100,
          }}
        >
          Group not found.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar barStyle={theme.statusBar} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Edit Group
          </Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Apps & Categories */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Apps &amp; Categories
            </Text>
            <View
              style={[
                styles.appsRow,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.appsIconWrap}>
                <Folder size={20} color={theme.primary} />
              </View>
              <View style={styles.appsTextWrap}>
                <Text style={[styles.appsCount, { color: theme.textPrimary }]}>
                  {selectionSummary}
                </Text>
                <Text style={[styles.appsHint, { color: theme.textSecondary }]}>
                  Tap to change selection
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.changeButton,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
                onPress={openPicker}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.changeButtonText, { color: theme.primary }]}
                >
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Group Name */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Group Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="e.g., Social Media, Games, etc."
              placeholderTextColor={theme.textTertiary}
              value={groupName}
              onChangeText={setGroupName}
              returnKeyType="done"
            />
          </View>

          {/* Access Control */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Access Control
            </Text>
            <View style={styles.modeGrid}>
              {/* Unlocks Mode */}
              <TouchableOpacity
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor:
                      blockMode === "unlocks" ? theme.primary : theme.border,
                  },
                  blockMode === "unlocks" && styles.modeCardSelected,
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

              {/* Blocked Mode */}
              <TouchableOpacity
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor:
                      blockMode === "blocked" ? theme.primary : theme.border,
                  },
                  blockMode === "blocked" && styles.modeCardSelected,
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

          {/* Daily Unlocks — only shown in unlocks mode */}
          {blockMode === "unlocks" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Daily Unlocks
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
                      !customUnlocks &&
                        selectedUnlocks === preset &&
                        styles.presetButtonSelected,
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

              <TextInput
                style={[
                  styles.customInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: customUnlocks ? theme.primary : theme.border,
                    color: theme.textPrimary,
                    marginTop: spacing.sm,
                  },
                ]}
                placeholder="Or enter custom amount"
                placeholderTextColor={theme.textTertiary}
                value={customUnlocks}
                onChangeText={(text) => {
                  setCustomUnlocks(text);
                  if (text) setSelectedUnlocks(0);
                }}
                keyboardType="number-pad"
                maxLength={3}
                returnKeyType="done"
              />
            </View>
          )}

          {/* When to Block — Schedule */}
          <View style={styles.section}>
            <View style={styles.scheduleTitleRow}>
              <View style={styles.scheduleIcon}>
                <Clock size={18} color={theme.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                When to Block
              </Text>
            </View>

            {/* Quick Presets */}
            <View style={styles.schedulePresetsRow}>
              {TIME_PRESETS.map((preset, index) => {
                const active = selectedPreset === index;
                const iconColor = active ? "#fff" : theme.textSecondary;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.schedulePresetChip,
                      {
                        backgroundColor: active ? theme.primary : theme.surface,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => handlePresetSelect(index)}
                    activeOpacity={0.7}
                  >
                    <preset.Icon size={15} color={iconColor} />
                    <Text
                      style={[
                        styles.schedulePresetText,
                        { color: active ? "#fff" : theme.textPrimary },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time Range */}
            <View style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text
                  style={[styles.timeLabel, { color: theme.textSecondary }]}
                >
                  Start
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
                    {formatTimeDisplay(formatTimeDate(startTime))}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[styles.timeSeparator, { color: theme.textSecondary }]}
              >
                →
              </Text>

              <View style={styles.timeColumn}>
                <Text
                  style={[styles.timeLabel, { color: theme.textSecondary }]}
                >
                  End
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
                    {formatTimeDisplay(formatTimeDate(endTime))}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Days */}
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

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
        <View
          style={[
            styles.actions,
            { backgroundColor: theme.background, borderTopColor: theme.border },
          ]}
        >
          <Button
            title={saving ? "Saving…" : "Save Changes"}
            onPress={handleSave}
            disabled={saving || !groupName.trim()}
          />
        </View>
      </SafeAreaView>

      {/* App Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPicker(false)}
      >
        <View
          style={[styles.pickerModal, { backgroundColor: theme.background }]}
        >
          <SafeAreaView style={styles.safeArea} edges={["top"]}>
            {/* Picker Header */}
            <View
              style={[styles.pickerHeader, { borderBottomColor: theme.border }]}
            >
              <TouchableOpacity
                style={styles.pickerHeaderBtn}
                onPress={() => setShowPicker(false)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerCancelText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text style={[styles.pickerTitle, { color: theme.textPrimary }]}>
                Change Selection
              </Text>
              <TouchableOpacity
                style={styles.pickerHeaderBtn}
                onPress={confirmPickerSelection}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerDoneText, { color: theme.primary }]}>
                  {totalPending > 0 ? `Done (${totalPending})` : "Done"}
                </Text>
              </TouchableOpacity>
            </View>

            {Platform.OS !== "ios" ? (
              <View style={styles.pickerCenteredState}>
                <Text style={{ color: theme.textSecondary }}>
                  Screen Time is only available on iOS.
                </Text>
              </View>
            ) : pickerAuthorized === false ? (
              <View style={styles.pickerCenteredState}>
                <Text
                  style={[styles.permissionTitle, { color: theme.textPrimary }]}
                >
                  Screen Time permission required
                </Text>
                <Text
                  style={[
                    styles.permissionDesc,
                    { color: theme.textSecondary },
                  ]}
                >
                  Enable it in Settings → Screen Time → Serenity
                </Text>
              </View>
            ) : (
              <DeviceActivitySelectionView
                style={styles.picker}
                onSelectionChange={handlePickerSelectionChange}
                familyActivitySelection={
                  pendingSelection ?? familyActivitySelection ?? undefined
                }
                headerText="Select apps to limit"
                footerText="Your selection is private and stays on-device"
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Start Time Picker Modal */}
      {showStartPicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showStartPicker}
          onRequestClose={() => setShowStartPicker(false)}
        >
          <Pressable
            style={styles.timePickerOverlay}
            onPress={() => setShowStartPicker(false)}
          >
            <View
              style={[
                styles.timePickerSheet,
                { backgroundColor: theme.surface },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View
                  style={[
                    styles.timePickerHeader,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                    <Text
                      style={[styles.timePickerDone, { color: theme.primary }]}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="spinner"
                  onChange={(_, d) => {
                    if (d) setStartTime(d);
                  }}
                  textColor={theme.textPrimary}
                />
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* End Time Picker Modal */}
      {showEndPicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showEndPicker}
          onRequestClose={() => setShowEndPicker(false)}
        >
          <Pressable
            style={styles.timePickerOverlay}
            onPress={() => setShowEndPicker(false)}
          >
            <View
              style={[
                styles.timePickerSheet,
                { backgroundColor: theme.surface },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View
                  style={[
                    styles.timePickerHeader,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                    <Text
                      style={[styles.timePickerDone, { color: theme.primary }]}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display="spinner"
                  onChange={(_, d) => {
                    if (d) setEndTime(d);
                  }}
                  textColor={theme.textPrimary}
                />
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONTS.interSemiBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.interSemiBold,
  },
  appsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 2,
    gap: spacing.sm,
  },
  appsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  appsTextWrap: {
    flex: 1,
    gap: 3,
  },
  appsCount: {
    fontSize: 15,
    fontFamily: FONTS.interSemiBold,
  },
  appsHint: {
    fontSize: 12,
    fontFamily: FONTS.interRegular,
  },
  changeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  changeButtonText: {
    fontSize: 14,
    fontFamily: FONTS.interSemiBold,
  },
  input: {
    borderRadius: 12,
    borderWidth: 2,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: FONTS.interRegular,
  },
  modeGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modeCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    padding: spacing.md,
    gap: spacing.xs,
  },
  modeCardSelected: {
    borderWidth: 2,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs / 2,
  },
  modeTitle: {
    fontSize: 15,
    fontFamily: FONTS.interSemiBold,
  },
  modeSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.interRegular,
    lineHeight: 16,
  },
  presetsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  presetButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: spacing.md,
    alignItems: "center",
    gap: 2,
  },
  presetButtonSelected: {
    borderWidth: 2,
  },
  presetNumber: {
    fontSize: 20,
    fontFamily: FONTS.interBold,
  },
  presetLabel: {
    fontSize: 11,
    fontFamily: FONTS.interMedium,
  },
  customInput: {
    borderRadius: 12,
    borderWidth: 2,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: FONTS.interRegular,
    textAlign: "center",
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  // Picker modal
  pickerModal: {
    flex: 1,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  pickerHeaderBtn: {
    minWidth: 70,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  pickerTitle: {
    fontSize: 17,
    fontFamily: FONTS.interSemiBold,
    textAlign: "center",
  },
  pickerCancelText: {
    fontSize: 16,
    fontFamily: FONTS.interRegular,
  },
  pickerDoneText: {
    fontSize: 16,
    fontFamily: FONTS.interSemiBold,
    textAlign: "right",
  },
  picker: {
    flex: 1,
  },
  pickerCenteredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  permissionTitle: {
    fontSize: 18,
    fontFamily: FONTS.interSemiBold,
    textAlign: "center",
  },
  permissionDesc: {
    fontSize: 14,
    fontFamily: FONTS.interRegular,
    textAlign: "center",
    lineHeight: 20,
  },
  // Schedule section
  scheduleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  scheduleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  schedulePresetsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  schedulePresetChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 2,
  },
  schedulePresetText: {
    fontSize: 13,
    fontFamily: FONTS.interSemiBold,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  timeColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  timeLabel: {
    fontSize: 13,
    fontFamily: FONTS.interMedium,
  },
  timeButton: {
    borderRadius: 12,
    borderWidth: 2,
    padding: spacing.md,
    alignItems: "center",
  },
  timeText: {
    fontSize: 17,
    fontFamily: FONTS.interBold,
  },
  timeSeparator: {
    fontSize: 18,
    fontFamily: FONTS.interMedium,
    paddingBottom: spacing.md,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  dayButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 13,
    fontFamily: FONTS.interSemiBold,
  },
  // Time picker modals
  timePickerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: spacing.lg,
  },
  timePickerSheet: {
    borderRadius: 20,
    paddingBottom: spacing.md,
    width: "100%",
    overflow: "hidden",
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  timePickerDone: {
    fontSize: 17,
    fontFamily: FONTS.interSemiBold,
  },
});
