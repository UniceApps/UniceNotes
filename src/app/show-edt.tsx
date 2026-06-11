import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  Button,
  Appbar,
  Divider,
  Menu,
  Tooltip,
} from 'react-native-paper';
import { CalendarBody, CalendarContainer, CalendarHeader } from '@howljs/calendar-kit';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/src/context/AppContext';
import { useChoosenTheme, getCalendarTheme } from '@/src/constants/theme';
import { haptics } from '@/src/utils/haptics';
import { getCalendarFromCache } from '@/src/utils/calendar';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function ShowEDTScreen() {
  const router = useRouter();
  const { calendar, setCalendar, adeid } = useApp();
  const theme = useChoosenTheme();
  const insets = useSafeAreaInsets();

  const [view, setView] = useState(3);
  const [viewIcon, setViewIcon] = useState('magnify-minus');
  const [menuVisible, setMenuVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState('Infos');
  const [infoSubtitle, setInfoSubtitle] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const calendarRef = useRef<React.ElementRef<typeof CalendarContainer>>(null);
  const bottomSheetInfoRef = useRef<BottomSheet>(null);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.5}
        enableTouchThrough={false}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        style={[{ backgroundColor: 'rgba(0, 0, 0, 1)' }, StyleSheet.absoluteFillObject]}
      />
    ),
    [],
  );

  useEffect(() => {
    async function loadCache() {
      const cal = await getCalendarFromCache();
      setCalendar(cal);
    }
    if (!calendar || calendar.length === 0) {
      loadCache();
    }
    setTimeout(() => goToToday(), 500);
  }, []);

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
    const res =
      eventItem.subtitle +
      '\n\nSalle : ' +
      eventItem.description +
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
    setInfoSubtitle(res);
    bottomSheetInfoRef.current?.expand();
  }

  const calTheme = getCalendarTheme(theme);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' }}>
      <Appbar.Header elevated>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => router.back()} />
        </Tooltip>
        <Appbar.Content title="Emploi du temps" />
        <Menu
          visible={menuVisible}
          onDismiss={toggleMenu}
          anchor={<Appbar.Action icon="dots-vertical" onPress={toggleMenu} />}
        >
          <Menu.Item title={adeid ?? ''} />
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

      <Divider style={{ marginBottom: 8 }} />
      <Text style={{ marginBottom: 8, textAlign: 'center' }} variant="titleMedium">
        {selectedMonth} {selectedYear}
      </Text>

      <CalendarContainer
        events={calendar}
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
