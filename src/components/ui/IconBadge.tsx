import { View } from 'react-native';

import { Icon } from 'react-native-paper';

import { getToneColors, useAppTheme, type Tone } from '@/src/theme';

interface IconBadgeProps {
  icon: string;
  tone?: Tone;
  size?: number;
  // couleur pleine au lieu du conteneur tonal
  filled?: boolean;
}

export function IconBadge({ icon, tone = 'primary', size = 44, filled = false }: IconBadgeProps) {
  const theme = useAppTheme();
  const colors = getToneColors(theme, tone);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: filled ? colors.accent : colors.container,
      }}
    >
      <Icon source={icon} size={size * 0.55} color={filled ? colors.onAccent : colors.onContainer} />
    </View>
  );
}
