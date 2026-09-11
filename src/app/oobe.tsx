import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { Button, IconButton, Text, Tooltip } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';

import { useChoosenTheme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { handleURL } from '@/src/utils/api';
import { haptics } from '@/src/utils/haptics';
import { saveSecure } from '@/src/utils/storage';

type Step = 'welcome' | 'edt' | 'pronote';

export default function OOBEScreen() {
  const router = useRouter();
  const { setAdeid } = useApp();
  const theme = useChoosenTheme();
  const insets = useSafeAreaInsets();

  const rotation = useSharedValue(0);
  const rotateConfig = { damping: 2, stiffness: 15 };
  rotation.value = withRepeat(
    withSequence(withSpring(0, rotateConfig), withSpring(360, rotateConfig)),
    -1,
    false,
  );
  const animatedStyleLogo = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const renderNoBackdrop = useCallback(() => null, []);

  async function handleStart() {
    haptics('medium');
    await saveSecure('adeid', 'demo');
    setAdeid('demo');
    router.replace('/home');
    router.push('/edt-config');
  }

  const bgStyle = { backgroundColor: theme.colors.background };
  const handleStyle = { backgroundColor: theme.colors.onBackground };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LottieView
        autoPlay
        loop
        resizeMode="cover"
        source={
          theme.dark
            ? require('../assets/lottie/background_login_dark')
            : require('../assets/lottie/background_login_light')
        }
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View style={{ flex: 1, alignSelf: 'center', height: 'auto', marginTop: insets.top * 2 }}>
        <Animated.View style={animatedStyleLogo}>
          <Image source={require('../assets/color.png')} style={{ width: 200, height: 200 }} />
        </Animated.View>
      </View>

      <BottomSheet
        index={0}
        enableDynamicSizing
        backgroundStyle={bgStyle}
        handleIndicatorStyle={handleStyle}
        backdropComponent={renderNoBackdrop}
      >
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
          <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="displayMedium">
            UniceNotes
          </Text>
              <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleLarge">
                Délaissez les vieux intranets et retrouvez vos notes et votre emploi du temps directement dans l&apos;application.
          </Text>
              <Text style={{ textAlign: 'center', marginBottom: 8 }} variant="titleSmall">
                En continuant, vous acceptez les conditions{'\n'}
                d&apos;utilisation ainsi que la politique de confidentialité.
          </Text>
              <Button style={{ marginBottom: 8 }} icon="skip-next" mode="contained" onPress={handleWelcomeNext}>
            Suivant
          </Button>
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
            <Tooltip title="Mentions légales">
              <IconButton
                style={{ marginBottom: 4 }}
                icon="license"
                mode="contained"
                onPress={() => handleURL('https://notes.metrixmedia.fr/credits')}
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
            <Tooltip title="Paramètres">
              <IconButton
                style={{ marginBottom: insets.bottom }}
                icon="cog"
                mode="contained"
                onPress={() => router.push('/settings')}
              />
            </Tooltip>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
