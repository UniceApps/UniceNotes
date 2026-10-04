import ExpoModulesCore
import Foundation
import WebKit

// WKWebView oublie les cookies de session quand l'app est tuée : sans eux il faudrait se
// reconnecter au CAS, à Moodle… à chaque lancement. On les garde dans un fichier protégé
// pour les réinjecter avant le premier chargement.
public class WebSessionModule: Module {
  // tant que la sauvegarde n'a pas été relue, persistAsync l'écraserait avec une session vide
  private var restored = false
  // certaines versions de WebKit ne répondent sur le magasin de cookies qu'une fois une WebView créée
  private var warmUpView: WKWebView?

  private func dataStore() -> WKWebsiteDataStore {
    if warmUpView == nil {
      warmUpView = WKWebView(frame: .zero)
    }
    return WKWebsiteDataStore.default()
  }

  public func definition() -> ModuleDefinition {
    Name("WebSession")

    // ne remplace jamais un cookie déjà présent, plus récent que la sauvegarde
    AsyncFunction("restoreAsync") { (promise: Promise) in
      let saved = CookieVault.load()
      let store = self.dataStore().httpCookieStore
      store.getAllCookies { current in
        let present = Set(current.map(CookieVault.key))
        let missing = saved.filter { !present.contains(CookieVault.key($0)) }
        let group = DispatchGroup()
        for cookie in missing {
          group.enter()
          store.setCookie(cookie) { group.leave() }
        }
        group.notify(queue: .main) {
          self.restored = true
          promise.resolve(missing.count)
        }
      }
    }
    .runOnQueue(.main)

    // les cookies persistants sont déjà gardés par WebKit : seuls ceux de session sont sauvegardés
    AsyncFunction("persistAsync") { (promise: Promise) in
      guard self.restored else {
        promise.resolve(0)
        return
      }
      self.dataStore().httpCookieStore.getAllCookies { cookies in
        let session = cookies.filter { $0.isSessionOnly }
        do {
          try CookieVault.save(session)
          promise.resolve(session.count)
        } catch {
          promise.reject(error)
        }
      }
    }
    .runOnQueue(.main)

    // pour télécharger un fichier avec la session de la WebView
    AsyncFunction("cookieHeaderAsync") { (url: URL, promise: Promise) in
      self.dataStore().httpCookieStore.getAllCookies { cookies in
        let matching = cookies.filter { CookieVault.matches($0, url: url) }
        let header: String? = HTTPCookie.requestHeaderFields(with: matching)["Cookie"]
        promise.resolve(header)
      }
    }
    .runOnQueue(.main)

    AsyncFunction("clearAsync") { (promise: Promise) in
      CookieVault.delete()
      self.dataStore().removeData(
        ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
        modifiedSince: .distantPast
      ) {
        promise.resolve()
      }
    }
    .runOnQueue(.main)
  }
}

// cookie tel qu'écrit dans la sauvegarde
private struct StoredCookie: Codable {
  let name: String
  let value: String
  let domain: String
  let path: String
  let expires: Date?
  let secure: Bool
  let httpOnly: Bool
  let sameSite: String?

  init(_ cookie: HTTPCookie) {
    name = cookie.name
    value = cookie.value
    domain = cookie.domain
    path = cookie.path
    expires = cookie.expiresDate
    secure = cookie.isSecure
    httpOnly = cookie.isHTTPOnly
    sameSite = cookie.sameSitePolicy?.rawValue
  }

  var cookie: HTTPCookie? {
    var properties: [HTTPCookiePropertyKey: Any] = [
      .name: name,
      .value: value,
      .domain: domain,
      .path: path,
    ]
    if let expires {
      properties[.expires] = expires
    }
    if secure {
      properties[.secure] = "TRUE"
    }
    if httpOnly {
      // pas de constante publique, mais la clé est reconnue par CFNetwork
      properties[HTTPCookiePropertyKey("HttpOnly")] = "TRUE"
    }
    if let sameSite {
      properties[.sameSitePolicy] = sameSite
    }
    return HTTPCookie(properties: properties)
  }
}

private enum CookieVault {
  // une session restée inutilisée plus longtemps n'est plus réinjectée
  private static let maxAge: TimeInterval = 30 * 24 * 60 * 60

  private struct Snapshot: Codable {
    let savedAt: Date
    let cookies: [StoredCookie]
  }

  private static var directory: URL? {
    FileManager.default
      .urls(for: .applicationSupportDirectory, in: .userDomainMask)
      .first?
      .appendingPathComponent("WebSession", isDirectory: true)
  }

  private static var file: URL? {
    directory?.appendingPathComponent("cookies.json")
  }

  static func key(_ cookie: HTTPCookie) -> String {
    "\(cookie.domain)|\(cookie.path)|\(cookie.name)"
  }

  static func save(_ cookies: [HTTPCookie]) throws {
    guard var folder = directory, let target = file else { return }
    try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    // jamais dans les sauvegardes iCloud ou de l'ordinateur
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try folder.setResourceValues(values)

    let snapshot = Snapshot(savedAt: Date(), cookies: cookies.map { StoredCookie($0) })
    let data = try JSONEncoder().encode(snapshot)
    try data.write(to: target, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
  }

  static func load() -> [HTTPCookie] {
    guard let target = file,
          let data = try? Data(contentsOf: target),
          let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data),
          Date().timeIntervalSince(snapshot.savedAt) < maxAge
    else {
      return []
    }
    let now = Date()
    return snapshot.cookies.compactMap { $0.cookie }.filter { cookie in
      guard let expires = cookie.expiresDate else { return true }
      return expires > now
    }
  }

  static func delete() {
    guard let target = file else { return }
    try? FileManager.default.removeItem(at: target)
  }

  // règles d'envoi d'un cookie (RFC 6265, 5.4) : domaine, chemin, connexion sécurisée, expiration
  static func matches(_ cookie: HTTPCookie, url: URL) -> Bool {
    guard let host = url.host(percentEncoded: false)?.lowercased() else { return false }
    if cookie.isSecure && url.scheme?.lowercased() != "https" { return false }
    if let expires = cookie.expiresDate, expires <= Date() { return false }

    let domain = cookie.domain.lowercased()
    if domain.hasPrefix(".") {
      guard host == String(domain.dropFirst()) || host.hasSuffix(domain) else { return false }
    } else if host != domain {
      return false
    }

    let requestPath = url.path(percentEncoded: false)
    let path = requestPath.isEmpty ? "/" : requestPath
    let cookiePath = cookie.path.isEmpty ? "/" : cookie.path
    if path == cookiePath { return true }
    guard path.hasPrefix(cookiePath) else { return false }
    return cookiePath.hasSuffix("/") || path.dropFirst(cookiePath.count).hasPrefix("/")
  }
}
