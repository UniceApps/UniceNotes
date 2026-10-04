import { useState } from 'react';
import { View } from 'react-native';

import { Text } from 'react-native-paper';

import { HeaderButton } from '@/src/components/ui/ScreenHeader';
import { useAppTheme } from '@/src/theme';
import { formatLongDate } from '@/src/utils/date';

// salutation selon l'heure, avant 5 h on reste sur le soir
const GREETINGS = [
  {
    from: 18,
    title: 'Bonsoir ! 🌙',
    messages: [
      'On jette un œil à demain ?',
      'Petit check avant demain ?',
      'Ravi de te revoir ! ^^',
      "Un œil sur l'emploi du temps ?",
    ],
  },
  {
    from: 12,
    title: 'Salut ! 👋',
    messages: [
      'On fait le point sur la journée ?',
      'Petit check rapide de ta journée ?',
      "Un œil sur l'emploi du temps ?",
      'Ravi de te revoir ! ^^',
    ],
  },
  {
    from: 5,
    title: 'Bonjour ! ☀️',
    messages: [
      'Passe une excellente journée !',
      "Quoi de prévu aujourd'hui ? :)",
      "Voyons ce qui t'attend aujourd'hui.",
      "C'est quoi le plan pour aujourd'hui ?",
    ],
  },
];

function getGreeting(date: Date) {
  const hour = date.getHours();
  const { title, messages } = GREETINGS.find((g) => hour >= g.from) ?? GREETINGS[0];
  return { title, message: messages[Math.floor(Math.random() * messages.length)] };
}

interface HomeHeaderProps {
  now: Date;
  onEditEdt: () => void;
}

export function HomeHeader({ now, onEditEdt }: HomeHeaderProps) {
  const theme = useAppTheme();
  const [greeting] = useState(() => getGreeting(new Date()));

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant="labelLarge" style={{ flex: 1, color: theme.colors.primary }}>
          {formatLongDate(now)}
        </Text>
        <HeaderButton icon="calendar-edit" label="Configurer l'emploi du temps" onPress={onEditEdt} />
      </View>

      <Text variant="displaySmall" style={{ marginTop: 8 }}>
        {greeting.title}
      </Text>
      <Text variant="titleMedium" style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}>
        {greeting.message}
      </Text>
    </View>
  );
}
