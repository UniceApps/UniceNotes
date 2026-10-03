import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ActivityIndicator, Button, Icon, Text } from 'react-native-paper';

import { ListGroup, ListItem } from '@/src/components/ui/ListGroup';
import { Screen } from '@/src/components/ui/Screen';
import { checkServer, SERVERS } from '@/src/services/servers';
import { getStatusColors, useAppTheme } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';

// temps de réponse par URL : null hors ligne, absent pendant le test
type Results = Record<string, number | null>;

export default function ServersScreen() {
  const theme = useAppTheme();
  const [results, setResults] = useState<Results>({});
  const [run, setRun] = useState(0);
  const testing = SERVERS.some((server) => !(server.url in results));

  useEffect(() => {
    let cancelled = false;
    for (const server of SERVERS) {
      checkServer(server.url).then((latency) => {
        if (!cancelled) setResults((current) => ({ ...current, [server.url]: latency }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [run]);

  function retry() {
    haptics('medium');
    setResults({});
    setRun((n) => n + 1);
  }

  return (
    <Screen modal title="Serveurs" subtitle="État des services de l'université">
      <ListGroup>
        {SERVERS.map((server) => (
          <ListItem
            key={server.url}
            icon={server.icon}
            title={server.name}
            subtitle={server.description}
            right={<ServerStatus latency={results[server.url]} />}
          />
        ))}
      </ListGroup>

      <View style={{ gap: 12 }}>
        <Button mode="contained-tonal" icon="refresh" loading={testing} disabled={testing} onPress={retry}>
          {testing ? 'Test en cours…' : 'Relancer le test'}
        </Button>
        <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          Si un serveur ne répond pas, le problème vient sûrement de l&apos;université : réessaie plus tard.
        </Text>
      </View>
    </Screen>
  );
}

function ServerStatus({ latency }: { latency: number | null | undefined }) {
  const theme = useAppTheme();
  const colors = getStatusColors(theme);

  if (latency === undefined) return <ActivityIndicator size={20} />;

  const online = latency !== null;
  const color = online ? colors.free : colors.busy;
  return (
    <View
      accessible
      accessibilityLabel={online ? `En ligne, ${latency} millisecondes` : 'Hors ligne'}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
    >
      <Icon source={online ? 'check-circle' : 'close-circle'} size={20} color={color} />
      <Text variant="labelLarge" style={{ color }}>
        {online ? `${latency} ms` : 'Hors ligne'}
      </Text>
    </View>
  );
}
