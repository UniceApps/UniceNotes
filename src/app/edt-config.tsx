import React, { useState } from 'react';
import { View, ScrollView, Alert, Platform } from 'react-native';
import {
  Text,
  Appbar,
  Card,
  Divider,
  Avatar,
  TextInput,
  SegmentedButtons,
  Searchbar,
  Tooltip,
  Button,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useApp } from '@/src/context/AppContext';
import { useChoosenTheme } from '@/src/constants/theme';
import { haptics } from '@/src/utils/haptics';
import { saveSecure } from '@/src/utils/storage';
import { stringToColour } from '@/src/utils/color';
import type { SearchResult } from '@/src/types';

export default function EDTConfigScreen() {
  const router = useRouter();
  const { adeid, setAdeid } = useApp();
  const theme = useChoosenTheme();

  const [mode, setMode] = useState(adeid?.includes('-VET') ? '1' : '0');
  const [tempAde, setTempAde] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function searchCursus(value: string) {
    setLoading(true);
    setSearchValue(value);
    if (value.length >= 2) {
      try {
        const res = await fetch(
          'https://ade-consult.univ-cotedazur.fr/?action=search-vet&term=' + value,
        );
        if (res.status === 200) {
          const data = (await res.json()) as { results: SearchResult[] };
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([{ id: 'demo', text: 'Erreur, veuillez vérifier votre connexion.' }]);
      }
    }
    setLoading(false);
  }

  function selectCursus(value: string, individual = false) {
    if (!value || value === 'demo') {
      Alert.alert('Erreur', 'Entrée invalide.');
      return;
    }
    const newAdeid = individual ? value : value + '-VET';
    setAdeid(newAdeid);
    saveSecure('adeid', newAdeid);
    haptics('heavy');
    router.replace('/home');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' }}>
      <Appbar.Header elevated statusBarHeight={Platform.OS === 'ios' ? 0 : undefined}>
        <Tooltip title="Retour">
          <Appbar.BackAction onPress={() => router.back()} />
        </Tooltip>
        <Appbar.Content title="Config. EDT" />
      </Appbar.Header>

      <SegmentedButtons
        style={{ marginLeft: 20, marginRight: 20, marginTop: 16, marginBottom: 8 }}
        value={mode}
        onValueChange={setMode}
        buttons={[
          { value: '0', label: 'Individuel', icon: 'account', showSelectedCheck: true },
          { value: '1', label: 'Cursus', icon: 'account-group', showSelectedCheck: true },
        ]}
      />

      {mode === '0' ? (
        <ScrollView style={{ paddingLeft: 25, paddingRight: 25, marginBottom: 16 }}>
          <Text style={{ marginTop: 8, marginBottom: 8, textAlign: 'left' }} variant="titleMedium">
            EDT affiché : {adeid ?? 'Non configuré'}
          </Text>

          <Card style={{ backgroundColor: theme.colors.surface }}>
            <Card.Content>
              <Text style={{ textAlign: 'left' }} variant="labelLarge">
                Entrez votre numéro étudiant pour configurer l&apos;emploi du temps affiché :
              </Text>
              <TextInput
                style={{ marginTop: 8, marginBottom: 8 }}
                mode="outlined"
                keyboardType="number-pad"
                maxLength={12}
                label="Numéro étudiant"
                value={tempAde}
                onChangeText={setTempAde}
              />
              <Button
                mode="contained-tonal"
                icon="content-save"
                onPress={() => selectCursus(tempAde, true)}
                style={{ marginTop: 8 }}>
                Sauvegarder
              </Button>
            </Card.Content>
          </Card>
          <Card style={{ marginTop: 16 }}>
            <Card.Title left={(props) => <Avatar.Icon {...props} icon="information" />} title />
            <Card.Content>
              <Text style={{ textAlign: 'left' }} variant="bodyMedium">
                Votre numéro étudiant est celui indiqué sur votre carte étudiant. Il commence souvent par 22.
              </Text>
              <Text style={{ marginTop: 8, textAlign: 'left' }} variant="bodyMedium">
                L&apos;emploi du temps individuel comprend les cours de votre cursus ainsi que
                les cours de groupes dont vous faites partie.
              </Text>
            </Card.Content>
          </Card>
        </ScrollView>
      ) : (
        <>
          <Text style={{ marginLeft: 25, marginRight: 25, marginTop: 8, textAlign: 'left' }} variant="titleMedium">
            EDT affiché : {adeid ?? 'Non configuré'}
          </Text>

          <Divider style={{ marginLeft: 20, marginRight: 20, marginTop: 8, height: 1 }} />

          <Searchbar
            autoCorrect={false}
            autoCapitalize="none"
            placeholder="Rechercher un cursus"
            value={searchValue}
            style={{ marginLeft: 20, marginRight: 20, marginTop: 16, marginBottom: 8 }}
            onChangeText={searchCursus}
            loading={loading}
            maxLength={32}
          />
          <ScrollView style={{ paddingLeft: 25, paddingRight: 25, marginBottom: 16 }}>
            <Text style={{ marginBottom: 16, textAlign: 'left' }} variant="titleSmall">
              Sélectionnez un cursus pour changer l&apos;emploi du temps affiché :
            </Text>
            {searchResults.map((item, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <Card style={{ marginBottom: 8 }} onPress={() => selectCursus(item.id, false)}>
                  <Card.Cover
                    style={{ marginBottom: 8, height: 10, backgroundColor: stringToColour(item.text) }}
                  />
                  <Card.Content>
                    <Text variant="titleMedium">{item.text}</Text>
                  </Card.Content>
                </Card>
              </View>
            ))}
            <Card>
              <Card.Title left={(props) => <Avatar.Icon {...props} icon="information" />} title />
              <Card.Content>
                <Text style={{ textAlign: 'left' }} variant="bodyMedium">
                  L&apos;emploi du temps par cursus comprend les cours du cursus sélectionné ainsi
                  que tous les cours de groupes, y compris ceux dont vous ne faites pas partie.
                </Text>
              </Card.Content>
            </Card>
          </ScrollView>
        </>
      )}
    </View>
  );
}
