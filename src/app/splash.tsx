import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  IconButton,
  Tooltip,
} from 'react-native-paper';
import { Image } from 'expo-image';
import * as Network from 'expo-network';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/src/context/AppContext';
import { getChoosenTheme } from '@/src/constants/theme';
import { getCalendarFromCache } from '@/src/utils/calendar';

export default function SplashScreen() {
  const router = useRouter();
  const { adeid, setCalendar, isInitialized } = useApp();
  const [loading, setLoading] = useState(true);
  const [hasRun, setHasRun] = useState(false);
  const [titleError, setTitleError] = useState('Erreur');
  const [subtitleError, setSubtitleError] = useState('');
  const insets = useSafeAreaInsets();
  const theme = getChoosenTheme();

  const bottomSheetErrorRef = useRef<BottomSheet>(null);

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
    if (isInitialized && !hasRun) {
      setHasRun(true);
      access();
    }
  }, [isInitialized]);

  async function access() {
    const netState = await Network.getNetworkStateAsync();
    if (!netState.isInternetReachable) {
      setLoading(false);
      setTitleError('Internet indisponible');
      setSubtitleError("Vous n'êtes pas connecté à Internet ! EC=0xT");
      setTimeout(() => bottomSheetErrorRef.current?.expand(), 500);
      return;
    }

    setLoading(false);
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
    setHasRun(false);
    setLoading(true);
  }

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
