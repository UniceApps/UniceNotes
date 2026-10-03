import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Image } from 'expo-image';

import { Button, Icon, Text } from 'react-native-paper';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useChoosenTheme } from '@/src/constants/theme';
import type { AgendaState } from '@/src/hooks/useAgenda';
import { formatSchedule, getClassStatus, type AgendaClass } from '@/src/utils/agenda';
import { withAlpha } from '@/src/utils/color';

import { PressableScale } from './PressableScale';

interface NextClassCardProps {
  agenda: AgendaState;
  onOpen: () => void;
  onSetup: () => void;
  onRetry: () => void;
}

// carte principale : cours en cours, sinon le prochain
export function NextClassCard({ agenda, onOpen, onSetup, onRetry }: NextClassCardProps) {
  if (!agenda.configured) {
    return (
      <MessageCard
        icon="calendar-edit"
        title="Configure ton emploi du temps"
        text="Retrouve ton prochain cours ici et sur tes widgets."
        action={{ label: 'Configurer', icon: 'arrow-right', onPress: onSetup }}
        onPress={onSetup}
      />
    );
  }

  if (agenda.classes.length === 0) {
    if (agenda.fetching) return <LoadingCard />;
    if (agenda.offline) {
      return (
        <MessageCard
          tone="error"
          icon="wifi-off"
          title="ADE indisponible"
          text="Impossible de récupérer ton emploi du temps pour le moment."
          action={{ label: 'Réessayer', icon: 'refresh', onPress: onRetry }}
        />
      );
    }
    return (
      <MessageCard
        icon="calendar-search"
        title="Aucun cours trouvé"
        text="Ton emploi du temps est vide : vérifie ton numéro étudiant ou ton cursus."
        action={{ label: 'Vérifier', icon: 'arrow-right', onPress: onSetup }}
      />
    );
  }

  if (!agenda.next) {
    return <MessageCard icon="beach" title="Aucun cours à venir" text="La chance… Profites-en !" onPress={onOpen} />;
  }

  return <ClassCard item={agenda.next} now={agenda.now} onPress={onOpen} />;
}

