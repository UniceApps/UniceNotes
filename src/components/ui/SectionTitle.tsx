import { Pressable, View } from 'react-native';

import { Text } from 'react-native-paper';

import { useAppTheme } from '@/src/theme';

interface SectionTitleProps {
  title: string;
  aside?: string;
  // aside devient un lien
  onPressAside?: () => void;
}

export function SectionTitle({ title, aside, onPressAside }: SectionTitleProps) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 10, paddingHorizontal: 4 }}>
      <Text variant="titleMedium" style={{ flex: 1 }}>
        {title}
      </Text>
      {aside && onPressAside && (
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onPressAside}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            {aside}
          </Text>
        </Pressable>
      )}
      {aside && !onPressAside && (
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {aside}
        </Text>
      )}
    </View>
  );
}
