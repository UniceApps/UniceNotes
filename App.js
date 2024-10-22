/*

UniceNotes
Votre ENT. Dans votre poche.
Développé par Hugo Meleiro (@hugofnm) / MetrixMedia
MIT License
2022 - 2025

*/

// ---------------------------------------------
// IMPORTS
// ---------------------------------------------

// React components
import React, { useState, useEffect, useRef, 
  useMemo, createRef, useCallback
} from 'react';
import { Alert, View, StyleSheet, 
  AppState, ScrollView, RefreshControl,
  Appearance, BackHandler, SafeAreaView,
  SafeAreaProvider, Keyboard, Platform
} from 'react-native';

// Material Design 3 components (React Native Paper)
import { Avatar, Text, TextInput, 
  Button, Switch, Divider, 
  ActivityIndicator, ProgressBar, Chip,
  DataTable, Card, Provider as PaperProvider,
  IconButton, Appbar, Tooltip,
  List, configureFonts, SegmentedButtons,
  TouchableRipple, Menu, Searchbar
} from 'react-native-paper';

// Expo components
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import * as Linking from 'expo-linking';
import * as Font from 'expo-font';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import Constants from "expo-constants";
import * as QuickActions from "expo-quick-actions";

// Third-party components
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Bugsnag from '@bugsnag/expo';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Disable this when using Expo Go
import { setAppIcon } from "@hugofnm/expo-dynamic-app-icon";

// ---------------------------------------------
// VARIABLES GLOBALES
// ---------------------------------------------

// IMPORTANT !!!
var appVersion = 'merci<3';
var isBeta = false;
// IMPORTANT !!!

var initialQuickAction = null; // Quick action
var calendar = {}; // User's calendar

var adeid = SecureStore.getItemAsync("adeid").then((result) => {
  if (result != null) {
    adeid = result;
  } else {
    adeid = "demo";
  }
}).catch((error) => {
  haptics("error");
  Alert.alert("Erreur", "Impossible de récupérer les données de connexion. EC=0xR");
  deleteData(false);
}); // User's ADE Identifier (emploi du temps)

var hapticsOn = AsyncStorage.getItem("haptics").then((result) => {
  if (result != null) {
    hapticsOn = (result === 'true');
  } else {
    hapticsOn = true;
  }
}); // Haptics on/off

// ---------------------------------------------
// FONCTIONS GLOBALES
// ---------------------------------------------

if (!__DEV__) {
  Bugsnag.start();
}

// AsyncStorage API
async function saveAsyncStore(key, value) {
  await AsyncStorage.setItem(key, value);
}

// Fonction de suppression des données
async function deleteData(warnings = false, navigation = null) {
  if (warnings) {
    haptics("warning");
  }

  // Suppression des anciennces données
  await SecureStore.deleteItemAsync("username"); // Suppression du nom d'utilisateur
  await SecureStore.deleteItemAsync("passkey"); // Suppression du mot de passe
  await AsyncStorage.removeItem("name"); // Suppression du nom
  await AsyncStorage.removeItem("server"); // Suppression du serveur sélectionné
  await AsyncStorage.removeItem("userADEData"); // Suppression des données ADE utilisateur
  await AsyncStorage.removeItem("haptics"); // Suppression des paramètres retours haptiques
  await SecureStore.deleteItemAsync("adeid"); // Suppression de l'identifiant ADE

  await FileSystem.deleteAsync(FileSystem.documentDirectory + 'calendar.json'); // Suppression du calendrier hors-ligne
  await FileSystem.deleteAsync(FileSystem.documentDirectory + 'profile.png'); // Suppression de la photo de profil

  await Image.clearDiskCache();
  await Image.clearMemoryCache();
  await AsyncStorage.clear();

  Alert.alert("Données supprimées", "Vous pouvez désormais désinstaller l'application en toute sécurité.");
  haptics("success");

  if (navigation != null) {
    navigation.goBack();
    navigation.reset({
      index: 0,
      routes: [{ name: 'SplashScreen' }],
    });
  }
}

// Ouverture de pages web dans le navigateur par défaut
const handleURL = async (url) => {
  haptics("selection");
  await WebBrowser.openBrowserAsync(url);
};

// Fonction de retour haptique
function haptics(intensity) {
  if(hapticsOn == true) {
    switch(intensity) {
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "error":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "selection":
        Haptics.selectionAsync();
        break;
    }
  }
}