function ClassCard({ item, now, onPress }: { item: AgendaClass; now: Date; onPress: () => void }) {
  const theme = useChoosenTheme();
  const c = theme.colors;
  const status = getClassStatus(item, now);
  const room = item.room || 'Salle non précisée';
  const schedule = formatSchedule(item);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${status.label} : ${item.title}, ${room}, ${schedule}${status.ongoing ? `, ${status.remaining}` : ''}`}
      accessibilityHint="Ouvre l'emploi du temps"
      style={[styles.card, { backgroundColor: c.primaryContainer }]}
      onPress={onPress}
    >
      <Watermark color={c.onPrimaryContainer} />

      <View style={styles.row}>
        <View style={[styles.pill, { backgroundColor: c.primary }]}>
          {status.ongoing && <LiveDot color={c.onPrimary} />}
          <Text variant="labelLarge" style={{ color: c.onPrimary }}>
            {status.label}
          </Text>
        </View>
        <Icon source="chevron-right" size={24} color={c.onPrimaryContainer} />
      </View>

      <Text variant="headlineSmall" numberOfLines={3} style={{ color: c.onPrimaryContainer, marginTop: 16 }}>
        {item.title}
      </Text>

      <View style={{ marginTop: 12, gap: 6 }}>
        <InfoLine icon="map-marker-outline" text={room} color={c.onPrimaryContainer} />
        <InfoLine icon="clock-outline" text={schedule} color={c.onPrimaryContainer} />
      </View>

      {status.ongoing && (
        <View style={[styles.row, { marginTop: 18, gap: 12 }]}>
          <ProgressTrack
            progress={status.progress}
            color={c.primary}
            track={withAlpha(c.onPrimaryContainer, 0.16)}
          />
          <Text variant="labelLarge" style={{ color: c.onPrimaryContainer }}>
            {status.remaining}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

interface MessageCardProps {
  icon: string;
  title: string;
  text: string;
  tone?: 'primary' | 'error';
  action?: { label: string; icon: string; onPress: () => void };
  onPress?: () => void;
}

function MessageCard({ icon, title, text, tone = 'primary', action, onPress }: MessageCardProps) {
  const theme = useChoosenTheme();
  const c = theme.colors;
  const [background, foreground, accent, onAccent] =
    tone === 'error'
      ? [c.errorContainer, c.onErrorContainer, c.error, c.onError]
      : [c.primaryContainer, c.onPrimaryContainer, c.primary, c.onPrimary];

  return (
    <PressableScale
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[styles.card, { backgroundColor: background }]}
      onPress={onPress}
    >
      <Watermark color={foreground} />
      <View style={[styles.badge, { backgroundColor: accent }]}>
        <Icon source={icon} size={24} color={onAccent} />
      </View>
      <Text variant="headlineSmall" style={{ color: foreground, marginTop: 16 }}>
        {title}
      </Text>
      <Text variant="bodyLarge" style={{ color: foreground, marginTop: 4, opacity: 0.85 }}>
        {text}
      </Text>
      {action && (
        <Button
          mode="contained"
          icon={action.icon}
          buttonColor={accent}
          textColor={onAccent}
          style={{ alignSelf: 'flex-start', marginTop: 16 }}
          contentStyle={{ flexDirection: 'row-reverse' }}
          onPress={action.onPress}
        >
          {action.label}
        </Button>
      )}
    </PressableScale>
  );
}

// squelette pendant le premier téléchargement
function LoadingCard() {
  const theme = useChoosenTheme();
  const pulse = usePulse(0.4, 800);
  const bone = { backgroundColor: withAlpha(theme.colors.onPrimaryContainer, 0.12) };

  return (
    <View
      accessible
      accessibilityLabel="Chargement du prochain cours"
      style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]}
    >
      <Animated.View style={pulse}>
        <View style={[styles.bone, bone, { width: 110, height: 32, borderRadius: 16 }]} />
        <View style={[styles.bone, bone, { width: '85%', height: 26, marginTop: 18 }]} />
        <View style={[styles.bone, bone, { width: '55%', height: 26, marginTop: 8 }]} />
        <View style={[styles.bone, bone, { width: '45%', marginTop: 18 }]} />
        <View style={[styles.bone, bone, { width: '60%', marginTop: 10 }]} />
      </Animated.View>
    </View>
  );
}

function InfoLine({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ marginTop: 3 }}>
        <Icon source={icon} size={18} color={color} />
      </View>
      <Text variant="titleMedium" numberOfLines={2} style={{ color, flexShrink: 1 }}>
        {text}
      </Text>
    </View>
  );
}

function ProgressTrack({ progress, color, track }: { progress: number; color: string; track: string }) {
  const [width, setWidth] = useState(0);
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.set(withTiming(progress * width, { duration: 700 }));
  }, [fill, progress, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: fill.value }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={[styles.track, { backgroundColor: track }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
    </View>
  );
}

function LiveDot({ color }: { color: string }) {
  const pulse = usePulse(0.25, 900);
  return <Animated.View style={[styles.dot, { backgroundColor: color }, pulse]} />;
}

// logo en filigrane dans le coin
function Watermark({ color }: { color: string }) {
  return <Image source={require('../../assets/white.png')} tintColor={color} style={styles.watermark} />;
}

// opacité qui pulse en boucle
function usePulse(min: number, duration: number) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(min, { duration }), -1, true));
    return () => cancelAnimation(opacity);
  }, [opacity, min, duration]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, padding: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  watermark: { position: 'absolute', right: -40, bottom: -40, width: 170, height: 170, opacity: 0.07 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  bone: { height: 18, borderRadius: 8 },
});
