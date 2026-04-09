import { borderRadius, spacing } from "@/constants/spacing";
import { FONTS, typeScale } from "@/constants/typography";
import { useThemedColors } from "@/hooks/useThemedStyles";
import { Flame } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StreakBadgeProps {
  count: number;
  label?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: {
    iconSize: 14,
    countStyle: typeScale.caption1,
    labelStyle: typeScale.caption2,
    paddingH: spacing[2],
    paddingV: spacing[1],
    gap: spacing[1],
  },
  md: {
    iconSize: 16,
    countStyle: typeScale.statSmall,
    labelStyle: typeScale.footnote,
    paddingH: spacing[3],
    paddingV: spacing[1.5],
    gap: spacing[1],
  },
  lg: {
    iconSize: 20,
    countStyle: typeScale.statMedium,
    labelStyle: typeScale.subheadline,
    paddingH: spacing[4],
    paddingV: spacing[2],
    gap: spacing[1.5],
  },
} as const;

export default function StreakBadge({
  count,
  label = "days",
  color,
  size = "md",
}: StreakBadgeProps) {
  const theme = useThemedColors();
  const resolvedColor = color ?? theme.accent.primary;
  const config = sizeConfig[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${resolvedColor}1A`,
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
          gap: config.gap,
        },
      ]}
    >
      <Flame size={config.iconSize} strokeWidth={1.5} color={resolvedColor} />
      <Text
        style={[
          styles.count,
          {
            color: resolvedColor,
            fontSize: config.countStyle.size,
            fontWeight: config.countStyle.weight,
            lineHeight: config.countStyle.lineHeight,
          },
        ]}
      >
        {count}
      </Text>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.text.tertiary,
              fontSize: config.labelStyle.size,
              fontWeight: config.labelStyle.weight,
              lineHeight: config.labelStyle.lineHeight,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  count: {
    fontFamily: FONTS.mono,
  },
  label: {},
});
