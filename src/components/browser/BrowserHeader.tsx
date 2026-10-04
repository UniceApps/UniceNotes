import { useState } from 'react';
import { View } from 'react-native';

import { Icon, Menu, ProgressBar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntAppIcon } from '@/src/components/ent/EntAppIcon';
import { HeaderButton } from '@/src/components/ui/ScreenHeader';
import type { EntApp } from '@/src/constants/ent';
import { useAppTheme } from '@/src/theme';
import { getHost, isSecureUrl } from '@/src/utils/browser';
import { haptics } from '@/src/utils/haptics';

interface BrowserHeaderProps {
  app: EntApp;
  title: string;
  url: string;
  loading: boolean;
  progress: number;
  pinned: boolean;
  onClose: () => void;
  onTogglePin: () => void;
  onShare: () => void;
  onOpenExternally: () => void;
}

export function BrowserHeader({
  app,
  title,
  url,
  loading,
  progress,
  pinned,
  onClose,
  onTogglePin,
  onShare,
  onOpenExternally,
}: BrowserHeaderProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const c = theme.colors;
  const secure = isSecureUrl(url);
  const host = getHost(url);

  function openMenu() {
    haptics('light');
    setMenuVisible(true);
  }

  // le menu se ferme avant de lancer l'action
  function menuAction(action: () => void) {
    setMenuVisible(false);
    action();
  }

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: c.elevation.level2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
        <HeaderButton icon="close" label="Fermer" onPress={onClose} />
        <EntAppIcon app={app} size={32} />
        <View
          accessible
          accessibilityLabel={`${title}, ${secure ? 'connexion sécurisée' : 'connexion non sécurisée'}, ${host}`}
          style={{ flex: 1 }}
        >
          <Text variant="titleMedium" numberOfLines={1}>
            {title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon
              source={secure ? 'lock' : 'lock-open-variant-outline'}
              size={12}
              color={secure ? c.onSurfaceVariant : c.error}
            />
            <Text variant="bodySmall" numberOfLines={1} style={{ flexShrink: 1, color: c.onSurfaceVariant }}>
              {host}
            </Text>
          </View>
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<HeaderButton icon="dots-vertical" label="Options" onPress={openMenu} />}
        >
          <Menu.Item
            leadingIcon={pinned ? 'pin-off-outline' : 'pin-outline'}
            title={pinned ? "Retirer de l'accès rapide" : "Épingler à l'accès rapide"}
            onPress={() => menuAction(onTogglePin)}
          />
          <Menu.Item leadingIcon="share-variant-outline" title="Partager le lien" onPress={() => menuAction(onShare)} />
          <Menu.Item
            leadingIcon="open-in-new"
            title="Ouvrir dans le navigateur"
            onPress={() => menuAction(onOpenExternally)}
          />
        </Menu>
      </View>
      <ProgressBar progress={progress} visible={loading} color={c.primary} style={{ backgroundColor: 'transparent' }} />
    </View>
  );
}
