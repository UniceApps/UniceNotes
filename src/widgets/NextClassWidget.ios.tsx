import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { cornerRadius, font, foregroundStyle, frame } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import type { NextClassWidgetProps, WidgetClass } from '../types';

const EMPTY: WidgetClass = {
  title: 'Aucun cours',
  room: 'Profitez-en !',
  startTime: '',
  endTime: '',
};

const NextClassWidget = (props: NextClassWidgetProps, env: any) => {
  'widget';

  const c1 = props?.courses?.[0] ?? EMPTY;
  const c2 = props?.courses?.[1] ?? null;
  const blue = env?.colorScheme === 'dark' ? 'rgb(155, 203, 255)' : 'rgb(0, 98, 159)';

  // ── systemSmall ──────────────────────────────────────────
  if (env?.widgetFamily === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={4}>
        <HStack spacing={5} alignment="center">
          <Image
            systemName="graduationcap.fill"
            color={blue}
            size={14}
            modifiers={[frame({ width: 18, height: 18 })]}
          />
          <Text modifiers={[font({ size: 12 }), foregroundStyle(blue)]}>UniceNotes</Text>
        </HStack>

        <Spacer />

        {/* Cours suivant */}
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

  // ── systemMedium / systemLarge ────────────────────────────
  return (
    <VStack alignment="leading" spacing={10}>
      {/* Header : logo + nom | label droit */}
      <HStack alignment="center">
        <HStack spacing={6} alignment="center">
          <Image
            systemName="graduationcap.fill"
            color={blue}
            size={16}
            modifiers={[frame({ width: 20, height: 20 })]}
          />
          <Text modifiers={[font({ size: 15 }), foregroundStyle(blue)]}>UniceNotes</Text>
        </HStack>
        <Spacer />
        <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}> 
          prochains cours
        </Text>
      </HStack>

      {/* Deux cours côte à côte */}
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
        {c2 ? (
          <VStack alignment="leading" spacing={3}>
            <Text modifiers={[font({ size: 12 }), foregroundStyle(blue)]}>
              {c2.startTime ? `${c2.startTime} – ${c2.endTime}` : '–'}
            </Text>
            <Text modifiers={[font({ size: 15 })]}>{c2.title}</Text>
            <Text modifiers={[font({ size: 12 }), foregroundStyle('secondary')]}> 
              {c2.room || 'Salle non précisée'}
            </Text>
          </VStack>
        ) : (
          <Text modifiers={[font({ size: 15 }), foregroundStyle('secondary')]}> 
            Aucun autre cours
          </Text>
        )}
      </HStack>
    </VStack>
  );
};

export const NextClassWidgetInstance = createWidget('NextClassWidget', NextClassWidget);