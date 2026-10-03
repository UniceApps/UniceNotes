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
- `androidWidgetTimeline`: upcoming classes read by the Android widget

## File system

- `calendar.json` (document directory): last downloaded timetable with its ADE code and download date, shown while offline
