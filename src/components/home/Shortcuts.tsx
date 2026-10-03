import React from 'react';
import { View } from 'react-native';

import { Icon, Text } from 'react-native-paper';

import { useChoosenTheme, type AppTheme } from '@/src/constants/theme';

import { PressableScale } from './PressableScale';
import { SectionTitle } from './SectionTitle';

export interface Shortcut {
  key: string;
  icon: string;
  label: string;
  subtitle: string;
  tone: 'primary' | 'secondary' | 'tertiary';
  onPress: () => void;
}

function toneColors(theme: AppTheme, tone: Shortcut['tone']): [container: string, onContainer: string] {
  const c = theme.colors;
  if (tone === 'secondary') return [c.secondaryContainer, c.onSecondaryContainer];
  if (tone === 'tertiary') return [c.tertiaryContainer, c.onTertiaryContainer];
  return [c.primaryContainer, c.onPrimaryContainer];
}

// grille de tuiles, deux par ligne
export function Shortcuts({ items }: { items: Shortcut[] }) {
  const theme = useChoosenTheme();

  return (
    <View>
      <SectionTitle title="Accès rapide" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {items.map((item) => {
          const [container, onContainer] = toneColors(theme, item.tone);
          return (
            <PressableScale
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}, ${item.subtitle}`}
              style={{
                flexGrow: 1,
                flexBasis: '40%',
                borderRadius: 24,
                padding: 16,
                backgroundColor: theme.colors.elevation.level2,
              }}
              onPress={item.onPress}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: container,
                }}
              >
                <Icon source={item.icon} size={24} color={onContainer} />
              </View>
              <Text variant="titleMedium" numberOfLines={1} style={{ marginTop: 14 }}>
                {item.label}
              </Text>
              <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                {item.subtitle}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
