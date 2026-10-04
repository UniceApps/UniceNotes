import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Button, Icon, Text } from 'react-native-paper';

import { IconBadge } from '@/src/components/ui/IconBadge';
import { Sheet } from '@/src/components/ui/Sheet';
import { APP_VERSION, IS_BETA, LINKS, RELEASE_NOTES } from '@/src/constants/config';
import { fetchApiStatus, isUpdateAvailable } from '@/src/services/uniceapi';
import { useAppTheme } from '@/src/theme';
import { openURL } from '@/src/utils/browser';
import { storage } from '@/src/utils/storage';

type Announcement =
  | { kind: 'alert'; title: string; message: string }
  | { kind: 'update'; version: string }
  | { kind: 'release' };

// laisse l'accueil apparaître avant la première annonce
const OPEN_DELAY_MS = 1200;

async function loadAnnouncements(): Promise<Announcement[]> {
  const [seenVersion, status] = await Promise.all([storage.get('releaseNotesVersion'), fetchApiStatus()]);
  const queue: Announcement[] = [];
  if (status?.alert) queue.push({ kind: 'alert', ...status.alert });
  if (!IS_BETA && status?.version && isUpdateAvailable(APP_VERSION, status.version)) {
    queue.push({ kind: 'update', version: status.version });
  }
  if (seenVersion !== APP_VERSION) queue.push({ kind: 'release' });
  return queue;
}

// alerte de l'API, mise à jour disponible puis nouveautés : une feuille à la fois
export function AnnouncementSheet() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [queue, setQueue] = useState<Announcement[]>([]);
  const current = queue[0];

  useEffect(() => {
    let cancelled = false;
    loadAnnouncements().then((announcements) => {
      if (!cancelled) setQueue(announcements);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => {
      if (current.kind === 'release') storage.set('releaseNotesVersion', APP_VERSION);
      sheetRef.current?.present();
    }, OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [current]);

  const close = () => sheetRef.current?.dismiss();

  return (
    <Sheet sheetRef={sheetRef} onClose={() => setQueue((items) => items.slice(1))}>
      {current?.kind === 'alert' && (
        <Content icon="bullhorn-outline" title={current.title} text={current.message}>
          <Button mode="contained" icon="check" onPress={close}>
            Compris
          </Button>
        </Content>
      )}

      {current?.kind === 'update' && (
        <Content
          icon="download-outline"
          title="Mise à jour disponible"
          text={`UniceNotes ${current.version} est disponible : mets à jour l'application pour profiter des dernières nouveautés et corrections.`}
        >
          <Button mode="contained" icon="download" onPress={() => openURL(LINKS.download)}>
            Mettre à jour
          </Button>
          <Button mode="contained-tonal" onPress={close}>
            Plus tard
          </Button>
        </Content>
      )}

      {current?.kind === 'release' && (
        <Content icon="party-popper" title={RELEASE_NOTES.title}>
          <View style={{ gap: 12, marginBottom: 8 }}>
            {RELEASE_NOTES.items.map((item) => (
              <ReleaseItem key={item.text} {...item} />
            ))}
          </View>
          <Button mode="contained" icon="check" onPress={close}>
            Merci !
          </Button>
        </Content>
      )}
    </Sheet>
  );
}

function Content({ icon, title, text, children }: { icon: string; title: string; text?: string; children: ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={{ gap: 8 }}>
      <IconBadge icon={icon} size={48} />
      <Text variant="headlineSmall" style={{ marginTop: 8 }}>
        {title}
      </Text>
      {text && (
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
          {text}
        </Text>
      )}
      <View style={{ gap: 8, marginTop: 8 }}>{children}</View>
    </View>
  );
}

function ReleaseItem({ icon, text }: { icon: string; text: string }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Icon source={icon} size={22} color={theme.colors.primary} />
      <Text variant="bodyLarge" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}
