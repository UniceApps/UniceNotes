import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import type { NextClassWidgetProps, WidgetClass } from '../types';

const NextClassWidget = (props: NextClassWidgetProps, env: any) => {
  'widget';
  const isSmall = env?.widgetFamily === 'systemSmall';
  const blue = env?.colorScheme === 'dark' ? 'rgb(155, 203, 255)' : 'rgb(0, 98, 159)';

  // toucher le widget ouvre l'EDT (lien profond unicenotes://edt, voir utils/deeplink.ts)
  const openEdt = [widgetURL('unicenotes://edt')];

  const EMPTY: WidgetClass = {
    title: 'Aucun cours',
    room: 'Profites-en !',
    startTime: '',
    endTime: '',
  };

  // Logo header commun
  const LogoHeader = (
    <HStack spacing={5} alignment="center">
      <Image
        systemName="graduationcap.fill"
        color={blue}
        size={14}
        modifiers={[frame({ width: 18, height: 18 })]}
      />
      <Text modifiers={[font({ size: 12 }), foregroundStyle(blue)]}>UniceNotes</Text>
    </HStack>
  );

  // État : EDT non configuré
  if (props?.configured === false) {
    if (isSmall) {
      return (
        <VStack alignment="leading" spacing={4} modifiers={openEdt}>
          {LogoHeader}
          <Spacer />
          <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>
            Configure ton EDT dans l'app
          </Text>
        </VStack>
      );
    }
    return (
      <VStack alignment="leading" spacing={10} modifiers={openEdt}>
        <HStack alignment="center">
          {LogoHeader}
          <Spacer />
          <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>prochains cours</Text>
        </HStack>
        <Text modifiers={[font({ size: 15 }), foregroundStyle('secondary')]}>
          Ouvre UniceNotes et configure ton EDT pour voir tes prochains cours ici.
        </Text>
      </VStack>
    );
  }

  // État : timeline expirée / widget jamais alimenté
  if (props?.configured === undefined) {
    if (isSmall) {
      return (
        <VStack alignment="leading" spacing={4} modifiers={openEdt}>
          {LogoHeader}
          <Spacer />
          <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>
            Relance UniceNotes pour mettre à jour
          </Text>
        </VStack>
      );
    }
    return (
      <VStack alignment="leading" spacing={10} modifiers={openEdt}>
        <HStack alignment="center">
          {LogoHeader}
          <Spacer />
          <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>prochains cours</Text>
        </HStack>
        <Text modifiers={[font({ size: 15 }), foregroundStyle('secondary')]}>
          Ouvre UniceNotes et relance-le pour mettre à jour l'emploi du temps.
        </Text>
      </VStack>
    );
  }

  // État normal : cours configurés
  const c1 = props?.courses?.[0] ?? EMPTY;
  const c2 = props?.courses?.[1] ?? null;

  if (isSmall) {
    return (
      <VStack alignment="leading" spacing={4} modifiers={openEdt}>
        {LogoHeader}
        <Spacer />
        {c1.startTime ? (
          <Text modifiers={[font({ size: 12 }), foregroundStyle(blue)]}>
            {c1.startTime} – {c1.endTime}
          </Text>
        ) : null}
        <Text modifiers={[font({ size: 17, weight: 'semibold' })]}>{c1.title}</Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle('secondary')]}>
          {c1.room || 'Salle non précisée'}
        </Text>
      </VStack>
    );
  }

  // systemMedium / systemLarge
  return (
    <VStack alignment="leading" spacing={10} modifiers={openEdt}>
      <HStack alignment="center">
        {LogoHeader}
        <Spacer />
        <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>
          prochains cours
        </Text>
      </HStack>

      <HStack alignment="top" spacing={16}>
        {/* Cours 1 */}
        <VStack alignment="leading" spacing={3}>
          <Text modifiers={[font({ size: 12 }), foregroundStyle(blue)]}>
            {c1.startTime ? `${c1.startTime} – ${c1.endTime}` : '–'}
          </Text>
          <Text modifiers={[font({ size: 15 })]}>{c1.title}</Text>
          <Text modifiers={[font({ size: 12 }), foregroundStyle('secondary')]}>
            {c1.room || 'Salle non précisée'}
          </Text>
        </VStack>

        {/* Cours 2 */}
        {c2 &&
          <VStack alignment="leading" spacing={3}>
            <Text modifiers={[font({ size: 12 }), foregroundStyle(blue)]}>
              {c2.startTime ? `${c2.startTime} – ${c2.endTime}` : '–'}
            </Text>
            <Text modifiers={[font({ size: 15 })]}>{c2.title}</Text>
            <Text modifiers={[font({ size: 12 }), foregroundStyle('secondary')]}>
              {c2.room || 'Salle non précisée'}
            </Text>
          </VStack>
        }
      </HStack>
    </VStack>
  );
};

export const NextClassWidgetInstance = createWidget('NextClassWidget', NextClassWidget);