//
//  ActivityReportScenes.swift
//  DeviceActivityReport
//
//  SwiftUI views and DeviceActivityReportScene implementations for the
//  Serenity analytics tab. Receives real screen-time data from iOS and
//  renders it using SwiftUI.
//

import DeviceActivity
import ManagedSettings
import SwiftUI

#if os(iOS)

// ─── Context identifiers ─────────────────────────────────────────────────────
// These string values must match what the main app passes to DeviceActivityReport.

extension DeviceActivityReport.Context {
  static let totalActivity = Self("TotalActivity")
  static let weeklyActivity = Self("WeeklyActivity")
}

// ─── App usage model ─────────────────────────────────────────────────────────

struct AppUsageItem: Identifiable {
  let id = UUID()
  let name: String
  let duration: TimeInterval
}

// ─── Daily usage model ───────────────────────────────────────────────────────

struct DailyUsageItem: Identifiable {
  let id: Date
  let date: Date
  let duration: TimeInterval
}

// ─── TotalActivityReport scene ───────────────────────────────────────────────

/// Handles the "TotalActivity" context.
/// Receives raw DeviceActivityResults, aggregates them, and renders TotalActivityView.
struct TotalActivityReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .totalActivity
  let content: (TotalActivityView) -> TotalActivityView = { $0 }

  func makeConfiguration(
    representing activityReport: DeviceActivityResults<DeviceActivityData>
  ) async -> TotalActivityView {
    var totalDuration: TimeInterval = 0
    var appMap: [String: TimeInterval] = [:]

    for await activityData in activityReport {
      for await segment in activityData.activitySegments {
        totalDuration += segment.totalActivityDuration
        for await category in segment.categories {
          for await app in category.applications {
            let name = app.application.localizedDisplayName
              ?? app.application.bundleIdentifier
              ?? "Unknown"
            appMap[name, default: 0] += app.totalActivityDuration
          }
        }
      }
    }

    let appUsages: [AppUsageItem] = appMap
      .map { AppUsageItem(name: $0.key, duration: $0.value) }
      .sorted { $0.duration > $1.duration }

    return TotalActivityView(totalDuration: totalDuration, appUsages: appUsages)
  }
}

// ─── WeeklyActivityReport scene ──────────────────────────────────────────────

/// Handles the "WeeklyActivity" context.
/// Provides per-day breakdown and per-app totals for the current week.
struct WeeklyActivityReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .weeklyActivity
  let content: (WeeklyActivityView) -> WeeklyActivityView = { $0 }

  func makeConfiguration(
    representing activityReport: DeviceActivityResults<DeviceActivityData>
  ) async -> WeeklyActivityView {
    var totalDuration: TimeInterval = 0
    var dailyMap: [Date: TimeInterval] = [:]
    var appMap: [String: TimeInterval] = [:]
    let cal = Calendar.current

    for await activityData in activityReport {
      for await segment in activityData.activitySegments {
        // Normalize to start-of-day for grouping
        let day = cal.startOfDay(for: segment.dateInterval.start)
        dailyMap[day, default: 0] += segment.totalActivityDuration
        totalDuration += segment.totalActivityDuration
        for await category in segment.categories {
          for await app in category.applications {
            let name = app.application.localizedDisplayName
              ?? app.application.bundleIdentifier
              ?? "Unknown"
            appMap[name, default: 0] += app.totalActivityDuration
          }
        }
      }
    }

    let dailyUsages: [DailyUsageItem] = dailyMap
      .map { DailyUsageItem(id: $0.key, date: $0.key, duration: $0.value) }
      .sorted { $0.date < $1.date }

    let appUsages: [AppUsageItem] = appMap
      .map { AppUsageItem(name: $0.key, duration: $0.value) }
      .sorted { $0.duration > $1.duration }

    return WeeklyActivityView(
      totalDuration: totalDuration,
      dailyUsages: dailyUsages,
      appUsages: appUsages
    )
  }
}

// ─── Shared formatting helper ─────────────────────────────────────────────────

private func formatDuration(_ duration: TimeInterval) -> String {
  let hours = Int(duration) / 3600
  let mins = (Int(duration) % 3600) / 60
  if hours == 0 { return "\(mins)m" }
  return "\(hours)h \(mins)m"
}

// ─── TotalActivityView ────────────────────────────────────────────────────────

