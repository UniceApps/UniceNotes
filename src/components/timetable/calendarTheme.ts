import type { DeepPartial, LocaleConfigsProps, ThemeConfigs } from '@howljs/calendar-kit';

import type { AppTheme } from '@/src/theme';

export const CALENDAR_LOCALES: Record<string, DeepPartial<LocaleConfigsProps>> = {
  fr: {
    weekDayShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    meridiem: { ante: 'am', post: 'pm' },
    more: 'de plus',
  },
};

export function getCalendarTheme(theme: AppTheme): DeepPartial<ThemeConfigs> {
  const c = theme.colors;
  return {
    colors: {
      primary: c.primary,
      onPrimary: c.onPrimary,
      background: c.background,
      onBackground: c.onBackground,
      border: c.outlineVariant,
      text: c.onBackground,
      surface: c.elevation.level2,
      onSurface: c.onSurface,
    },
    textStyle: { fontFamily: 'Bahnschrift' },
    hourTextStyle: { color: c.onSurfaceVariant, fontSize: 11 },
    dayName: { color: c.onSurfaceVariant },
    dayNumber: { color: c.onSurface },
    todayName: { color: c.primary },
    todayNumber: { color: c.onPrimary },
    todayNumberContainer: { backgroundColor: c.primary },
    weekNumber: { color: c.onPrimaryContainer },
    weekNumberContainer: { backgroundColor: c.primaryContainer },
    nowIndicatorColor: c.error,
    // week-end grisé
    unavailableHourBackgroundColor: c.elevation.level1,
    eventContainerStyle: { borderRadius: 8 },
  };
}
