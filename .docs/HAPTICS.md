# Haptics guide

<p align="center">
  <img src="https://docs.expo.dev/static/images/packages/expo-haptics.png" alt="Haptics" width="50"/>
</p>

Always go through `haptics()` from `src/utils/haptics.ts`: it does nothing when the user disabled haptic feedback in the settings.

| Interaction | Call |
| --- | --- |
| Navigation (open a screen, go back, open a menu) | `haptics('light')` |
| Main action (open the timetable, refresh, retry) | `haptics('medium')` |
| Choice (chip, switch, list item, theme, link) | `haptics('selection')` |
| Action completed (timetable saved, data deleted) | `haptics('success')` |
| Limit reached, destructive confirmation | `haptics('warning')` |
| Failure | `haptics('error')` |
