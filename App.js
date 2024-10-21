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
import { CalendarBody, CalendarContainer, CalendarHeader } from '@howljs/calendar-kit';
import Animated, { event, log, set, 
  Easing, loop, useSharedValue, 
  useAnimatedStyle, withSpring, withRepeat, 
  withSequence
} from 'react-native-reanimated';
import Bugsnag from '@bugsnag/expo';
import LottieView from 'lottie-react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal components
import EDT from './components/edt';

// Disable this when using Expo Go
import { setAppIcon } from "@hugofnm/expo-dynamic-app-icon";

// ---------------------------------------------
// VARIABLES GLOBALES
// ---------------------------------------------

// IMPORTANT !!!
var appVersion = 'Lite';
var isBeta = false;
// IMPORTANT !!!

var initialQuickAction = null; // Quick action
var calendar = {}; // User's calendar
const edt = new EDT(); // EDT instance

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

// SecureStore API
async function saveSecure(key, value) {
  await SecureStore.setItemAsync(key, value);
}

// AsyncStorage API
async function saveAsyncStore(key, value) {
  await AsyncStorage.setItem(key, value);
}

// Fonction de suppression des données - GDPR friendly :)
async function deleteData(warnings = false, navigation = null) {
  if (warnings) {
    haptics("warning");
  }

  if(!__DEV__ && Platform.OS == "ios" && parseInt(Platform.Version, 10) >= 18){
    setAppIcon("unicenotes");
  }

  // Suppression des anciennces données
  await SecureStore.deleteItemAsync("username"); // Suppression du nom d'utilisateur
  await SecureStore.deleteItemAsync("passkey"); // Suppression du mot de passe
  await AsyncStorage.removeItem("name"); // Suppression du nom
  await AsyncStorage.removeItem("server"); // Suppression du serveur sélectionné
  await AsyncStorage.removeItem("userADEData"); // Suppression des données ADE utilisateur
  await FileSystem.deleteAsync(FileSystem.documentDirectory + 'profile.png'); // Suppression de la photo de profil

  // Suppression des données de l'application
  await SecureStore.deleteItemAsync("adeid"); // Suppression de l'identifiant ADE
  adeid = "";
  await saveJSONToFile({}); // Suppression du calendrier hors-ligne
  calendar = {};
  await AsyncStorage.removeItem("haptics"); // Suppression des paramètres retours haptiques
  hapticsOn = true;
  await FileSystem.deleteAsync(FileSystem.documentDirectory + 'calendar.json'); // Suppression du calendrier hors-ligne

  await Image.clearDiskCache();
  await Image.clearMemoryCache();
  await AsyncStorage.clear();
  if (warnings) {
    Alert.alert("Données supprimées", "Retour à la page de connexion.");
    haptics("success");
  }
  if (navigation != null) {
    logout(navigation);
  }
}

// Ouverture de pages web dans le navigateur par défaut
const handleURL = async (url) => {
  haptics("selection");
  await WebBrowser.openBrowserAsync(url);
};

// Fonction de déconnexion (UniceAPI + app si "Se souvenir de moi" est désactivé)
function logout(navigation) {
  haptics("heavy");
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        { name: 'SplashScreen' }
      ],
    })
  );
}

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