struct TotalActivityView: View {
  let totalDuration: TimeInterval
  let appUsages: [AppUsageItem]

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {

        // ── Today's total ──────────────────────────────────────────────────
        VStack(alignment: .leading, spacing: 6) {
          Text("Today's Screen Time")
            .font(.footnote)
            .foregroundStyle(.secondary)
          Text(formatDuration(totalDuration))
            .font(.system(size: 42, weight: .semibold, design: .rounded))
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(uiColor: .secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))

        // ── Top apps ───────────────────────────────────────────────────────
        if !appUsages.isEmpty {
          let maxDur = appUsages.first?.duration ?? 1
          VStack(alignment: .leading, spacing: 4) {
            Text("Usage by App")
              .font(.headline)
              .padding(.bottom, 4)

            ForEach(appUsages.prefix(8)) { item in
              VStack(alignment: .leading, spacing: 6) {
                HStack {
                  Label(item.name, systemImage: "app")
                    .lineLimit(1)
                  Spacer()
                  Text(formatDuration(item.duration))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
                GeometryReader { geo in
                  ZStack(alignment: .leading) {
                    Capsule().fill(Color.secondary.opacity(0.15))
                    Capsule()
                      .fill(Color.orange)
                      .frame(width: geo.size.width * CGFloat(item.duration / maxDur))
                  }
                }
                .frame(height: 5)
              }
              .padding(.vertical, 6)
              if item.id != appUsages.prefix(8).last?.id {
                Divider()
              }
            }
          }
          .padding()
          .background(Color(uiColor: .secondarySystemBackground))
          .clipShape(RoundedRectangle(cornerRadius: 16))
        }

        // ── Empty state ────────────────────────────────────────────────────
        if appUsages.isEmpty && totalDuration == 0 {
          ContentUnavailableView(
            "No Screen Time Data",
            systemImage: "checkmark.circle.fill",
            description: Text("No usage recorded today.")
          )
          .frame(maxWidth: .infinity)
        }
      }
      .padding()
    }
  }
}

// ─── WeeklyActivityView ───────────────────────────────────────────────────────

struct WeeklyActivityView: View {
  let totalDuration: TimeInterval
  let dailyUsages: [DailyUsageItem]
  let appUsages: [AppUsageItem]

  private let dayFormatter: DateFormatter = {
    let f = DateFormatter()
    f.dateFormat = "EEE"
    return f
  }()

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {

        // ── Weekly total ───────────────────────────────────────────────────
        VStack(alignment: .leading, spacing: 6) {
          Text("Weekly Screen Time")
            .font(.footnote)
            .foregroundStyle(.secondary)
          Text(formatDuration(totalDuration))
            .font(.system(size: 42, weight: .semibold, design: .rounded))
          if !dailyUsages.isEmpty {
            let avg = totalDuration / Double(dailyUsages.count)
            Text("Daily average: \(formatDuration(avg))")
              .font(.subheadline)
              .foregroundStyle(.secondary)
          }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(uiColor: .secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))

        // ── Daily bar chart ────────────────────────────────────────────────
        if !dailyUsages.isEmpty {
          let maxDur = dailyUsages.map(\.duration).max() ?? 1
          VStack(alignment: .leading, spacing: 10) {
            Text("Daily Breakdown")
              .font(.headline)

            HStack(alignment: .bottom, spacing: 6) {
              ForEach(dailyUsages) { day in
                let isToday = Calendar.current.isDateInToday(day.date)
                let barHeight = max(8, CGFloat(day.duration / maxDur) * 120)

                VStack(spacing: 4) {
                  if isToday {
                    Text(formatDuration(day.duration))
                      .font(.system(size: 9))
                      .foregroundStyle(Color.orange)
                  }
                  RoundedRectangle(cornerRadius: 4)
                    .fill(isToday ? Color.orange : Color.secondary.opacity(0.3))
                    .frame(height: barHeight)
                  Text(dayFormatter.string(from: day.date))
                    .font(.caption2)
                    .foregroundStyle(isToday ? Color.orange : Color.secondary)
                }
                .frame(maxWidth: .infinity)
              }
            }
            .frame(height: 155)
          }
          .padding()
          .background(Color(uiColor: .secondarySystemBackground))
          .clipShape(RoundedRectangle(cornerRadius: 16))
        }

        // ── Top apps ───────────────────────────────────────────────────────
        if !appUsages.isEmpty {
          let maxDur = appUsages.first?.duration ?? 1
          VStack(alignment: .leading, spacing: 4) {
            Text("Most Used Apps")
              .font(.headline)
              .padding(.bottom, 4)

            ForEach(appUsages.prefix(8)) { item in
              VStack(alignment: .leading, spacing: 6) {
                HStack {
                  Label(item.name, systemImage: "app")
                    .lineLimit(1)
                  Spacer()
                  Text(formatDuration(item.duration))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
                GeometryReader { geo in
                  ZStack(alignment: .leading) {
                    Capsule().fill(Color.secondary.opacity(0.15))
                    Capsule()
                      .fill(Color.orange)
                      .frame(width: geo.size.width * CGFloat(item.duration / maxDur))
                  }
                }
                .frame(height: 5)
              }
              .padding(.vertical, 6)
              if item.id != appUsages.prefix(8).last?.id {
                Divider()
              }
            }
          }
          .padding()
          .background(Color(uiColor: .secondarySystemBackground))
          .clipShape(RoundedRectangle(cornerRadius: 16))
        }

        // ── Empty state ────────────────────────────────────────────────────
        if dailyUsages.isEmpty && totalDuration == 0 {
          ContentUnavailableView(
            "No Screen Time Data",
            systemImage: "chart.bar.fill",
            description: Text(
              "Weekly usage data will appear here once Screen Time is active.")
          )
          .frame(maxWidth: .infinity)
        }
      }
      .padding()
    }
  }
}

#endif