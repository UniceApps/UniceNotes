import AppIntents
internal import ExpoAppIntents

// ouvre l'onglet EDT sur aujourd'hui (repris par src/services/app-intents.ts)
struct OpenTimetableIntent: AppIntent {
  static let title: LocalizedStringResource = "Ouvrir l'emploi du temps"
  static let description = IntentDescription("Ouvre ton emploi du temps sur la journée en cours.")
  static let openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(name: "openTimetable")
    return .result()
  }
}
