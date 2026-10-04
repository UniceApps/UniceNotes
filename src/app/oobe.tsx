import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { Button, Icon, IconButton, Text } from 'react-native-paper';
import Animated, {
  cancelAnimation,
  FadeInRight,
  FadeOutLeft,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import darkBackground from '@/src/assets/lottie/background_login_dark.json';
import lightBackground from '@/src/assets/lottie/background_login_light.json';
import { IconPicker, ThemePicker } from '@/src/components/appearance/AppearancePickers';
import { APP_VERSION, LINKS } from '@/src/constants/config';
import { useSettings } from '@/src/context/SettingsContext';
import { useAppTheme } from '@/src/theme';
import { openURL } from '@/src/utils/browser';
import { haptics } from '@/src/utils/haptics';
import { storage } from '@/src/utils/storage';

const STEPS = ['welcome', 'edt', 'appearance'] as const;
type Step = (typeof STEPS)[number];

// marge intérieure du panneau, que le sélecteur d'icônes déborde
const PANEL_PADDING = 24;

export default function OobeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { adeid, setOobeCompleted } = useSettings();
  const [step, setStep] = useState<Step>('welcome');

  function goTo(next: Step) {
    haptics('light');
    setStep(next);
  }

  async function finish() {
    // un nouvel utilisateur n'a pas besoin des nouveautés de cette version
    await storage.set('releaseNotesVersion', APP_VERSION);
    haptics('success');
    setOobeCompleted(true);
    router.replace('/home');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LottieView
        autoPlay
        loop
        resizeMode="cover"
        source={theme.dark ? darkBackground : lightBackground}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
        <SpinningLogo dark={theme.dark} />
      </View>

      <Animated.View
        layout={LinearTransition.duration(250)}
        style={{
          marginHorizontal: 12,
          marginBottom: insets.bottom + 12,
          padding: PANEL_PADDING,
          borderRadius: 32,
          overflow: 'hidden',
          backgroundColor: theme.colors.background,
        }}
      >
        <StepDots step={step} />
        <Animated.View key={step} entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(200)}>
          {step === 'welcome' && (
            <Welcome onNext={() => goTo('edt')} onSettings={() => router.push('/oobe/settings')} />
          )}
          {step === 'edt' && (
            <EdtStep adeid={adeid} onConfigure={() => router.push('/edt-config')} onNext={() => goTo('appearance')} />
          )}
          {step === 'appearance' && <AppearanceStep onFinish={finish} />}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function Welcome({ onNext, onSettings }: { onNext: () => void; onSettings: () => void }) {
  const theme = useAppTheme();
  return (
    <StepContent
      title="UniceNotes"
      text="Délaisse les vieux intranets : ton emploi du temps, les salles libres et ton ENT, réunis dans une seule app."
    >
      <Button mode="contained" icon="arrow-right" contentStyle={{ flexDirection: 'row-reverse' }} onPress={onNext}>
        Commencer
      </Button>
      <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
        En continuant, tu acceptes les conditions d&apos;utilisation et la politique de confidentialité.
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <IconButton
          icon="license"
          mode="contained-tonal"
          accessibilityLabel="Mentions légales"
          onPress={() => openURL(LINKS.credits)}
        />
        <IconButton
          icon="source-branch"
          mode="contained-tonal"
          accessibilityLabel="Code source"
          onPress={() => openURL(LINKS.source)}
        />
        <IconButton icon="cog-outline" mode="contained-tonal" accessibilityLabel="Paramètres" onPress={onSettings} />
      </View>
    </StepContent>
  );
}

function EdtStep({
  adeid,
  onConfigure,
  onNext,
}: {
  adeid: string | null;
  onConfigure: () => void;
  onNext: () => void;
}) {
  const theme = useAppTheme();
  return (
    <StepContent
      label="Étape 1 sur 2"
      title="Ton emploi du temps"
      text="Configure ton emploi du temps ADE pour retrouver ton prochain cours à l'accueil et sur tes widgets."
    >
      {adeid ? (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 16,
              backgroundColor: theme.colors.primaryContainer,
            }}
          >
            <Icon source="check-circle" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={{ flex: 1, color: theme.colors.onPrimaryContainer }}>
              EDT {adeid} configuré
            </Text>
          </View>
          <Button mode="contained" icon="arrow-right" contentStyle={{ flexDirection: 'row-reverse' }} onPress={onNext}>
            Suivant
          </Button>
        </>
      ) : (
        <>
          <Button mode="contained" icon="calendar-edit" onPress={onConfigure}>
            Configurer
          </Button>
          <Button mode="text" onPress={onNext}>
            Plus tard
          </Button>
        </>
      )}
    </StepContent>
  );
}

function AppearanceStep({ onFinish }: { onFinish: () => void }) {
  const theme = useAppTheme();
  return (
    <StepContent label="Étape 2 sur 2" title="À ton style">
      <ThemePicker />
      <IconPicker compact bleed={PANEL_PADDING} />
      <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
        Tu pourras changer d&apos;avis à tout moment dans Paramètres › Apparence.
      </Text>
      <Button mode="contained" icon="check" onPress={onFinish}>
        C&apos;est parti !
      </Button>
    </StepContent>
  );
}

function StepContent({
  label,
  title,
  text,
  children,
}: {
  label?: string;
  title: string;
  text?: string;
  children: ReactNode;
}) {
  const theme = useAppTheme();
  return (
    <View style={{ gap: 12 }}>
      <View>
        {label && (
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            {label}
          </Text>
        )}
        <Text variant="headlineLarge">{title}</Text>
        {text && (
          <Text variant="titleMedium" style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}>
            {text}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

function StepDots({ step }: { step: Step }) {
  const theme = useAppTheme();
  const index = STEPS.indexOf(step);
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
      {STEPS.map((item, i) => (
        <View
          key={item}
          style={{
            width: i === index ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i <= index ? theme.colors.primary : theme.colors.surfaceVariant,
          }}
        />
      ))}
    </View>
  );
}

// tour complet avec rebond, en boucle
function SpinningLogo({ dark }: { dark: boolean }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    const spring = { damping: 2, stiffness: 15 };
    rotation.set(withRepeat(withSequence(withSpring(0, spring), withSpring(360, spring)), -1, false));
    return () => cancelAnimation(rotation);
  }, [rotation]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <Animated.View style={style}>
      <Image
        source={dark ? require('../assets/white.png') : require('../assets/color.png')}
        style={{ width: 180, height: 180 }}
      />
    </Animated.View>
  );
}
