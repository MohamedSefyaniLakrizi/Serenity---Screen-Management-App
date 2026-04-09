import { OathConfirmation } from "@/components/ui";
import { borderRadius, spacing } from "@/constants/spacing";
import { typeScale } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import type { PrayerEntry } from "@/types/habits";
import { Check } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PrayerTimesListProps {
  prayers: PrayerEntry[];
  onPrayerConfirmed: (prayerName: string) => void;
  habitColor: string;
}

export default function PrayerTimesList({
  prayers,
  onPrayerConfirmed,
  habitColor,
}: PrayerTimesListProps) {
  const theme = useThemedColors();
  // Track which prayer's oath UI is expanded
  const [expandedPrayer, setExpandedPrayer] = useState<string | null>(null);

  // Determine the "current" prayer — the first uncompleted one
  const currentPrayerIndex = prayers.findIndex((p) => !p.completed);

  return (
    <View style={styles.container}>
      {prayers.map((prayer, index) => {
        const isCurrent = index === currentPrayerIndex;
        const isExpanded = expandedPrayer === prayer.name;

        return (
          <View
            key={prayer.name}
            style={[
              styles.prayerCard,
              {
                backgroundColor: theme.bg.elevated,
                borderColor: isCurrent ? habitColor : theme.border.subtle,
                borderLeftColor: prayer.completed
                  ? theme.status.success
                  : isCurrent
                    ? habitColor
                    : theme.border.subtle,
              },
            ]}
          >
            {/* Prayer row */}
            <View style={styles.prayerRow}>
              <View style={styles.prayerInfo}>
                <Text
                  style={[
                    styles.prayerName,
                    {
                      color: prayer.completed
                        ? theme.text.tertiary
                        : isCurrent
                          ? theme.text.primary
                          : theme.text.secondary,
                    },
                  ]}
                >
                  {prayer.name}
                </Text>
                <Text
                  style={[styles.prayerTime, { color: theme.text.tertiary }]}
                >
                  {prayer.time}
                </Text>
              </View>

              {prayer.completed ? (
                /* Checkmark for completed prayers */
                <View
                  style={[
                    styles.completedBadge,
                    { backgroundColor: theme.status.successSubtle },
                  ]}
                >
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    color={theme.status.success}
                  />
                </View>
              ) : (
                /* Confirm button for uncompleted prayers */
                <TouchableOpacity
                  onPress={() =>
                    setExpandedPrayer(isExpanded ? null : prayer.name)
                  }
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor: isCurrent
                        ? habitColor + "1A"
                        : theme.bg.subtle,
                      borderColor: isCurrent
                        ? habitColor
                        : theme.border.default,
                    },
                  ]}
                  accessibilityLabel={`Confirm ${prayer.name}`}
                >
                  <Text
                    style={[
                      styles.confirmBtnText,
                      { color: isCurrent ? habitColor : theme.text.secondary },
                    ]}
                  >
                    {isExpanded ? "Cancel" : "Confirm"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Oath confirmation — shown when expanded */}
            {isExpanded && !prayer.completed && (
              <View style={styles.oathContainer}>
                <OathConfirmation
                  oathText={`I confirm I completed ${prayer.name}`}
                  habitColor={habitColor}
                  holdDurationMs={5000}
                  onConfirmed={() => {
                    setExpandedPrayer(null);
                    onPrayerConfirmed(prayer.name);
                  }}
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  prayerCard: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  prayerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  prayerInfo: {
    flex: 1,
    gap: spacing[0.5],
  },
  prayerName: {
    ...typeScale.headline,
  },
  prayerTime: {
    ...typeScale.footnote,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  confirmBtnText: {
    ...typeScale.footnote,
    fontWeight: "600",
  },
  oathContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    alignItems: "center",
  },
});
