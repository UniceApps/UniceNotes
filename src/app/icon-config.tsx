import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { Text, Appbar, Card, Avatar, Chip, Tooltip } from 'react-native-paper';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useChoosenTheme } from '@/src/constants/theme';
import { haptics } from '@/src/utils/haptics';

let setAppIcon: (name: string) => void;
if (!__DEV__) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    setAppIcon = require('@hugofnm/expo-dynamic-app-icon').setAppIcon;
  } catch {
    setAppIcon = () => {};
  }
} else {
  setAppIcon = (name: string) => console.log('Icon changed to:', name);
}

export default function IconConfigScreen() {
  const router = useRouter();
  const theme = useChoosenTheme();

  function changeIconHome(value: string) {
    haptics('medium');
    if (!__DEV__) {
      setAppIcon(value);
    }
  }

  const chipStyle = {
    height: 48,
    justifyContent: 'center' as const,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' }}>
      <Appbar.Header elevated statusBarHeight={Platform.OS === 'ios' ? 0 : undefined}>
        <Tooltip title="Retour">
          <Appbar.BackAction onPress={() => router.back()} />
        </Tooltip>
        <Appbar.Content title="Icône" />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">
          Choisissez votre icône :
        </Text>

        <Chip style={{ height: 36, justifyContent: 'center', marginTop: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} disabled>
          Icônes officielles
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icon.png')} />}
          onPress={() => changeIconHome('unicenotes')}
        >
          Par défaut
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icons/icon_old.png')} />}
          onPress={() => changeIconHome('old')}
        >
          Old Style
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icons/icon_magnet.png')} />}
          onPress={() => changeIconHome('magnet')}
        >
          Magnet
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icons/icon_ardente.png')} />}
          onPress={() => changeIconHome('ardente')}
        >
          Ardente
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icons/icon_beach.png')} />}
          onPress={() => changeIconHome('beach')}
        >
          Beach
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icons/icon_monaco.png')} />}
          onPress={() => changeIconHome('monaco')}
        >
          Monaco
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icons/icon_melted.png')} />}
          onPress={() => changeIconHome('melted')}
        >
          Melted
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icons/icon_zoomed.png')} />}
          onPress={() => changeIconHome('zoomed')}
        >
          Zoomed
        </Chip>

        <Chip style={{ height: 36, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} disabled>
          Communautaire
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icons/icon_glitched.png')} />}
          onPress={() => changeIconHome('glitched')}
        >
          Glitched (par @f.eli0tt)
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icons/icon_vaporwave.png')} />}
          onPress={() => changeIconHome('vaporwave')}
        >
          Vaporwave (par @nathan_jaffres)
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icons/icon_ios6.png')} />}
          onPress={() => changeIconHome('ios6')}
        >
          iOS 6 (par @ds.marius)
        </Chip>

        <Chip style={{ height: 36, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} disabled>
          Événement
        </Chip>
        <Chip
          style={{ ...chipStyle, borderRadius: 0, marginTop: 1 }}
          textStyle={{ paddingVertical: 8 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icons/icon_france.png')} />}
          onPress={() => changeIconHome('france')}
        >
          France - Euro et JO 2024
        </Chip>
        <Chip
          style={{ ...chipStyle, borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 1 }}
          avatar={<Image style={{ width: 24, height: 24 }} source={require('../assets/icons/icon_christmas2023.png')} />}
          onPress={() => changeIconHome('christmas2023')}
        >
          Christmas - Noël 2023
        </Chip>

        <Card style={{ marginTop: 16 }}>
          <Card.Title left={(props) => <Avatar.Icon {...props} icon="flower" />} title />
          <Card.Content>
            <Text style={{ textAlign: 'left' }} variant="bodyMedium">
              Vous trouvez pas &quot;l&apos;icône&quot; qu&apos;il vous faut ? Envoyez-nous vos oeuvres d&apos;art à l&apos;adresse :{' '}
              <Text
                style={{ color: theme.colors.primary }}
                onPress={() => Linking.openURL('mailto://app+icons@metrixmedia.fr')}
              >
                app+icons@metrixmedia.fr
              </Text>
            </Text>
          </Card.Content>
        </Card>

        <Text style={{ marginTop: 16, marginBottom: 36, textAlign: 'left' }} variant="titleSmall">
          {' '}
        </Text>
      </ScrollView>
    </View>
  );
}
