import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useReducedMotion } from 'react-native-reanimated';

import snow from '@/src/assets/lottie/christmas.json';
import { useThemeId } from '@/src/theme';

// thème Noël : neige et traîneau derrière l'accueil, en pause quand l'onglet est caché
export function Snowfall() {
  const themeId = useThemeId();
  const reduceMotion = useReducedMotion();
  const ref = useRef<LottieView>(null);

  useFocusEffect(
    useCallback(() => {
      ref.current?.resume();
      return () => ref.current?.pause();
    }, []),
  );

  if (themeId !== 'noel' || reduceMotion) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LottieView ref={ref} source={snow} autoPlay loop resizeMode="cover" style={StyleSheet.absoluteFill} />
    </View>
  );
}
