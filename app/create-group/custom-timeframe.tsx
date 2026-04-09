import { OnboardingHeader } from "@/components/OnboardingHeader";
import { Button } from "@/components/ui";
import { spacing } from "@/constants";
import { FONTS } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { AppGroupService } from "@/services/appGroups";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { Briefcase, Globe, Moon } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function CustomTimeFrameScreen() {
  const theme = useThemedColors();
  const params = useLocalSearchParams();

  // Initialize with 9 AM start and 5 PM end
  const [startTime, setStartTime] = useState(new Date(2024, 0, 1, 9, 0));
  const [endTime, setEndTime] = useState(new Date(2024, 0, 1, 17, 0));
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
  ]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const slideAnim = useRef(new Animated.Value(300)).current;

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
  }, [showStartPicker, showEndPicker, slideAnim]);

  // Parse params
  const familyActivitySelection =
    (params.familyActivitySelection as string) ?? "";
  const applicationCount = parseInt(
    (params.applicationCount as string) ?? "0",
    10,
  );
  const categoryCount = parseInt((params.categoryCount as string) ?? "0", 10);
  const groupName = params.groupName as string;
  const unlockCount = parseInt((params.unlockCount as string) ?? "-1", 10);
  const isFromUnlocks = unlockCount >= 0;

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId],
    );
    setSelectedPreset(null); // Deselect preset when manually changing
  };

  const handlePresetSelect = (index: number) => {
    const preset = TIME_PRESETS[index];
    setSelectedPreset(index);

    // Parse and set start time
    const [startHour, startMin] = preset.start.split(":").map(Number);
    setStartTime(new Date(2024, 0, 1, startHour, startMin));

    // Parse and set end time
    const [endHour, endMin] = preset.end.split(":").map(Number);
    setEndTime(new Date(2024, 0, 1, endHour, endMin));

    // Set days
    setSelectedDays(preset.days);
  };

  const handleTimeChange = () => {
    setSelectedPreset(null); // Deselect preset when manually changing time
  };

  const handleCreate = async () => {
    if (selectedDays.length === 0) {
      Alert.alert("Validation Error", "Please select at least one day");
      return;
    }

    setLoading(true);

    const schedule = {
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      days: selectedDays,
      alwaysOn: false,
    };

    try {
      await AppGroupService.createAppGroup(
        groupName,
        [],
        30, // sessionLength - not used in MVP
        isFromUnlocks ? unlockCount : 0,
        !isFromUnlocks,
        familyActivitySelection || undefined,
        applicationCount,
        categoryCount,
        schedule,
      );

      router.replace("/(tabs)/" as any);
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create app group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar barStyle={theme.statusBar} />

        <OnboardingHeader
          progressFraction={1}
          stepLabel={isFromUnlocks ? "Step 4 of 4" : "Step 3 of 3"}
          onBack={() => router.back()}
        />

        <View style={styles.scrollView}>
          <View style={[styles.content, { paddingHorizontal: spacing.lg }]}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                When to Block
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Choose a preset or customize your blocking schedule
              </Text>
            </View>

            {/* Time Presets */}
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
                          backgroundColor: active
                            ? theme.primary
                            : theme.surface,
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

            {/* Time Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Custom Time Range
              </Text>

              <View style={styles.timeRow}>
                {/* Start Time */}
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
                      handleTimeChange();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.timeText, { color: theme.textPrimary }]}
                    >
                      {formatTime(startTime)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text
                  style={[styles.timeSeparator, { color: theme.textSecondary }]}
                >
                  to
                </Text>

                {/* End Time */}
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
                      handleTimeChange();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.timeText, { color: theme.textPrimary }]}
                    >
                      {formatTime(endTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Days Selection */}
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
        </View>

        {/* Bottom Actions */}
        <View
          style={[
            styles.actions,
            { backgroundColor: theme.background, borderTopColor: theme.border },
          ]}
        >
          <Button
            title="Create Group"
            onPress={handleCreate}
            disabled={loading || selectedDays.length === 0}
          />
        </View>
      </SafeAreaView>

      {/* Native Time Pickers */}
      {showStartPicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showStartPicker}
          onRequestClose={() => setShowStartPicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowStartPicker(false)}
          >
            <Animated.View
              style={[
                styles.pickerModal,
                { backgroundColor: theme.surface },
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                    <Text
                      style={[styles.pickerButton, { color: theme.primary }]}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContent}>
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setStartTime(selectedDate);
                      }
                    }}
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
          visible={showEndPicker}
          onRequestClose={() => setShowEndPicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowEndPicker(false)}
          >
            <Animated.View
              style={[
                styles.pickerModal,
                { backgroundColor: theme.surface },
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                    <Text
                      style={[styles.pickerButton, { color: theme.primary }]}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContent}>
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setEndTime(selectedDate);
                      }
                    }}
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
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  titleSection: {
    gap: 2,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.loraMedium,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FONTS.interRegular,
    lineHeight: 20,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.interSemiBold,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
  },
  timeColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  timeLabel: {
    fontSize: 14,
    fontFamily: FONTS.interMedium,
  },
  timeButton: {
    borderRadius: 12,
    borderWidth: 2,
    padding: spacing.md,
    alignItems: "center",
  },
  timeText: {
    fontSize: 20,
    fontFamily: FONTS.interBold,
  },
  timeSeparator: {
    fontSize: 14,
    fontFamily: FONTS.interMedium,
    paddingBottom: spacing.md,
  },
  daysGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dayButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 14,
    fontFamily: FONTS.interSemiBold,
  },
  presetsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  presetChip: {
    width: "31.5%",
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 2,
  },
  presetChipText: {
    fontSize: 13,
    fontFamily: FONTS.interSemiBold,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  pickerButton: {
    fontSize: 17,
    fontFamily: FONTS.interSemiBold,
  },
  pickerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
});
