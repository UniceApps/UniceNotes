import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Appbar, Divider, ProgressBar, Text, Tooltip } from 'react-native-paper';

import BottomSheet from '@gorhom/bottom-sheet';
import { CalendarBody, CalendarContainer, CalendarHeader } from '@howljs/calendar-kit';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { Banner } from '@/src/components/Banner';
import { EventCard } from '@/src/components/timetable/EventCard';
import {
  describeEvent,
  EventSheet,
  type EventDetails,
  type PressedEvent,
} from '@/src/components/timetable/EventSheet';
import { TimetableMenu } from '@/src/components/timetable/TimetableMenu';
import { getCalendarTheme, useChoosenTheme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { edtService } from '@/src/services/edt';
import type { CalendarEvent } from '@/src/types';
import { getCalendarFromCache } from '@/src/utils/calendar';
import { isValidEdtCode } from '@/src/utils/deeplink';
import { haptics } from '@/src/utils/haptics';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function ShowEDTScreen() {
  const router = useRouter();
  const { code, fresh } = useLocalSearchParams<{ code?: string; fresh?: string }>();
  const { calendar, setCalendar, calendarOffline, setCalendarOffline, adeid } = useApp();
  const theme = useChoosenTheme();

  const tempCode = isValidEdtCode(code) ? code : null;
  const invalidCode = code !== undefined && tempCode === null;

  const [view, setView] = useState(3);
  const [viewIcon, setViewIcon] = useState('magnify-minus');
  const [menuVisible, setMenuVisible] = useState(false);

  const [details, setDetails] = useState<EventDetails>({ title: 'Infos', description: '', room: '', time: '' });

  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [tempEvents, setTempEvents] = useState<CalendarEvent[]>([]);

  const [loading, setLoading] = useState(tempCode !== null);
  const [loadFailed, setLoadFailed] = useState(false);

  const calendarRef = useRef<React.ComponentRef<typeof CalendarContainer>>(null);
  const bottomSheetInfoRef = useRef<BottomSheet>(null);

  useEffect(() => {
    async function loadCache() {
      const cal = await getCalendarFromCache();
      setCalendar(cal);
    }
    if (invalidCode) return;
    if (tempCode) {
      loadTemp(tempCode);
    } else if (fresh === '1') {
      refreshOwn();
    } else if (!calendar || calendar.length === 0) {
      loadCache();
    }
    setTimeout(() => goToToday(), 500);
  }, []);

  async function loadTemp(target: string) {
    setLoading(true);
    setLoadFailed(false);
    const events = await edtService.getTemporaryEDT(target);
    if (events) setTempEvents(events);
    else setLoadFailed(true);
    setLoading(false);
  }

  // ouvert par un raccourci : le calendrier en mémoire peut dater
  async function refreshOwn() {
    if (!adeid || adeid === 'demo') return;
    setLoading(true);
    const { events, offline } = await edtService.getEDT(adeid);
    setCalendar(events);
    setCalendarOffline(offline);
    setLoading(false);
  }

  // premier écran de la pile si l'app a été ouverte directement ici
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  function toggleMenu() {
    haptics('medium');
    setMenuVisible(!menuVisible);
  }

  function goToToday(toggle = false) {
    haptics('medium');
    if (toggle) toggleMenu();
    calendarRef.current?.goToDate({
      date: new Date(),
      hourScroll: true,
      animatedDate: true,
      animatedHour: true,
    });
  }

  function changeView() {
    haptics('medium');
    toggleMenu();
    if (view === 5) {
      setView(3);
      setViewIcon('magnify-minus');
    } else {
      setView(5);
      setViewIcon('magnify-plus');
    }
  }

  function changeDate(date: Date | string) {
    const resDate = new Date(date.toString());
    setSelectedMonth(MONTHS[resDate.getMonth()]);
    setSelectedYear(resDate.getFullYear());
  }

  function showInfos(event: PressedEvent) {
    haptics('selection');
    setDetails(describeEvent(event));
    bottomSheetInfoRef.current?.expand();
  }

  // code invalide : on ne charge ni n'affiche rien
  if (invalidCode) return <Redirect href="/home" />;

  const calTheme = getCalendarTheme(theme);

  const offlineBannerBg = theme.dark ? theme.colors.errorContainer : theme.colors.error;
  const offlineBannerFg = theme.dark ? theme.colors.onErrorContainer : theme.colors.onError;

  const tempBannerBg = loadFailed ? offlineBannerBg : theme.colors.tertiaryContainer;
  const tempBannerFg = loadFailed ? offlineBannerFg : theme.colors.onTertiaryContainer;
  const tempLabel = loadFailed
    ? 'ADE indisponible'
    : !loading && tempEvents.length === 0
      ? 'Aucun cours trouvé'
      : 'EDT temporaire';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header elevated>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={goBack} />
        </Tooltip>
        <Appbar.Content title="Emploi du temps" />
        <TimetableMenu
          visible={menuVisible}
          onToggle={toggleMenu}
          code={tempCode ?? adeid ?? ''}
          zoomIcon={viewIcon}
          onOtherEdt={() => { toggleMenu(); router.push('/edt-config'); }}
          onToday={() => goToToday(true)}
          onChangeView={changeView}
          onSettings={() => { toggleMenu(); router.push('/settings'); }}
        />
      </Appbar.Header>

      {loading && <ProgressBar indeterminate />}

      {tempCode && (
        <Banner
          alert={loadFailed}
          icon={loadFailed ? 'alert-circle-outline' : 'eye-outline'}
          text={`${tempLabel} · ${tempCode}`}
          background={tempBannerBg}
          foreground={tempBannerFg}
          action={loadFailed ? { label: 'Réessayer', onPress: () => loadTemp(tempCode) } : undefined}
        />
      )}

      {!tempCode && calendarOffline && (
        <Banner
          alert
          icon="wifi-off"
          text="Hors ligne"
          background={offlineBannerBg}
          foreground={offlineBannerFg}
        />
      )}

      <Divider style={{ marginBottom: 8 }} />
      <Text style={{ marginBottom: 8, textAlign: 'center' }} variant="titleMedium">
        {selectedMonth} {selectedYear}
      </Text>

      <CalendarContainer
        events={tempCode ? tempEvents : calendar}
        theme={calTheme}
        ref={calendarRef}
        onPressEvent={(eventItem: unknown) => showInfos(eventItem as PressedEvent)}
        onChange={(date: Date | string) => changeDate(date)}
        scrollToNow
        numberOfDays={view}
        allowPinchToZoom
        start={420}
        end={1200}
        useHaptic
        showWeekNumber
        unavailableHours={{ 6: [{ start: 0, end: 24 * 60 }], 7: [{ start: 0, end: 24 * 60 }] }}
        timeZone="Europe/Paris"
      >
        <CalendarHeader />
        <CalendarBody renderEvent={(event: any) => <EventCard event={event} />} />
      </CalendarContainer>

      <EventSheet sheetRef={bottomSheetInfoRef} details={details} />
    </View>
  );
}
