import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  CalendarBody,
  CalendarContainer,
  CalendarHeader,
  type CalendarKitHandle,
  type OnEventResponse,
  type PackedAllDayEvent,
  type PackedEvent,
  type SizeAnimation,
} from '@howljs/calendar-kit';
import { useRouter } from 'expo-router';
import { Divider, Menu } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CALENDAR_LOCALES, getCalendarTheme } from '@/src/components/timetable/calendarTheme';
import { DatePicker } from '@/src/components/timetable/DatePicker';
import { AllDayCard, EventCard } from '@/src/components/timetable/EventCard';
import { EventSheet } from '@/src/components/timetable/EventSheet';
import { Banner } from '@/src/components/ui/Banner';
import { HeaderButton, ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { useCalendar } from '@/src/context/CalendarContext';
import { useSettings } from '@/src/context/SettingsContext';
import { useExams } from '@/src/hooks/useExams';
import { useTabBarInset } from '@/src/hooks/useTabBarInset';
import { useTemporaryCalendar } from '@/src/hooks/useTemporaryCalendar';
import { getCourseColors, useAppTheme, type Tone } from '@/src/theme';
import type { CalendarEvent } from '@/src/types';
import { formatIsoDate, formatMonth, getIsoWeek } from '@/src/utils/date';
import { haptics } from '@/src/utils/haptics';
import { getHolidays } from '@/src/utils/holidays';
import { subscribeTimetableToday } from '@/src/utils/timetable';

const VIEWS = [
  { days: 1, label: 'Jour', icon: 'view-day-outline' },
  { days: 3, label: '3 jours', icon: 'view-column-outline' },
  { days: 5, label: 'Semaine', icon: 'view-week-outline' },
];

const TODAY = new Date();
const MIN_DATE = new Date(TODAY.getFullYear() - 2, TODAY.getMonth(), TODAY.getDate());
const MAX_DATE = new Date(TODAY.getFullYear() + 2, TODAY.getMonth(), TODAY.getDate());

const HOLIDAYS = Array.from({ length: MAX_DATE.getFullYear() - MIN_DATE.getFullYear() + 1 }, (_, i) =>
  getHolidays(MIN_DATE.getFullYear() + i),
).flat();

// samedi, dimanche (jours luxon : 1 = lundi) et fériés grisés
const FULL_DAY = [{ start: 0, end: 24 * 60 }];
const WEEKEND = { 6: FULL_DAY, 7: FULL_DAY };
const WEEKEND_AND_HOLIDAYS = {
  ...WEEKEND,
  ...Object.fromEntries(HOLIDAYS.map((holiday) => [holiday.date, FULL_DAY])),
};

// calendar-kit laisse les bandeaux de l'en-tête à 2 pt de haut (reanimated 4) : ils prennent celle d'AllDayCard
const ALL_DAY_CONTAINER = { bottom: undefined };

interface BannerState {
  tone: Tone;
  icon: string;
  text: string;
  action?: { label: string; onPress: () => void };
}

// tempCode : edt d'un autre code ADE, en lecture seule ; null : l'edt enregistré
export function TimetableScreen({ tempCode }: { tempCode: string | null }) {
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const { adeid, haptics: hapticsOn, holidays: holidaysOn } = useSettings();
  const calendar = useCalendar();
  const temporary = useTemporaryCalendar(tempCode);
  const exams = useExams();
  const tab = tempCode === null;

  const [days, setDays] = useState(3);
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const [menuVisible, setMenuVisible] = useState(false);
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const calendarRef = useRef<CalendarKitHandle>(null);
  const sheetRef = useRef<BottomSheetModal>(null);

  const calendarTheme = useMemo(() => getCalendarTheme(theme), [theme]);
  const renderEvent = useCallback((event: PackedEvent) => <EventCard event={event} />, []);
  // vue semaine : colonnes étroites, bandeaux sur deux lignes
  const compact = days === 5;
  const renderAllDayEvent = useCallback(
    (event: PackedAllDayEvent, size: SizeAnimation) => <AllDayCard event={event} size={size} compact={compact} />,
    [compact],
  );

  const events = tempCode ? temporary.events : calendar.events;
  const loading = tempCode ? temporary.loading : calendar.loading;
  const reload = tempCode ? temporary.retry : calendar.reload;

  // couleurs des cours tirées du thème ; DS marqués dans l'onglet seulement ; fériés en tête de journée
  const calendarEvents = useMemo(
    () => [
      ...events.map((event) => ({
        ...event,
        color: getCourseColors(theme, event.title).container,
        containerStyle: ALL_DAY_CONTAINER,
        exam: tab && exams.has(event.id),
      })),
      ...(holidaysOn ? HOLIDAYS : []).map((holiday) => ({
        id: `holiday-${holiday.date}`,
        title: holiday.name,
        start: { date: holiday.date },
        end: { date: holiday.date },
        color: theme.colors.tertiaryContainer,
        containerStyle: ALL_DAY_CONTAINER,
        holiday: true,
      })),
    ],
    [tab, events, exams, theme, holidaysOn],
  );

  // jour et numéro des fériés en tertiaire, sauf aujourd'hui qui garde sa pastille
  const highlightDates = useMemo(() => {
    if (!holidaysOn) return undefined;
    const style = { dayName: { color: theme.colors.tertiary }, dayNumber: { color: theme.colors.tertiary } };
    return Object.fromEntries(HOLIDAYS.map((holiday) => [holiday.date, style]));
  }, [theme, holidaysOn]);

  function openMenu() {
    haptics('light');
    setMenuVisible(true);
  }

  function menuAction(action: () => void) {
    setMenuVisible(false);
    action();
  }

  const showToday = useCallback(() => {
    calendarRef.current?.goToDate({ date: new Date(), hourScroll: true, animatedDate: true, animatedHour: true });
  }, []);

  function goToToday() {
    haptics('light');
    showToday();
  }

  // onglet EDT uniquement, pas l'edt temporaire
  useEffect(() => (tab ? subscribeTimetableToday(showToday) : undefined), [tab, showToday]);

  function openPicker() {
    haptics('light');
    setPicking(true);
  }

  function goToDay(date: Date) {
    haptics('selection');
    calendarRef.current?.goToDate({ date: formatIsoDate(date), animatedDate: true });
  }

  function showEvent(pressed: OnEventResponse) {
    const event = events.find((item) => item.id === pressed.id);
    if (!event) return;
    haptics('selection');
    setSelected(event);
    sheetRef.current?.present();
  }

  let banner: BannerState | null = null;
  if (tempCode) {
    banner = temporary.failed
      ? {
          tone: 'error',
          icon: 'alert-circle-outline',
          text: `ADE indisponible · ${tempCode}`,
          action: { label: 'Réessayer', onPress: reload },
        }
      : {
          tone: 'tertiary',
          icon: 'eye-outline',
          text: `${!loading && events.length === 0 ? 'Aucun cours trouvé' : 'EDT temporaire'} · ${tempCode}`,
        };
  } else if (calendar.offline) {
    banner = {
      tone: 'error',
      icon: 'wifi-off',
      text: loading ? 'Nouvelle tentative…' : 'Hors ligne · EDT en cache',
      action: loading ? undefined : { label: 'Réessayer', onPress: reload },
    };
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: theme.colors.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12 }}>
        <ScreenHeader
          tab={tab}
          title={formatMonth(visibleDate)}
          titleAction={{ label: 'Choisir une date', onPress: openPicker }}
          subtitle={`Semaine ${getIsoWeek(visibleDate)} · ${tempCode ? 'EDT temporaire' : `EDT ${adeid ?? 'non configuré'}`}`}
          actions={
            <>
              <HeaderButton icon="calendar-today" label="Aujourd'hui" onPress={goToToday} />
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={<HeaderButton icon="dots-vertical" label="Options" onPress={openMenu} />}
              >
                {VIEWS.map((view) => (
                  <Menu.Item
                    key={view.days}
                    leadingIcon={view.icon}
                    trailingIcon={view.days === days ? 'check' : undefined}
                    title={view.label}
                    onPress={() => menuAction(() => setDays(view.days))}
                  />
                ))}
                <Divider />
                <Menu.Item
                  leadingIcon="refresh"
                  title="Actualiser"
                  disabled={loading}
                  onPress={() => menuAction(reload)}
                />
                <Menu.Item
                  leadingIcon="calendar-edit"
                  title="Changer d'EDT"
                  onPress={() => menuAction(() => router.push('/edt-config'))}
                />
              </Menu>
            </>
          }
        />
        {banner && <Banner {...banner} />}
      </View>

      <CalendarContainer
        ref={calendarRef}
        events={calendarEvents}
        theme={calendarTheme}
        initialLocales={CALENDAR_LOCALES}
        locale="fr"
        timeZone="Europe/Paris"
        numberOfDays={days}
        scrollByDay={days < 5}
        minDate={MIN_DATE}
        maxDate={MAX_DATE}
        start={7 * 60}
        end={20 * 60}
        unavailableHours={holidaysOn ? WEEKEND_AND_HOLIDAYS : WEEKEND}
        highlightDates={highlightDates}
        isLoading={loading}
        scrollToNow
        showWeekNumber
        allowPinchToZoom
        useHaptic={hapticsOn}
        // onglet : au-dessus de la barre d'onglets
        spaceFromBottom={tab ? tabBarInset : insets.bottom}
        onChange={(date) => setVisibleDate(new Date(date))}
        onPressEvent={showEvent}
      >
        <CalendarHeader
          renderEvent={renderAllDayEvent}
          eventInitialMinutes={compact ? 36 : 20}
          eventMaxMinutes={compact ? 36 : 30}
        />
        <CalendarBody renderEvent={renderEvent} />
      </CalendarContainer>

      <EventSheet sheetRef={sheetRef} event={selected} readOnly={!tab} />

      {picking && (
        <DatePicker
          value={visibleDate}
          minimumDate={MIN_DATE}
          maximumDate={MAX_DATE}
          onPick={goToDay}
          onClose={() => setPicking(false)}
        />
      )}
    </View>
  );
}
