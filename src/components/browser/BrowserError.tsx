import { StyleSheet, View } from 'react-native';

import { Text } from 'react-native-paper';

import { EmptyState } from '@/src/components/ui/EmptyState';
import { useAppTheme } from '@/src/theme';

interface BrowserErrorProps {
  code: number;
  description: string;
  onRetry: () => void;
}

// page qui n'a pas pu être chargée (réseau coupé, serveur de l'université en panne…)
export function BrowserError({ code, description, onRetry }: BrowserErrorProps) {
  const theme = useAppTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        StyleSheet.absoluteFill,
        { justifyContent: 'center', padding: 24, backgroundColor: theme.colors.background },
      ]}
    >
      <EmptyState
        tone="error"
        icon="web-off"
        title="Page indisponible"
        text="Vérifie ta connexion internet ou réessaie dans quelques instants : le serveur de l'université ne répond peut-être pas."
        action={{ label: 'Réessayer', icon: 'refresh', onPress: onRetry }}
      />
      <Text variant="bodySmall" numberOfLines={2} style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
        {description ? `${description} (${code})` : `Erreur ${code}`}
      </Text>
    </View>
  );
}
