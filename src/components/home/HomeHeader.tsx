import { useState } from 'react';
import { View } from 'react-native';

import { Text } from 'react-native-paper';

import { HeaderButton } from '@/src/components/ui/ScreenHeader';
import { useAppTheme, useThemeId } from '@/src/theme';
import { daysBetween, formatLongDate } from '@/src/utils/date';

// salutation selon l'heure, avant 5 h on reste sur le soir
const GREETINGS = [
  {
    from: 18,
    title: '🌙 Bonsoir !',
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
    title: '☀️ Bonjour !',
    messages: [
      'Passe une excellente journée !',
      "Quoi de prévu aujourd'hui ? :)",
      "Voyons ce qui t'attend aujourd'hui.",
      "C'est quoi le plan pour aujourd'hui ?",
    ],
  },
];

// thème Noël : compte à rebours jusqu'au 25 décembre, puis les fêtes jusqu'à l'Épiphanie
function getChristmasGreeting(date: Date): { title: string; messages: string[] } {
  const month = date.getMonth();
  const day = date.getDate();
  if (month === 11 && day >= 24 && day <= 25) {
    return {
      title: '🎄 Joyeux Noël !',
      messages: ['tema le gars il mate UniceNotes à Noël 🎁'],
    };
  }
  if (month === 11 && day > 25) {
    return {
      title: '⛄ Bonnes fêtes !',
      messages: [
        'Encore un peu de bûche ? 🍰',
        'Repose-toi bien pendant les vacances !',
        'Les cours reprennent bientôt… ❄️',
      ],
    };
  }
  if (month === 0 && day <= 3 || month === 11 && day === 31) {
    return {
      title: '🎆 Bonne année !',
      messages: [
        "On passe de 6 à 7 ou quoi l'ékip 😋",
        'Meilleurs vœux !',
      ],
    };
  }

  const days = daysBetween(date, new Date(date.getFullYear(), 11, 25));
  const hour = date.getHours();
  return {
    title: hour >= 18 || hour < 5 ? '⛄ Bonsoir !' : hour >= 12 ? '🎄 Salut !' : '❄️ Bonjour !',
    messages: [
      `Plus que ${days} dodos avant Noël 🎁`,
      'Tu as été sage cette année ? 🎅',
    ],
  };
}

function getGreeting(date: Date, christmas: boolean): { title: string; messages: string[] } {
  if (christmas) return getChristmasGreeting(date);
  const hour = date.getHours();
  return GREETINGS.find((g) => hour >= g.from) ?? GREETINGS[0];
}

interface HomeHeaderProps {
  now: Date;
  onEditEdt: () => void;
  onSettings: () => void;
}

export function HomeHeader({ now, onEditEdt, onSettings }: HomeHeaderProps) {
  const theme = useAppTheme();
  const christmas = useThemeId() === 'noel';
  // tiré une fois : le message ne change pas à chaque rendu
  const [seed] = useState(Math.random);
  const greeting = getGreeting(now, christmas);
  const message = greeting.messages[Math.floor(seed * greeting.messages.length)];

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant="labelLarge" style={{ flex: 1, color: theme.colors.primary }}>
          {formatLongDate(now)}
        </Text>
        <HeaderButton icon="calendar-edit" label="Configurer l'emploi du temps" onPress={onEditEdt} />
        <HeaderButton icon="cog-outline" label="Paramètres" onPress={onSettings} />
      </View>

      <Text variant="displaySmall" style={{ marginTop: 8 }}>
        {greeting.title}
      </Text>
      <Text variant="titleMedium" style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}>
        {message}
      </Text>
    </View>
  );
}
