//
//  ActivityReportModule.swift
//  Serenity
//
//  Expo module definition that registers ActivityReportView as a native
//  React Native component named "ActivityReport".
//

import ExpoModulesCore

public class ActivityReportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ActivityReport")

    View(ActivityReportView.self) {
      Prop("period") { (view: ActivityReportView, period: String) in
        view.updatePeriod(period)
      }
    }
  }
}
