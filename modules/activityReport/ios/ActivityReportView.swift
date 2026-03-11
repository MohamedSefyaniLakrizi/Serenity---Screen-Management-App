//
//  ActivityReportView.swift
//  Serenity
//
//  An ExpoView subclass that hosts the SwiftUI DeviceActivityReport view.
//  It embeds the DeviceActivityReport app extension into the React Native
//  view hierarchy using UIHostingController.
//

import DeviceActivity
import ExpoModulesCore
import SwiftUI
import UIKit

public class ActivityReportView: ExpoView {

  // The hosting controller wrapping the SwiftUI DeviceActivityReport view.
  private var hostingController: UIHostingController<AnyView>?
  private var period: String = "week"

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    backgroundColor = .clear
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  override public func didMoveToWindow() {
    super.didMoveToWindow()
    guard window != nil else { return }
    setupHostingControllerIfNeeded()
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private func setupHostingControllerIfNeeded() {
    guard hostingController == nil,
      let parentVC = nearestViewController()
    else { return }

    let hc = UIHostingController(rootView: makeReportView())
    hc.view.backgroundColor = .clear

    parentVC.addChild(hc)
    addSubview(hc.view)
    hc.view.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      hc.view.topAnchor.constraint(equalTo: topAnchor),
      hc.view.bottomAnchor.constraint(equalTo: bottomAnchor),
      hc.view.leadingAnchor.constraint(equalTo: leadingAnchor),
      hc.view.trailingAnchor.constraint(equalTo: trailingAnchor),
    ])
    hc.didMove(toParent: parentVC)
    hostingController = hc
  }

  private func makeReportView() -> AnyView {
    if #available(iOS 16.0, *) {
      let context =
        period == "day"
        ? DeviceActivityReport.Context.totalActivity
        : DeviceActivityReport.Context.weeklyActivity

      let filter = makeFilter()
      return AnyView(DeviceActivityReport(context, filter: filter))
    } else {
      return AnyView(
        Text("Screen Time reports require iOS 16 or later.")
          .foregroundStyle(.secondary)
          .multilineTextAlignment(.center)
          .padding()
      )
    }
  }

  @available(iOS 16.0, *)
  private func makeFilter() -> DeviceActivityFilter {
    let calendar = Calendar.current
    let now = Date()
    let interval: DateInterval

    switch period {
    case "day":
      interval =
        calendar.dateInterval(of: .day, for: now)
        ?? DateInterval(start: now, duration: 86400)
    default:  // "week"
      interval =
        calendar.dateInterval(of: .weekOfYear, for: now)
        ?? DateInterval(start: now, duration: 7 * 86400)
    }

    return DeviceActivityFilter(
      segment: .daily(during: interval),
      users: .all,
      devices: .init([.iPhone, .iPad])
    )
  }

  /// Walk the UIResponder chain upwards to find the nearest UIViewController.
  private func nearestViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let r = responder {
      if let vc = r as? UIViewController { return vc }
      responder = r.next
    }
    return nil
  }

  // ─── Public API (called by Expo module props) ────────────────────────────────

  func updatePeriod(_ newPeriod: String) {
    period = newPeriod
    hostingController?.rootView = makeReportView()
  }
}
