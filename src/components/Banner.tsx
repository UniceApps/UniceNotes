import React from 'react';
import { View } from 'react-native';

import { Button, Icon, Text } from 'react-native-paper';

interface BannerProps {
  icon: string;
  text: string;
  background: string;
  foreground: string;
  alert?: boolean;
  action?: { label: string; onPress: () => void };
}

// bandeau d'information pleine largeur sous l'en-tête
export function Banner({ icon, text, background, foreground, alert, action }: BannerProps) {
  return (
    <View
      accessibilityRole={alert ? 'alert' : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: background,
      }}
    >
      <Icon source={icon} size={18} color={foreground} />
      <Text variant="labelLarge" style={{ color: foreground, flexShrink: 1 }}>
        {text}
      </Text>
      {action && (
        <Button compact textColor={foreground} onPress={action.onPress}>
          {action.label}
        </Button>
      )}
    </View>
  );
}