const readJSONFromFile = async () => {
  const fileUri = FileSystem.documentDirectory + 'calendar.json'; // Specify the file path and name

  try {
    const jsonContent = await FileSystem.readAsStringAsync(fileUri);
    const parsedData = JSON.parse(jsonContent);
    return parsedData;
  } catch (error) {
    Alert.alert("Erreur", "Veuillez télécharger le calendrier avant de l'utiliser en mode hors-ligne ! EC=0xR");
    haptics("error");
    return null;
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

// Récupération du calendrier de l'utilisateur depuis le cache
async function getCalendarFromCache() {
  var cal = await readJSONFromFile();

  formattedCal = [];

  if(cal != null) {
    cal.map((item) => {
      formattedCal.push({
        id : item.id,
        start: { dateTime : item.start_time},
        end: { dateTime : item.end_time},
        title: item.summary,
        subtitle: item.description,
        description: item.location,
        color: stringToColour(item.summary)
      })
    });
  } else {
    formattedCal = [];
  }

  calendar = formattedCal;
  return formattedCal;
}

// Récupération du calendrier de l'utilisateur
async function getCalendar() {
    haptics("medium");
    var netInfos = (await Network.getNetworkStateAsync()).isInternetReachable;

    if (adeid == null) {
      haptics("error");
      Alert.alert("Erreur", "Votre identifiant ADE est introuvable. Veuillez fermer de force l'application et réessayez.");
      deleteData(false);
      return;
    }
    
    if (netInfos == true) {
      try{
        var cal = await edt.getEDT(adeid);
      } catch(e) {
        haptics("error");
        Alert.alert("Erreur", "Impossible de récupérer l'emploi du temps. EC=0xS");
        return;
      }

      saveJSONToFile(cal);

      formattedCal = [];

      cal.map((item) => {
        formattedCal.push({
          id : item.id,
          start: { dateTime : item.start_time},
          end: { dateTime : item.end_time},
          title: item.summary,
          subtitle: item.description,
          description: item.location,
          color: stringToColour(item.summary)
        })
      });

      return formattedCal;
    } else {
      formattedCal = await getCalendarFromCache();
      return formattedCal;
    }
}

// ---------------------------------------------
// FONCTIONS NOTIFICATION PUSH
// ---------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ---------------------------------------------
// FONCTIONS VIEW (ECRANS DE L'APPLICATION)
// ---------------------------------------------

// Page de transition (splashscreen)
function SplashScreen({ navigation }) {
  const [count, setCount] = useState(0);
  const [isDataStored, setIsDataStored] = useState(false);
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
    var version, isAvailable, maintenance, banned
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
    // Vérification de la disponibilité des usernames et mots de passe enregistrés
    if(!isDataStored) {
      if (accessOK && adeid != "demo") {
        setLoading(false);
        navigation.navigate('HomeScreen');
      } else {
        setIsDataStored(false);
        if(accessOK) {
          setLoading(false);
          navigation.navigate('OOBE');
        }
      }
    }
  }

  function specialMode() {
    if(isBeta) {
      return (
        <Text style={{ textAlign: 'center' }} variant="displaySmall">BETA</Text>
      );
    }

    if(!ok) {
      return (
        <Button style={{ marginTop: 16 }} icon="calendar-sync-outline" mode="contained" onPress={ () => getMyCal(navigation) }>Emploi du temps (hors-ligne)</Button>
      );
    }

    if(appVersion == "Lite") {
      return (
        <Text style={{ textAlign: 'center' }} variant="displaySmall">Lite</Text>
      );
    }
  }

  function showError(action){
    if(action == "nointernet") {
      setTitleError("Internet indisponible");
      setSubtitleError("Vous n'êtes pas connecté à Internet ! EC=0xT");
    } else if(action == "noserver") {
      setTitleError("Serveur indisponible");
      setSubtitleError("Le serveur n'est pas accessible ! Essayez de changer de serveur dans les paramètres. EC=0xS");
    } else if(action == "customservercheck") {
      setTitleError("Serveur custom indisponible");
      setSubtitleError("Il est possible que sa configuration soit mauvaise ou bien qu'il soit banni. Essayez de changer de serveur dans les paramètres. EC=0xS");
    }
    if(bottomSheetError != null) {
      setTimeout(() => {
        bottomSheetError.expand()
      }, 1000);
    }
  }

  async function getMyCal(navigation) {
    if(bottomSheetInfo != null) {
      bottomSheetInfo.close()
    }
    calendar = await getCalendarFromCache();
    navigation.navigate('ShowEDT');
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

      {specialMode()}

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

// Page OOBE (On-boarding experience)
function OOBE({ navigation }) {
  const insets = useSafeAreaInsets();

  // ----------------
  // Animation stuff
  // ----------------

  const rotation = useSharedValue(0);

  // Configure the animation of the logo
  const rotateConfig = {
    damping: 2,
    stiffness: 15,
  };

  // Define the rotation animation
  rotation.value = withRepeat(
    withSequence(
      withSpring(0, rotateConfig),
      withSpring(360, rotateConfig)
    ),
    -1, // -1 means infinite loop
    false // use false to indicate non-reversing rotation
  );

  // Create an animated style for the logo
  const animatedStyleLogo = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  // ----------------
  // Login stuff
  // ----------------

  const [ok, setOk] = useState(false);
  const [appearance, setAppearance] = useState(Appearance.getColorScheme());

  useEffect(() => {
    if(ok) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'HomeScreen' }
          ],
        })
      );
    }
  }, [ok]);

  function goToSettingsSpecial(navigation) {
    haptics("medium");
    navigation.goBack();
    navigation.navigate('ShowSettings');
  }

  return (  
    <View style={style.container}>
      {appearance == "dark" ? (
        <LottieView
          autoPlay
          loop
          resizeMode='cover'
          source={require('./assets/lottie/background_login_dark')}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : (
        <LottieView
          autoPlay
          loop
          resizeMode='cover'
          source={require('./assets/lottie/background_login_light')}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}
      <View style={{ flex: 1, alignSelf: 'center', height:'auto', marginTop: insets.top*2 }}>
        <Animated.View style={[ animatedStyleLogo ]}>
          <Image source={require('./assets/color.png')} style={{ width: 200, height: 200 }} />
        </Animated.View>
      </View>
      <BottomSheet index={0} enableDynamicSizing contentHeight={128} backgroundStyle={{ backgroundColor: style.container.backgroundColor }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onBackground }}>
          <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25}}>
            <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="displayMedium">UniceNotes</Text>
            <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleLarge'>Bienvenu·e·s sur l'application qui remplace des intranets datant de la préhistoire, par une interface moderne, rapide et facile d'utilisation.</Text>
            <Button style={{ marginBottom: 16 }} icon="skip-next" mode="contained" onPress={ () => setOk(true) }> Suivant </Button>
            <View style={{ display: "flex", flexDirection: 'row', justifyContent:'center' }}>
              <Tooltip title="Mentions légales">
                <IconButton style={{ marginBottom: 4 }} icon="license" mode="contained" onPress={ () => handleURL("https://notes.metrixmedia.fr/credits") }/>
              </Tooltip>
              <Tooltip title="Code source">
                <IconButton style={{ marginBottom: 16 }} icon="source-branch" mode="contained" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }/>
              </Tooltip>
              <Tooltip title="Paramètres">
                <IconButton style={{ marginBottom: insets.bottom }} icon="cog" mode="contained" onPress={ () => goToSettingsSpecial(navigation) }/>
              </Tooltip>
            </View>
          </BottomSheetView>
      </BottomSheet>
    </View>
  )
}

