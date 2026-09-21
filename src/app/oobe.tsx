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

import { IconPicker, ThemePicker } from '@/src/components/AppearancePickers';
import { useChoosenTheme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { handleURL } from '@/src/utils/api';
import { haptics } from '@/src/utils/haptics';
import { saveSecure } from '@/src/utils/storage';

type Step = 'welcome' | 'edt' | 'appearance';

export default function OOBEScreen() {
  const router = useRouter();
  const { adeid, setAdeid, setOnboarding, setOobeCompleted } = useApp();
  const theme = useChoosenTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('welcome');
  const edtDone = !!adeid && adeid !== 'demo';

  useEffect(() => {
    setOnboarding(true);
  }, [setOnboarding]);

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

  async function handleWelcomeNext() {
    haptics('medium');
    // second passage (bouton "Relancer" des paramètres) : on n'écrase pas un EDT déjà configuré
    if (!edtDone) {
    await saveSecure('adeid', 'demo');
    setAdeid('demo');
    }
    setStep('edt');
  }

  function configureEdt() {
    haptics('medium');
    router.push('/edt-config');
  }

  function goToAppearance() {
    haptics('light');
    setStep('appearance');
  }

  function finishOobe() {
    haptics('success');
    setOobeCompleted(true);
    setOnboarding(false);
    router.replace('/home');
  }

  const GREEN = '#2E7D32';

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
            ? require('../assets/themes/lottie/background_login_dark')
            : require('../assets/themes/lottie/background_login_light')
        }
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View style={{ flex: 1, alignSelf: 'center', height: 'auto', marginTop: insets.top }}>
        <Animated.View style={animatedStyleLogo}>
          <Image         source={
          theme.dark
            ? require('../assets/white.png')
            : require('../assets/color.png')
        } style={{ width: 200, height: 200 }} />
        </Animated.View>
      </View>

      <BottomSheet
        index={0}
        enableDynamicSizing
        backgroundStyle={bgStyle}
        handleIndicatorStyle={handleStyle}
        backdropComponent={renderNoBackdrop}
      >
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25, paddingBottom: insets.bottom }}>
          {step === 'welcome' && (
            <>
          <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="displayMedium">
            UniceNotes
          </Text>
              <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleLarge">
                Délaisse les vieux intranets et retrouve tes notes et ton emploi du temps directement dans l&apos;application.
          </Text>
              <Text style={{ textAlign: 'center', marginBottom: 8 }} variant="titleSmall">
                En continuant, tu acceptes les conditions{'\n'}
                d&apos;utilisation ainsi que la politique de confidentialité.
          </Text>
              <Button style={{ marginBottom: 8 }} icon="skip-next" mode="contained" onPress={handleWelcomeNext}>
            Suivant
          </Button>
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
            <Tooltip title="Mentions légales">
              <IconButton
                icon="license"
                mode="contained"
                onPress={() => handleURL('https://notes.metrixmedia.fr/credits')}
              />
            </Tooltip>
            <Tooltip title="Code source">
              <IconButton
                icon="source-branch"
                mode="contained"
                onPress={() => handleURL('https://github.com/UniceApps/UniceNotes')}
              />
            </Tooltip>
            <Tooltip title="Paramètres">
              <IconButton
                icon="cog"
                mode="contained"
                onPress={() => router.push('/settings')}
              />
            </Tooltip>
          </View>
            </>
          )}

          {step === 'edt' && (
            <>
              <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="displayMedium">
                Configuration
              </Text>
              <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleLarge">
                (1/2) &mdash; Emploi du temps
              </Text>
              <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">
                Configure ton emploi du temps (via ADE) pour le retrouver directement à l&apos;accueil.
              </Text>
              {edtDone ? (
                <Button
                  style={{ marginBottom: 16 }}
                  icon="check"
                  mode="contained"
                  buttonColor={GREEN}
                  onPress={goToAppearance}
                >
                  Suivant
                </Button>
              ) : (
                <>
                  <Button style={{ marginBottom: 8 }} icon="calendar-edit" mode="contained" onPress={configureEdt}>
                    Configurer
                  </Button>
                  <Button style={{ marginBottom: 16 }} mode="outlined" onPress={goToAppearance}>
                    Plus tard
                  </Button>
                </>
              )}
            </>
          )}

          {step === 'appearance' && (
            <>
              <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="displayMedium">
                Personnalisation
              </Text>
              <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleLarge">
                (2/2) &mdash; UniceNotes de ton style
              </Text>
              <Text style={{ textAlign: 'left', marginBottom: 8 }} variant="titleMedium">
                Thème
              </Text>
              <ThemePicker />
              <Text style={{ textAlign: 'left', marginTop: 16 }} variant="titleMedium">
                Icône
              </Text>
              <IconPicker compact />
              <Text
                style={{ textAlign: 'center', marginTop: 4, marginBottom: 8, color: theme.colors.onSurfaceVariant }}
                variant="bodySmall"
              >
                Tu pourras changer d&apos;avis à tout moment dans Paramètres › Apparence.
              </Text>
              <Button style={{ marginBottom: 16 }} icon="check" mode="contained" buttonColor={GREEN} onPress={finishOobe}>
                C&apos;est parti !
              </Button>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
