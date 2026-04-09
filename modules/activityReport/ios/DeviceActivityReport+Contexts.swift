//
//  DeviceActivityReport+Contexts.swift
//  Serenity
//
//  Declares the DeviceActivityReport.Context values shared between
//  the main app (ActivityReportView) and the DeviceActivityReport extension.
//  Both targets must agree on the same raw string values.
//

import DeviceActivity
import SwiftUI

@available(iOS 16.0, *)
extension DeviceActivityReport.Context {
  /// Shows today's total screen time plus per-app breakdown.
  static let totalActivity = Self("TotalActivity")
  /// Shows the current week's daily usage chart plus per-app breakdown.
  static let weeklyActivity = Self("WeeklyActivity")
}
