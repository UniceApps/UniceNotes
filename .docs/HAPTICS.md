# Haptics guide

## New

### Inputs

Text Input -> ```haptics(selection)```

Refresh Input -> ```haptics(light)```

### Buttons

Normal Button -> ```haptics(medium)```

URL Buttons -> ```haptics(selection)```

Logout Button -> ```haptics(heavy)```

Delete Button -> ```haptics(warning)```

## Deprecated

### Inputs

Text Input -> ```Haptics.selectionAsync()```

Refresh Input -> ```Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)```

### Buttons

Normal Button -> ```Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)```

URL Buttons -> ```Haptics.selectionAsync()```

Logout Button -> ```Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)```

Delete Button -> ```Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)```