// Page d'accueil
function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [selectable, setSelectable] = useState(true);
  const [quickAction, setQuickAction] = useState(null);
  const [nextEvent, setNextEvent] = useState({summary: "Chargement...", location: "Chargement..."});
  const [nextEventLoaded, setNextEventLoaded] = useState(false);
  const [titleError, setTitleError] = useState("Erreur");
  const [subtitleError, setSubtitleError] = useState("");
  const internetAvailable = (Network.getNetworkStateAsync()).isInternetReachable;
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

  async function getNextEvent(mode = "normal") {
    while (!edt.READY) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (internetAvailable == false) {
      setNextEvent({summary: "Chargement...", location: "Chargement..."});
      setNextEventLoaded(true);
      showError("nointernet");
      return;
    }

    if(mode == "force") {
      setNextEvent({summary: "Chargement...", location: "Chargement..."});
    }

    if(mode == "force" || ( mode == "normal" && nextEventLoaded == false )) {
      try {
        response = await edt.getNextEvent(adeid);
        setNextEvent(response);
        setNextEventLoaded(true);
      } catch (e) {
        setNextEvent({summary: "Erreur", location: "Impossible de récupérer le prochain cours"});
        setNextEventLoaded(true);
      }
    }
  }

  async function getMyCal(navigation) {
    setSelectable(false);
    setLoading(true);
    if (nextEvent.summary == "ADE Indisponible" || nextEvent.summary == "Erreur" || nextEvent.summary == "Chargement...") {
      calendar = await getCalendarFromCache();
    } else {
      calendar = await getCalendar();
    }
    setSelectable(true);
    setLoading(false);
    navigation.navigate('ShowEDT');
  }

  function showError(action) {
    if(action == "nobiologin") {
      setTitleError("Erreur");
      setSubtitleError("Authentification annulée. EC=0xB");
    } else if(action == "noserver") {
      setTitleError("Serveur indisponible");
      setSubtitleError("Le serveur n'est pas accessible ! Essayez de changer de serveur dans les paramètres. EC=0xS");
    } else if(action == "nointernet") {
      setTitleError("Internet indisponible");
      setSubtitleError("Vous n'êtes pas connecté à Internet ! EC=0xT");
    } else if(action == "wronglogin") {
      setTitleError("Erreur");
      setSubtitleError("Vos identifiants sont incorrects. EC=0xI");
    } else if(action == "alreadyrated") {
      setTitleError("Erreur");
      setSubtitleError("Vous avez déjà soumis une note à UniceNotes.");      
    } else if(action == "info") {
      setTitleError("Informations")
      setSubtitleError("Ce n'est pas votre emploi du temps ? Vous pouvez changer l'EDT sélectionné dans Mon Compte > Code Apogée - ADE.");
    }
    if(bottomSheetError != null) {
      bottomSheetError.expand()
    }
  }

  useEffect(() => {
    getNextEvent("normal");
    if(initialQuickAction != null) {
      setQuickAction(initialQuickAction.params.href);
      initialQuickAction = null;
    }
  }, [])

  useEffect(() => {
    var state = navigation.getState();
    if(selectable && quickAction != null && state.routes[state.index].name == "HomeScreen") {
      setSelectable(false);
      if (quickAction == "/notes") {
        handleLogin("notes");
      } else if (quickAction == "/edt") {
        getMyCal(navigation);
      }
    }
  }, [quickAction]);

  const subscription = QuickActions.addListener((action) => {
    setQuickAction(action.params.href);
  });

  return (
    <View style={style.container}>
      <SafeAreaView>
        <View style={{ display: "flex", flexDirection: 'row', justifyContent:'left' }}>
          <Avatar.Image style={{ marginTop: insets.top*2, marginBottom: 16 }} size={96} source={require('./assets/white.png')} />
          <TouchableRipple onPress={() => goToSettings(navigation)} rippleColor="rgba(0, 0, 0, 0)" style={{ marginLeft: "auto", marginTop: insets.top*2, marginBottom: 50 }} >
            <Avatar.Icon size={48} icon={"cog"} />
          </TouchableRipple>
        </View>
        <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayLarge">Salut ! 👋</Text>

        <Card style={{ marginBottom: 8 }} disabled={!selectable} onPress={ () => getMyCal(navigation) }>
          <Card.Title title="Prochain Cours" />
          <Card.Content>
            <Text variant="titleLarge" numberOfLines={1}>{nextEvent.summary}</Text>
            <Text variant="bodyMedium" numberOfLines={1}>{nextEvent.location}</Text>
          </Card.Content>
          <Card.Actions>
            <Chip disabled={!selectable} onPress={() => getNextEvent("force")} icon="refresh">Rafraîchir</Chip>
            { nextEvent.summary != "ADE Indisponible" || nextEvent.summary != "Erreur" || nextEvent.summary != "Chargement..." ? (
              <>
                <Chip disabled={!selectable} onPress={() => getMyCal(navigation)} icon="calendar">Emploi du temps</Chip>
              </>
            ) : ( 
              <Chip disabled={!selectable} onPress={() => getMyCal(navigation)} icon="calendar-alert">EDT (Hors-ligne)</Chip>
             )}
          </Card.Actions>
        </Card>
        <Chip style={{ height: 48, marginBottom: 8, justifyContent: 'center', flexDirection: 'row'}} textStyle={{ paddingVertical: 8 }} disabled={!selectable} onPress={ () => navigation.navigate(EDTConfig) } icon="pencil" >Modifier le calendrier</Chip>
        <Chip style={{ height: 48, marginBottom: 16, justifyContent: 'center', flexDirection: 'row'}} textStyle={{ paddingVertical: 8 }} disabled={!selectable} onPress={ () => navigation.navigate(ShowENT) } icon="briefcase-variant" >Espace Numérique de Travail</Chip>
        <Divider style={{ marginBottom: 16 }} />
        <Text style={{ textAlign: 'center' }} variant='titleSmall'>Version {appVersion}</Text>
        <ActivityIndicator style={{ marginTop: 8, marginBottom: insets.bottom }} animating={loading} size="large" />
      </SafeAreaView>
      <BottomSheet ref={(sheet) => bottomSheetError = sheet} index={-1} enableDynamicSizing enablePanDownToClose contentHeight={64} bottomInset={ insets.bottom } detached={true} style={{ marginHorizontal: 24 }} backgroundStyle={{ backgroundColor: style.container.errorContainer }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onErrorContainer }} backdropComponent={renderBackdrop}>
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
          <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="headlineSmall">{titleError}</Text>
          <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">{subtitleError}</Text>
          <Button style={{ marginBottom: 16, backgroundColor: style.container.error }} icon="close" mode="contained" onPress={() => bottomSheetError.close()}> Fermer </Button>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

