import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

import { Image } from 'expo-image';
import * as Network from 'expo-network';
import { useRouter } from 'expo-router';

import {
  Text,
  Button,
  ActivityIndicator,
  IconButton,
  Tooltip,
} from 'react-native-paper'

import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/src/context/AppContext';
import { useChoosenTheme } from '@/src/constants/theme';
import { APP_VERSION, DOWNLOAD_URL, IS_BETA } from '@/src/constants/config';
import { fetchApiStatus, isUpdateAvailable, type ApiAlert } from '@/src/services/uniceapi';
import { handleURL } from '@/src/utils/api';
import { getCalendarFromCache } from '@/src/utils/calendar';

// type pour parser les données de l'API 
type InfoPrompt =
  | { kind: 'update'; latestVersion: string }
  | { kind: 'alert'; alert: ApiAlert };

export default function SplashScreen() {
  const router = useRouter();
  const { adeid, setCalendar, isInitialized } = useApp();

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [titleError, setTitleError] = useState('Erreur');
  const [subtitleError, setSubtitleError] = useState('');
  const [infoPrompt, setInfoPrompt] = useState<InfoPrompt | null>(null);

  const insets = useSafeAreaInsets();
  const theme = useChoosenTheme();

  const lastAttemptRef = useRef(-1);
  const bottomSheetErrorRef = useRef<BottomSheet>(null);
  const bottomSheetInfoRef = useRef<BottomSheet>(null);
  const pendingPromptsRef = useRef<InfoPrompt[]>([]);
  const infoSheetOpenRef = useRef(false);

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

  async function access() {
    const netState = await Network.getNetworkStateAsync();
    if (!netState.isInternetReachable) {
      setLoading(false);
      setTitleError('Internet indisponible');
      setSubtitleError("Vous n'êtes pas connecté à Internet ! EC=0xT");
      setTimeout(() => bottomSheetErrorRef.current?.expand(), 500);
      return;
    }

    // on check l'api pour versionning et alerts
    const status = await fetchApiStatus();
    const prompts: InfoPrompt[] = [];
    if (status) {
      if (!IS_BETA && status.version && isUpdateAvailable(APP_VERSION, status.version)) {
        prompts.push({ kind: 'update', latestVersion: status.version });
      }
      if (status.alert) {
        prompts.push({ kind: 'alert', alert: status.alert });
      }
    }

    setLoading(false);
    pendingPromptsRef.current = prompts;
    showNextPrompt();
  }

  function showNextPrompt() {
    const next = pendingPromptsRef.current.shift();
    if (!next) {
      enterApp();
      return;
    }

    setInfoPrompt(next);
    infoSheetOpenRef.current = true;
    setTimeout(() => bottomSheetInfoRef.current?.expand(), 500);
  }

  function onInfoSheetClosed() {
    if (!infoSheetOpenRef.current) return;
    infoSheetOpenRef.current = false;
    showNextPrompt();
  }

  function enterApp() {
    if (adeid != null && adeid !== 'demo') {
      router.replace('/home');
    } else {
      router.replace('/oobe');
    }
  }

  async function getMyCal() {
    bottomSheetErrorRef.current?.close();
    const cal = await getCalendarFromCache();
    setCalendar(cal);
    router.replace('/home');
  }

  function refresh() {
    bottomSheetErrorRef.current?.close();
    setLoading(true);
    setAttempt((n) => n + 1);
  }

  useEffect(() => {
    if (isInitialized && lastAttemptRef.current !== attempt) {
      lastAttemptRef.current = attempt;
      access();
    }
  }, [isInitialized, attempt]);

  const infoTitle =
    infoPrompt?.kind === 'update' ? 'Mise à jour disponible' : (infoPrompt?.alert.title ?? '');
    
  const infoSubtitle =
    infoPrompt?.kind === 'update'
      ? `Une nouvelle version de UniceNotes (${infoPrompt.latestVersion}) est disponible. Mettez à jour l'application pour profiter des dernières nouveautés et corrections.`
      : (infoPrompt?.alert.message ?? '');

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
      }}
    >
      <Image
        source={require('../assets/color.png')}
        style={{ width: 200, height: 200, marginBottom: 16 }}
      />
      <Text style={{ textAlign: 'center' }} variant="displayLarge">
        UniceNotes
      </Text>

      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
        <Tooltip title="Paramètres">
          <IconButton
            style={{ marginTop: 16 }}
            icon="cog"
            mode="contained"
            onPress={() => router.push('/settings')}
          />
        </Tooltip>
        <Tooltip title="Rafraîchir">
          <IconButton
            style={{ marginTop: 16 }}
            icon="refresh"
            mode="contained"
            onPress={refresh}
          />
        </Tooltip>
      </View>

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
        onClose={onInfoSheetClosed}
      >
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
          <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="headlineSmall">
            {infoTitle}
          </Text>
          <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">
            {infoSubtitle}
          </Text>
          {infoPrompt?.kind === 'update' ? (
            <>
              <Button
                style={{ marginBottom: 8 }}
                icon="download"
                mode="contained"
                onPress={() => handleURL(DOWNLOAD_URL)}
              >
                Mettre à jour
              </Button>
              <Button
                style={{ marginBottom: 16 }}
                icon="clock-outline"
                mode="contained-tonal"
                onPress={() => bottomSheetInfoRef.current?.close()}
              >
                Plus tard
              </Button>
            </>
          ) : (
            <Button
              style={{ marginBottom: 16 }}
              icon="check"
              mode="contained"
              onPress={() => bottomSheetInfoRef.current?.close()}
            >
              Continuer
            </Button>
          )}
        </BottomSheetView>
      </BottomSheet>

      <BottomSheet
        ref={bottomSheetErrorRef}
        index={-1}
        enableDynamicSizing
        enablePanDownToClose
        bottomInset={insets.bottom}
        detached
        style={{ marginHorizontal: 24 }}
        backgroundStyle={{ backgroundColor: theme.colors.errorContainer }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.onErrorContainer }}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
          <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="headlineSmall">
            {titleError}
          </Text>
          <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">
            {subtitleError}
          </Text>
          <Button
            style={{ marginBottom: 8 }}
            icon="calendar-sync-outline"
            mode="contained"
            onPress={getMyCal}
          >
            Emploi du temps (hors-ligne)
          </Button>
          <Button
            style={{ marginBottom: 16, backgroundColor: theme.colors.error }}
            icon="refresh"
            mode="contained"
            onPress={refresh}
          >
            Rafraîchir
          </Button>
        </BottomSheetView>
      </BottomSheet>

      <ActivityIndicator style={{ marginTop: 16 }} animating={loading} size="large" />
    </View>
  );
}
