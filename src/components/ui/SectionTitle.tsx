import { View } from 'react-native';

import { Text } from 'react-native-paper';

import { useAppTheme } from '@/src/theme';

export function SectionTitle({ title, aside }: { title: string; aside?: string }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 10, paddingHorizontal: 4 }}>
      <Text variant="titleMedium" style={{ flex: 1 }}>
        {title}
      </Text>
      {aside && (
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {aside}
        </Text>
      )}
    </View>
  );
}