// Page d'affichage de l'emploi du temps
function ShowEDT({ navigation }) { 
  const [cal, setCalendar] = useState(calendar);
  const [view, setView] = useState(3);
  const [viewIcon, setViewIcon] = useState("magnify-minus");
  const [menuVisible, setMenuVisible] = useState(false);
  const [title, setTitle] = useState("Infos");
  const [subtitle, setSubtitle] = useState("");
  const insets = useSafeAreaInsets();
  const calendarRef = useRef(null);

  const month = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const [selectedMonth, setSelectedMonth] = useState(month[new Date().getMonth()])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

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
    async function calCache() {
      setCalendar(await getCalendarFromCache());
    }

    if(cal == null) {
      calCache();
    }
    
    setTimeout(() => goToToday(), 500);
  }, []);

  function toggleMenu() {
    haptics("medium");
    setMenuVisible(!menuVisible);
  }

  function goToToday(toggle = false) {
    haptics("medium");
    if(toggle) {
      toggleMenu();
    }
    var today = new Date();
    calendarRef.current?.goToDate({date: today, hourScroll: true, animatedDate: true, animatedHour: true})
  }

  function changeView() {
    haptics("medium");
    toggleMenu();
    if(view == 5) {
      setView(3);
      setViewIcon("magnify-minus");
    } else {
      setView(5);
      setViewIcon("magnify-plus");
    }
  }

  function changeDate(date) { 
    var resDate = new Date(date.toString());
    resMonth = month[resDate.getMonth()];
    resYear = resDate.getFullYear();
    setSelectedMonth(resMonth);
    setSelectedYear(resYear);
  }

  function showInfos(eventItem){
    haptics("selection");
    var res;

    const startTime = new Date(eventItem._internal.startUnix);

    const durationMilliseconds = eventItem._internal.duration * 60 * 1000;
    const durationTime = new Date(durationMilliseconds);
    const stopTime = new Date(eventItem._internal.endUnix);
    
    res = eventItem.subtitle + "\n\nSalle : " + eventItem.description + "\n" + startTime.getHours() + ":" + startTime.getMinutes() + " → " + stopTime.getHours() + ":" + stopTime.getMinutes() + " (" + durationTime.getUTCHours() + "h" + durationTime.getMinutes() + ")"
    setTitle(eventItem.title);
    setSubtitle(res);
    if(bottomSheetInfo != null) {
      bottomSheetInfo.expand()
    }
  }

  return (
    <View style={styleScrollable.container}>
      <Appbar.Header elevated>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => navigation.goBack()} />
        </Tooltip>
        <Appbar.Content title="Emploi du temps" />
        <Menu
          visible={menuVisible}
          onDismiss={toggleMenu}
          anchor={<Appbar.Action icon="dots-vertical" onPress={() => toggleMenu()}/>}>
          <Menu.Item title={adeid} />
          <Menu.Item leadingIcon="magnify" onPress={() => { toggleMenu(); navigation.navigate('EDTConfig'); }} title="Voir un autre EDT" />
          <Divider/>
          <Menu.Item leadingIcon="update" onPress={() => {goToToday(true)}} title="Aujourd'hui" />
          <Menu.Item leadingIcon={viewIcon} onPress={() => {changeView()}} title="Changer la vue" />
          <Divider/>
          <Menu.Item leadingIcon="cog" onPress={() => { toggleMenu(); goToSettings(navigation); }} title="Paramètres" />
        </Menu>
      </Appbar.Header>

      <Divider style={{ marginBottom: 8 }} />
      <Text style={{ marginBottom: 8, textAlign: 'center' }} variant="titleMedium">{selectedMonth} {selectedYear}</Text>

      <CalendarContainer
          events={cal} 
          theme={styleCalendar.container} 
          ref={calendarRef} 
          onPressEvent={(eventItem) => showInfos(eventItem)} 
          onChange={(date) => changeDate(date)}
          scrollToNow={true} numberOfDays={view} 
          allowPinchToZoom 
          start={420} end={1200} 
          useHaptic showWeekNumber 
          unavailableHours={{ 6 : [{ start: 0, end: 24 * 60 }], 7 : [{ start: 0, end: 24 * 60 }] }}
          timeZone='Europe/Paris'
      >
          <CalendarHeader />
          <CalendarBody renderEvent={(event) => {
            return (
              <SafeAreaView style={{ margin: 8 }}>
                <Text style={{ fontFamily:'', fontWeight:'bold', color:'black', marginBottom: 4 }}>{event.title}</Text>
                <Text style={{ color:'black' }}>{event.description}</Text>
              </SafeAreaView>
            );
          }} />
      </CalendarContainer>

      <BottomSheet ref={(sheet) => bottomSheetInfo = sheet} index={-1} enableDynamicSizing enablePanDownToClose contentHeight={64} bottomInset={ insets.bottom } detached={true} style={{ marginHorizontal: 24 }} backgroundStyle={{ backgroundColor: style.container.surfaceVariant }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onSurfaceVariant }} backdropComponent={renderBackdrop}>
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
          <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="headlineSmall">{title}</Text>
          <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">{subtitle}</Text>
          <Button style={{ marginBottom: 16 }} icon="close" mode="contained" onPress={() => bottomSheetInfo.close()}> Fermer </Button>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

