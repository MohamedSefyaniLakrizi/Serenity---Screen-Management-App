//
//  DeviceActivityReportExtension.swift
//  DeviceActivityReport
//
//  Entry point for the DeviceActivityReport app extension.
//  Provides SwiftUI-based scenes that display real screen-time data
//  via Apple's DeviceActivity framework.
//

import DeviceActivity
import SwiftUI

@main
struct SerenityActivityReportExtension: DeviceActivityReportExtension {
  var body: some DeviceActivityReportScene {
    TotalActivityReport()
    WeeklyActivityReport()
  }
}
