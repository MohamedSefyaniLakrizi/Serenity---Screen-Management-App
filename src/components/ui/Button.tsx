import { borderRadius } from "@/constants";
import { useThemedColors } from "@/hooks/useThemedStyles";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  fullWidth = true,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const themedColors = useThemedColors();

  const getBackgroundColor = () => {
    switch (variant) {
      case "primary":
        return themedColors.accent.primary;
      case "secondary":
        return themedColors.bg.elevated;
      case "outline":
      case "ghost":
        return "transparent";
      default:
        return themedColors.accent.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "primary":
        return "#FFFFFF";
      case "secondary":
        return themedColors.text.primary;
      case "outline":
      case "ghost":
        return themedColors.accent.primary;
      default:
        return "#FFFFFF";
    }
  };

  const s = styles(themedColors);

  const buttonStyles = [
    s.base,
    { backgroundColor: getBackgroundColor() },
    variant === "outline" && [
      s.outline,
      { borderColor: themedColors.accent.primary },
    ],
    s[`${size}Size`],
    fullWidth && s.fullWidth,
    disabled && s.disabled,
    style,
  ];

  const textStyles = [
    s.text,
    { color: getTextColor() },
    s[`${size}Text`],
    disabled && s.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary" ? "#FFFFFF" : themedColors.accent.primary
          }
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = (theme: ReturnType<typeof useThemedColors>) =>
  StyleSheet.create({
    base: {
      borderRadius: borderRadius.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    fullWidth: {
      width: "100%",
    },
    outline: {
      borderWidth: 2,
    },

    // Sizes
    smallSize: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    mediumSize: {
      paddingVertical: 16,
      paddingHorizontal: 24,
    },
    largeSize: {
      paddingVertical: 18,
      paddingHorizontal: 32,
    },

    // Text Styles
    text: {
      fontWeight: "600",
    },
    smallText: {
      fontSize: 13,
    },
    mediumText: {
      fontSize: 17,
    },
    largeText: {
      fontSize: 17,
    },

    // States
    disabled: {
      opacity: 0.5,
    },
    disabledText: {
      opacity: 0.7,
    },
  });