// Page d'affichage des sous-applications de l'ENT
function ShowENT({ navigation }) {
  return (
    <View style={ styleScrollable.container }>
      <Appbar.Header elevated statusBarHeight={0}>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => navigation.goBack()} />
        </Tooltip>
        <Appbar.Content title="ENT" />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">Choisissez votre application :</Text>
        <Chip style={{ height: 48, justifyContent: 'center', flexDirection: 'row', marginTop: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} textStyle={{ paddingVertical: 8 }}  avatar={<Image size={24} source={require('./assets/ent/outlook.png')}/>} onPress={ () => handleURL("https://outlook.office.com/owa/?realm=etu.unice.fr&exsvurl=1&ll-cc=1036&modurl=0") }> Outlook (Emails) </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', flexDirection: 'row', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} avatar={<Image size={24} source={require('./assets/ent/moodle.png')}/>} onPress={ () => handleURL("https://portail-lms.univ-cotedazur.fr") }> Moodle (LMS) </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', flexDirection: 'row', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} icon={"school"} onPress={ () => handleURL("https://mondossierweb.univ-cotedazur.fr/") }> Mon dossier Web </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', flexDirection: 'row', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} icon={"account-search"} onPress={ () => handleURL("https://annuaire.univ-cotedazur.fr") }> Annuaire UniCA </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', flexDirection: 'row', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} icon={"book"} onPress={ () => handleURL("https://dsi-extra.unice.fr/BU/Etudiant/index.html") }> Bibliothèques Universitaires</Chip>
        <Chip style={{ height: 48, justifyContent: 'center', flexDirection: 'row', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} icon={"printer"} onPress={ () => handleURL("https://dsi-extra.unice.fr/repro/index.html") }> Imprimer à la BU </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', flexDirection: 'row', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} icon={"account"} onPress={ () => handleURL("https://link.univ-cotedazur.fr/fr/authentication/index/caslogin?1") }> Link UCA </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', flexDirection: 'row', borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }}  avatar={<Image size={24} source={require('./assets/ent/izly.png')}/>} onPress={ () => handleURL("https://mon-espace.izly.fr") }> Mon Espace Izly </Chip>
        
        <Card style={{ marginTop: 16 }}>
          <Card.Title left={(props) => <Avatar.Icon {...props} icon="information" />} />
          <Card.Content>
            <Text style={{ textAlign: 'left' }} variant="bodyLarge">Les applications ne sont pas compatibles avec UniceNotes et seront ouvertes avec un navigateur externe.</Text>
          </Card.Content>
        </Card>
      </ScrollView>
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

  function devToolbox(mode) {
    if(mode == "crash") {
      throw new Error('This is a crash');
    } else if(mode == "deleteprofile") {
      deleteData(false);
      AsyncStorage.clear();
      haptics("success");
      Alert.alert(
        "Données supprimées", 
        "Les données ont été supprimées avec succès. L'application va redémarrer.", 
        [{ text: "Fermer", onPress: () => { throw new Error('Data deletion forced') } }]
      );
    }
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
        <Button style={{ marginTop:16 }} icon="bug" mode="contained-tonal" onPress={ () => handleURL("https://notes.metrixmedia.fr/support") }> F.A.Q. / Signaler un bug </Button>

        <Divider style={{ marginTop: 16 }} />

        <Card style={{ marginTop:16 }}>
          <Card.Title
              title="Sélection de l'icône"
              subtitle="Changez l'icône de l'application"
              left={(props) => <Avatar.Icon {...props} icon="shape-square-rounded-plus" />}
          />
          <Card.Actions>
            <Button mode={"contained-tonal"} onPress={ () => navigation.navigate("IconConfig") }>Choisir</Button>
          </Card.Actions>
        </Card>

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

        <Card style={{ marginTop:16 }}>
          <Card.Title
              title="Serveurs UniceNotes"
              subtitle="Configuration, diagnostic, ..."
              left={(props) => <Avatar.Icon {...props} icon="server-network" />}
          />
          <Card.Actions>
            <Button mode={"contained-tonal"} onPress={ () => navigation.navigate("ServerConfig") }>Accéder</Button>
          </Card.Actions>
        </Card>

        <Divider style={{ marginTop: 16 }} />

        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">UniceNotes Lite</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">© {new Date().getFullYear()} - MetrixMedia / hugofnm</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">⚡ Version : {appVersion}</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">🛠️ Hash local du commit Git : {hash}</Text>

        <Card style={{ marginTop: 16, textAlign: 'left' }}>
          <Card.Title left={(props) => <Avatar.Icon {...props} icon="alert" />} />
          <Card.Content>
            <Text style={{ textAlign: 'left' }} variant="bodyMedium">Cette application n'est lié d'aucune forme à l'Université Côte d'Azur ou à l'I.U.T. de Nice Côte d'Azur.</Text>
            <Text style={{ textAlign: 'left' }} variant="titleSmall">Tout usage de cette application implique la seule responsabilité de l'utilisateur comme prévue dans les conditions d'utilisation.</Text>
          </Card.Content>
        </Card>

        <Button style={{ marginTop: 16 }} icon="license" onPress={ () => handleURL("https://notes.metrixmedia.fr/credits") }> Mentions légales </Button>
        <Button style={{ marginTop: 4 }} icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }> Code source </Button>
        <Button style={{ marginTop: 4 }} icon="account-remove" onPress={ () => devToolbox("deleteprofile") }> Forcer la suppression de données </Button>

        { // Bouton de test de crash
          isBeta ? ( 
            <>
              <Button style={{ marginTop: 4 }} icon="bug" onPress={ () => devToolbox("crash") }> crash_app </Button> 
              <Button style={{ marginTop: 4 }} icon="bug" onPress={ () => devToolbox("crash") }> crash_app </Button> 
              <Button style={{ marginTop: 4 }} icon="download" onPress={ () => devToolbox("downphoto") }> down_photoprofile </Button>
              <Button style={{ marginTop: 4 }} icon="account-box-multiple" onPress={ () => devToolbox("deletephoto") }> del_photoprofile </Button>
              <Button style={{ marginTop: 4 }} icon="bug" onPress={ () => devToolbox("crash") }> crash_app </Button>
              <Button style={{ marginTop: 4 }} icon="download" onPress={ () => devToolbox("downphoto") }> down_photoprofile </Button>
              <Button style={{ marginTop: 4 }} icon="account-box-multiple" onPress={ () => devToolbox("deletephoto") }> del_photoprofile </Button>
            </>
            ) : null
        }

        <Divider style={{ marginTop: insets.bottom }} /> 
      </ScrollView>
    </View>
  );
}

