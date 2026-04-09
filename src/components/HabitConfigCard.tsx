import { borderRadius, spacing } from "@/constants/spacing";
import { typeScale } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import type {
    FitnessGoalType,
    HabitConfig,
    HabitType,
    Religion,
} from "@/types/habits";
import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Reusable primitives ────────────────────────────────────────────────────

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: StepperProps) {
  const theme = useThemedColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.text.secondary }]}>
        {label}
      </Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - step))}
          style={[
            styles.stepBtn,
            {
              backgroundColor: theme.bg.subtle,
              borderColor: theme.border.default,
            },
          ]}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={[styles.stepBtnText, { color: theme.text.primary }]}>
            −
          </Text>
        </TouchableOpacity>
        <Text style={[styles.stepValue, { color: theme.text.primary }]}>
          {value}
          {unit ? (
            <Text style={{ color: theme.text.tertiary }}> {unit}</Text>
          ) : null}
        </Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + step))}
          style={[
            styles.stepBtn,
            {
              backgroundColor: theme.bg.subtle,
              borderColor: theme.border.default,
            },
          ]}
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={[styles.stepBtnText, { color: theme.text.primary }]}>
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface SelectRowProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}

function SelectRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: SelectRowProps<T>) {
  const theme = useThemedColors();
  return (
    <View style={styles.selectBlock}>
      <Text style={[styles.rowLabel, { color: theme.text.secondary }]}>
        {label}
      </Text>
      <View style={styles.optionsRow}>
        {options.map((opt) => {
          const active = opt.value === selected;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              style={[
                styles.optionChip,
                {
                  backgroundColor: active
                    ? theme.accent.subtle
                    : theme.bg.subtle,
                  borderColor: active
                    ? theme.accent.primary
                    : theme.border.default,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionChipText,
                  {
                    color: active ? theme.accent.primary : theme.text.secondary,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── HabitConfigCard ────────────────────────────────────────────────────────

interface HabitConfigCardProps {
  habitType: HabitType;
  config: HabitConfig;
  onConfigChange: (config: HabitConfig) => void;
}

export default function HabitConfigCard({
  habitType,
  config,
  onConfigChange,
}: HabitConfigCardProps) {
  const theme = useThemedColors();

  // ── Screentime ───────────────────────────────────────────────────────────
  if (habitType === "screentime" && config.type === "screentime") {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.bg.elevated,
            borderColor: theme.border.subtle,
          },
        ]}
      >
        <Stepper
          label="Daily limit"
          value={config.dailyLimitMinutes}
          min={15}
          max={480}
          step={15}
          unit="min"
          onChange={(v) => onConfigChange({ ...config, dailyLimitMinutes: v })}
        />
      </View>
    );
  }

  // ── Study ────────────────────────────────────────────────────────────────
  if (habitType === "study" && config.type === "study") {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.bg.elevated,
            borderColor: theme.border.subtle,
          },
        ]}
      >
        <Stepper
          label="Daily goal"
          value={config.dailyGoalMinutes}
          min={15}
          max={480}
          step={15}
          unit="min"
          onChange={(v) => onConfigChange({ ...config, dailyGoalMinutes: v })}
        />
        <View
          style={[styles.divider, { backgroundColor: theme.border.subtle }]}
        />
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: theme.text.secondary }]}>
            Label (optional)
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                color: theme.text.primary,
                backgroundColor: theme.bg.subtle,
                borderColor: theme.border.default,
              },
            ]}
            value={config.workLabel ?? ""}
            onChangeText={(t) =>
              onConfigChange({ ...config, workLabel: t || undefined })
            }
            placeholder="e.g. Deep Work"
            placeholderTextColor={theme.text.tertiary}
            maxLength={30}
          />
        </View>
      </View>
    );
  }

  // ── Fitness ──────────────────────────────────────────────────────────────
  if (habitType === "fitness" && config.type === "fitness") {
    const goalTypeOptions: { value: FitnessGoalType; label: string }[] = [
      { value: "steps", label: "Steps" },
      { value: "workout", label: "Workout" },
      { value: "calories", label: "Calories" },
    ];
    const { min, max, step, unit } = {
      steps: { min: 1000, max: 30000, step: 500, unit: "steps" },
      workout: { min: 10, max: 180, step: 5, unit: "min" },
      calories: { min: 100, max: 2000, step: 50, unit: "kcal" },
    }[config.goalType];

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.bg.elevated,
            borderColor: theme.border.subtle,
          },
        ]}
      >
        <SelectRow<FitnessGoalType>
          label="Goal type"
          options={goalTypeOptions}
          selected={config.goalType}
          onSelect={(t) =>
            onConfigChange({ ...config, goalType: t, goalValue: min })
          }
        />
        <View
          style={[styles.divider, { backgroundColor: theme.border.subtle }]}
        />
        <Stepper
          label="Goal"
          value={config.goalValue}
          min={min}
          max={max}
          step={step}
          unit={unit}
          onChange={(v) => onConfigChange({ ...config, goalValue: v })}
        />
      </View>
    );
  }

  // ── Sleep ────────────────────────────────────────────────────────────────
  if (habitType === "sleep" && config.type === "sleep") {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.bg.elevated,
            borderColor: theme.border.subtle,
          },
        ]}
      >
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: theme.text.secondary }]}>
            Bedtime
          </Text>
          <TextInput
            style={[
              styles.timeInput,
              {
                color: theme.text.primary,
                backgroundColor: theme.bg.subtle,
                borderColor: theme.border.default,
              },
            ]}
            value={config.bedtime}
            onChangeText={(t) => onConfigChange({ ...config, bedtime: t })}
            placeholder="22:00"
            placeholderTextColor={theme.text.tertiary}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>
        <View
          style={[styles.divider, { backgroundColor: theme.border.subtle }]}
        />
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: theme.text.secondary }]}>
            Wake time
          </Text>
          <TextInput
            style={[
              styles.timeInput,
              {
                color: theme.text.primary,
                backgroundColor: theme.bg.subtle,
                borderColor: theme.border.default,
              },
            ]}
            value={config.wakeTime}
            onChangeText={(t) => onConfigChange({ ...config, wakeTime: t })}
            placeholder="06:00"
            placeholderTextColor={theme.text.tertiary}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>
      </View>
    );
  }

  // ── Prayer ───────────────────────────────────────────────────────────────
  if (habitType === "prayer" && config.type === "prayer") {
    const religionOptions: { value: Religion; label: string }[] = [
      { value: "islam", label: "Islam" },
      { value: "christianity", label: "Christianity" },
      { value: "judaism", label: "Judaism" },
      { value: "buddhism", label: "Buddhism" },
      { value: "hinduism", label: "Hinduism" },
      { value: "other", label: "Other" },
    ];
    // Default prayer counts per religion
    const defaultCount: Record<Religion, number> = {
      islam: 5,
      christianity: 1,
      judaism: 3,
      buddhism: 1,
      hinduism: 1,
      other: 1,
    };
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.bg.elevated,
            borderColor: theme.border.subtle,
          },
        ]}
      >
        <SelectRow<Religion>
          label="Religion"
          options={religionOptions}
          selected={config.religion}
          onSelect={(r) =>
            onConfigChange({
              ...config,
              religion: r,
              prayerCount: defaultCount[r],
            })
          }
        />
        <View
          style={[styles.divider, { backgroundColor: theme.border.subtle }]}
        />
        <Stepper
          label="Prayers per day"
          value={config.prayerCount}
          min={1}
          max={10}
          step={1}
          onChange={(v) => onConfigChange({ ...config, prayerCount: v })}
        />
      </View>
    );
  }

  // ── Meditation ───────────────────────────────────────────────────────────
  if (habitType === "meditation" && config.type === "meditation") {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.bg.elevated,
            borderColor: theme.border.subtle,
          },
        ]}
      >
        <Stepper
          label="Daily goal"
          value={config.dailyGoalMinutes}
          min={5}
          max={120}
          step={5}
          unit="min"
          onChange={(v) => onConfigChange({ ...config, dailyGoalMinutes: v })}
        />
      </View>
    );
  }

  // ── Reading ──────────────────────────────────────────────────────────────
  if (habitType === "reading" && config.type === "reading") {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.bg.elevated,
            borderColor: theme.border.subtle,
          },
        ]}
      >
        <Stepper
          label="Daily goal"
          value={config.dailyGoalMinutes}
          min={10}
          max={240}
          step={10}
          unit="min"
          onChange={(v) => onConfigChange({ ...config, dailyGoalMinutes: v })}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  rowLabel: {
    ...typeScale.subheadline,
    flex: 1,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    ...typeScale.headline,
    lineHeight: 20,
  },
  stepValue: {
    ...typeScale.callout,
    minWidth: 64,
    textAlign: "center",
  },
  selectBlock: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  optionChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  optionChipText: {
    ...typeScale.footnote,
    fontWeight: "500",
  },
  textInput: {
    flex: 1,
    maxWidth: 180,
    height: 36,
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    ...typeScale.subheadline,
  },
  timeInput: {
    width: 80,
    height: 36,
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    textAlign: "center",
    ...typeScale.subheadline,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing[4],
  },
});
