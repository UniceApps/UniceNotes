import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/src/theme';

import { PressableScale } from './PressableScale';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  // false : contenu collé aux bords (listes)
  padded?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Card({ children, style, padded = true, onPress, accessibilityLabel, accessibilityHint }: CardProps) {
  const theme = useAppTheme();
  const cardStyle = [
    {
      borderRadius: 24,
      overflow: 'hidden',
      padding: padded ? 16 : 0,
      backgroundColor: theme.colors.elevation.level2,
    } as const,
    style,
  ];

  if (!onPress) {
    return (
      <View style={cardStyle} accessibilityLabel={accessibilityLabel}>
        {children}
      </View>
    );
  }
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={cardStyle}
      onPress={onPress}
    >
      {children}
    </PressableScale>
  );
}
