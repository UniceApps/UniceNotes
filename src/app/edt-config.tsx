import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useRouter } from 'expo-router';
import { Button, HelperText, Icon, Searchbar, SegmentedButtons, Switch, Text, TextInput } from 'react-native-paper';

import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { IconBadge } from '@/src/components/ui/IconBadge';
import { ListGroup, ListItem } from '@/src/components/ui/ListGroup';
import { Screen } from '@/src/components/ui/Screen';
import { SectionTitle } from '@/src/components/ui/SectionTitle';
import { useCalendar } from '@/src/context/CalendarContext';
import { useSettings } from '@/src/context/SettingsContext';
import { getProjectSelection, setProjectOverride, type ProjectSelection } from '@/src/services/ade';
import { PROGRAM_SUFFIX, searchPrograms } from '@/src/services/edt';
import type { AdeProgram } from '@/src/types';
import { useAppTheme } from '@/src/theme';
import { haptics } from '@/src/utils/haptics';

type Mode = 'student' | 'program';

const SEARCH_DELAY_MS = 300;
const STUDENT_ID = /^\d{5,12}$/;

export default function EdtConfigScreen() {
  const router = useRouter();
  const { adeid, setAdeid } = useSettings();
  const [mode, setMode] = useState<Mode>(adeid?.endsWith(PROGRAM_SUFFIX) ? 'program' : 'student');

  function save(code: string) {
    haptics('success');
    setAdeid(code);
    router.back();
  }

  return (
    <Screen modal title="Emploi du temps" subtitle="Choisis l'EDT affiché dans l'app">
      {adeid && <CurrentEdt adeid={adeid} />}

      <SegmentedButtons
        value={mode}
        onValueChange={(value) => {
          haptics('selection');
          setMode(value as Mode);
        }}
        buttons={[
          { value: 'student', label: 'Individuel', icon: 'account' },
          { value: 'program', label: 'Cursus', icon: 'account-group' },
        ]}
      />

      {mode === 'student' ? (
        <StudentForm onSave={save} />
      ) : (
        <ProgramSearch onSelect={(id) => save(id + PROGRAM_SUFFIX)} />
      )}

      <ProjectPicker />
    </Screen>
  );
}

