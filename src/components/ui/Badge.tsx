import { borderRadius } from "@/constants";
import { accent, darkBg, status } from "@/constants/colors";
import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

interface BadgeProps {
  text: string;
  variant?: "primary" | "secondary" | "success" | "error";
  size?: "small" | "medium";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  text,
  variant = "primary",
  size = "medium",
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], styles[`${size}Size`], style]}>
      <Text
        style={[
          styles.text,
          styles[`${variant}Text`],
          styles[`${size}Text`],
          textStyle,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },

  // Variants
  primary: {
    backgroundColor: accent.primary,
  },
  secondary: {
    backgroundColor: accent.subtle,
  },
  success: {
    backgroundColor: status.success,
  },
  error: {
    backgroundColor: status.error,
  },

  // Sizes
  smallSize: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  mediumSize: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  // Text
  text: {
    fontWeight: "600",
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: darkBg.primary,
  },
  successText: {
    color: "#FFFFFF",
  },
  errorText: {
    color: "#FFFFFF",
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 13,
  },
});
