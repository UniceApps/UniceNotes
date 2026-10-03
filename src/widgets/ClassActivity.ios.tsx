import { Capsule, HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  multilineTextAlignment,
  padding,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

import type { ClassActivityProps } from '@/src/types';

// bannière de l'écran verrouillé et Dynamic Island
const ClassActivityLayout = (props: ClassActivityProps, env: LiveActivityEnvironment) => {
  'widget';
  const accent = props.color || 'gray';
  const interval = { lower: new Date(props.start), upper: new Date(props.end) };
  const finished = env?.isStale === true;

  const pad = (n: number) => String(n).padStart(2, '0');
  const hour = (ms: number) => {
    const d = new Date(ms);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const icon = <Image systemName="graduationcap.fill" color={accent} />;

  const timer = (size: number, width: number) => (
    <Text
      timerInterval={interval}
      countsDown
      modifiers={[
        font({ size, weight: 'semibold' }),
        monospacedDigit(),
        multilineTextAlignment('trailing'),
        frame({ width }),
      ]}
    />
  );

  const details = (
    <Text modifiers={[font({ size: 13 }), foregroundStyle('secondary'), lineLimit(1)]}>
      {`${props.room || 'Salle non précisée'} · ${hour(props.start)}–${hour(props.end)}`}
    </Text>
  );

  const nextText = props.next
    ? `Ensuite : ${props.next.title} à ${props.next.startTime}${props.next.room ? ` · ${props.next.room}` : ''}`
    : "Plus de cours aujourd'hui";

  const ended = (
    <VStack alignment="leading" spacing={4}>
      <Text modifiers={[font({ size: 15, weight: 'semibold' })]}>Cours terminé</Text>
      <Text modifiers={[font({ size: 13 }), foregroundStyle('secondary'), lineLimit(2)]}>{nextText}</Text>
    </VStack>
  );

  const progress = <ProgressView timerInterval={interval} countsDown={false} modifiers={[tint(accent)]} />;

  return {
    banner: (
      <VStack alignment="leading" spacing={10} modifiers={[padding({ all: 16 })]}>
        {finished ? (
          ended
        ) : (
          <>
            <HStack alignment="center" spacing={10}>
              <Capsule modifiers={[frame({ width: 4, height: 36 }), foregroundStyle(accent)]} />
              <VStack alignment="leading" spacing={2}>
                <Text modifiers={[font({ size: 16, weight: 'semibold' }), lineLimit(1)]}>{props.title}</Text>
                {details}
              </VStack>
              <Spacer />
              {timer(22, 90)}
            </HStack>
            {progress}
          </>
        )}
      </VStack>
    ),
    compactLeading: icon,
    compactTrailing: finished ? <Text modifiers={[font({ size: 14 })]}>Fini</Text> : timer(14, 52),
    minimal: icon,
    expandedLeading: (
      <HStack spacing={6} modifiers={[padding({ leading: 4 })]}>
        {icon}
        <Text modifiers={[font({ size: 15, weight: 'semibold' }), lineLimit(1)]}>{props.title}</Text>
      </HStack>
    ),
    expandedTrailing: finished ? undefined : timer(18, 80),
    expandedBottom: (
      <VStack alignment="leading" spacing={8} modifiers={[padding({ horizontal: 4 })]}>
        {finished ? ended : details}
        {finished ? null : progress}
      </VStack>
    ),
  };
};

export const ClassActivity = createLiveActivity('ClassActivity', ClassActivityLayout);
