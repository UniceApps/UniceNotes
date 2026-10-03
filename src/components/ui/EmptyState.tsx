import { View } from 'react-native';

import { Button, Text } from 'react-native-paper';

import { useAppTheme, type Tone } from '@/src/theme';

import { IconBadge } from './IconBadge';

interface EmptyStateProps {
  icon: string;
  title: string;
  text?: string;
  tone?: Tone;
  action?: { label: string; icon: string; onPress: () => void };
}

export function EmptyState({ icon, title, text, tone, action }: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
      <IconBadge icon={icon} tone={tone} size={56} />
      <Text variant="titleMedium" style={{ marginTop: 16, textAlign: 'center' }}>
        {title}
      </Text>
      {text && (
        <Text variant="bodyMedium" style={{ marginTop: 4, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          {text}
        </Text>
      )}
      {action && (
        <Button mode="contained-tonal" icon={action.icon} style={{ marginTop: 16 }} onPress={action.onPress}>
          {action.label}
        </Button>
      )}
    </View>
  );
}
