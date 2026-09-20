import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import {
  ActivityIndicator,
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Text,
  Tooltip,
  TouchableRipple,
} from 'react-native-paper';

import { useRouter } from 'expo-router';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';


import { APP_VERSION, PRONOTE_URL, RELEASE_NOTES } from '@/src/constants/config';
import { useChoosenTheme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { edtService } from '@/src/services/edt';
import type { NextEvent } from '@/src/types';
import { handleURL } from '@/src/utils/api';
import { haptics } from '@/src/utils/haptics';
import { NextClassWidgetInstance } from '@/src/widgets/NextClassWidget';
import { getSecure, saveAsync } from '../utils/storage';

const WELCOME_MESSAGES = [
  'Passe une excellente journée !',
  'Quoi de prévu aujourd\'hui ? :)',
  'Voyons ce qui t\'attend aujourd\'hui.',
  'Un œil sur l\'emploi du temps ?',
  'On fait le point sur la journée ?',
  'C\'est quoi le plan pour aujourd\'hui ?',
  'Petit check rapide de ta journée ?',
  'Ravi de te revoir ! ^^',
];

function getRandomWelcomeMessage() {
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    adeid, setCalendar, setCalendarOffline,
    updateModalShown, setUpdateModalShown,
    setOnboarding
  } = useApp();
  const theme = useChoosenTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [selectable, setSelectable] = useState(true);

  const [nextEvent, setNextEvent] = useState<NextEvent>({
    summary: 'Chargement...',
    location: 'Chargement...',
  });
  const [nextEventLoaded, setNextEventLoaded] = useState(false);

  const [infoTitle, setInfoTitle] = useState('Informations');
  const [infoSubtitle, setInfoSubtitle] = useState('');

  const isDemo = !adeid || adeid === 'demo';

  const [welcomeMessage] = useState(getRandomWelcomeMessage);

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
    setOnboarding(false);
    if (!isDemo) {
      getNextEvent('normal');
      if (Platform.OS === 'ios') pushWidgetTimeline();
    }



    // check in app context if update modal has been shown, if not show it and set it to true
    if (!updateModalShown) {
      showUpdateModal();
    }
  }, []);

  async function getNextEvent(mode: 'normal' | 'force') {
    if (isDemo) return;
    if (mode === 'force') {
      setNextEvent({ summary: 'Chargement...', location: 'Chargement...' });
    }
    if (mode === 'force' || (mode === 'normal' && !nextEventLoaded)) {
      const result = await edtService.getNextEvent(adeid ?? 'demo');
      setNextEvent(result);
      setNextEventLoaded(true);
    }
  }

  async function getMyCal() {
    haptics('medium');
    setSelectable(false);
    setLoading(true);

    const { events, offline } = await edtService.getEDT(adeid ?? 'demo');
    setCalendar(events);
    setCalendarOffline(offline);
    if (Platform.OS === 'ios') {
      try {
        NextClassWidgetInstance.updateTimeline(
          edtService.buildWidgetTimeline(events)
        );
      } catch { }
    }

    setSelectable(true);
    setLoading(false);
    router.push('/show-edt');
  }

  async function pushWidgetTimeline() {
    try {
      const { events } = await edtService.getEDT(adeid ?? 'demo');
      const timeline = edtService.buildWidgetTimeline(events);
      NextClassWidgetInstance.updateTimeline(timeline);
    } catch {
      // widget non configuré ou ADE indisponible
    }
  }

  async function showUpdateModal() {
    // wait 1 second before showing the update modal
    await new Promise(resolve => setTimeout(resolve, 1500));
    setInfoTitle(RELEASE_NOTES.info);
    setInfoSubtitle(RELEASE_NOTES.subtitle);
    saveAsync('releaseNotesVersion', APP_VERSION);
    setUpdateModalShown(true);
    bottomSheetInfoRef.current?.expand();
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.colors.background, paddingLeft: 25, paddingRight: 25 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' }}>
          <Avatar.Image
            style={{ marginTop: insets.top, marginBottom: 16 }}
            size={96}
            source={require('../assets/white.png')}
          />
          <TouchableRipple
            onPress={() => router.push('/edt-config')}
            rippleColor="rgba(0, 0, 0, 0)"
            style={{ marginLeft: 'auto', marginTop: insets.top, marginBottom: 32 }}
          >
            <Avatar.Icon size={48} icon="calendar-edit" />
          </TouchableRipple>
          <TouchableRipple
            onPress={() => router.push('/settings')}
            rippleColor="rgba(0, 0, 0, 0)"
            style={{ marginLeft: 8, marginTop: insets.top, marginBottom: 32 }}
          >
            <Avatar.Icon size={48} icon="cog" />
          </TouchableRipple>
        </View>

        <Text style={{ textAlign: 'left' }} variant="displayLarge">
          Salut ! 👋
        </Text>
        <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="headlineSmall">
          {welcomeMessage}
        </Text>

        <Card
          style={{ marginBottom: 8 }}
          disabled={!selectable}
          onPress={isDemo ? () => router.push('/edt-config') : getMyCal}
        >
          <Card.Title title={isDemo ? 'Emploi du temps' : 'Prochain Cours'} />
          <Card.Content>
            <Text variant="titleLarge" numberOfLines={1}>
              {isDemo ? 'Non configuré' : nextEvent.summary}
            </Text>
            <Text variant="bodyMedium" numberOfLines={1}>
              {isDemo ? "Appuies pour choisir ton emploi du temps" : (nextEvent.location || "Salle non précisée")}
            </Text>
          </Card.Content>
          <Card.Actions>
            {isDemo && (
              <Chip disabled={!selectable} onPress={() => router.push('/edt-config')} icon="calendar-edit">
                Configurer l&apos;EDT
              </Chip>
            )}
            {!isDemo && (
              <Chip
                style={{ marginRight: 4 }}
                disabled={!selectable}
                onPress={() => getNextEvent('force')}
                icon="refresh"
              >
                Rafraîchir
              </Chip>
            )}
            {!isDemo && (
              nextEvent.summary !== 'ADE Indisponible' ? (
                <Chip disabled={!selectable} onPress={getMyCal} icon="calendar">
                  Emploi du temps
                </Chip>
              ) : (
                <Chip disabled={!selectable} onPress={getMyCal} icon="calendar-alert">
                  EDT (Hors-ligne)
                </Chip>
              )
            )}
          </Card.Actions>
        </Card>

        <Divider style={{ marginBottom: 8 }} />
        <Chip
          style={{ height: 48, marginBottom: 8, justifyContent: 'center', flexDirection: 'row' }}
          textStyle={{ paddingVertical: 8 }}
          disabled={!selectable}
          onPress={() => router.push('/free-rooms')}
          icon="door-open"
        >
          Salles libres
        </Chip>
        <Chip
          style={{ height: 48, marginBottom: 8, justifyContent: 'center', flexDirection: 'row' }}
          textStyle={{ paddingVertical: 8 }}
          disabled={!selectable}
          icon="calculator-variant-outline"
          onPress={() => handleURL(PRONOTE_URL)}
        >
          PronoteCampus
        </Chip>
        <Chip
          style={{ height: 48, marginBottom: 8, justifyContent: 'center', flexDirection: 'row' }}
          textStyle={{ paddingVertical: 8 }}
          disabled={!selectable}
          onPress={() => router.push('/show-ent')}
          icon="briefcase-variant"
        >
          Intranet Étudiant (ENT)
        </Chip>

        <Divider style={{ marginBottom: 16 }} />

        <Text style={{ textAlign: 'center' }} variant="titleSmall">
          {adeid ? `Connecté en tant que ${adeid}` : "Non connecté"}
        </Text>

        <ActivityIndicator
          style={{ marginTop: 8, marginBottom: insets.bottom }}
          animating={loading}
          size="large"
        />
      </SafeAreaView>

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