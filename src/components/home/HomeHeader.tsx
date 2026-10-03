import React, { useState } from 'react';
import { View } from 'react-native';

import { IconButton, Text, Tooltip } from 'react-native-paper';

import { useChoosenTheme } from '@/src/constants/theme';
import { formatLongDate } from '@/src/utils/agenda';

// salutation selon l'heure, avant 5 h on reste sur le soir
const GREETINGS = [
  {
    from: 18,
    title: 'Bonsoir ! 🌙',
    messages: [
      'On jette un œil à demain ?',
      'Petit check avant demain ?',
      'Ravi de te revoir ! ^^',
      'Un œil sur l\'emploi du temps ?',
    ],
  },
  {
    from: 12,
    title: 'Salut ! 👋',
    messages: [
      'On fait le point sur la journée ?',
      'Petit check rapide de ta journée ?',
      'Un œil sur l\'emploi du temps ?',
      'Ravi de te revoir ! ^^',
    ],
  },
  {
    from: 5,
    title: 'Bonjour ! ☀️',
    messages: [
      'Passe une excellente journée !',
      'Quoi de prévu aujourd\'hui ? :)',
      'Voyons ce qui t\'attend aujourd\'hui.',
      'C\'est quoi le plan pour aujourd\'hui ?',
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
  onSettings: () => void;
}

export function HomeHeader({ now, onEditEdt, onSettings }: HomeHeaderProps) {
  const theme = useChoosenTheme();
  const [greeting] = useState(() => getGreeting(new Date()));

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="labelLarge" style={{ flex: 1, color: theme.colors.primary }}>
          {formatLongDate(now)}
        </Text>
        <Tooltip title="Configurer l'EDT">
          <IconButton
            icon="calendar-edit"
            mode="contained-tonal"
            size={20}
            accessibilityLabel="Configurer l'emploi du temps"
            onPress={onEditEdt}
          />
        </Tooltip>
        <Tooltip title="Paramètres">
          <IconButton
            icon="cog-outline"
            mode="contained-tonal"
            size={20}
            accessibilityLabel="Paramètres"
            style={{ marginRight: 0 }}
            onPress={onSettings}
          />
        </Tooltip>
      </View>

      <Text variant="displaySmall" style={{ marginTop: 2 }}>
        {greeting.title}
      </Text>
      <Text variant="titleMedium" style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}>
        {greeting.message}
      </Text>
    </View>
  );
}
