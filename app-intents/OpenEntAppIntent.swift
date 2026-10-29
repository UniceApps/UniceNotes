import AppIntents
internal import ExpoAppIntents
import Foundation

// service du catalogue publié par l'app (publishEntApps)
struct EntAppEntity: AppEntity {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Service de l'ENT"
  static let defaultQuery = EntAppQuery()

  var id: String
  var title: String
  var subtitle: String?
  var synonyms: [String]

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(
      title: LocalizedStringResource(stringLiteral: title),
      subtitle: subtitle.map { LocalizedStringResource(stringLiteral: $0) }
    )
  }

  init(record: AppIntentEntityRecord) {
    id = record.id
    title = record.title
    subtitle = record.subtitle
    synonyms = record.synonyms
  }

  func matches(_ search: String) -> Bool {
    let fold = { (text: String) in text.folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current) }
    let needle = fold(search.trimmingCharacters(in: .whitespacesAndNewlines))
    guard !needle.isEmpty else { return false }
    return ([id, title] + synonyms).map(fold).contains { $0.contains(needle) || needle.contains($0) }
  }
}

struct EntAppQuery: EntityStringQuery {
  func entities(for identifiers: [String]) async throws -> [EntAppEntity] {
    try await AppIntentEntityStore.shared.entities(ofKind: "entApp", matching: identifiers)
      .map(EntAppEntity.init(record:))
  }

  func suggestedEntities() async throws -> [EntAppEntity] {
    try await AppIntentEntityStore.shared.entities(ofKind: "entApp").map(EntAppEntity.init(record:))
  }

  func entities(matching string: String) async throws -> [EntAppEntity] {
    try await suggestedEntities().filter { $0.matches(string) }
  }
}

// ouvre un service dans le navigateur de l'app, comme unicenotes://app/{id}
struct OpenEntAppIntent: AppIntent {
  static let title: LocalizedStringResource = "Ouvrir un service de l'ENT"
  static let description = IntentDescription("Ouvre Moodle, PronoteCampus, Izly… dans UniceNotes.")
  static let openAppWhenRun: Bool = true

  @Parameter(title: "Service", requestValueDialog: "Quel service veux-tu ouvrir ?")
  var app: EntAppEntity

  static var parameterSummary: some ParameterSummary {
    Summary("Ouvrir \(\.$app)")
  }

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(name: "openEntApp", params: ["appId": .string(app.id)])
    return .result()
  }
}
