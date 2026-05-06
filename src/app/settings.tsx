import React from 'react';
import { View, ScrollView } from 'react-native';
import {
  Text,
  Button,
  Appbar,
  Card,
  Avatar,
  Divider,
  Tooltip,
} from 'react-native-paper';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useApp } from '@/src/context/AppContext';
import { getChoosenTheme } from '@/src/constants/theme';
import { APP_VERSION, IS_BETA } from '@/src/constants/config';
import { haptics } from '@/src/utils/haptics';
import { saveAsync } from '@/src/utils/storage';
import { handleURL } from '@/src/utils/api';

export default function ShowSettingsScreen() {
  const router = useRouter();
  const { hapticsOn, setHapticsOn, clearAllData } = useApp();
  const theme = getChoosenTheme();

  const hash = Constants.expoConfig?.extra?.github_hash as string | undefined;

  function goBack() {
    haptics('medium');
    router.back();
  }

  function whatHapticMode(value: 'ON' | 'OFF'): 'contained' | 'contained-tonal' {
    if (hapticsOn && value === 'ON') return 'contained';
    if (!hapticsOn && value === 'OFF') return 'contained';
    return 'contained-tonal';
  }

  function setHapticsBool(value: boolean) {
    setHapticsOn(value);
    saveAsync('haptics', value.toString());
    haptics('error');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' }}>
      <Appbar.Header elevated>
        <Tooltip title="Retour">
          <Appbar.BackAction onPress={goBack} />
        </Tooltip>
        <Appbar.Content title="Paramètres" />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Button
          style={{ marginTop: 16 }}
          icon="bug"
          mode="contained-tonal"
          onPress={() => handleURL('https://notes.metrixmedia.fr/support')}
        >
          F.A.Q. / Signaler un bug
        </Button>

        <Divider style={{ marginTop: 16 }} />

        <Card style={{ marginTop: 16 }}>
          <Card.Title
            title="Sélection de l'icône"
            subtitle="Changez l'icône de l'application"
            left={(props) => <Avatar.Icon {...props} icon="shape-square-rounded-plus" />}
          />
          <Card.Actions>
            <Button mode="contained-tonal" onPress={() => router.push('/icon-config')}>
              Choisir
            </Button>
          </Card.Actions>
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Card.Title
            title="Retours haptiques"
            subtitle="Activer/désactiver les vibrations"
            left={(props) => <Avatar.Icon {...props} icon="vibrate" />}
          />
          <Card.Actions>
            <Button mode={whatHapticMode('ON')} onPress={() => setHapticsBool(true)}>
              Activer
            </Button>
            <Button mode={whatHapticMode('OFF')} onPress={() => setHapticsBool(false)}>
              Désactiver
            </Button>
          </Card.Actions>
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Card.Title
            title="Serveurs Université"
            subtitle="Diagnostic des serveurs UniCA"
            left={(props) => <Avatar.Icon {...props} icon="server-network" />}
          />
          <Card.Actions>
            <Button mode="contained-tonal" onPress={() => router.push('/server-config')}>
              Accéder
            </Button>
          </Card.Actions>
        </Card>

        <Divider style={{ marginTop: 16 }} />

        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">
          UniceNotes
        </Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">
          Votre ENT. Dans votre poche.
        </Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">
          © {new Date().getFullYear()} - MetrixMedia / hugofnm
        </Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">
          Merci d&apos;avoir téléchargé UniceNotes :)
        </Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">
          ⚡ Version : {APP_VERSION}
        </Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">
          ❤️ Fièrement développé par un SI3 :{' '}
          <Text
            style={{ color: theme.colors.primary }}
            onPress={() => handleURL('https://github.com/hugofnm')}
          >
            @hugofnm
          </Text>
        </Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">
          🛠️ Hash local du commit Git : {hash ?? 'N/A'}
        </Text>

        <Card style={{ marginTop: 16 }}>
          <Card.Title left={(props) => <Avatar.Icon {...props} icon="alert" />} title />
          <Card.Content>
            <Text style={{ textAlign: 'left' }} variant="bodyMedium">
              UniceNotes n&apos;est lié d&apos;aucune forme à l&apos;Université Côte d&apos;Azur, Polytech Nice Sophia Antipolis ou à l&apos;I.U.T. de Nice
              Côte d&apos;Azur.
            </Text>
            <Text style={{ textAlign: 'left' }} variant="titleSmall">
              Tout usage de cette application implique la seule responsabilité de l&apos;utilisateur comme
              prévue dans les conditions d&apos;utilisation.
            </Text>
          </Card.Content>
        </Card>

        <Button
          style={{ marginTop: 16 }}
          icon="license"
          onPress={() => handleURL('https://notes.metrixmedia.fr/credits')}
        >
          Mentions légales
        </Button>
        <Button
          style={{ marginTop: 4 }}
          icon="account-child-circle"
          onPress={() => handleURL('https://notes.metrixmedia.fr/privacy')}
        >
          Politique de confidentialité
        </Button>
        <Button
          style={{ marginTop: 4 }}
          icon="source-branch"
          onPress={() => handleURL('https://github.com/UniceApps/UniceNotes')}
        >
          Code source
        </Button>
        <Button
          style={{ marginTop: 4 }}
          icon="account-remove"
          onPress={() =>
            clearAllData().then(() => {
              haptics('success');
              throw new Error('Data deletion forced');
            })
          }
        >
          Forcer la suppression de données
        </Button>

        {IS_BETA && (
          <Button style={{ marginTop: 4 }} icon="bug" onPress={() => { throw new Error('This is a crash'); }}>
            crash_app
          </Button>
        )}

        <Divider style={{ marginTop: 32, marginBottom: 8 }} />
      </ScrollView>
    </View>
  );
}
