import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import {
  Text,
  Button,
  Appbar,
  Chip,
  Tooltip,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getChoosenTheme } from '@/src/constants/theme';

export default function ServerConfigScreen() {
  const router = useRouter();
  const theme = getChoosenTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [statusPronote, setStatusPronote] = useState('timer-sand');
  const [statusDW, setStatusDW] = useState('timer-sand');
  const [statusADE, setStatusADE] = useState('timer-sand');
  const [statusLoginUniCA, setStatusLoginUniCA] = useState('timer-sand');

  async function startTest() {
    setLoading(true);

    const check = async (url: string, setter: (v: string) => void, okStatuses: number[] = [200]) => {
      try {
        const res = await fetch(url);
        setter(okStatuses.includes(res.status) ? 'check' : 'close');
      } catch {
        setter('close');
      }
    };

    await check('https://sco.polytech.unice.fr/1', setStatusPronote, [200, 301, 302]);
    await check('https://mondossierweb.univ-cotedazur.fr', setStatusDW, [200, 301, 302]);
    await check('https://edtweb.univ-cotedazur.fr', setStatusADE, [200, 301, 302]);
    await check('https://login.univ-cotedazur.fr', setStatusLoginUniCA);

    setLoading(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' }}>
      <Appbar.Header elevated statusBarHeight={0}>
        <Tooltip title="Retour">
          <Appbar.BackAction onPress={() => router.back()} />
        </Tooltip>
        <Appbar.Content title="Serveurs" />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Text style={{ marginTop: 16, marginBottom: 16, textAlign: 'left' }} variant="titleMedium">
          Status des serveurs Université :
        </Text>

        <Button mode="contained-tonal" onPress={startTest} loading={loading}>
          Démarrer test serveurs
        </Button>

        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleSmall">
          Si ces serveurs ne répondent pas, c&apos;est sûrement de la faute de l&apos;Université
        </Text>
        <Chip
          style={{ height: 48, justifyContent: 'center', marginTop: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          mode="outlined"
          icon={statusPronote}
          disabled
        >
          Serveur PronoteCampus
        </Chip>
        <Chip
          style={{ height: 48, justifyContent: 'center', borderRadius: 0 }}
          mode="outlined"
          icon={statusDW}
          disabled
        >
          Serveur Mon Dossier Web (Notes)
        </Chip>
        <Chip
          style={{ height: 48, justifyContent: 'center', borderRadius: 0 }}
          mode="outlined"
          icon={statusADE}
          disabled
        >
          Serveur ADE (Emploi du temps)
        </Chip>
        <Chip
          style={{ height: 48, justifyContent: 'center', borderTopLeftRadius: 0, borderTopRightRadius: 0, marginBottom: insets.bottom }}
          mode="outlined"
          icon={statusLoginUniCA}
          disabled
        >
          Serveur Login UniCA (Connexion)
        </Chip>
      </ScrollView>
    </View>
  );
}
