import { borderRadius, shadows } from "@/constants";
import { useThemedColors } from "@/hooks/useThemedStyles";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: number;
  style?: ViewStyle;
}

export default function Card({
  children,
  variant = "default",
  padding = 16,
  style,
}: CardProps) {
  const themedColors = useThemedColors();

  const getShadowStyle = () => {
    if (variant === "outlined") return {};
    const shadowIntensity = variant === "elevated" ? "medium" : "small";
    return shadows[shadowIntensity];
  };

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: themedColors.bg.elevated },
        getShadowStyle(),
        variant === "outlined" && [
          styles.outlined,
          { borderColor: themedColors.border.default },
        ],
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
  },
  outlined: {
    borderWidth: 1,
  },
});
