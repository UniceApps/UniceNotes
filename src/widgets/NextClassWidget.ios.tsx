import { 
  Capsule, HStack, Image, 
  Spacer, Text, VStack 
} from '@expo/ui/swift-ui';

import {
  background, fixedSize, font,
  foregroundStyle, frame, lineLimit,
  padding, shapes, widgetURL,
} from '@expo/ui/swift-ui/modifiers';
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

  // barre verticale à la couleur du cours, à la hauteur du texte qu'elle accompagne
  const bar = (c: WidgetClass, width: number) => (
    <Capsule modifiers={[frame({ width }), foregroundStyle(c.color || 'gray')]} />
  );

  // cours mis en avant : horaire au-dessus, titre et salle à côté de la barre
  const mainCourse = (c: WidgetClass) => (
    <VStack alignment="leading" spacing={3}>
      {c.startTime ? (
        <Text modifiers={[font({ size: 12 }), foregroundStyle('secondary')]}>
          {c.startTime} – {c.endTime}
        </Text>
      ) : null}
      <HStack alignment="center" spacing={7} modifiers={[fixedSize({ horizontal: false, vertical: true })]}>
        {bar(c, 4)}
        <VStack alignment="leading" spacing={1}>
          <Text modifiers={[font({ size: 16, weight: 'semibold' }), lineLimit(isSmall ? 2 : 3)]}>
            {c.title}
          </Text>
          <Text modifiers={[font({ size: 12 }), foregroundStyle('secondary'), lineLimit(2)]}>
            {c.room || 'Salle non précisée'}
          </Text>
        </VStack>
      </HStack>
    </VStack>
  );

  // cours suivant, en plus compact : l'horaire passe devant la salle
  const nextCourse = (c: WidgetClass, key: number) => (
    <HStack key={key} alignment="center" spacing={6} modifiers={[fixedSize({ horizontal: false, vertical: true })]}>
      {bar(c, 3)}
      <VStack alignment="leading" spacing={1}>
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), lineLimit(1)]}>{c.title}</Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary'), lineLimit(2)]}>
          {c.startTime} · {c.room || 'Salle non précisée'}
        </Text>
      </VStack>
    </HStack>
  );

  const message = (text: string) => (
    <VStack alignment="leading" spacing={4} modifiers={openEdt}>
      {LogoHeader}
      <Spacer />
      <Text modifiers={[font({ size: isSmall ? 11 : 15 }), foregroundStyle('secondary')]}>{text}</Text>
    </VStack>
  );

  // État : EDT non configuré
  if (props?.configured === false) {
    return message(
      isSmall
        ? "Configure ton EDT dans l'app"
        : 'Ouvre UniceNotes et configure ton EDT pour voir tes prochains cours ici.',
    );
  }

  // État : timeline expirée / widget jamais alimenté
  if (props?.configured === undefined) {
    return message(
      isSmall
        ? 'Relance UniceNotes pour mettre à jour'
        : "Ouvre UniceNotes et relance-le pour mettre à jour l'emploi du temps.",
    );
  }

  // État normal : cours configurés
  const c1 = props?.courses?.[0] ?? EMPTY;
  const upNext = props?.courses?.slice(1, 3) ?? [];

  if (isSmall) {
    return (
      <VStack alignment="leading" spacing={4} modifiers={openEdt}>
        {LogoHeader}
        <Spacer />
        {mainCourse(c1)}
      </VStack>
    );
  }

  // systemMedium : cours en avant à gauche, les suivants dans un panneau à droite
  return (
    <HStack alignment="top" spacing={12} modifiers={openEdt}>
      <VStack alignment="leading" spacing={4} modifiers={[frame({ maxWidth: 10000, maxHeight: 10000, alignment: 'topLeading' })]}>
        {LogoHeader}
        <Spacer />
        {mainCourse(c1)}
      </VStack>

      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[
          padding({ all: 10 }),
          frame({ maxWidth: 10000, maxHeight: 10000, alignment: 'topLeading' }),
          background({ type: 'hierarchical', style: 'quinary' }, shapes.containerRelativeShape()),
        ]}
      >
        <Text modifiers={[font({ size: 13, weight: 'semibold' })]}>À suivre</Text>
        {upNext.length > 0 ? (
          upNext.map((c, i) => nextCourse(c, i))
        ) : (
          <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>
            {"Rien d'autre de prévu"}
          </Text>
        )}
      </VStack>
    </HStack>
  );
};

export const NextClassWidgetInstance = createWidget('NextClassWidget', NextClassWidget);
