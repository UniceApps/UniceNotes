import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useRouter } from 'expo-router';
import { IconButton, Text, Tooltip } from 'react-native-paper';

import { useAppTheme } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  // modale : une croix au lieu de la flèche de retour
  modal?: boolean;
  // racine d'un onglet : pas de retour, le titre partage sa ligne avec les actions
  tab?: boolean;
  // HeaderButton à droite
  actions?: ReactNode;
}

export function HeaderButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip title={label}>
      <IconButton
        icon={icon}
        mode="contained-tonal"
        size={20}
        accessibilityLabel={label}
        disabled={disabled}
        style={{ marginHorizontal: 0 }}
        onPress={onPress}
      />
    </Tooltip>
  );
}

export function ScreenHeader({ title, subtitle, modal, tab, actions }: ScreenHeaderProps) {
  const router = useRouter();
  const theme = useAppTheme();

  function goBack() {
    haptics('light');
    // premier écran de la pile si l'app a été ouverte directement ici
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  return (
    <View>
      {tab ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Text variant="headlineLarge" style={{ flex: 1 }}>
            {title}
          </Text>
          {actions}
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <HeaderButton icon={modal ? 'close' : 'arrow-left'} label={modal ? 'Fermer' : 'Retour'} onPress={goBack} />
            <View style={{ flex: 1 }} />
            {actions}
          </View>
          <Text variant="headlineLarge" style={{ marginTop: 12 }}>
            {title}
          </Text>
        </>
      )}
      {subtitle && (
        <Text variant="titleMedium" style={{ marginTop: 2, color: theme.colors.onSurfaceVariant }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