// Page de changement d'icône
function IconConfig({ navigation }) {
  function changeIconHome(value) {
    haptics("medium");
    if(!__DEV__){
      Alert.alert("Icône modifiée");
      setAppIcon(value);
    } else {
      console.log("Changement d'icône : " + value);
    }
  }

  return (
    <View style={ styleScrollable.container }>
      <Appbar.Header elevated statusBarHeight={0}>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => navigation.goBack()} />
        </Tooltip>
        <Appbar.Content title="Icône" />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">Choisissez votre icône :</Text>
        <Chip style={{ height: 36, justifyContent: 'center', marginTop: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} disabled > Icônes officielles </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} avatar={<Image size={24} source={require('./assets/icon.png')}/>} onPress={ () => changeIconHome("unicenotes") }> Par défaut </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} avatar={<Image size={24} source={require('./assets/icons/icon_magnet.png')}/>} onPress={ () => changeIconHome("magnet") }> Magnet </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} avatar={<Image size={24} source={require('./assets/icons/icon_ardente.png')}/>} onPress={ () => changeIconHome("ardente") }> Ardente </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} avatar={<Image size={24} source={require('./assets/icons/icon_beach.png')}/>} onPress={ () => changeIconHome("beach") }> Beach </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} avatar={<Image size={24} source={require('./assets/icons/icon_monaco.png')}/>} onPress={ () => changeIconHome("monaco") }> Monaco </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} avatar={<Image size={24} source={require('./assets/icons/icon_melted.png')}/>} onPress={ () => changeIconHome("melted") }> Melted </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} avatar={<Image size={24} source={require('./assets/icons/icon_zoomed.png')}/>} onPress={ () => changeIconHome("zoomed") }> Zoomed </Chip>
        <Chip style={{ height: 36, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} disabled > Communautaire </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} avatar={<Image size={24} source={require('./assets/icons/icon_glitched.png')}/>} onPress={ () => changeIconHome("glitched") }> Glitched (par @f.eli0tt) </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} avatar={<Image size={24} source={require('./assets/icons/icon_vaporwave.png')}/>} onPress={ () => changeIconHome("vaporwave") }> Vaporwave (par @nathan_jaffres) </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} avatar={<Image size={24} source={require('./assets/icons/icon_ios6.png')}/>} onPress={ () => changeIconHome("ios6") }> iOS 6 (par @ds.marius) </Chip>
        <Chip style={{ height: 36, justifyContent: 'center', borderRadius: 0, marginTop: 1 }}disabled > Événement </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0, marginTop: 1 }} textStyle={{ paddingVertical: 8 }} avatar={<Image size={24} source={require('./assets/icons/icon_france.png')}/>} onPress={ () => changeIconHome("france") }> France - Euro et JO 2024 </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 1 }} avatar={<Image size={24} source={require('./assets/icons/icon_christmas2023.png')}/>} onPress={ () => changeIconHome("christmas2023") }> Christmas - Noël 2023 </Chip>
        
        <Card style={{ marginTop: 16, textAlign: 'left' }}>
          <Card.Title left={(props) => <Avatar.Icon {...props} icon="flower" />} />
          <Card.Content>
            <Text style={{ textAlign: 'left' }} variant="bodyMedium">Vous trouvez pas "l'icône" qu'il vous faut ? Envoyez-nous vos oeuvres d'art à l'adresse :<Text style={style.textLink} onPress={() => Linking.openURL("mailto://app+icons@metrixmedia.fr")}> app+icons@metrixmedia.fr </Text></Text>
          </Card.Content>
        </Card>
        
        <Text style={{ marginTop: 16, marginBottom: 36, textAlign: 'left' }} variant="titleSmall"></Text>
      </ScrollView>
    </View>
  );
}

