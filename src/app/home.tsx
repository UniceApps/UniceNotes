import { APP_VERSION, RELEASE_NOTES } from '@/src/constants/config';
import { useChoosenTheme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { edtService } from '@/src/services/edt';
import type { NextEvent } from '@/src/types';
import { handleURL } from '@/src/utils/api';
import { haptics } from '@/src/utils/haptics';
import { NextClassWidgetInstance } from '@/src/widgets/NextClassWidget';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Text,
  Tooltip,
  TouchableRipple,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveAsync } from '../utils/storage';

const WELCOME_MESSAGES = [
  'Passe une excellente journée !',
  'Quoi de prévu aujourd\'hui ? :)',
  'Prêt pour une bonne session de cours ?',
  'On avance, un cours a la fois.',
  'Bon courage pour la journée !',
  'Let\'s go, on s\'organise bien aujourd\'hui.',
  'Petit check rapide de ton EDT ?'
];

function getRandomWelcomeMessage() {
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
}

export default function HomeScreen() {
  const router = useRouter();
  const { adeid, setCalendar, updateModalShown, setUpdateModalShown } = useApp();
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
    getNextEvent('normal');
    if (Platform.OS === 'ios') pushWidgetTimeline();

    // check in app context if update modal has been shown, if not show it and set it to true
    if (!updateModalShown) {
      showUpdateModal();
    }
  }, []);

  function showInfo(action: string) {
    if (action === 'info') {
      setInfoTitle('Informations');
      setInfoSubtitle(
        "Ce n'est pas votre emploi du temps ? Vous pouvez changer l'EDT sélectionné en cliquant sur l'icône de calendrier en haut à droite de l'écran d'accueil.",
      );
    }
    bottomSheetInfoRef.current?.expand();
  }

  async function getNextEvent(mode: 'normal' | 'force') {
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

    const cal = await edtService.getEDT(adeid ?? 'demo');
    setCalendar(cal);
    if (Platform.OS === 'ios') {
      try {
        NextClassWidgetInstance.updateTimeline(edtService.buildWidgetTimeline(cal));
      } catch { }
    }

    setSelectable(true);
    setLoading(false);
    router.push('/show-edt');
  }

  async function pushWidgetTimeline() {
    try {
      const events = await edtService.getEDT(adeid ?? 'demo');
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
      <SafeAreaView>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' }}>
          <Avatar.Image
            style={{ marginTop: insets.top * 2, marginBottom: 16 }}
            size={96}
            source={require('../assets/white.png')}
          />
          <TouchableRipple
            onPress={() => router.push('/edt-config')}
            rippleColor="rgba(0, 0, 0, 0)"
            style={{ marginLeft: 'auto', marginTop: insets.top * 2, marginBottom: 50 }}
          >
            <Avatar.Icon size={48} icon="calendar-edit" />
          </TouchableRipple>
          <TouchableRipple
            onPress={() => router.push('/settings')}
            rippleColor="rgba(0, 0, 0, 0)"
            style={{ marginLeft: 8, marginTop: insets.top * 2, marginBottom: 50 }}
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

        <Card style={{ marginBottom: 8 }} disabled={!selectable} onPress={getMyCal}>
          <Card.Title title="Prochain Cours" />
          <Card.Content>
            <Text variant="titleLarge" numberOfLines={1}>
              {nextEvent.summary}
            </Text>
            <Text variant="bodyMedium" numberOfLines={1}>
              {nextEvent.location || "Salle non précisée"}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Chip
              style={{ marginRight: 4 }}
              disabled={!selectable}
              onPress={() => getNextEvent('force')}
              icon="refresh"
            >
              Rafraîchir
            </Chip>
            {nextEvent.summary !== 'ADE Indisponible' ? (
              <Chip disabled={!selectable} onPress={getMyCal} icon="calendar">
                Emploi du temps
              </Chip>
            ) : (
              <Chip disabled={!selectable} onPress={getMyCal} icon="calendar-alert">
                EDT (Hors-ligne)
              </Chip>
            )}
          </Card.Actions>
        </Card>

        <Chip
          style={{ height: 48, marginBottom: 8, justifyContent: 'center', flexDirection: 'row' }}
          textStyle={{ paddingVertical: 8 }}
          disabled={!selectable}
          icon="calculator-variant-outline"
          onPress={() => handleURL('https://sco.polytech.unice.fr/1/mobile.etudiant')}
        >
          PronoteCampus
        </Chip>
        <Chip
          style={{ height: 48, marginBottom: 16, justifyContent: 'center', flexDirection: 'row' }}
          textStyle={{ paddingVertical: 8 }}
          disabled={!selectable}
          onPress={() => router.push('/show-ent')}
          icon="briefcase-variant"
        >
          Intranet Étudiant (ENT)
        </Chip>

        <Divider style={{ marginBottom: 8 }} />
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          <Tooltip title="Informations">
            <IconButton
              style={{ marginBottom: 4 }}
              icon="information"
              mode="contained"
              onPress={() => showInfo('info')}
            />
          </Tooltip>
          <Tooltip title="Code source">
            <IconButton
              style={{ marginBottom: 16 }}
              icon="source-branch"
              mode="contained"
              onPress={() => handleURL('https://github.com/UniceApps/UniceNotes')}
            />
          </Tooltip>
        </View>

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