function CurrentEdt({ adeid }: { adeid: string }) {
  const theme = useAppTheme();
  const program = adeid.endsWith(PROGRAM_SUFFIX);

  return (
    <Card style={{ backgroundColor: theme.colors.primaryContainer }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <IconBadge icon="calendar-check" size={48} filled />
        <View style={{ flex: 1 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.85 }}>
            EDT actuel · {program ? 'cursus' : 'individuel'}
          </Text>
          <Text variant="titleLarge" style={{ color: theme.colors.onPrimaryContainer }}>
            {program ? adeid.slice(0, -PROGRAM_SUFFIX.length) : adeid}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function StudentForm({ onSave }: { onSave: (code: string) => void }) {
  const theme = useAppTheme();
  const [value, setValue] = useState('');
  const studentId = value.trim();
  const invalid = studentId.length > 0 && !STUDENT_ID.test(studentId);

  return (
    <Card>
      <TextInput
        mode="outlined"
        label="Numéro étudiant"
        keyboardType="number-pad"
        maxLength={12}
        value={value}
        error={invalid}
        onChangeText={setValue}
        onSubmitEditing={() => !invalid && studentId && onSave(studentId)}
      />
      <HelperText type={invalid ? 'error' : 'info'} visible>
        {invalid ? 'Uniquement des chiffres, comme sur ta carte étudiant.' : 'Celui indiqué sur ta carte étudiant.'}
      </HelperText>
      <Button mode="contained" icon="content-save" disabled={!studentId || invalid} onPress={() => onSave(studentId)}>
        Enregistrer
      </Button>
      <Hint
        text="L'emploi du temps individuel comprend les cours de ton cursus et ceux des groupes dont tu fais partie."
        color={theme.colors.onSurfaceVariant}
      />
    </Card>
  );
}

function ProgramSearch({ onSelect }: { onSelect: (id: string) => void }) {
  const theme = useAppTheme();
  const [query, setQuery] = useState('');
  // résultats de la dernière recherche terminée
  const [search, setSearch] = useState<{ term: string; results: AdeProgram[] | null } | null>(null);
  const term = query.trim();
  const active = term.length >= 2;

  useEffect(() => {
    if (term.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchPrograms(term).then((results) => {
        if (!cancelled) setSearch({ term, results });
      });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  const searching = active && search?.term !== term;
  const results = active ? search?.results : undefined;

  return (
    <View style={{ gap: 12 }}>
      <Searchbar
        placeholder="Rechercher un cursus"
        autoCorrect={false}
        autoCapitalize="none"
        maxLength={32}
        value={query}
        loading={searching}
        onChangeText={setQuery}
      />

      {results === null && !searching && (
        <Card>
          <EmptyState tone="error" icon="wifi-off" title="Recherche impossible" text="Vérifie ta connexion internet." />
        </Card>
      )}
      {results?.length === 0 && !searching && (
        <Card>
          <EmptyState icon="magnify-close" title="Aucun cursus trouvé" text={`Rien ne correspond à « ${term} ».`} />
        </Card>
      )}
      {results && results.length > 0 && (
        <ListGroup>
          {results.map((program) => (
            <ListItem
              key={program.id}
              icon="school-outline"
              title={program.name}
              onPress={() => onSelect(program.id)}
            />
          ))}
        </ListGroup>
      )}

      <Hint
        text={
          active
            ? "L'emploi du temps par cursus comprend tous les cours de groupes, y compris ceux dont tu ne fais pas partie."
            : 'Tape au moins 2 caractères pour rechercher un cursus.'
        }
        color={theme.colors.onSurfaceVariant}
      />
    </View>
  );
}

// année scolaire (projet ADE) : automatique, ou choisie à la main
function ProjectPicker() {
  const theme = useAppTheme();
  const { reload } = useCalendar();
  const [selection, setSelection] = useState<ProjectSelection | null>(null);

  useEffect(() => {
    getProjectSelection().then(setSelection);
  }, []);

  async function choose(id: string | null) {
    haptics('selection');
    await setProjectOverride(id);
    setSelection(await getProjectSelection());
    reload();
  }

  // passer en manuel garde l'année affichée
  function setAuto(auto: boolean) {
    if (!selection) return;
    choose(auto ? null : (selection.selected ?? selection.projects[0]).id);
  }

  if (!selection) {
    return <Hint text="Chargement des années scolaires…" color={theme.colors.onSurfaceVariant} />;
  }
  if (selection.projects.length === 0) {
    return <Hint text="ADE est indisponible : impossible de lister les années scolaires." color={theme.colors.error} />;
  }

  return (
    <View>
      <SectionTitle title="Année scolaire" aside={selection.selected?.name} />
      <ListGroup>
        <ListItem
          icon="auto-fix"
          tone="tertiary"
          title="Automatique"
          subtitle="Suit l'année en cours"
          onPress={() => setAuto(selection.manual)}
          right={<Switch value={!selection.manual} onValueChange={setAuto} />}
        />
        {selection.manual &&
          selection.projects.map((project) => (
            <ListItem
              key={project.id}
              title={project.name}
              onPress={() => choose(project.id)}
              right={
                project.id === selection.selected?.id ? (
                  <Icon source="check" size={24} color={theme.colors.primary} />
                ) : null
              }
            />
          ))}
      </ListGroup>
    </View>
  );
}

function Hint({ text, color }: { text: string; color: string }) {
  return (
    <Text variant="bodySmall" style={{ marginTop: 12, paddingHorizontal: 4, color }}>
      {text}
    </Text>
  );
}
