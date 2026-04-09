import { borderRadius, spacing, typeScale } from "@/constants";
import { useSequentialFadeIn } from "@/hooks/useOnboardingAnimation";
import { useOnboardingNext } from "@/hooks/useOnboardingNext";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { useOnboardingStore } from "@/store/onboardingStore";
import { Religion } from "@/types/habits";
import { router } from "expo-router";
import {
    Check,
    ChevronDown,
    ChevronUp,
    Minus,
    Plus,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type ReligionOption = {
  value: Religion;
  label: string;
  description: string;
  defaultCount: number;
  autoCount: boolean;
};

const RELIGIONS: ReligionOption[] = [
  {
    value: "islam",
    label: "Islam",
    description: "5 daily prayers from GPS",
    defaultCount: 5,
    autoCount: true,
  },
  {
    value: "christianity",
    label: "Christianity",
    description: "Daily prayer at custom times",
    defaultCount: 1,
    autoCount: false,
  },
  {
    value: "judaism",
    label: "Judaism",
    description: "3 daily prayers",
    defaultCount: 3,
    autoCount: true,
  },
  {
    value: "buddhism",
    label: "Buddhism",
    description: "Daily meditation / chanting",
    defaultCount: 2,
    autoCount: false,
  },
  {
    value: "hinduism",
    label: "Hinduism",
    description: "Daily puja / devotion",
    defaultCount: 2,
    autoCount: false,
  },
  {
    value: "other",
    label: "Other",
    description: "Custom prayer practice",
    defaultCount: 1,
    autoCount: false,
  },
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function ConfigPrayerScreen() {
  const theme = useThemedColors();
  const { setHabitConfig } = useOnboardingStore();
  const { navigateNext, progressFraction } = useOnboardingNext(
    "/onboarding/config-prayer",
  );

  const [selectedReligion, setSelectedReligion] = useState<Religion>("islam");
  const [prayerCount, setPrayerCount] = useState(5);
  const [customTimes, setCustomTimes] = useState<
    { hour: number; minute: number }[]
  >([{ hour: 7, minute: 0 }]);

  const [titleAnim, subtitleAnim, religionAnim, configAnim, buttonAnim] =
    useSequentialFadeIn(5, { duration: 300, stagger: 180 });

  const currentReligion = RELIGIONS.find((r) => r.value === selectedReligion)!;

  const handleSelectReligion = (religion: Religion) => {
    setSelectedReligion(religion);
    const opt = RELIGIONS.find((r) => r.value === religion)!;
    if (opt.autoCount) {
      setPrayerCount(opt.defaultCount);
    } else {
      const clampedCount = Math.max(1, Math.min(7, opt.defaultCount));
      setPrayerCount(clampedCount);
      const newTimes = Array.from({ length: clampedCount }, (_, i) => ({
        hour: 7 + i * 3,
        minute: 0,
      }));
      setCustomTimes(newTimes);
    }
  };

  const handleCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(7, prayerCount + delta));
    setPrayerCount(newCount);
    if (newCount > customTimes.length) {
      const last = customTimes[customTimes.length - 1] ?? {
        hour: 7,
        minute: 0,
      };
      setCustomTimes([
        ...customTimes,
        ...Array(newCount - customTimes.length)
          .fill(null)
          .map((_, i) => ({
            hour: (last.hour + (i + 1) * 2) % 24,
            minute: 0,
          })),
      ]);
    } else {
      setCustomTimes(customTimes.slice(0, newCount));
    }
  };

  const adjustTime = (
    index: number,
    field: "hour" | "minute",
    delta: number,
  ) => {
    const updated = [...customTimes];
    if (field === "hour") {
      updated[index] = {
        ...updated[index],
        hour: (updated[index].hour + delta + 24) % 24,
      };
    } else {
      updated[index] = {
        ...updated[index],
        minute: (updated[index].minute + delta * 15 + 60) % 60,
      };
    }
    setCustomTimes(updated);
  };

  const handleContinue = () => {
    const times = currentReligion.autoCount
      ? undefined
      : customTimes
          .slice(0, prayerCount)
          .map((t) => `${pad(t.hour)}:${pad(t.minute)}`);

    setHabitConfig("prayer", {
      type: "prayer",
      religion: selectedReligion,
      prayerCount,
      customTimes: times,
      calculationMethod:
        selectedReligion === "islam" ? "MuslimWorldLeague" : undefined,
    });
    navigateNext();
  };

  const s = styles(theme);
  const accentColor = theme.habitAccent.prayer;

  const showCustomConfig = !currentReligion.autoCount;

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <StatusBar barStyle={theme.statusBar} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <View style={s.backIcon}>
            <Text style={s.backChevron}>‹</Text>
          </View>
        </TouchableOpacity>
        <View style={s.progressTrack}>
          <View
            style={[s.progressFill, { width: `${progressFraction * 100}%` }]}
          />
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text style={[s.title, titleAnim]}>
          Prayer Practice
        </Animated.Text>
        <Animated.Text style={[s.subtitle, subtitleAnim]}>
          Select your faith tradition. Serenity will track and remind you of
          each prayer.
        </Animated.Text>

        {/* Religion selector */}
        <Animated.View style={religionAnim}>
          <View style={s.religionGrid}>
            {RELIGIONS.map((religion) => {
              const selected = religion.value === selectedReligion;
              return (
                <TouchableOpacity
                  key={religion.value}
                  style={[
                    s.religionCard,
                    selected && {
                      borderColor: accentColor,
                      backgroundColor: `${accentColor}10`,
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => handleSelectReligion(religion.value)}
                >
                  <View style={s.religionCardTop}>
                    <Text
                      style={[
                        s.religionLabel,
                        selected && { color: theme.text.primary },
                      ]}
                    >
                      {religion.label}
                    </Text>
                    {selected && (
                      <Check size={14} color={accentColor} strokeWidth={2.5} />
                    )}
                  </View>
                  <Text style={s.religionDescription}>
                    {religion.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Dynamic config */}
        {showCustomConfig && (
          <Animated.View style={[s.configSection, configAnim]}>
            {/* Prayer count stepper */}
            <View style={s.countRow}>
              <Text style={s.configLabel}>Number of daily prayers</Text>
              <View style={s.countStepper}>
                <TouchableOpacity
                  style={[s.countBtn, prayerCount <= 1 && s.countBtnDisabled]}
                  onPress={() => handleCountChange(-1)}
                  activeOpacity={0.7}
                  disabled={prayerCount <= 1}
                >
                  <Minus
                    size={18}
                    color={prayerCount <= 1 ? theme.text.disabled : accentColor}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
                <Text style={s.countValue}>{prayerCount}</Text>
                <TouchableOpacity
                  style={[s.countBtn, prayerCount >= 7 && s.countBtnDisabled]}
                  onPress={() => handleCountChange(1)}
                  activeOpacity={0.7}
                  disabled={prayerCount >= 7}
                >
                  <Plus
                    size={18}
                    color={prayerCount >= 7 ? theme.text.disabled : accentColor}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Time pickers for each prayer */}
            {customTimes.slice(0, prayerCount).map((time, index) => (
              <View key={index} style={s.prayerTimeRow}>
                <Text style={s.prayerTimeIndex}>Prayer {index + 1}</Text>
                <View style={s.miniTimePicker}>
                  <View style={s.miniTimeColumn}>
                    <TouchableOpacity
                      style={s.miniArrow}
                      onPress={() => adjustTime(index, "hour", 1)}
                      activeOpacity={0.7}
                    >
                      <ChevronUp
                        size={16}
                        color={accentColor}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                    <Text style={s.miniTimeValue}>{pad(time.hour)}</Text>
                    <TouchableOpacity
                      style={s.miniArrow}
                      onPress={() => adjustTime(index, "hour", -1)}
                      activeOpacity={0.7}
                    >
                      <ChevronDown
                        size={16}
                        color={accentColor}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={s.miniTimeSep}>:</Text>
                  <View style={s.miniTimeColumn}>
                    <TouchableOpacity
                      style={s.miniArrow}
                      onPress={() => adjustTime(index, "minute", 1)}
                      activeOpacity={0.7}
                    >
                      <ChevronUp
                        size={16}
                        color={accentColor}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                    <Text style={s.miniTimeValue}>{pad(time.minute)}</Text>
                    <TouchableOpacity
                      style={s.miniArrow}
                      onPress={() => adjustTime(index, "minute", -1)}
                      activeOpacity={0.7}
                    >
                      <ChevronDown
                        size={16}
                        color={accentColor}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {currentReligion.autoCount && (
          <Animated.View style={[s.infoCard, configAnim]}>
            <Text style={s.infoText}>
              {selectedReligion === "islam"
                ? "Prayer times are calculated automatically from your GPS location. No manual setup needed."
                : "Prayer times are fixed based on tradition. You'll confirm each prayer with a brief hold."}
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* CTA */}
      <Animated.View style={[s.actions, buttonAnim]}>
        <TouchableOpacity
          style={s.button}
          activeOpacity={0.8}
          onPress={handleContinue}
        >
          <Text style={s.buttonText}>Continue</Text>
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
    backIcon: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    backChevron: {
      fontSize: 28,
      color: theme.text.primary,
      lineHeight: 32,
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing[6],
      paddingTop: spacing[6],
      paddingBottom: spacing[4],
    },
    title: {
      fontFamily: "System",
      fontSize: typeScale.title1.size,
      fontWeight: typeScale.title1.weight,
      lineHeight: typeScale.title1.lineHeight,
      color: theme.text.primary,
      marginBottom: spacing[2],
    },
    subtitle: {
      fontFamily: "System",
      fontSize: typeScale.callout.size,
      fontWeight: typeScale.callout.weight,
      lineHeight: typeScale.callout.lineHeight,
      color: theme.text.secondary,
      marginBottom: spacing[6],
    },
    religionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[3],
      marginBottom: spacing[6],
    },
    religionCard: {
      width: "47%",
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.default,
      borderRadius: borderRadius.lg,
      padding: spacing[4],
      gap: spacing[1],
    },
    religionCardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    religionLabel: {
      fontFamily: "System",
      fontSize: typeScale.headline.size,
      fontWeight: typeScale.headline.weight,
      color: theme.text.secondary,
    },
    religionDescription: {
      fontFamily: "System",
      fontSize: typeScale.caption1.size,
      fontWeight: typeScale.caption1.weight,
      color: theme.text.tertiary,
    },
    configSection: {
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.default,
      borderRadius: borderRadius.lg,
      padding: spacing[4],
      gap: spacing[4],
      marginBottom: spacing[4],
    },
    configLabel: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: "500",
      color: theme.text.secondary,
    },
    countRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    countStepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    countBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: `${theme.habitAccent.prayer}15`,
      borderWidth: 1,
      borderColor: `${theme.habitAccent.prayer}40`,
      justifyContent: "center",
      alignItems: "center",
    },
    countBtnDisabled: {
      backgroundColor: theme.bg.subtle,
      borderColor: theme.border.default,
    },
    countValue: {
      fontFamily: "Menlo",
      fontSize: typeScale.title3.size,
      fontWeight: typeScale.title3.weight,
      color: theme.text.primary,
      minWidth: 28,
      textAlign: "center",
    },
    prayerTimeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: spacing[2],
      borderTopWidth: 1,
      borderTopColor: theme.border.subtle,
    },
    prayerTimeIndex: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: "500",
      color: theme.text.secondary,
    },
    miniTimePicker: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    miniTimeColumn: {
      alignItems: "center",
      gap: spacing[1],
    },
    miniArrow: {
      padding: spacing[1],
    },
    miniTimeValue: {
      fontFamily: "Menlo",
      fontSize: typeScale.headline.size,
      fontWeight: "600",
      color: theme.text.primary,
      minWidth: 32,
      textAlign: "center",
    },
    miniTimeSep: {
      fontFamily: "Menlo",
      fontSize: typeScale.headline.size,
      fontWeight: "700",
      color: theme.text.secondary,
      marginBottom: spacing[1],
    },
    infoCard: {
      backgroundColor: theme.bg.elevated,
      borderWidth: 1,
      borderColor: theme.border.default,
      borderRadius: borderRadius.lg,
      padding: spacing[4],
      marginBottom: spacing[4],
    },
    infoText: {
      fontFamily: "System",
      fontSize: typeScale.subheadline.size,
      fontWeight: typeScale.subheadline.weight,
      lineHeight: typeScale.subheadline.lineHeight,
      color: theme.text.secondary,
    },
    actions: {
      paddingHorizontal: spacing[6],
      paddingBottom: spacing[6],
      paddingTop: spacing[3],
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