// Page de configuration des serveurs
function ServerConfig({ navigation }) {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [statusIntracursus, setStatusIntracursus] = useState("timer-sand");
  const [statusDW, setStatusDW] = useState("timer-sand");
  const [statusADE, setStatusADE] = useState("timer-sand");
  const [statusLoginUniCA, setStatusLoginUniCA] = useState("timer-sand");

  async function startTest() {
    setLoading(true)

    await fetch("https://intracursus.unice.fr/uns").then((res) => {
      if(res.status == 200 || res.status == 302 || res.status == 301) {
        setStatusIntracursus("check");
      } else {
        setStatusIntracursus("close");
      }
    }).catch((err) => {
      setStatusIntracursus("close");
    });

    await fetch("https://mondossierweb.univ-cotedazur.fr").then((res) => {
      if(res.status == 200 || res.status == 302 || res.status == 301) {
        setStatusDW("check");
      } else {
        setStatusDW("close");
      }
    }).catch((err) => {
      setStatusDW("close");
    });

    await fetch("https://edtweb.univ-cotedazur.fr").then((res) => {
      if(res.status == 200 || res.status == 302 || res.status == 301) {
        setStatusADE("check");
      } else {
        setStatusADE("close");
      }
    }).catch((err) => {
      setStatusADE("close");
    });

    await fetch("https://login.univ-cotedazur.fr").then((res) => {
      if(res.status == 200) {
        setStatusLoginUniCA("check");
      } else {
        setStatusLoginUniCA("close");
      }
    }).catch((err) => {
      setStatusLoginUniCA("close");
    });

    setLoading(false)
  }

  return (
    <View style={ styleScrollable.container }>
      <Appbar.Header elevated statusBarHeight={0}>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => navigation.goBack()} />
        </Tooltip>
        <Appbar.Content title="Serveurs" />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Text style={{ marginTop:16, marginBottom: 16, textAlign: 'left' }} variant="titleMedium">Status des serveurs :</Text>

        <Button mode={"contained-tonal"} onPress={ () => startTest() } loading={loading} >Démarrer test serveurs</Button>

        <Chip style={{ height: 48, justifyContent: 'center', marginTop: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} mode='outlined' icon={statusIntracursus} disabled > Serveur Intracursus (Notes) </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0 }} mode='outlined' icon={statusDW} disabled > Serveur Mon Dossier Web (Notes) </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0 }} mode='outlined' icon={statusADE} disabled > Serveur ADE (Emploi du temps) </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderTopLeftRadius: 0, borderTopRightRadius: 0, marginBottom: insets.bottom }} mode='outlined' icon={statusLoginUniCA} disabled > Serveur Login UniCA (Connexion) </Chip>
      </ScrollView>
    </View>
  );
}

