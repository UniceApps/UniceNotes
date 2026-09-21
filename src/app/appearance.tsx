import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { Text, Appbar, Card, Avatar, Tooltip } from 'react-native-paper';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconPicker, ThemePicker } from '@/src/components/AppearancePickers';
import { themeOptions, useChoosenTheme, useThemeId } from '@/src/constants/theme';

export default function AppearanceScreen() {
  const router = useRouter();
  const theme = useChoosenTheme();
  const themeId = useThemeId();
  const insets = useSafeAreaInsets();
  const selectedTheme = themeOptions.find((t) => t.id === themeId);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header elevated statusBarHeight={Platform.OS === 'ios' ? 0 : undefined}>
        <Tooltip title="Retour">
          <Appbar.BackAction onPress={() => router.back()} />
        </Tooltip>
        <Appbar.Content title="Apparence" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 25, paddingBottom: insets.bottom + 24 }}>
        <Text style={{ marginTop: 24 }} variant="titleLarge">
          Thème
        </Text>
        <Text style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }} variant="bodyMedium">
          {selectedTheme?.description ?? 'Les couleurs de l’application'}
        </Text>
        <ThemePicker />

        <Text style={{ marginTop: 32 }} variant="titleLarge">
          Icône
        </Text>
        <Text style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }} variant="bodyMedium">
          L&apos;icône affichée sur ton écran d&apos;accueil.
        </Text>
        <IconPicker />

        <Card mode="contained" style={{ marginTop: 24 }}>
          <Card.Title
            title="Tu es un·e artiste ?"
            subtitle="Propose ton icône à la communauté"
            left={(props) => <Avatar.Icon {...props} icon="brush-variant" />}
          />
          <Card.Content>
            <Text variant="bodyMedium">
              Envoie-nous tes œuvres d&apos;art à{' '}
              <Text
                style={{ color: theme.colors.primary }}
                onPress={() => Linking.openURL('mailto://app+icons@metrixmedia.fr')}
              >
                app+icons@metrixmedia.fr
              </Text>
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}
