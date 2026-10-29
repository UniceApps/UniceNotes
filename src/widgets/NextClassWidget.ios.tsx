import { AccessoryWidgetBackground, Capsule, HStack, Image, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  background,
  fixedSize,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  padding,
  shapes,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { NextClassWidgetProps, WidgetClass } from '@/src/types';

// 'widget' : la fonction est exécutée par l'extension, elle ne peut rien utiliser en dehors d'elle-même
const NextClassWidget = (props: NextClassWidgetProps, env: WidgetEnvironment) => {
  'widget';
  const family = env?.widgetFamily;
  const isSmall = family === 'systemSmall';
  const blue = env?.colorScheme === 'dark' ? 'rgb(155, 203, 255)' : 'rgb(0, 98, 159)';

  // toucher le widget ouvre l'EDT (lien profond unicenotes://edt, voir utils/deeplink.ts)
  const openEdt = [widgetURL('unicenotes://edt')];

  // écran verrouillé : prochain cours seulement
  if (family === 'accessoryInline' || family === 'accessoryRectangular' || family === 'accessoryCircular') {
    const next = props?.configured === true ? props.courses?.[0] : undefined;
    const status =
      props?.configured === false
        ? 'Configure ton EDT'
        : props?.configured !== true
          ? 'Ouvre UniceNotes'
          : 'Aucun cours';
    const room = next ? next.room.replace(/^salle\s+/i, '') : '';

    if (family === 'accessoryInline') {
      return <Text modifiers={openEdt}>{next ? `${next.startTime} · ${room || next.title}` : status}</Text>;
    }

    if (family === 'accessoryCircular') {
      return (
        <ZStack modifiers={openEdt}>
          <AccessoryWidgetBackground />
          <VStack spacing={1}>
            <Image systemName={next ? 'graduationcap.fill' : 'calendar'} size={13} />
            {next ? (
              <Text modifiers={[font({ size: 13, weight: 'semibold' }), monospacedDigit()]}>{next.startTime}</Text>
            ) : null}
          </VStack>
        </ZStack>
      );
    }

    return (
      <VStack
        alignment="leading"
        spacing={1}
        modifiers={[...openEdt, frame({ maxWidth: 10000, alignment: 'leading' })]}
      >
        <HStack spacing={4}>
          <Image systemName="graduationcap.fill" size={12} />
          <Text modifiers={[font({ size: 15, weight: 'semibold' }), lineLimit(1)]}>{next ? next.title : status}</Text>
        </HStack>
        {next ? (
          <>
            <Text modifiers={[font({ size: 13 }), monospacedDigit()]}>{`${next.startTime} – ${next.endTime}`}</Text>
            <Text modifiers={[font({ size: 13 }), lineLimit(1)]}>{next.room || 'Salle non précisée'}</Text>
          </>
        ) : null}
      </VStack>
    );
  }

  const EMPTY: WidgetClass = {
    title: 'Aucun cours',
    room: 'Profites-en !',
    startTime: '',
    endTime: '',
  };

  // en-tête commun
  const LogoHeader = (
    <HStack spacing={5} alignment="center">
      <Image systemName="graduationcap.fill" color={blue} size={14} modifiers={[frame({ width: 18, height: 18 })]} />
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
          <Text modifiers={[font({ size: 16, weight: 'semibold' }), lineLimit(isSmall ? 2 : 3)]}>{c.title}</Text>
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

  // edt non configuré
  if (props?.configured === false) {
    return message(
      isSmall
        ? "Configure ton EDT dans l'app"
        : 'Ouvre UniceNotes et configure ton EDT pour voir tes prochains cours ici.',
    );
  }

  // timeline expirée ou widget jamais alimenté
  if (props?.configured === undefined) {
    return message(
      isSmall
        ? 'Relance UniceNotes pour mettre à jour'
        : "Ouvre UniceNotes et relance-le pour mettre à jour l'emploi du temps.",
    );
  }

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
      <VStack
        alignment="leading"
        spacing={4}
        modifiers={[frame({ maxWidth: 10000, maxHeight: 10000, alignment: 'topLeading' })]}
      >
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
          <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>{"Rien d'autre de prévu"}</Text>
        )}
      </VStack>
    </HStack>
  );
};

export const NextClassWidgetInstance = createWidget('NextClassWidget', NextClassWidget);
