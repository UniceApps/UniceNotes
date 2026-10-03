import { View } from 'react-native';

import { Icon, Text } from 'react-native-paper';

interface InfoLineProps {
  icon: string;
  text: string;
  color: string;
  variant?: 'titleMedium' | 'bodyLarge';
  numberOfLines?: number;
}

// icône + texte aligné sur la première ligne
export function InfoLine({ icon, text, color, variant = 'titleMedium', numberOfLines = 2 }: InfoLineProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ marginTop: 3 }}>
        <Icon source={icon} size={18} color={color} />
      </View>
      <Text variant={variant} numberOfLines={numberOfLines} style={{ color, flexShrink: 1 }}>
        {text}
      </Text>
    </View>
  );
}
