import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import type BottomSheet from '@gorhom/bottom-sheet';
import {
  CalendarBody,
  CalendarContainer,
  CalendarHeader,
  type CalendarKitHandle,
  type OnEventResponse,
  type PackedEvent,
} from '@howljs/calendar-kit';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Divider, Menu } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CALENDAR_LOCALES, getCalendarTheme } from '@/src/components/timetable/calendarTheme';
import { EventCard } from '@/src/components/timetable/EventCard';
import { EventSheet } from '@/src/components/timetable/EventSheet';
import { Banner } from '@/src/components/ui/Banner';
import { HeaderButton, ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { useCalendar } from '@/src/context/CalendarContext';
import { useSettings } from '@/src/context/SettingsContext';
import { useTemporaryCalendar } from '@/src/hooks/useTemporaryCalendar';
import { useAppTheme, type Tone } from '@/src/theme';
import type { CalendarEvent } from '@/src/types';
import { formatMonth, getIsoWeek } from '@/src/utils/date';
import { isValidEdtCode } from '@/src/utils/deeplink';
import { haptics } from '@/src/utils/haptics';

const VIEWS = [
  { days: 1, label: 'Jour', icon: 'view-day-outline' },
  { days: 3, label: '3 jours', icon: 'view-column-outline' },
  { days: 5, label: 'Semaine', icon: 'view-week-outline' },
];

// samedi et dimanche grisés (jours luxon : 1 = lundi)
const WEEKEND = { 6: [{ start: 0, end: 24 * 60 }], 7: [{ start: 0, end: 24 * 60 }] };

interface BannerState {
  tone: Tone;
  icon: string;
  text: string;
  action?: { label: string; onPress: () => void };
}

export default function TimetableScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { adeid, haptics: hapticsOn } = useSettings();
  const calendar = useCalendar();

  // ?code=… : edt d'un autre code ADE, en lecture seule
  const tempCode = isValidEdtCode(code) ? code : null;
  const temporary = useTemporaryCalendar(tempCode);

  const [days, setDays] = useState(3);
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const [menuVisible, setMenuVisible] = useState(false);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const calendarRef = useRef<CalendarKitHandle>(null);
  const sheetRef = useRef<BottomSheet>(null);

  const calendarTheme = useMemo(() => getCalendarTheme(theme), [theme]);
  const renderEvent = useCallback((event: PackedEvent) => <EventCard event={event} />, []);

  if (code !== undefined && !tempCode) return <Redirect href="/home" />;

  const events = tempCode ? temporary.events : calendar.events;
  const loading = tempCode ? temporary.loading : calendar.loading;
  const reload = tempCode ? temporary.retry : calendar.reload;

  function openMenu() {
    haptics('light');
    setMenuVisible(true);
  }

  function menuAction(action: () => void) {
    setMenuVisible(false);
    action();
  }

  function goToToday() {
    haptics('light');
    calendarRef.current?.goToDate({ date: new Date(), hourScroll: true, animatedDate: true, animatedHour: true });
  }

  function showEvent(pressed: OnEventResponse) {
    const event = events.find((item) => item.id === pressed.id);
    if (!event) return;
    haptics('selection');
    setSelected(event);
    sheetRef.current?.expand();
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
          title={formatMonth(visibleDate)}
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
                <Menu.Item
                  leadingIcon="cog-outline"
                  title="Paramètres"
                  onPress={() => menuAction(() => router.push('/settings'))}
                />
              </Menu>
            </>
          }
        />
        {banner && <Banner {...banner} />}
      </View>

      <CalendarContainer
        ref={calendarRef}
        events={events}
        theme={calendarTheme}
        initialLocales={CALENDAR_LOCALES}
        locale="fr"
        timeZone="Europe/Paris"
        numberOfDays={days}
        scrollByDay={days < 5}
        start={7 * 60}
        end={20 * 60}
        unavailableHours={WEEKEND}
        isLoading={loading}
        scrollToNow
        showWeekNumber
        allowPinchToZoom
        useHaptic={hapticsOn}
        spaceFromBottom={insets.bottom}
        onChange={(date) => setVisibleDate(new Date(date))}
        onPressEvent={showEvent}
      >
        <CalendarHeader />
        <CalendarBody renderEvent={renderEvent} />
      </CalendarContainer>

      <EventSheet sheetRef={sheetRef} event={selected} />
    </View>
  );
}
