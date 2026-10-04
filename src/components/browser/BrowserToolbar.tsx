import { StyleSheet, View } from 'react-native';

import { IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/src/theme';

// hauteur sans la zone du geste d'accueil
export const BROWSER_TOOLBAR_HEIGHT = 52;

interface BrowserToolbarProps {
  appLabel: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
  onReload: () => void;
  onStop: () => void;
}

export function BrowserToolbar({
  appLabel,
  canGoBack,
  canGoForward,
  loading,
  onBack,
  onForward,
  onHome,
  onReload,
  onStop,
}: BrowserToolbarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        height: BROWSER_TOOLBAR_HEIGHT + insets.bottom,
        paddingBottom: insets.bottom,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: theme.colors.elevation.level2,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.outlineVariant,
      }}
    >
      <IconButton icon="chevron-left" disabled={!canGoBack} accessibilityLabel="Page précédente" onPress={onBack} />
      <IconButton
        icon="chevron-right"
        disabled={!canGoForward}
        accessibilityLabel="Page suivante"
        onPress={onForward}
      />
      <IconButton icon="home-outline" accessibilityLabel={`Accueil de ${appLabel}`} onPress={onHome} />
      <IconButton
        icon={loading ? 'close' : 'refresh'}
        accessibilityLabel={loading ? 'Arrêter le chargement' : 'Actualiser'}
        onPress={loading ? onStop : onReload}
      />
    </View>
  );
}
