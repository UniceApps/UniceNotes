import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Appbar,
  Button,
  Divider,
  Icon,
  Menu,
  ProgressBar,
  Text,
  Tooltip,
} from 'react-native-paper';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { CalendarBody, CalendarContainer, CalendarHeader } from '@howljs/calendar-kit';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  const tempCode = isValidEdtCode(code) ? code : null;
  const invalidCode = code !== undefined && tempCode === null;

  const [view, setView] = useState(3);
  const [viewIcon, setViewIcon] = useState('magnify-minus');
  const [menuVisible, setMenuVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState('Infos');
  const [infoSubtitle, setInfoSubtitle] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tempEvents, setTempEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(tempCode !== null);
  const [loadFailed, setLoadFailed] = useState(false);

  const calendarRef = useRef<React.ComponentRef<typeof CalendarContainer>>(null);
  const bottomSheetInfoRef = useRef<BottomSheet>(null);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.5}
        enableTouchThrough={false}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        style={[{ backgroundColor: 'rgba(0, 0, 0, 1)' }, StyleSheet.absoluteFill]}
      />
    ),
    [],
  );

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

  function cleanOutputString(input: string) {
    return input
      .replace(/[ \t]+/g, ' ')
      .replace(/^[ \t]+|[ \t]+$/gm, '')
      .replace(/\n\s*\n+/g, '\n')
      .trim();
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

  function showInfos(eventItem: {
    title: string;
    subtitle: string;
    description: string;
    _internal: { startUnix: number; endUnix: number; duration: number };
  }) {
    haptics('selection');
    const startTime = new Date(eventItem._internal.startUnix);
    const stopTime = new Date(eventItem._internal.endUnix);
    const durationMs = eventItem._internal.duration * 60 * 1000;
    const durationTime = new Date(durationMs);

    console.log(eventItem.subtitle.length)

    const res =
      (eventItem.subtitle.length > 512
        ? eventItem.subtitle.slice(0, 509) + "..."
        : eventItem.subtitle) +
      (eventItem.description ? '\n\n' + eventItem.description : '') +
      '\n' +
      startTime.getHours() +
      ':' +
      String(startTime.getMinutes()).padStart(2, '0') +
      ' → ' +
      stopTime.getHours() +
      ':' +
      String(stopTime.getMinutes()).padStart(2, '0') +
      ' (' +
      durationTime.getUTCHours() +
      'h' +
      durationTime.getMinutes() +
      ')';
    setInfoTitle(eventItem.title);

    let cleanRes: string = cleanOutputString(res);
    setInfoSubtitle(cleanRes);

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
        <Menu
          visible={menuVisible}
          onDismiss={toggleMenu}
          anchor={<Appbar.Action icon="dots-vertical" onPress={toggleMenu} />}
        >
          <Menu.Item title={tempCode ?? adeid ?? ''} />
          <Menu.Item
            leadingIcon="magnify"
            onPress={() => { toggleMenu(); router.push('/edt-config'); }}
            title="Voir un autre EDT"
          />
          <Divider />
          <Menu.Item leadingIcon="update" onPress={() => goToToday(true)} title="Aujourd'hui" />
          <Menu.Item leadingIcon={viewIcon} onPress={changeView} title="Changer la vue" />
          <Divider />
          <Menu.Item
            leadingIcon="cog"
            onPress={() => { toggleMenu(); router.push('/settings'); }}
            title="Paramètres"
          />
        </Menu>
      </Appbar.Header>

      {loading && <ProgressBar indeterminate />}

      {tempCode && (
        <View
          accessibilityRole={loadFailed ? 'alert' : undefined}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: tempBannerBg,
          }}
        >
          <Icon
            source={loadFailed ? 'alert-circle-outline' : 'eye-outline'}
            size={18}
            color={tempBannerFg}
          />
          <Text variant="labelLarge" style={{ color: tempBannerFg, flexShrink: 1 }}>
            {tempLabel} · {tempCode}
          </Text>
          {loadFailed && (
            <Button compact textColor={tempBannerFg} onPress={() => loadTemp(tempCode)}>
              Réessayer
            </Button>
          )}
        </View>
      )}

      {!tempCode && calendarOffline && (
        <View
          accessibilityRole="alert"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: offlineBannerBg,
          }}
        >
          <Icon source="wifi-off" size={18} color={offlineBannerFg} />
          <Text variant="labelLarge" style={{ color: offlineBannerFg, textAlign: 'center' }}>
            Hors ligne
          </Text>
        </View>
      )}

      <Divider style={{ marginBottom: 8 }} />
      <Text style={{ marginBottom: 8, textAlign: 'center' }} variant="titleMedium">
        {selectedMonth} {selectedYear}
      </Text>

      <CalendarContainer
        events={tempCode ? tempEvents : calendar}
        theme={calTheme}
        ref={calendarRef}
        onPressEvent={(eventItem: unknown) => showInfos(eventItem as Parameters<typeof showInfos>[0])}
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
        <CalendarBody
          renderEvent={(event: any, _size: any) => {
            const e = event && event.title !== undefined ? event : event?.event ?? {};
            return (
              <View style={{ padding: 8 }}>
                <Text style={{ fontWeight: 'bold', color: 'black', marginBottom: 4 }}>
                  {e.title ?? ''}
                </Text>
                <Text style={{ color: 'black' }}>{e.description ?? ''}</Text>
              </View>
            );
          }}
        />
      </CalendarContainer>

      <BottomSheet
        ref={bottomSheetInfoRef}
        index={-1}
        enableDynamicSizing
        enablePanDownToClose
        bottomInset={insets.bottom}
        detached
        style={{ marginHorizontal: 24 }}
        backgroundStyle={{ backgroundColor: theme.colors.surfaceVariant }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.onSurfaceVariant }}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
          <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="headlineSmall">
            {infoTitle}
          </Text>
          <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">
            {infoSubtitle}
          </Text>
          <Button
            style={{ marginBottom: 16 }}
            icon="close"
            mode="contained"
            onPress={() => bottomSheetInfoRef.current?.close()}
          >
            Fermer
          </Button>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
