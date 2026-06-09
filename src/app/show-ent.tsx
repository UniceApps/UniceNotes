import { getChoosenTheme } from '@/src/constants/theme';
import { handleURL } from '@/src/utils/api';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { Appbar, Avatar, Card, Text, Tooltip } from 'react-native-paper';

const apps = [
  {
    label: 'Outlook',
    subtitle: 'Emails',
    icon: 'email-outline',
    image: require('../assets/ent/outlook.png'),
    url: 'https://outlook.office.com/owa/?realm=etu.unice.fr&exsvurl=1&ll-cc=1036&modurl=0',
  },
  {
    label: 'Moodle',
    subtitle: 'Portail LMS',
    icon: 'book-open-variant',
    image: require('../assets/ent/moodle.png'),
    url: 'https://portail-lms.univ-cotedazur.fr',
  },
  {
    label: 'PronoteCampus',
    subtitle: 'Notes',
    icon: 'calculator-variant-outline',
    url: 'https://sco.polytech.unice.fr/1',
  },
  {
    label: 'IUT Notes',
    subtitle: 'Notes',
    icon: 'calculator-variant',
    url: 'https://iut-notes.unice.fr/',
  },
  {
    label: 'Mon dossier Web',
    subtitle: 'Scolarité',
    icon: 'school-outline',
    url: 'https://mondossierweb.univ-cotedazur.fr/',
  },
  {
    label: 'Annuaire UniCA',
    subtitle: 'Contacts',
    icon: 'account-search-outline',
    url: 'https://annuaire.univ-cotedazur.fr',
  },
  {
    label: 'BU',
    subtitle: 'Bibliothèques',
    icon: 'book-open-page-variant-outline',
    url: 'https://bu.univ-cotedazur.fr/',
  },
  {
    label: 'Imprimerie',
    subtitle: 'Impressions',
    icon: 'printer-outline',
    url: 'https://impression.univ-cotedazur.fr/',
  },
  {
    label: 'Alumni UniCA',
    subtitle: 'Anciennement Link',
    icon: 'account-circle-outline',
    url: 'https://link.univ-cotedazur.fr/fr/authentication/index/caslogin?1',
  },
  {
    label: 'Izly',
    subtitle: 'Mon espace',
    icon: 'cash-multiple',
    image: require('../assets/ent/izly.png'),
    url: 'https://mon-espace.izly.fr',
  },
];

export default function ShowENTScreen() {
  const router = useRouter();
  const theme = getChoosenTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header elevated statusBarHeight={Platform.OS === 'ios' ? 0 : undefined}>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => router.back()} />
        </Tooltip>
        <Appbar.Content title="ENT" />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ marginBottom: 12 }} variant="titleMedium">
          Vos applications
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' }}>
          {apps.map((app) => (
            <Card
              key={app.label}
              mode="elevated"
              onPress={() => handleURL(app.url)}
              style={{ width: '46%', marginBottom: 12, backgroundColor: theme.colors.surface }}
            >
              <Card.Content style={{ alignItems: 'center', paddingVertical: 8 }}>
                {app.image ? (
                  <Avatar.Image size={52} source={app.image} style={{ marginBottom: 10 }} />
                ) : (
                  <Avatar.Icon
                    size={52}
                    icon={app.icon}
                    style={{ marginBottom: 10, backgroundColor: theme.colors.primaryContainer }}
                    color={theme.colors.onPrimaryContainer}
                  />
                )}
                <Text style={{ textAlign: 'center' }} variant="titleSmall">
                  {app.label}
                </Text>
                <Text style={{ marginTop: 4, textAlign: 'center', opacity: 0.7 }} variant="bodySmall">
                  {app.subtitle}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
