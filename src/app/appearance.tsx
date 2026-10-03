import { Linking, View } from 'react-native';

import { Text } from 'react-native-paper';

import { IconPicker, ThemePicker } from '@/src/components/appearance/AppearancePickers';
import { Card } from '@/src/components/ui/Card';
import { IconBadge } from '@/src/components/ui/IconBadge';
import { Screen } from '@/src/components/ui/Screen';
import { SectionTitle } from '@/src/components/ui/SectionTitle';
import { LINKS } from '@/src/constants/config';
import { themeOptions, useAppTheme, useThemeId } from '@/src/theme';

export default function AppearanceScreen() {
  const theme = useAppTheme();
  const themeId = useThemeId();
  const selected = themeOptions.find((option) => option.id === themeId);

  return (
    <Screen modal title="Apparence" subtitle="UniceNotes, à ton style">
      <View>
        <SectionTitle title="Thème" aside={selected?.label} />
        <Card>
          <ThemePicker />
          <Text
            variant="bodyMedium"
            style={{ marginTop: 12, textAlign: 'center', color: theme.colors.onSurfaceVariant }}
          >
            {selected?.description}
          </Text>
        </Card>
      </View>

      <View>
        <SectionTitle title="Icône" />
        <Card>
          <IconPicker />
        </Card>
      </View>

      <Card onPress={() => Linking.openURL(LINKS.iconsMail)} accessibilityHint="Écrire un e-mail">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <IconBadge icon="brush-variant" tone="tertiary" />
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium">Tu es un·e artiste ?</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Propose ton icône à la communauté : app+icons@metrixmedia.fr
            </Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