// Fonction navigate vers paramètres
function goToSettings(navigation) {
  haptics("medium");
  navigation.navigate('ShowSettings');
}

// ---------------------------------------------
// FONCTIONS API EMPLOI DU TEMPS
// ---------------------------------------------

const saveJSONToFile = async (data) => {
  const fileUri = FileSystem.documentDirectory + 'calendar.json'; // Specify the file path and name

  try {
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving JSON file:', error);
  }
};

// Lighten the color
const pSBC=(p,c0,c1,l)=>{
    let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
    if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
    if(!this.pSBCr)this.pSBCr=(d)=>{
        let n=d.length,x={};
        if(n>9){
            [r,g,b,a]=d=d.split(","),n=d.length;
            if(n<3||n>4)return null;
            x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
        }else{
            if(n==8||n==6||n<4)return null;
            if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
            d=i(d.slice(1),16);
            if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
            else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
        }return x};
    h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=this.pSBCr(c0),P=p<0,t=c1&&c1!="c"?this.pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
    if(!f||!t)return null;
    if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
    else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
    a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
    if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
    else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
}

// Convert a string to a color
var stringToColour = function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '#';
    for (var i = 0; i < 3; i++) {
      var value = (hash >> (i * 8)) & 0xFF;
      colour += ('00' + value.toString(16)).substr(-2);
    }
    return pSBC(0.25, colour);
}

// ---------------------------------------------
// FONCTIONS VIEW (ECRANS DE L'APPLICATION)
// ---------------------------------------------

// Page de transition (splashscreen)
function SplashScreen({ navigation }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(true);
  const [titleError, setTitleError] = useState("Erreur");
  const [subtitleError, setSubtitleError] = useState("");
  const insets = useSafeAreaInsets();

  const renderBackdrop = useCallback(
		(props) => (
			<BottomSheetBackdrop {...props}
        opacity={0.5}
        enableTouchThrough={false}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        style={[{ backgroundColor: 'rgba(0, 0, 0, 1)' }, StyleSheet.absoluteFillObject]} 
      />
		),
		[]
	);

  useEffect(() => { 
    if (count == 0) {
      setLoading(true);
      access();
      setCount(1);
    }
  });

  async function verifyLogin() {
    // Vérification de la version de l'application en récupérant le json contenant la dernière version
    var res = true;

    if ((await Network.getNetworkStateAsync()).isInternetReachable == false) {
      setLoading(false);
      showError("nointernet");
      res = false;
    }
    return res;
  }

  async function access(force = false) {
    var accessOK = await verifyLogin();
    accessOK ? setOk(true) : setOk(false);
    if(force == true) {
      accessOK = true;
      setOk(true);
    }

    if (accessOK) {
      setLoading(false);
      navigation.navigate('Goodbye');
    }
  }

  function showError(action){
    if(action == "nointernet") {
      setTitleError("Internet indisponible");
      setSubtitleError("Vous n'êtes pas connecté à Internet ! EC=0xT");
    }
    if(bottomSheetError != null) {
      setTimeout(() => {
        bottomSheetError.expand()
      }, 1000);
    }
  }

  function refresh() {
    if(bottomSheetError != null) {
      bottomSheetError.close()
    }
    setCount(0);
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: choosenTheme.colors.background }}>
      <Image source={require('./assets/color.png')} style={{ width: 200, height: 200, marginBottom: 16 }} />

      <Text style={{ textAlign: 'center' }} variant="displayLarge">UniceNotes</Text>

      <View style={{ display: "flex", flexDirection: 'row', justifyContent:'center' }}>
        <Tooltip title="Paramètres">
          <IconButton style={{ marginTop: 16 }} icon="cog" mode="contained" onPress={ () => goToSettings(navigation) }/>
        </Tooltip>
        <Tooltip title="Rafraîchir">
          <IconButton style={{ marginTop: 16 }} icon="refresh" mode="contained" onPress={ () => refresh() }/>
        </Tooltip>
      </View>

      <BottomSheet ref={(sheet) => bottomSheetError = sheet} index={-1} enableDynamicSizing enablePanDownToClose contentHeight={64} bottomInset={ insets.bottom } detached={true} style={{ marginHorizontal: 24 }} backgroundStyle={{ backgroundColor: style.container.errorContainer }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onErrorContainer }} backdropComponent={renderBackdrop}>
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
          <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="headlineSmall">{titleError}</Text>
          <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">{subtitleError}</Text>
          <Button style={{ marginBottom: 16, backgroundColor: style.container.error }} icon="refresh" mode="contained" onPress={() => refresh()}>Rafraîchir</Button>
        </BottomSheetView>
      </BottomSheet>

      <ActivityIndicator style={{ marginTop: 16 }} animating={loading} size="large" />
    </View>
  );
}

