import { useThemedColors } from "@/hooks/useThemedStyles";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedProps,
    useDerivedValue,
    withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0–1
  size: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export default function ProgressRing({
  progress,
  size,
  strokeWidth = 4,
  color,
  trackColor,
  children,
}: ProgressRingProps) {
  const theme = useThemedColors();
  const resolvedTrackColor = trackColor ?? theme.border.subtle;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedProgress = useDerivedValue(() =>
    withTiming(progress, { duration: 400 }),
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - animatedProgress.value) * circumference,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={resolvedTrackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Active stroke */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      {children && (
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.childrenContainer}>{children}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  childrenContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
