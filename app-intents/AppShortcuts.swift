import AppIntents

// phrases Siri, compilées dans l'app : chacune doit contenir le nom de l'app
struct AppShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: NextClassIntent(),
      phrases: [
        "Quel est mon prochain cours sur \(.applicationName)",
        "Mon prochain cours sur \(.applicationName)",
        "Prochain cours \(.applicationName)",
      ],
      shortTitle: "Prochain cours",
      systemImageName: "graduationcap"
    )
    AppShortcut(
      intent: OpenTimetableIntent(),
      phrases: [
        "Ouvre mon emploi du temps sur \(.applicationName)",
        "Mon emploi du temps \(.applicationName)",
        "Mon EDT \(.applicationName)",
      ],
      shortTitle: "Emploi du temps",
      systemImageName: "calendar"
    )
    AppShortcut(
      intent: OpenEntAppIntent(),
      phrases: [
        "Ouvre \(\.$app) sur \(.applicationName)",
        "Ouvre un service de l'ENT sur \(.applicationName)",
      ],
      shortTitle: "Service de l'ENT",
      systemImageName: "square.grid.2x2"
    )
  }
}
