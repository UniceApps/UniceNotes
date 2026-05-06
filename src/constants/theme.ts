import { Appearance } from 'react-native';
import { configureFonts } from 'react-native-paper';

export const lightTheme = {
  dark: false,
  version: 3 as const,
  colors: {
    primary: 'rgb(0, 98, 159)',
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(208, 228, 255)',
    onPrimaryContainer: 'rgb(0, 29, 52)',
    secondary: 'rgb(82, 96, 112)',
    onSecondary: 'rgb(255, 255, 255)',
    secondaryContainer: 'rgb(214, 228, 247)',
    onSecondaryContainer: 'rgb(15, 29, 42)',
    tertiary: 'rgb(105, 87, 121)',
    onTertiary: 'rgb(255, 255, 255)',
    tertiaryContainer: 'rgb(240, 219, 255)',
    onTertiaryContainer: 'rgb(36, 21, 50)',
    error: 'rgb(186, 26, 26)',
    onError: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(255, 218, 214)',
    onErrorContainer: 'rgb(65, 0, 2)',
    background: 'rgb(252, 252, 255)',
    onBackground: 'rgb(26, 28, 30)',
    surface: 'rgb(252, 252, 255)',
    onSurface: 'rgb(26, 28, 30)',
    surfaceVariant: 'rgb(222, 227, 235)',
    onSurfaceVariant: 'rgb(66, 71, 78)',
    outline: 'rgb(115, 119, 127)',
    outlineVariant: 'rgb(194, 199, 207)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(47, 48, 51)',
    inverseOnSurface: 'rgb(241, 240, 244)',
    inversePrimary: 'rgb(155, 203, 255)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(239, 244, 250)',
      level2: 'rgb(232, 240, 247)',
      level3: 'rgb(224, 235, 244)',
      level4: 'rgb(222, 234, 244)',
      level5: 'rgb(217, 230, 242)',
    },
    surfaceDisabled: 'rgba(26, 28, 30, 0.12)',
    onSurfaceDisabled: 'rgba(26, 28, 30, 0.38)',
    backdrop: 'rgba(44, 49, 55, 0.4)',
  },
};

export const darkTheme = {
  dark: true,
  version: 3 as const,
  mode: 'adaptive' as const,
  colors: {
    primary: 'rgb(155, 203, 255)',
    onPrimary: 'rgb(0, 51, 86)',
    primaryContainer: 'rgb(0, 74, 121)',
    onPrimaryContainer: 'rgb(208, 228, 255)',
    secondary: 'rgb(186, 200, 219)',
    onSecondary: 'rgb(36, 50, 64)',
    secondaryContainer: 'rgb(59, 72, 87)',
    onSecondaryContainer: 'rgb(214, 228, 247)',
    tertiary: 'rgb(213, 190, 229)',
    onTertiary: 'rgb(58, 42, 72)',
    tertiaryContainer: 'rgb(81, 64, 96)',
    onTertiaryContainer: 'rgb(240, 219, 255)',
    error: 'rgb(255, 180, 171)',
    onError: 'rgb(105, 0, 5)',
    errorContainer: 'rgb(147, 0, 10)',
    onErrorContainer: 'rgb(255, 180, 171)',
    background: 'rgb(26, 28, 30)',
    onBackground: 'rgb(226, 226, 230)',
    surface: 'rgb(26, 28, 30)',
    onSurface: 'rgb(226, 226, 230)',
    surfaceVariant: 'rgb(66, 71, 78)',
    onSurfaceVariant: 'rgb(194, 199, 207)',
    outline: 'rgb(140, 145, 153)',
    outlineVariant: 'rgb(66, 71, 78)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(226, 226, 230)',
    inverseOnSurface: 'rgb(47, 48, 51)',
    inversePrimary: 'rgb(0, 98, 159)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(32, 37, 41)',
      level2: 'rgb(36, 42, 48)',
      level3: 'rgb(40, 47, 55)',
      level4: 'rgb(42, 49, 57)',
      level5: 'rgb(44, 53, 62)',
    },
    surfaceDisabled: 'rgba(226, 226, 230, 0.12)',
    onSurfaceDisabled: 'rgba(226, 226, 230, 0.38)',
    backdrop: 'rgba(44, 49, 55, 0.4)',
  },
};

let _theme: typeof lightTheme | typeof darkTheme =
  Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme;

export function updateFontConfig(): void {
  const fontConfig = { fontFamily: 'Bahnschrift' };
  _theme = {
    ..._theme,
    fonts: configureFonts({ config: fontConfig }),
  } as typeof _theme;
}

export function getChoosenTheme(): typeof lightTheme | typeof darkTheme {
  return _theme;
}

export function getCalendarTheme(theme: typeof lightTheme) {
  return {
    colors: {
      primary: theme.colors.primary,
      onPrimary: theme.colors.onPrimary,
      background: theme.colors.background,
      onBackground: theme.colors.onBackground,
      border: theme.colors.outline,
      text: theme.colors.onBackground,
    },
    hourTextStyle: { color: theme.colors.onBackground },
    weekNumber: { color: theme.colors.onPrimary },
    weekNumberContainer: { backgroundColor: theme.colors.primary },
    unavailableHourBackgroundColor: theme.colors.surfaceVariant,
  };
}