// Page de paramètres
function ShowSettings({ navigation }) {
  const [vibrations, setVibrations] = useState(hapticsOn);
  const insets = useSafeAreaInsets();

  let hash = Constants.expoConfig.extra.github_hash;

  function goBack() {
    haptics("medium");
    navigation.goBack();
  }

  function whatHapticMode(value) {
    var res = "contained-tonal";
    if (hapticsOn == true && value == "ON") {
      res = "contained";
    } else if (hapticsOn == false && value == "OFF") {
      res = "contained";
    }
    return res;
  }

  function setHapticsBool(value) {
    setVibrations(value);
    hapticsOn = value;
    saveAsyncStore("haptics", value.toString());
    haptics("error");
  }

  return (
    <View style={styleScrollable.container}>
      <Appbar.Header elevated>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => goBack()} />
        </Tooltip>
        <Appbar.Content title="Paramètres" />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>

        <Card style={{ marginTop:16 }}>
          <Card.Title
              title="Retours haptiques"
              subtitle="Activer/désactiver les vibrations"
              left={(props) => <Avatar.Icon {...props} icon="vibrate" />}
          />
          <Card.Actions>
            <Button mode={ whatHapticMode("ON") } onPress={ () => setHapticsBool(true) }>Activer</Button>
            <Button mode={ whatHapticMode("OFF") } onPress={ () => setHapticsBool(false) }>Désactiver</Button>
          </Card.Actions>
        </Card>

        <Divider style={{ marginTop: 16 }} />

        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">UniceNotes</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">© {new Date().getFullYear()} - MetrixMedia / hugofnm</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">⚡ Version : {appVersion}</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">❤️ Fièrement développé par un GEII : 
          <Text style={style.textLink} onPress={() => handleURL("https://github.com/hugofnm")}> @hugofnm </Text>
        </Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">🛠️ Hash local du commit Git : {hash}</Text>

        <Button style={{ marginTop: 16 }} icon="license" onPress={ () => handleURL("https://notes.metrixmedia.fr/credits") }> Mentions légales </Button>
        <Button style={{ marginTop: 4 }} icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }> Code source </Button>

        <Divider style={{ marginTop: insets.bottom }} /> 
      </ScrollView>
    </View>
  );
}

// Page d'adieu
function Goodbye({ navigation }) {
  return (
    <View style={styleScrollable.container}>
      <Appbar.Header elevated statusBarHeight={0}>
        <Appbar.Content title="Adieu 👋" />
      </Appbar.Header>
      
      { adeid == "" | adeid == null | adeid == "demo" ?
        <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>

          <Image source={require('./assets/end.png')} style={{ width: "100%", height: 200, marginTop: 32, marginBottom: 16 }} />

          <Text style={{ marginTop: 16, marginBottom: 8, textAlign: 'left' }} variant="headlineSmall">Ce n'est qu'un aurevoir...</Text>
          <Text style={{ textAlign: 'left' }} variant="bodyLarge">Pendant 2 ans et demi, UniceNotes vous a accompagné dans votre quotidien. </Text>
          <Text style={{ textAlign: 'left' }} variant="bodyLarge">Aujourd'hui, il est temps de dire au revoir.</Text>
          <Text style={{ textAlign: 'left' }} variant="bodyLarge">Merci pour votre confiance. ❤️</Text>

          <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleSmall">- hugo</Text>

          <Divider style={{ marginTop: 16, marginBottom: 16 }} />

          <Text style={{ textAlign: 'left' }} variant="bodyLarge">Vous pouvez désinstaller l'application en toute sécurité. Aucune action n'est requise de votre part.</Text>

          <Button style={{ marginTop: 16 }} mode='contained-tonal' icon="open-in-new" onPress={ () => handleURL("https://notes.metrixmedia.fr/export") }> Exporter mon emploi du temps </Button>
          <Button style={{ marginTop: 8 }} mode='outlined' icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/") }> Code Source </Button>

        </ScrollView>
      :
        <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>

          <Image source={require('./assets/theEnd.png')} style={{ width: "100%", height: 200, marginTop: 16, marginBottom: 16 }} />
          
          <Text style={{ marginTop: 16, marginBottom: 8, textAlign: 'left' }} variant="headlineSmall">Ce n'est qu'un aurevoir...</Text>
          <Text style={{ textAlign: 'left' }} variant="bodyLarge">Pendant 2 ans et demi, UniceNotes vous a accompagné dans votre quotidien. </Text>
          <Text style={{ textAlign: 'left' }} variant="bodyLarge">Aujourd'hui, il est temps de dire au revoir.</Text>
          <Text style={{ textAlign: 'left' }} variant="bodyLarge">Merci pour votre confiance. ❤️</Text>

          <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleSmall">- hugo</Text>
          
          <Divider style={{ marginTop: 16, marginBottom: 16 }} />
          
          <Text style={{ textAlign: 'left' }} variant="bodyLarge">Avant de partir, vous pouvez exporter votre emploi du temps actuel sur une autre application.</Text>
          <Button style={{ marginTop: 16 }} mode='contained-tonal' icon="calendar-export" onPress={ () => handleURL("https://notes.metrixmedia.fr/export?userId="+adeid) }> Exporter mon emploi du temps </Button>
          <Button style={{ marginTop: 8, backgroundColor: choosenTheme.colors.errorContainer }} mode='contained-tonal' icon="delete" onPress={ () => deleteData(false, navigation) }> Supprimer mes données </Button>
          <Button style={{ marginTop: 8 }} mode='outlined' icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/") }> Code Source </Button>

        </ScrollView>
      }

    </View>
  );
}

