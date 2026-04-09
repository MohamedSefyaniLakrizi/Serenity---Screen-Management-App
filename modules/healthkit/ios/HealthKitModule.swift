//
//  HealthKitModule.swift
//  Serenity
//
//  Expo module that exposes HealthKit fitness data to React Native.
//  Queries:
//    - Step count  (HKQuantityTypeIdentifier.stepCount)
//    - Active energy burned  (HKQuantityTypeIdentifier.activeEnergyBurned)
//    - Workout samples  (HKWorkoutType)
//
//  Authorization is requested once for all three types.
//  All queries are anchored to a calendar day in the local time zone.
//

import ExpoModulesCore
import HealthKit

public class HealthKitModule: Module {

  // MARK: - Module definition

  public func definition() -> ModuleDefinition {
    Name("HealthKit")

    // ── requestAuthorization ─────────────────────────────────────────────────
    AsyncFunction("requestAuthorization") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.resolve(false)
        return
      }

      let store = HKHealthStore()
      let readTypes: Set<HKObjectType> = [
        HKQuantityType.quantityType(forIdentifier: .stepCount)!,
        HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!,
        HKObjectType.workoutType(),
      ]

      store.requestAuthorization(toShare: nil, read: readTypes) { success, _ in
        promise.resolve(success)
      }
    }

    // ── getStepCount ─────────────────────────────────────────────────────────
    AsyncFunction("getStepCount") { (dateString: String, promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable(),
            let quantityType = HKQuantityType.quantityType(forIdentifier: .stepCount),
            let interval = HealthKitModule.calendarDayInterval(for: dateString)
      else {
        promise.resolve(0)
        return
      }

      let store = HKHealthStore()
      let predicate = HKQuery.predicateForSamples(
        withStart: interval.start,
        end: interval.end,
        options: .strictStartDate
      )
      let query = HKStatisticsQuery(
        quantityType: quantityType,
        quantitySamplePredicate: predicate,
        options: .cumulativeSum
      ) { _, result, _ in
        let steps = result?.sumQuantity()?.doubleValue(for: .count()) ?? 0
        promise.resolve(Int(steps))
      }
      store.execute(query)
    }

    // ── getActiveCalories ────────────────────────────────────────────────────
    AsyncFunction("getActiveCalories") { (dateString: String, promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable(),
            let quantityType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned),
            let interval = HealthKitModule.calendarDayInterval(for: dateString)
      else {
        promise.resolve(0)
        return
      }

      let store = HKHealthStore()
      let predicate = HKQuery.predicateForSamples(
        withStart: interval.start,
        end: interval.end,
        options: .strictStartDate
      )
      let query = HKStatisticsQuery(
        quantityType: quantityType,
        quantitySamplePredicate: predicate,
        options: .cumulativeSum
      ) { _, result, _ in
        let kcal = result?.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
        promise.resolve(Int(kcal))
      }
      store.execute(query)
    }

    // ── getWorkouts ──────────────────────────────────────────────────────────
    AsyncFunction("getWorkouts") { (dateString: String, promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable(),
            let interval = HealthKitModule.calendarDayInterval(for: dateString)
      else {
        promise.resolve([[String: Any]]())
        return
      }

      let store = HKHealthStore()
      let predicate = HKQuery.predicateForSamples(
        withStart: interval.start,
        end: interval.end,
        options: .strictStartDate
      )
      let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
      let query = HKSampleQuery(
        sampleType: HKObjectType.workoutType(),
        predicate: predicate,
        limit: HKObjectQueryNoLimit,
        sortDescriptors: [sort]
      ) { _, samples, _ in
        let result: [[String: Any]] = (samples as? [HKWorkout] ?? []).map { workout in
          let durationMinutes = Int(workout.duration / 60)
          let kcal = workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0
          return [
            "type": workout.workoutActivityType.name,
            "durationMinutes": durationMinutes,
            "calories": Int(kcal),
          ]
        }
        promise.resolve(result)
      }
      store.execute(query)
    }
  }

  // MARK: - Helpers

  /// Returns the start and end of the calendar day for a "YYYY-MM-DD" string
  /// in the current locale time zone.
  private static func calendarDayInterval(for dateString: String) -> (start: Date, end: Date)? {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.timeZone = .current
    guard let date = formatter.date(from: dateString) else { return nil }
    var calendar = Calendar.current
    calendar.timeZone = .current
    let start = calendar.startOfDay(for: date)
    guard let end = calendar.date(byAdding: .day, value: 1, to: start) else { return nil }
    return (start, end)
  }
}

// MARK: - HKWorkoutActivityType readable name

private extension HKWorkoutActivityType {
  var name: String {
    switch self {
    case .running: return "running"
    case .cycling: return "cycling"
    case .walking: return "walking"
    case .swimming: return "swimming"
    case .yoga: return "yoga"
    case .functionalStrengthTraining: return "strengthTraining"
    case .traditionalStrengthTraining: return "weightlifting"
    case .highIntensityIntervalTraining: return "hiit"
    case .dance: return "dance"
    case .soccer: return "soccer"
    case .basketball: return "basketball"
    case .tennis: return "tennis"
    default: return "workout"
    }
  }
}
