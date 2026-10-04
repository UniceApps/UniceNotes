# Data guide

Everything stays on the device: UniceNotes has no server of its own and never uploads personal data.
All keys are listed in `src/utils/storage.ts`.

## SecureStore

<p align="center">
  <img src="https://docs.expo.dev/static/images/packages/expo-secure-store.png" alt="SecureStore" width="50"/>
</p>

Encrypted storage backed by the iOS Keychain / Android Keystore.

- `adeid`: ADE timetable code, either a student number or a program id ending with `-VET`

## AsyncStorage

<p align="center">
  <img src="https://docs.expo.dev/static/images/packages/expo-file-system.png" alt="AsyncStorage" width="50"/>
</p>

Unencrypted key-value storage for non-sensitive preferences.

- `theme`: selected color palette (`azur`, `menthe`, `lavande`, `ambre`)
- `haptics`: `"false"` when haptic feedback is disabled
- `liveActivities`: `"false"` when the iOS Live Activity is disabled
- `oobeCompleted`: `"true"` once the first-launch setup is done
- `releaseNotesVersion`: last app version whose release notes were shown
- `adeProjectOverride`: ADE project (school year) picked manually, absent in automatic mode
- `favoriteRooms`: ids of the pinned rooms (3 max)
- `pinnedApps`: ids of the ENT services pinned to the home screen's quick access (3 max)
- `androidWidgetTimeline`: upcoming classes read by the Android widget

## File system

- `calendar.json` (document directory): last downloaded timetable with its ADE code and download date, shown while offline

## In-app browser

ENT services (Moodle, Outlook, PronoteCampus…) open in a WebView that keeps its own cookies and web storage on the device, so the user stays signed in between launches.

- iOS: WebKit keeps persistent cookies by itself. Session cookies, which WebKit drops when the app is killed, are saved by the local `web-session` module (`modules/web-session`) in `Application Support/WebSession/cookies.json`, protected until the first unlock and excluded from backups. They are not restored after 30 days without use.
- Android: the system WebView keeps every cookie, session cookies included; the app only makes sure they are written to disk.
- Files downloaded from a service on iOS go through the cache directory (`downloads/`) before being handed to the share sheet.

_Settings › Services de l'ENT › Se déconnecter partout_ and _Supprimer mes données_ erase all of it.
