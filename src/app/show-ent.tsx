import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Appbar, Card, Avatar, Chip, Tooltip } from 'react-native-paper';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { getChoosenTheme } from '@/src/constants/theme';
import { handleURL } from '@/src/utils/api';

export default function ShowENTScreen() {
  const router = useRouter();
  const theme = getChoosenTheme();

  const chipStyle = {
    height: 48,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' }}>
      <Appbar.Header elevated statusBarHeight={0}>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => router.back()} />
        </Tooltip>
        <Appbar.Content title="ENT" />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">
          Choisissez votre application :
        </Text>

        <Chip
          style={{ ...chipStyle, marginTop: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/ent/outlook.png')} />}
          onPress={() => handleURL('https://outlook.office.com/owa/?realm=etu.unice.fr&exsvurl=1&ll-cc=1036&modurl=0')}
        >
          Outlook (Emails)
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/ent/moodle.png')} />}
          onPress={() => handleURL('https://portail-lms.univ-cotedazur.fr')}
        >
          Moodle (LMS)
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          icon="school"
          onPress={() => handleURL('https://mondossierweb.univ-cotedazur.fr/')}
        >
          Mon dossier Web
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          icon="account-search"
          onPress={() => handleURL('https://annuaire.univ-cotedazur.fr')}
        >
          Annuaire UniCA
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          icon="book"
          onPress={() => handleURL('https://dsi-extra.unice.fr/BU/Etudiant/index.html')}
        >
          Bibliothèques Universitaires
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          icon="printer"
          onPress={() => handleURL('https://dsi-extra.unice.fr/repro/index.html')}
        >
          Imprimer à la BU
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          icon="account"
          onPress={() => handleURL('https://link.univ-cotedazur.fr/fr/authentication/index/caslogin?1')}
        >
          Link UCA
        </Chip>
        <Chip
          style={{ ...chipStyle, borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/ent/izly.png')} />}
          onPress={() => handleURL('https://mon-espace.izly.fr')}
        >
          Mon Espace Izly
        </Chip>

        <Card style={{ marginTop: 16 }}>
          <Card.Title left={(props) => <Avatar.Icon {...props} icon="information" />} title />
          <Card.Content>
            <Text style={{ textAlign: 'left' }} variant="bodyLarge">
              Les applications ne sont pas compatibles avec UniceNotes et seront ouvertes avec un
              navigateur externe.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}
