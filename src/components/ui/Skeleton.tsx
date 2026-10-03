import type { ReactNode } from 'react';
import { View, type DimensionValue } from 'react-native';

import Animated from 'react-native-reanimated';

import { usePulse } from '@/src/hooks/usePulse';
import { useAppTheme } from '@/src/theme';
import { withAlpha } from '@/src/utils/color';

// squelette pendant un chargement : les Bone qu'il contient pulsent ensemble
export function Skeleton({ label, children }: { label: string; children: ReactNode }) {
  const pulse = usePulse(0.4, 800);
  return (
    <Animated.View accessible accessibilityLabel={label} style={pulse}>
      {children}
    </Animated.View>
  );
}

interface BoneProps {
  width: DimensionValue;
  height?: number;
  radius?: number;
  // couleur du texte qu'il remplace
  color?: string;
  marginTop?: number;
}

export function Bone({ width, height = 18, radius = 8, color, marginTop }: BoneProps) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        width,
        height,
        marginTop,
        borderRadius: radius,
        backgroundColor: withAlpha(color ?? theme.colors.onSurface, 0.12),
      }}
    />
  );
}
