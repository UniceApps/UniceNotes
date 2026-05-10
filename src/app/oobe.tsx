import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Text, Button, IconButton, Tooltip } from 'react-native-paper';
import { Image } from 'expo-image';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/src/context/AppContext';
import { getChoosenTheme } from '@/src/constants/theme';
import { haptics } from '@/src/utils/haptics';
import { saveSecure } from '@/src/utils/storage';
import { handleURL } from '@/src/utils/api';

export default function OOBEScreen() {
  const router = useRouter();
  const { setAdeid } = useApp();
  const theme = getChoosenTheme();
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
          <Text style={{ textAlign: 'left', marginBottom: 8 }} variant="titleLarge">
            Application réservée à l&apos;Université Côte d&apos;Azur.
          </Text>
          <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">
            Bienvenue sur UniceNotes. Visualisez votre emploi du temps directement
            depuis l&apos;application, sans compte requis.
          </Text>
          <Button style={{ marginBottom: 16 }} icon="skip-next" mode="contained" onPress={handleStart}>
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
