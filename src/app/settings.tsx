import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button, Switch, Text } from 'react-native-paper';

import { ListGroup, ListItem } from '@/src/components/ui/ListGroup';
import { Screen } from '@/src/components/ui/Screen';
import { SectionTitle } from '@/src/components/ui/SectionTitle';
import { Watermark } from '@/src/components/ui/Watermark';
import { APP_VERSION, BUILD_COMMIT, IS_BETA, LINKS } from '@/src/constants/config';
import { useSettings } from '@/src/context/SettingsContext';
import { clearWebSession } from '@/src/services/webSession';
import { LIVE_ACTIVITIES_SUPPORTED } from '@/src/services/widgets';
import { useAppTheme } from '@/src/theme';
import { openURL } from '@/src/utils/browser';
import { haptics } from '@/src/utils/haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const settings = useSettings();
  const [webSignedOut, setWebSignedOut] = useState(false);

  function navigate(href: '/appearance' | '/servers' | '/edt-config') {
    haptics('light');
    router.push(href);
  }

  function toggleHaptics(on: boolean) {
    settings.setHaptics(on);
    haptics('selection');
  }

  function toggleLiveActivities(on: boolean) {
    haptics('selection');
    settings.setLiveActivities(on);
  }

  // repart de zéro : la configuration initiale devient le seul écran de la pile
  function restartFromOobe() {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/oobe');
  }

  function restartOobe() {
    haptics('medium');
    settings.setOobeCompleted(false);
    restartFromOobe();
  }

  // cookies et données des pages de l'ENT ouvertes dans l'application
  function signOutWeb() {
    haptics('warning');
    Alert.alert(
      'Se déconnecter partout',
      "Tu devras te reconnecter à Moodle, Outlook, PronoteCampus… la prochaine fois que tu les ouvriras dans l'application.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            if (await clearWebSession()) {
              haptics('success');
              setWebSignedOut(true);
            } else {
              haptics('error');
              Alert.alert('Déconnexion impossible', 'Réessaie dans un instant.');
            }
          },
        },
      ],
    );
  }

  function deleteAllData() {
    haptics('warning');
    Alert.alert(
      'Supprimer mes données',
      "Ton emploi du temps, tes favoris, tes connexions aux services de l'ENT et tes réglages seront effacés de l'appareil. Cette action est irréversible.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await settings.clearAllData();
            haptics('success');
            restartFromOobe();
          },
        },
      ],
    );
  }

  return (
    <Screen title="Paramètres">
      <AboutCard />

      <View>
        <SectionTitle title="Préférences" />
        <ListGroup>
          <ListItem
            icon="calendar-edit"
            title="Emploi du temps"
            subtitle={settings.adeid ? `EDT ${settings.adeid}` : 'Non configuré'}
            onPress={() => navigate('/edt-config')}
          />
          <ListItem
            icon="palette-outline"
            tone="tertiary"
            title="Apparence"
            subtitle="Thème et icône de l'application"
            onPress={() => navigate('/appearance')}
          />
          <ListItem
            icon="vibrate"
            tone="secondary"
            title="Retours haptiques"
            subtitle="Vibrations au toucher"
            onPress={() => toggleHaptics(!settings.haptics)}
            right={<Switch value={settings.haptics} onValueChange={toggleHaptics} />}
          />
          {LIVE_ACTIVITIES_SUPPORTED && (
            <ListItem
              icon="cellphone-information"
              tone="secondary"
              title="Live Activity"
              subtitle="Ton cours sur l'écran verrouillé"
              onPress={() => toggleLiveActivities(!settings.liveActivities)}
              right={<Switch value={settings.liveActivities} onValueChange={toggleLiveActivities} />}
            />
          )}
        </ListGroup>
      </View>

      <View>
        <SectionTitle title="Services de l'ENT" />
        <ListGroup>
          <ListItem
            icon={webSignedOut ? 'check' : 'logout'}
            tone="secondary"
            title={webSignedOut ? 'Déconnecté' : 'Se déconnecter partout'}
            subtitle={webSignedOut ? 'Reconnexion à la prochaine ouverture' : "Tes connexions restent sur l'appareil"}
            right={null}
            disabled={webSignedOut}
            onPress={signOutWeb}
          />
        </ListGroup>
      </View>

      <View>
        <SectionTitle title="Aide" />
        <ListGroup>
          <ListItem
            icon="help-circle-outline"
            title="F.A.Q. / Signaler un bug"
            external
            onPress={() => openURL(LINKS.support)}
          />
          <ListItem
            icon="server-network"
            tone="tertiary"
            title="État des serveurs"
            subtitle="ADE, PronoteCampus…"
            onPress={() => navigate('/servers')}
          />
          <ListItem icon="replay" tone="secondary" title="Relancer la configuration initiale" onPress={restartOobe} />
        </ListGroup>
      </View>

      <View>
        <SectionTitle title="À propos" />
        <ListGroup>
          <ListItem icon="license" title="Mentions légales" external onPress={() => openURL(LINKS.credits)} />
          <ListItem
            icon="shield-account-outline"
            title="Politique de confidentialité"
            external
            onPress={() => openURL(LINKS.privacy)}
          />
          <ListItem
            icon="source-branch"
            title="Code source"
            subtitle="UniceApps/UniceNotes"
            external
            onPress={() => openURL(LINKS.source)}
          />
          <ListItem
            icon="heart-outline"
            tone="tertiary"
            title="Fièrement développé par un SI"
            subtitle="@hugofnm"
            external
            onPress={() => openURL(LINKS.author)}
          />
        </ListGroup>
      </View>

      <ListGroup>
        <ListItem icon="delete-outline" tone="error" title="Supprimer mes données" onPress={deleteAllData} />
      </ListGroup>

      <View style={{ gap: 8 }}>
        <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          UniceNotes n&apos;est lié d&apos;aucune façon à l&apos;Université Côte d&apos;Azur, Polytech Nice Sophia ou à
          l&apos;IUT Nice Côte d&apos;Azur. Tout usage de l&apos;application relève de la seule responsabilité de
          l&apos;utilisateur, comme prévu dans les conditions d&apos;utilisation.
        </Text>
        <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          © {new Date().getFullYear()} MetrixMedia / hugofnm{BUILD_COMMIT ? ` · ${BUILD_COMMIT.slice(0, 7)}` : ''}
        </Text>
        {IS_BETA && (
          <Button
            icon="bug"
            onPress={() => {
              throw new Error('This is a crash');
            }}
          >
            crash_app
          </Button>
        )}
      </View>
    </Screen>
  );
}

function AboutCard() {
  const theme = useAppTheme();
  const c = theme.colors;

  return (
    <View style={{ borderRadius: 28, padding: 20, overflow: 'hidden', backgroundColor: c.primaryContainer }}>
      <Watermark color={c.onPrimaryContainer} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Image source={require('../assets/icon.png')} style={{ width: 64, height: 64, borderRadius: 16 }} />
        <View style={{ flex: 1 }}>
          <Text variant="headlineSmall" style={{ color: c.onPrimaryContainer }}>
            UniceNotes
          </Text>
          <Text variant="bodyLarge" style={{ color: c.onPrimaryContainer, opacity: 0.85 }}>
            Ton ENT. Dans ta poche.
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: c.primary }}>
          <Text variant="labelLarge" style={{ color: c.onPrimary }}>
            Version {APP_VERSION}
          </Text>
        </View>
        <Text variant="labelLarge" style={{ flex: 1, color: c.onPrimaryContainer }}>
          Merci de l&apos;utiliser :)
        </Text>
      </View>
    </View>
  );
}