// Page de configuration de l'emploi du temps
function EDTConfig({ navigation }) {
  const [mode, setMode] = useState(adeid.includes("-VET") ? 1 : 0);
  const [tempAde, setTempAde] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, [searchResults, loading]);

  async function searchCursus(value) {
    setLoading(true);
    setSearchValue(value);
    if(value.length >= 2) {
      await fetch("https://ade-consult.univ-cotedazur.fr/?action=search-vet&term=" + value).then((res) => {
        if(res.status == 200) {
          res.json().then((data) => {
            setSearchResults(data.results);
          });
        } else {
          setSearchResults([]);
        }
      }).catch((err) => {
        setSearchResults([
          { id: "demo", text: "Erreur, veuillez vérifier votre connexion." }
        ]);
      });
    }
    setLoading(false);
  }

  function selectCursus(value, individual = false) {
    if (value == "" || value == null) {
      Alert.alert("Erreur", "Entrée invalide.");
      return;
    }

    if(individual == false) {
      adeid = value + "-VET";
    } else {
      adeid = value;
    }
    saveSecure("adeid", adeid);
    logout(navigation);
  }

  return (
    <View style={styleScrollable.container}>
      <Appbar.Header elevated statusBarHeight={0}>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => navigation.goBack()} />
        </Tooltip>
        <Appbar.Content title="Config. EDT" />
      </Appbar.Header>
      <SegmentedButtons
        style={{ marginLeft: 20, marginRight: 20, marginTop: 16, marginBottom: 8 }}
        value={mode}
        onValueChange={setMode}
        buttons={[
          {
            value: 0,
            label: 'Individuel',
            showSelectedCheck: true
          },
          {
            value: 1,
            label: 'Cursus',     
            showSelectedCheck: true
          }
        ]}
      />
      { mode == 0 ? (
        <>
          <Text style={{ marginLeft: 25, marginRight: 25, marginTop: 8, textAlign: 'left' }} variant="titleMedium">EDT affiché : {adeid}</Text>
          <Divider style={{ marginTop: 16, marginBottom: 16 }} />
          <ScrollView style={{ paddingLeft: 25, paddingRight: 25, marginBottom: 16 }}>
            <Text style={{ textAlign: 'left' }} variant="labelLarge">Entrez un numéro étudiant pour changer l'emploi du temps affiché :</Text>
            <TextInput style={{ marginTop: 8, marginBottom: 8 }} mode='outlined' keyboardType='number-pad' maxLength={ 12 } label="Numéro étudiant" value={tempAde} onChangeText={setTempAde} right={<TextInput.Icon icon="content-save" onPress={() => selectCursus(tempAde, true)} />} />
            <Card style={{ marginTop: 16 }}>
              <Card.Title left={(props) => <Avatar.Icon {...props} icon="information" />} />
              <Card.Content>
                <Text style={{ textAlign: 'left' }} variant="bodyLarge">
                  L'emploi du temps individuel comprend les cours de votre cursus (TD, ...) ainsi que les cours de groupes dont vous faites partie (TP, ...).
                </Text>
              </Card.Content>
            </Card>
          </ScrollView>
        </>
      ) : (
        <>
          <Text style={{ marginLeft: 25, marginRight: 25, marginTop: 8, textAlign: 'left' }} variant="titleMedium">EDT affiché : {adeid}</Text>
          <Searchbar
            autoComplete='off' autoCorrect={false} autoCapitalize='none'
            placeholder="Rechercher un cursus"
            value={searchValue}
            style={{ marginLeft: 20, marginRight: 20, marginTop: 8, marginBottom: 8 }}
            onChangeText={(value) => searchCursus(value)}
            loading={loading}
            inputStyle={{ autoCorrect: false, autoComplete: 'off', autoCapitalize: 'none' }}
            maxLength={ 32 }
          />
          <Divider style={{ marginTop: 8, marginBottom: 16 }} />
          <ScrollView style={{ paddingLeft: 25, paddingRight: 25, marginBottom: 16 }}>
            <Text style={{ marginBottom: 16, textAlign: 'left' }} variant="titleSmall">Sélectionnez un cursus pour changer l'emploi du temps affiché :</Text>
            {searchResults.map((item, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <Card style={{ marginBottom: 8 }} onPress={() => selectCursus(item.id, false)}>
                  <Card.Cover style={{ marginBottom: 8, height: 10, backgroundColor: stringToColour(item.text) }} />
                  <Card.Content>
                    <Text variant="titleMedium">{item.text}</Text>
                  </Card.Content>
                </Card>
              </View>
            ))}
            <Card>
              <Card.Title left={(props) => <Avatar.Icon {...props} icon="information" />} />
              <Card.Content>
                <Text style={{ textAlign: 'left' }} variant="bodyLarge">L'emploi du temps par cursus comprend les cours du cursus sélectionné (TD, ...) ainsi que tous les cours de groupes, y compris ceux dont vous ne faites pas partie (TP, ...).</Text>
              </Card.Content>
            </Card>
          </ScrollView>
        </>
      )}
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
        <Stack.Screen name="OOBE" component={OOBE} options={{ title: 'OOBE', presentation: 'modal', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Se connecter', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="ShowEDT" component={ShowEDT} options={{ title: 'Emploi du temps', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="ShowENT" component={ShowENT} options={{ title: 'Espace Numérique de Travail', presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="ShowSettings" component={ShowSettings} options={{ title: 'Paramètres', headerShown: false }} />
        <Stack.Screen name="IconConfig" component={IconConfig} options={{ title: 'Icône', presentation: 'modal', headerShown: false, gestureEnabled: true  }} />
        <Stack.Screen name="ServerConfig" component={ServerConfig} options={{ title: 'Serveurs', presentation: 'modal', headerShown: false, gestureEnabled: true }} />
        <Stack.Screen name="EDTConfig" component={EDTConfig} options={{ title: 'Emploi du temps', presentation: 'modal', headerShown: false, gestureEnabled: true }} />
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

const styleCalendar = StyleSheet.create({
  container: {
    colors : {
      primary: choosenTheme.colors.primary,
      onPrimary: choosenTheme.colors.onPrimary,
      background: choosenTheme.colors.background,
      onBackground: choosenTheme.colors.onBackground,
      border : choosenTheme.colors.outline,
      text: choosenTheme.colors.onBackground,
    },
    hourTextStyle: {color: choosenTheme.colors.onBackground},
    weekNumber: {color: choosenTheme.colors.onPrimary},
    weekNumberContainer: {backgroundColor: choosenTheme.colors.primary},
    unavailableHourBackgroundColor: choosenTheme.colors.surfaceVariant,
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
        title: "Emploi du temps",
        icon: Platform.OS === "ios" ? "symbol:calendar" : undefined,
        params: { href: "/edt" }
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