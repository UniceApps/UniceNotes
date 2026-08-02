import React, { useEffect, useState } from 'react';
import { View, ScrollView, Alert, Platform } from 'react-native';
import {
  Text,
  Appbar,
  Card,
  Avatar,
  TextInput,
  SegmentedButtons,
  Searchbar,
  Tooltip,
  Button,
  RadioButton,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useApp } from '@/src/context/AppContext';
import { useChoosenTheme } from '@/src/constants/theme';
import { haptics } from '@/src/utils/haptics';
import { saveSecure } from '@/src/utils/storage';
import { stringToColour } from '@/src/utils/color';
import { edtService } from '@/src/services/edt';
import type { AdeProject, SearchResult } from '@/src/types';

export default function EDTConfigScreen() {
  const router = useRouter();
  const theme = useChoosenTheme();

  const { adeid, setAdeid } = useApp();
  const [tempAde, setTempAde] = useState('');

  const [mode, setMode] = useState(adeid?.includes('-VET') ? '1' : '0');

  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [projectMode, setProjectMode] = useState('0');
  const [adeProjects, setAdeProjects] = useState<AdeProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    edtService.getProjectSelection().then(({ projects, selectedId, isOverridden }) => {
      setAdeProjects(projects);
      setSelectedProjectId(selectedId);
      setProjectMode(isOverridden ? '1' : '0');
    });
  }, []);

  function selectProjectMode(value: string) {
    setProjectMode(value);
    if (value === '0') {
      edtService.setProjectOverride(null).then(() => {
        edtService.getProjectSelection().then(({ selectedId }) => setSelectedProjectId(selectedId));
      });
    }
  }

  function selectAdeProject(project: AdeProject) {
    setSelectedProjectId(project.id);
    edtService.setProjectOverride(project.id);
    haptics('light');
  }

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
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header elevated statusBarHeight={Platform.OS === 'ios' ? 0 : undefined}>
        <Tooltip title="Retour">
          <Appbar.BackAction onPress={() => router.back()} />
        </Tooltip>
        <Appbar.Content title="Config. EDT" />
      </Appbar.Header>

      <Text style={{ marginLeft: 25, marginRight: 25, marginTop: 16, textAlign: 'left' }} variant="titleMedium">
        EDT affiché : {adeid ?? 'Non configuré'} / {adeProjects.find((p) => p.id === selectedProjectId)?.name ?? 'Non configuré'}
      </Text>

      <Card style={{ backgroundColor: theme.colors.surface, marginTop: 16, marginLeft: 25, marginRight: 25 }}>
        <Card.Title
          left={(props) => <Avatar.Icon {...props} icon="calendar" />}
          title="Année scolaire (projet ADE)"
        />

        <Card.Content>
          <SegmentedButtons
            style={{ marginBottom: 8, width: '100%' }}
            value={projectMode}
            onValueChange={selectProjectMode}
            buttons={[
              { value: '0', label: 'Auto', icon: 'auto-fix', showSelectedCheck: true },
              { value: '1', label: 'Manuel', icon: 'tune', showSelectedCheck: true },
            ]}
          />

          {projectMode === '1' && (
            adeProjects.length === 0 ? (
              <Text style={{ marginTop: 8, textAlign: 'left' }} variant="bodyMedium">
                Chargement des projets...
              </Text>
            ) : (
              <RadioButton.Group
                value={selectedProjectId ?? ''}
                onValueChange={(id) => {
                  const project = adeProjects.find((p) => p.id === id);
                  if (project) selectAdeProject(project);
                }}
              >
                {adeProjects.map((project) => (
                  <RadioButton.Item
                    key={project.id}
                    label={project.name}
                    value={project.id}
                    style={{
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: theme.colors.outline,
                      borderRadius: 8,
                    }}
                  />
                ))}
              </RadioButton.Group>
            )
          )}
        </Card.Content>
      </Card>

      <Card style={{ backgroundColor: theme.colors.surface, marginTop: 16, marginBottom: 16, marginLeft: 25, marginRight: 25 }}>
        <Card.Title
          left={(props) => <Avatar.Icon {...props} icon="account" />}
          title="Identifiant ADE"
        />
        
        <Card.Content>
          <SegmentedButtons
            style={{ marginBottom: 8, width: '100%' }}
            value={mode}
            onValueChange={setMode}
            buttons={[
              { value: '0', label: 'Individuel', icon: 'account', showSelectedCheck: true },
              { value: '1', label: 'Cursus', icon: 'account-group', showSelectedCheck: true },
            ]}
          />

          {mode === '0' ? (
            <>
              <Text style={{ textAlign: 'left', marginTop: 8 }} variant="labelLarge">
                Entrez votre numéro étudiant pour configurer l&apos;emploi du temps affiché :
              </Text>
              <TextInput
                style={{ marginTop: 8 }}
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
                style={{ marginTop: 16 }}>
                Sauvegarder
              </Button>
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
            </>
          ) : (
            <>
              {searchResults.length > 1 ? (
                <Text style={{ marginTop: 8, textAlign: 'left' }} variant="titleSmall">
                  Sélectionnez un cursus pour changer l&apos;emploi du temps affiché :
                </Text>
              ) :
                <Text style={{ marginTop: 8, textAlign: 'left' }} variant="titleSmall">
                  Tapez au moins 2 caractères pour rechercher un cursus.
                </Text>
              }
              <Searchbar
                autoCorrect={false}
                autoCapitalize="none"
                placeholder="Rechercher un cursus"
                value={searchValue}
                style={{ marginTop: 8, marginBottom: 16, width: '100%' }}
                onChangeText={searchCursus}
                loading={loading}
                maxLength={32}
              />
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
            </>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
