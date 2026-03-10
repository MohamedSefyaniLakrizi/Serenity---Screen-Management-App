// eslint-disable-next-line @typescript-eslint/no-require-imports
const { requireNativeViewManager } = require("expo-modules-core");
import React from "react";
import { Platform, ViewProps } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

/** The time window to display in the report. */
export type ActivityReportPeriod = "day" | "week";

export interface ActivityReportViewProps extends ViewProps {
  /**
   * Which period to show.
   * - `"day"` – today's screen time (default)
   * - `"week"` – current week's screen time with daily breakdown
   */
  period?: ActivityReportPeriod;
}

// ─── Native view manager ──────────────────────────────────────────────────────

const NativeView: React.ComponentType<ActivityReportViewProps> | null =
  Platform.OS === "ios" ? requireNativeViewManager("ActivityReport") : null;

// ─── Exported component ───────────────────────────────────────────────────────

/**
 * A native SwiftUI view that embeds Apple's `DeviceActivityReport` to display
 * real screen-time data from the iOS Screen Time API.
 *
 * Requires:
 * - iOS 16.0+
 * - FamilyControls authorization granted by the user
 * - The `DeviceActivityReport` app extension built alongside the main app
 */
export function ActivityReportView(props: ActivityReportViewProps) {
  const { period = "week", ...rest } = props;
  if (!NativeView) return null;
  return React.createElement(NativeView, { period, ...rest });
}