// ---------------------------------------------
// FONCTIONS ANNEXES
// ---------------------------------------------

// Création du stack de navigation
const Stack = createNativeStackNavigator();

// Fonction principale de l'application
function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ title: 'UniceNotes', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="ShowSettings" component={ShowSettings} options={{ title: 'Paramètres', headerShown: false }} />
        <Stack.Screen name="Goodbye" component={Goodbye} options={{ title: 'Emploi du temps', presentation: 'modal', headerShown: false, gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ---------------------------------------------
// THEMES
// ---------------------------------------------

const lightTheme = {
  "dark": false,
  "version": 3,
  "colors": {
    "primary": "rgb(0, 98, 159)",
    "onPrimary": "rgb(255, 255, 255)",
    "primaryContainer": "rgb(208, 228, 255)",
    "onPrimaryContainer": "rgb(0, 29, 52)",
    "secondary": "rgb(82, 96, 112)",
    "onSecondary": "rgb(255, 255, 255)",
    "secondaryContainer": "rgb(214, 228, 247)",
    "onSecondaryContainer": "rgb(15, 29, 42)",
    "tertiary": "rgb(105, 87, 121)",
    "onTertiary": "rgb(255, 255, 255)",
    "tertiaryContainer": "rgb(240, 219, 255)",
    "onTertiaryContainer": "rgb(36, 21, 50)",
    "error": "rgb(186, 26, 26)",
    "onError": "rgb(255, 255, 255)",
    "errorContainer": "rgb(255, 218, 214)",
    "onErrorContainer": "rgb(65, 0, 2)",
    "background": "rgb(252, 252, 255)",
    "onBackground": "rgb(26, 28, 30)",
    "surface": "rgb(252, 252, 255)",
    "onSurface": "rgb(26, 28, 30)",
    "surfaceVariant": "rgb(222, 227, 235)",
    "onSurfaceVariant": "rgb(66, 71, 78)",
    "outline": "rgb(115, 119, 127)",
    "outlineVariant": "rgb(194, 199, 207)",
    "shadow": "rgb(0, 0, 0)",
    "scrim": "rgb(0, 0, 0)",
    "inverseSurface": "rgb(47, 48, 51)",
    "inverseOnSurface": "rgb(241, 240, 244)",
    "inversePrimary": "rgb(155, 203, 255)",
    "retard": "rgb(255, 220, 198)",
    "elevation": {
      "level0": "transparent",
      "level1": "rgb(239, 244, 250)",
      "level2": "rgb(232, 240, 247)",
      "level3": "rgb(224, 235, 244)",
      "level4": "rgb(222, 234, 244)",
      "level5": "rgb(217, 230, 242)"
    },
    "surfaceDisabled": "rgba(26, 28, 30, 0.12)",
    "onSurfaceDisabled": "rgba(26, 28, 30, 0.38)",
    "backdrop": "rgba(44, 49, 55, 0.4)"
  }
};

const darkTheme = {
  "dark": true,
  "version": 3,
  "mode": "adaptive",
  "colors": {
    "primary": "rgb(155, 203, 255)",
    "onPrimary": "rgb(0, 51, 86)",
    "primaryContainer": "rgb(0, 74, 121)",
    "onPrimaryContainer": "rgb(208, 228, 255)",
    "secondary": "rgb(186, 200, 219)",
    "onSecondary": "rgb(36, 50, 64)",
    "secondaryContainer": "rgb(59, 72, 87)",
    "onSecondaryContainer": "rgb(214, 228, 247)",
    "tertiary": "rgb(213, 190, 229)",
    "onTertiary": "rgb(58, 42, 72)",
    "tertiaryContainer": "rgb(81, 64, 96)",
    "onTertiaryContainer": "rgb(240, 219, 255)",
    "error": "rgb(255, 180, 171)",
    "onError": "rgb(105, 0, 5)",
    "errorContainer": "rgb(147, 0, 10)",
    "onErrorContainer": "rgb(255, 180, 171)",
    "background": "rgb(26, 28, 30)",
    "onBackground": "rgb(226, 226, 230)",
    "surface": "rgb(26, 28, 30)",
    "onSurface": "rgb(226, 226, 230)",
    "surfaceVariant": "rgb(66, 71, 78)",
    "onSurfaceVariant": "rgb(194, 199, 207)",
    "outline": "rgb(140, 145, 153)",
    "outlineVariant": "rgb(66, 71, 78)",
    "shadow": "rgb(0, 0, 0)",
    "scrim": "rgb(0, 0, 0)",
    "inverseSurface": "rgb(226, 226, 230)",
    "inverseOnSurface": "rgb(47, 48, 51)",
    "inversePrimary": "rgb(0, 98, 159)",
    "retard": "rgb(114, 54, 0)",
    "elevation": {
      "level0": "transparent",
      "level1": "rgb(32, 37, 41)",
      "level2": "rgb(36, 42, 48)",
      "level3": "rgb(40, 47, 55)",
      "level4": "rgb(42, 49, 57)",
      "level5": "rgb(44, 53, 62)"
    },
    "surfaceDisabled": "rgba(226, 226, 230, 0.12)",
    "onSurfaceDisabled": "rgba(226, 226, 230, 0.38)",
    "backdrop": "rgba(44, 49, 55, 0.4)"
  }
};

var choosenTheme = darkTheme;
var colorScheme = Appearance.getColorScheme();
if (colorScheme === 'dark') {
  choosenTheme = darkTheme
} else {
  choosenTheme = lightTheme
}

const useFonts = async () =>
  await Font.loadAsync({
    'Bahnschrift': require('./assets/bahnschrift.ttf')
  }).then(() => {
    fontConfig = {
      fontFamily: 'Bahnschrift',
    };
  
    choosenTheme = {
      ...choosenTheme,
      fonts: configureFonts({config: fontConfig}),
    }
  });


const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: choosenTheme.colors.background,
    surfaceVariant: choosenTheme.colors.surfaceVariant,
    onSurfaceVariant: choosenTheme.colors.onSurfaceVariant,
    error : choosenTheme.colors.error,
    errorContainer: choosenTheme.colors.errorContainer,
    onErrorContainer: choosenTheme.colors.onErrorContainer,
    justifyContent: 'center',
    paddingLeft: 25, 
    paddingRight: 25
  },
  buttonLogout: {
    backgroundColor: choosenTheme.colors.errorContainer
  },
  buttonActionChange: {
    backgroundColor: choosenTheme.colors.tertiaryContainer
  },
  textLink: {
    color: choosenTheme.colors.primary
  },
});

const styleScrollable = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: choosenTheme.colors.background,
    justifyContent: 'center'
  },
});

// ---------------------------------------------
// MAIN
// ---------------------------------------------

export default function Main() {
  const [isReady, setIsReady] = useState(false);
  initialQuickAction = QuickActions.initial;

  useEffect(() => {
    QuickActions.setItems([
      {
        id: "0",
        title: "Merci d'avoir utilisé UniceNotes",
        subtitle : "- hugo",
        icon: Platform.OS === "ios" ? "symbol:heart.fill" : undefined,
        params: { href: "" }
      }
    ]);

    // Load fonts
    const loadApp = async () => {
      await useFonts().then(() => {
        setIsReady(true);
      });
    };

    loadApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={choosenTheme}>
        { isReady ? <App/> : null}
      </PaperProvider>
    </GestureHandlerRootView>
  );
}