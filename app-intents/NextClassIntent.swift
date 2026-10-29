import AppIntents
internal import ExpoAppIntents
import Foundation

// répond sans ouvrir l'app, d'après les cours publiés par publishCourses (7 prochains jours)
struct NextClassIntent: AppIntent {
  static let title: LocalizedStringResource = "Prochain cours"
  static let description = IntentDescription("Donne ton prochain cours, son horaire et sa salle.")

  func perform() async throws -> some IntentResult & ProvidesDialog {
    let now = Date()
    let records = (try? await AppIntentEntityStore.shared.entities(ofKind: "course")) ?? []
    let courses = records.compactMap(Course.init(record:)).filter { $0.end > now }.sorted { $0.start < $1.start }

    guard let course = courses.first else {
      return .result(dialog: "Aucun cours à venir dans ton emploi du temps. Ouvre UniceNotes pour l'actualiser.")
    }
    return .result(dialog: "\(course.sentence(now: now))")
  }
}

private struct Course {
  let title: String
  let room: String
  let start: Date
  let end: Date

  init?(record: AppIntentEntityRecord) {
    guard let start = record.metadata["start"].flatMap(Double.init),
      let end = record.metadata["end"].flatMap(Double.init)
    else { return nil }
    title = record.title
    room = record.metadata["room"] ?? ""
    self.start = Date(timeIntervalSince1970: start / 1000)
    self.end = Date(timeIntervalSince1970: end / 1000)
  }

  func sentence(now: Date) -> String {
    let place = room.isEmpty ? "" : ", \(room)"
    if start <= now {
      return "En ce moment : \(title), jusqu'à \(Course.format(end, "HH:mm"))\(place)."
    }
    let calendar = Calendar.current
    let day =
      calendar.isDateInToday(start)
      ? "aujourd'hui" : calendar.isDateInTomorrow(start) ? "demain" : Course.format(start, "EEEE")
    return "Prochain cours : \(title), \(day) à \(Course.format(start, "HH:mm"))\(place)."
  }

  private static func format(_ date: Date, _ pattern: String) -> String {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "fr_FR")
    formatter.dateFormat = pattern
    return formatter.string(from: date)
  }
}
