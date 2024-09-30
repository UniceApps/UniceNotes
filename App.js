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
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import * as Linking from 'expo-linking';
import * as Font from 'expo-font';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from "expo-constants";
import * as ImagePicker from 'expo-image-picker';
import * as StoreReview from 'expo-store-review';
import * as QuickActions from "expo-quick-actions";

// Third-party components
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TimelineCalendar, EventItem } from '@howljs/calendar-kit';
import Animated, { event, log, set, 
  Easing, loop, useSharedValue, 
  useAnimatedStyle, withSpring, withRepeat, 
  withSequence
} from 'react-native-reanimated';
import Bugsnag from '@bugsnag/expo';
import LottieView from 'lottie-react-native';
import BottomSheet, { BottomSheetView, BottomSheetTextInput, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

// Disable this when using Expo Go
import { setAppIcon } from "@hugofnm/expo-dynamic-app-icon";

// ---------------------------------------------
// VARIABLES GLOBALES
// ---------------------------------------------

// IMPORTANT !!!
var appVersion = '2.1.1';
var isBeta = false;
// IMPORTANT !!!

var initialQuickAction = null; // Quick action
var isConnected = false; // UniceAPI login
var dataIsLoaded = false; // JSONPDF loaded
var semesters = []; // User's all semesters
var semester = ''; // Selected semesters
var calendar = {}; // User's calendar

const servers = [
  "https://api.unice.hugofnm.fr"
]; // UniceAPI servers

// Temporary variables - SecureStore
var username = SecureStore.getItemAsync("username").then((result) => {
  if (result != null) {
    username = result;
  } else {
    username = null;
  }
}).catch((error) => {
  haptics("error");
  Alert.alert("Erreur", "Impossible de récupérer les données de connexion. EC=0xR");
  deleteData(false);
}); // User's username

var password = SecureStore.getItemAsync("passkey").then((result) => {
  if (result != null) {
    password = result;
  } else {
    password = null;
  }
}).catch((error) => {
  haptics("error");
  Alert.alert("Erreur", "Impossible de récupérer les données de connexion. EC=0xR");
  deleteData(false);
}); // User's password

var adeid = SecureStore.getItemAsync("adeid").then((result) => {
  if (result != null) {
    adeid = result;
  } else {
    adeid = null;
  }
}).catch((error) => {
  haptics("error");
  Alert.alert("Erreur", "Impossible de récupérer les données de connexion. EC=0xR");
  deleteData(false);
}); // User's ADE Identifier (emploi du temps)

// Temporary variables - AsyncStorage
var name = AsyncStorage.getItem("name").then((result) => {
  if (result != null) {
    name = result.toString();
  } else {
    if (username != null) {
      haptics("error");
      Alert.alert("Erreur", "Données manquantes pour la bonne exécution de l'application. Veuillez vous connecter à nouveau. EC=0xR");
      deleteData(false);
    } else {
      name = "Étudiant";
    }
  }
}).catch((error) => {
  haptics("error");
  Alert.alert("Erreur", "Impossible de récupérer les données de connexion. EC=0xR");
  deleteData(false);
}); // User's name

var hapticsOn = AsyncStorage.getItem("haptics").then((result) => {
  if (result != null) {
    hapticsOn = (result === 'true');
  } else {
    hapticsOn = true;
  }
}); // Haptics on/off

var selectedServer = AsyncStorage.getItem("server").then((result) => {
  if (result != null) {
    if (result.toString() == servers[0].toString()) {
      selectedServer = servers[0].toString();
    } else {
      selectedServer = result.toString()
      servers.push(selectedServer);
    }
  } else {
    selectedServer = servers[0].toString();
  }
}); // Serveur sélectionné

var userADEData = AsyncStorage.getItem("userADEData").then((result) => {
  if (result != null) {
    userADEData = JSON.parse(result);
  } else {
    userADEData = {
      "cursus": "demo",
      "uid": "demo"
    };
  }
}); // User's ADE data

var rememberMe = true; // Remember me

var grades = []; // User's grades
var average = ""; // User's average
var admission = ""; // User's admission
var position = ""; // User's position

var subjects = []; // User's subjects

// ---------------------------------------------
// FONCTIONS GLOBALES
// ---------------------------------------------

if (!__DEV__) {
  Bugsnag.start({
    onError: function (event) {
      event.addMetadata('utilisateur', {
        name: name,
        username: username
      })
    }
  })
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

  // Suppression des données
  await SecureStore.deleteItemAsync("username"); // Suppression du nom d'utilisateur
  username = null;
  await SecureStore.deleteItemAsync("passkey"); // Suppression du mot de passe
  password = null;
  await SecureStore.deleteItemAsync("adeid"); // Suppression de l'identifiant ADE
  adeid = "";
  await AsyncStorage.removeItem("name"); // Suppression du nom
  name = "";
  await AsyncStorage.removeItem("haptics"); // Suppression des paramètres retours haptiques
  hapticsOn = true;
  await saveJSONToFile({}); // Suppression du calendrier hors-ligne
  calendar = {};
  await AsyncStorage.removeItem("server"); // Suppression du serveur sélectionné
  selectedServer = servers[0].toString();
  await AsyncStorage.removeItem("userADEData"); // Suppression des données ADE utilisateur
  userADEData = {
    "cursus": "demo",
    "uid": "demo"
  };
  await FileSystem.deleteAsync(FileSystem.documentDirectory + 'calendar.json'); // Suppression du calendrier hors-ligne
  await FileSystem.deleteAsync(FileSystem.documentDirectory + 'profile.png'); // Suppression de la photo de profil

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
  isConnected = false;
  dataIsLoaded = false;
  if (rememberMe == false) {
    password = null;
  }
  fetch(selectedServer + '/logout');
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

async function getPhotoFromLocal() {
  var photo = "";
  let options = { encoding: FileSystem.EncodingType.Base64 };
  await FileSystem.readAsStringAsync((FileSystem.documentDirectory + "profile.png"), options)
  .then((result) => {
    photo = "data:image/png;base64," + result;
  })
  .catch(async (error) => {
    await getPhotoFromENT();
  });
  return photo;
}

async function getPhotoFromENT() {
  await FileSystem.downloadAsync(
    selectedServer + "/avatar",
    FileSystem.documentDirectory + 'profile.png'
  )
  return;
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
        start: item.start_time,
        end: item.end_time,
        title: item.summary,
        subtitle: item.description,
        description: item.location,
        color: stringToColour(item.description)
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
        var cal = await fetch(selectedServer + '/edt/' + adeid.toString(), {
          method: 'POST',
          headers: {
            "Accept": "application/json",
            "Charset": "utf-8"
          }
        })
      } catch(e) {
        haptics("error");
        Alert.alert("Erreur", "Impossible de récupérer l'emploi du temps. EC=0xS");
        return;
      }

      cal = await cal.json();
      saveJSONToFile(cal);

      formattedCal = [];

      cal.map((item) => {
        formattedCal.push({
          id : item.id,
          start: item.start_time,
          end: item.end_time,
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
  const [titleInfo, setTitleInfo] = useState("Infos");
  const [subtitleInfo, setSubtitleInfo] = useState("");
  const [actionInfo, setActionInfo] = useState("");
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

    if (selectedServer != servers[0].toString() && res) {
      // check 200 ok
      await fetch("https://toolbox.hugofnm.fr/redirect?redirectUrl=" + selectedServer)
      .then((response) => {
        if(response.status != 200) {
          setLoading(false);
          showError("customservercheck");
          res = false;
        }
      })
    };

    if (!servers.includes(selectedServer)) {
      selectedServer = servers[0];
    }

    if(res) {
      await fetch(selectedServer + "/status")
      .then((response) => response.json())
      .then((json) => {
        version = json.version;
        if(version != null) {
          version = version.toString().replace("v", "");
          isAvailable = json.isAvailable;
          maintenance = json.maintenance;
          banned = json.banned;
        } else {
          setLoading(false);
          showError("noserver");
          res = false;
        }
      })
      .catch((error) => {
        setLoading(false);
        showError("noserver");
        res = false;
      });
    }

    if (banned == true && res) {
      setLoading(false);
      showInfos("ipban");
      res = false;
    }

    if(!isBeta && isAvailable == true && version != appVersion && res) {
      setLoading(false);
      showInfos("update");
      res = false;
    }

    if (maintenance != "" && res) {
      setLoading(false);
      showInfos("maintenance", maintenance);
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
      setUsername(await SecureStore.getItemAsync("username"));
      setPassword(await SecureStore.getItemAsync("passkey"));
      if (username != null && password != null && accessOK) {
        setLoading(false);
        navigation.navigate('HomeScreen');
      } else {
        username = null;
        password = null;
        setIsDataStored(false);
        if(accessOK) {
          setLoading(false);
          navigation.navigate('OOBE');
        }
      }
    }
  }

  function setUsername(text) {
    username = text;
  }

  function setPassword(text) {
    password = text;
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
  }

  function showInfos(action, overrideSubtitle = null){
    if(action == "update") {
      setTitleInfo("Mise à jour disponible");
      setSubtitleInfo("Une nouvelle version de l'application est disponible. Veuillez la mettre à jour pour continuer à utiliser UniceNotes.");
      setActionInfo("update");
    } else if(action == "maintenance") {
      setTitleInfo("Maintenance");
      setSubtitleInfo(overrideSubtitle);
      setActionInfo("maintenance");
    } else if(action == "ipban") {
      setTitleInfo("IP Bannie");
      setSubtitleInfo("Votre adresse IP ne peut pas utiliser UniceNotes. Cliquez sur ce bouton pour en savoir plus.");
      setActionInfo("ipban");
    }
    if(bottomSheetInfo != null) {
      bottomSheetInfo.expand()
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
    if(bottomSheetInfo != null) {
      bottomSheetInfo.close()
    }
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

      <BottomSheet ref={(sheet) => bottomSheetInfo = sheet} index={-1} enableDynamicSizing enablePanDownToClose contentHeight={64} bottomInset={ insets.bottom } detached={true} style={{ marginHorizontal: 24 }} backgroundStyle={{ backgroundColor: style.container.surfaceVariant }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onSurfaceVariant }} backdropComponent={renderBackdrop}>
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
          <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="headlineSmall">{titleInfo}</Text>
          <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">{subtitleInfo}</Text>
          {
            actionInfo == "update" ? (
              <Button style={{ marginBottom: 16 }} icon="download" mode="contained" onPress={() => handleURL("https://notes.metrixmedia.fr/get")}>Mettre à jour</Button>
            ) : ( null )
          }
          {
            actionInfo == "maintenance" ? (
              <Button style={{ marginBottom: 16 }} icon="chef-hat" mode="contained" onPress={() => access(true)}>Ok chef !</Button>
            ) : ( null )
          }
          {
            actionInfo == "ipban" ? (
              <Button style={{ marginBottom: 16 }} icon="information" mode="contained" onPress={() => handleURL("https://github.com/UniceApps/UniceNotes/blob/main/.docs/USAGE.md")}>En savoir plus</Button>
            ) : ( null )
          }
        </BottomSheetView>
      </BottomSheet>

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
  const [secondCard, setSecondCard] = useState(false);
  const [thirdCard, setThirdCard] = useState(false);
  const [fourthCard, setFourthCard] = useState(false);
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

  const [seePassword, setSeePassword] = useState(true);
  const [editable, setEditable] = useState(true);
  const [remember, setRemember] = useState(rememberMe);
  const [ok, setOk] = useState(false);
  const [appearance, setAppearance] = useState(Appearance.getColorScheme());

  
  // Résultat du bouton "Se connecter"
  function handleLogin(eula = false) {
    if (username == null || password == null) {
      haptics("warning");
      Alert.alert("Erreur", "Veuillez entrer un nom d'utilisateur et un mot de passe.");
    } else {
      Keyboard.dismiss();
      haptics("medium");
      setEditable(false);
      handleButtonPress();
      ssoUnice(username, password, eula);
    }
  }

  // Connexion au SSO de l'Université Nice Côte d'Azur et vérification des identifiants
  async function ssoUnice(username, password, eula) {
    if(!isConnected || !ok) {
      let apiResp = await fetch(selectedServer + "/signup", {
        method: 'POST',
        body: JSON.stringify({
          username: username,
          password: password,
          eula: eula
        }),
        headers: {
          "Accept": "application/json",
          "Content-type": "application/json",
          "Charset": "utf-8"
        }
      })

      if(apiResp.status == 429) {
        deleteData(false);
        AsyncStorage.clear();
        haptics("error");
        Alert.alert(
          "Erreur", 
          "Vous effectuez trop de requêtes. L'application contient peut-être des données trop anciennes pour les traîter. \n\nL'application va redémarrer pour tenter de les supprimer.", 
          [{ text: "OK", onPress: () => { throw new Error('Data deletion forced') } }]
        );
      }

      if(apiResp.status == 203) {
        setEditable(true);
        haptics("medium");
        setFourthCard(true);
        return;
      }
    
      if(!apiResp.ok){
        setEditable(true);
        haptics("error");
        Alert.alert("Erreur", "Connexion au serveur impossible. EC=0xS");
        setThirdCard(false);
      }

      let json = await apiResp.json();
    
      if(json.success) {
        // Sauvegarde des identifiants si "Se souvenir de moi" est activé
        if(rememberMe) {
          saveSecure("username", username);
          saveSecure("passkey", password);
          await getPhotoFromENT();
          var token = await registerForPushNotificationsAsync();
          if(token != null) {
            await fetch(selectedServer + '/push', {
              method: 'POST',
              body: JSON.stringify({
                username: username,
                token: token
              }),
              headers: {
                "Accept": "application/json",
                "Content-type": "application/json",
                "Charset": "utf-8"
              }
            })
          }
        }

        userADEData = json.userADEData;
        saveAsyncStore("userADEData", JSON.stringify(userADEData));

        adeid = userADEData.uid;
        saveSecure("adeid", adeid);

        name = json.name;
        if (name == null) {
          name = "Étudiant";
        }
        saveAsyncStore("name", name);

        semesters = json.semesters;
        haptics("success");
        setOk(true);
      } else {
        setEditable(true);
        haptics("warning");
        Alert.alert("Erreur", "Vos identifiants sont incorrects. EC=0xI");
        setThirdCard(false);
      }
    }
  };

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

  function setUsername(text) {
    username = text;
  }

  function setPassword(text) {
    password = text;
  }

  function setRememberMe(bool) {
    setRemember(bool);
    rememberMe = bool;
  }

  const handleButtonPress = () => {
    if(!secondCard && !thirdCard && !fourthCard) { // après bouton suivant sur le premier écran, on permute le deuxième écran
      setSecondCard(true);
    }
    if(secondCard && !thirdCard && !fourthCard) { // après login, on bascule sur le loading login
      setThirdCard(true);
    }
    if (secondCard && thirdCard && fourthCard) { // après acceptation EULA, on revient sur le loading login
      setFourthCard(false);
    }
  };

  function goToSettingsSpecial(navigation) {
    haptics("medium");
    navigation.goBack();
    navigation.navigate('ShowSettings');
  }

  // ----------------
  // Notifications stuff
  // ----------------

  async function registerForPushNotificationsAsync() {
    let token;

    try {
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          return;
        }
        token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig.extra.eas.projectId,
        });
      } else {
        alert('Must use physical device for Push Notifications');
      }
    
      return token.data;
    } catch (error) {
      return;
    }  
  }

  return (  
    <SafeAreaView style={style.container}>
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
      {secondCard ? (
        thirdCard ? (
          fourthCard ? (
            <BottomSheet enableDynamicSizing contentHeight={128} bottomInset={ insets.bottom } detached={true} backgroundStyle={{ backgroundColor: style.container.backgroundColor }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onBackground }}>
              <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
                <Text style={{ textAlign: 'left', marginBottom: 16, marginTop: 8 }} variant="headlineMedium">Conditions générales d'utilisation</Text>
                <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Mis à jour le 17/07/2024</Text>
                <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>En acceptant d'utiliser UniceNotes, MetrixMedia (l'entité représentant le développeur) se dégage de toute responsabilité émanant de l'utilisation d'UniceNotes. Je (l’utilisateur de l’application, le signataire du contrat actuel), suis responsable de mon compte UniCA (Université Côte d’Azur ou Sésame) et j’accepte TOUS les risques associés à l’utilisation de l’application UniceNotes.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} >
                  <Button style={{ marginBottom: 8, marginRight: 8 }} icon="check" mode="contained" onPress={ () => handleLogin(true) }> Accepter </Button>
                  <Button style={{ marginBottom: 8, marginRight: 8, backgroundColor: style.container.error }} icon="close" mode="contained" onPress={ () => deleteData(true, navigation) }> Refuser </Button>
                  <IconButton style={{ marginBottom: 14 }} icon="information" mode="outlined" onPress={ () => handleURL("https://notes.metrixmedia.fr/eula") }/>
                </View>
              </BottomSheetView>
            </BottomSheet>
          ) : (
          <BottomSheet enableDynamicSizing contentHeight={32} bottomInset={ insets.bottom } detached={true} style={{ marginHorizontal: 24 }} backgroundStyle={{ backgroundColor: style.container.backgroundColor }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onBackground }}>
            <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
              <Text style={{ textAlign: 'left', marginBottom: 16, marginTop: 8 }} variant="displayMedium">Connexion ...</Text>
              <ActivityIndicator style={{ marginBottom: 32 }} animating={true} size="large" />
            </BottomSheetView>
          </BottomSheet>
          )
        ) : (
          <BottomSheet enableDynamicSizing keyboardBehavior={'interactive'} keyboardBlurBehavior={"restore"} backgroundStyle={{ backgroundColor: style.container.backgroundColor }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onBackground }}>
            <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
              <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="displayMedium">Se connecter</Text>
              <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Utilisez votre compte Sésame afin de vous connecter.</Text>
              <BottomSheetTextInput 
                  placeholder="Nom d'utilisateur (aa000000)"
                  defaultValue={username}
                  onChangeText={(text) => setUsername(text)}
                  onPressIn={() => haptics("selection")}
                  returnKeyType="next"
                  autoCapitalize='none' 
                  autoComplete='username'
                  autoCorrect={false} 
                  onSubmitEditing={() => passwordInput.focus()}
                  editable={editable}
                  style={{ marginBottom: 8, borderRadius: 10, fontSize: 16, lineHeight: 20, padding: 8, backgroundColor: 'rgba(151, 151, 151, 0.25)', color: choosenTheme.colors.onBackground }}
                />
                <BottomSheetTextInput 
                  ref={(input) => passwordInput = input}
                  placeholder='Mot de passe'
                  defaultValue={password}
                  onChangeText={(text) => setPassword(text)}
                  onPressIn={() => haptics("selection")}
                  secureTextEntry={seePassword}
                  returnKeyType="go"
                  autoCapitalize='none'
                  autoComplete='password' 
                  autoCorrect={false} 
                  editable={editable}
                  style={{ marginBottom: 8, borderRadius: 10, fontSize: 16, lineHeight: 20, padding: 8, backgroundColor: 'rgba(151, 151, 151, 0.25)', color: choosenTheme.colors.onBackground }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} >
                  <Switch onValueChange={ (value) => setRememberMe(value) } disabled={!editable} value={rememberMe}/>
                  <Text style={{ marginLeft:8}}> Se souvenir de moi</Text>
                </View>
                <Button style={{ marginBottom: 8 }} disabled={!editable} icon="login" mode="contained" onPress={ () => handleLogin(false) }> Se connecter </Button>
                <Button style={{ marginBottom: insets.bottom }} icon="shield-account" onPress={() => handleURL("https://sesame.unice.fr/web/app/prod/Compte/Reinitialisation/saisieNumeroEtudiant")} > J'ai oublié mon mot de passe </Button>
            </BottomSheetView>
          </BottomSheet>
        )
      ) : (
        <BottomSheet enableDynamicSizing contentHeight={128} backgroundStyle={{ backgroundColor: style.container.backgroundColor }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onBackground }}>
            <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25}}>
              <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="displayMedium">UniceNotes</Text>
              <Text style={{ textAlign: 'left', marginBottom: 8 }} variant='titleLarge'>Application réservée à l'Université Côte d'Azur.</Text>
              <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Bienvenu·e·s sur l'application qui remplace des intranets datant de la préhistoire, par une interface moderne, rapide et facile d'utilisation.</Text>
              <Button style={{ marginBottom: 16 }} icon="skip-next" mode="contained" onPress={ () => handleButtonPress() }> Suivant </Button>
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
      )}
    </SafeAreaView>
  )
}

// Page d'accueil
function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [selectable, setSelectable] = useState(true);
  const [quickAction, setQuickAction] = useState(null);
  const [nextEvent, setNextEvent] = useState({summary: "Chargement...", location: "Chargement..."});
  const [nextEventLoaded, setNextEventLoaded] = useState(false);
  const [tempPhoto, setTempPhoto] = useState(null);
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

  // Connexion biométrique
  function handleLogin() {
    haptics("medium");
    setLoading(true);
    if (internetAvailable == false) {
      setLoading(false);
      showError("nointernet");
      return;
    }
    if(username == "demo") {
      ssoUnice(username, password);
    } else {
      // Connexion par TouchID/FaceID
      LocalAuthentication.authenticateAsync({ promptMessage:"Authentifiez-vous pour accéder à UniceNotes." }).then((result) => {
        if (result.success) {
          ssoUnice(username, password);
        } else {
          setLoading(false);
          setSelectable(true);
          haptics("error");
          showError("nobiologin");
        }
      });
    }
  }

  // Connexion au SSO de l'Université Nice Côte d'Azur et vérification des identifiants
  async function ssoUnice(username, password) {
    setSelectable(false);
    if(!isConnected) {
      let apiResp = await fetch(selectedServer + '/login', {
        method: 'POST',
        body: JSON.stringify({
          username: username,
          password: password
        }),
        headers: {
          "Accept": "application/json",
          "Content-type": "application/json",
          "Charset": "utf-8"
        }
      })
    
      if(!apiResp.ok){
        haptics("error");
        showError("noserver");
        setSelectable(true);
        setLoading(false);
        return;
      }

      if(apiResp.status == 203) {
        haptics("error");
        deleteData(false, navigation);
        return;
      }

      let json = await apiResp.json();
    
      if(json.success) { 
        isConnected = true;
        userADEData = json.userADEData;
        saveAsyncStore("userADEData", JSON.stringify(userADEData));
        semesters = json.semesters;
        setLoading(false);
        setSelectable(true);
        haptics("success");
      } else {
        setLoading(false);
        setSelectable(true);
        haptics("warning");
        showError("wronglogin");
      }
    }
  };

  async function getNextEvent(mode = "normal") {
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
        fetch(selectedServer + "/edt/" + adeid.toString() + "/nextevent", {
          method: 'GET',
          headers: {
            "Accept": "application/json",
            "Charset": "utf-8"
          }
        }).then(async (response) => {
          if (response.status == 200) {
            let json = await response.json();
            setNextEvent(json);
            setNextEventLoaded(true);
          } else if (response.status == 429) {
            setNextEvent({summary: "Erreur", location: "Trop de requêtes. Réessayez plus tard."});
            setNextEventLoaded(true);
          } else {
            setNextEvent({summary: "Erreur", location: "Impossible de récupérer le prochain cours"});
            setNextEventLoaded(true);
          }
        });
      } catch (e) {
        setNextEvent({summary: "Erreur", location: "Impossible de récupérer le prochain cours"});
        setNextEventLoaded(true);
      }
    }
  }

  async function getMyCal(navigation) {
    setSelectable(false);
    setLoading(true);
    calendar = await getCalendar();
    setSelectable(true);
    setLoading(false);
    navigation.navigate('ShowEDT');
  }

  function goToUser(navigation) {
    haptics("medium");
    navigation.navigate(ShowUser);
  }

  async function rateApp() {
    haptics("medium");
    Alert.alert("Notez-nous !", "Appréciez-vous l'application UniceNotes ?", [
      {
        text: "Pas vraiment",
        onPress: () => {
          Alert.alert("Ah dommage...", "Souhaitez-vous nous envoyer un message pour nous expliquer pourquoi ?", [
            {
              text: "Non",
              style: "cancel"
            },
            {
              text: "Oui",
              onPress: () => {
                handleURL("https://notes.metrixmedia.fr/support");
              }
            }
          ]);
        },
        style: "cancel"
      },
      { text: "Oui", 
        onPress: async () => {
          if (await StoreReview.hasAction()) {
            StoreReview.requestReview();
          } else (
            showError("alreadyrated")
          )
        }    
      }
    ]);
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
    getPhotoFromLocal().then((value) => {
      setTempPhoto(value);
    });
    getNextEvent("normal");
    if(initialQuickAction != null) {
      setQuickAction(initialQuickAction.params.href);
      initialQuickAction = null;
    }
  }, [])

  useEffect(() => {
    if(isConnected) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'Semesters' }
          ],
        })
      );
    }
  }, [isConnected]);

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
          <TouchableRipple onPress={() => goToUser(navigation)} rippleColor="rgba(0, 0, 0, 0)" style={{ marginLeft: "auto", marginTop: insets.top*2, marginBottom: 50 }} >
            <Avatar.Image size={48} source={{ uri: tempPhoto }} />
          </TouchableRipple>
          <TouchableRipple onPress={() => goToSettings(navigation)} rippleColor="rgba(0, 0, 0, 0)" style={{ marginLeft: 16, marginTop: insets.top*2, marginBottom: 50 }} >
            <Avatar.Icon size={48} icon={"cog"} />
          </TouchableRipple>
        </View>
        <Text style={{ textAlign: 'left' }} variant="displayLarge">Salut ! 👋</Text>
        <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Tu es connecté·e·s sous le compte de : {"\n"}{username} - {name}</Text>
        <Chip style={{ height: 48, marginBottom: 8, justifyContent: 'center', flexDirection: 'row'}} textStyle={{ paddingVertical: 8 }} disabled={!selectable} onPress={ () => handleLogin("notes") } icon="school" >Notes (Intracursus)</Chip>
        <Chip style={{ height: 48, marginBottom: 8, justifyContent: 'center', flexDirection: 'row'}} textStyle={{ paddingVertical: 8 }} disabled={!selectable} onPress={ () => navigation.navigate(ShowENT) } icon="briefcase-variant" >Espace Numérique de Travail</Chip>

        <Card style={{ marginBottom: 16 }} disabled={!selectable} onPress={ () => getMyCal(navigation) }>
          <Card.Title title="Prochain Cours" />
          <Card.Content>
            <Text variant="titleLarge" numberOfLines={1}>{nextEvent.summary}</Text>
            <Text variant="bodyMedium" numberOfLines={1}>{nextEvent.location}</Text>
          </Card.Content>
          <Card.Actions>
            <Chip disabled={!selectable} onPress={ () => getNextEvent("force") } icon="refresh" >Rafraîchir</Chip>
            <Chip disabled={!selectable} onPress={ () => getMyCal(navigation) } icon="calendar" >Emploi du temps</Chip>
          </Card.Actions>
        </Card>

        <Divider style={{ marginBottom: 8 }} />
        <View style={{ display: "flex", flexDirection: 'row', justifyContent:'center' }}>
        <Tooltip title="Informations">
            <IconButton style={{ marginBottom: 4 }} icon="information" mode="contained" onPress={ () => showError("info") }/>
          </Tooltip>
          <Tooltip title="Code source">
            <IconButton style={{ marginBottom: 16 }} icon="source-branch" mode="contained" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }/>
          </Tooltip>
          <Tooltip title="Avis">
            <IconButton style={{ marginBottom: 16 }} icon="star" mode="contained" onPress={ () => rateApp() }/>
          </Tooltip>
        </View>
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

// Page de sélection du semestre
function Semesters ({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [selectable, setSelectable] = useState(true);
  const [done, setDone] = useState(false);
  const [tempPhoto, setTempPhoto] = useState(null);
  const [latestSemester, setLatestSemester] = useState("?");

  // Fonction de chargement des notes
  function loadGrades(sel) {
      setSelectable(false);
      haptics("medium");
      semester = sel.toString();
      setSelectable(true);
      navigation.navigate('APIConnect');
  }
  
  useEffect(() => {
    if(!done) { 
      getPhotoFromLocal().then((value) => {
        setTempPhoto(value);
      }); 
      if (semesters.length == 0 || semesters == null) {
        setSelectable(false);
        Alert.alert("Attention", "Il se peut que l'I.U.T. n'ait pas encore publié vos résultats. Dans ce cas là, UniceNotes peut ne pas récupérer correctement vos notes. EC=0xP");
      } else {
        setLatestSemester(semesters[0].semester);
      }
      setDone(true);
    }
  }, [done]);

  function getMySemesters() {
    if (semesters.length == 0 || semesters == null) {
      return <Text style={{ textAlign: 'center', marginTop : 8 }} variant="titleMedium">Aucun autre semestre disponible. Veuillez vous reconnecter ultérieurement.</Text>
    }

    return semesters.map((sem) => (
      <Chip key={sem.id} style={{ height: 48, marginBottom: 8, justifyContent: 'center' }} textStyle={{ paddingVertical: 8 }} disabled={!selectable} onPress={ () => loadGrades(sem.semester) } icon="adjust" > {sem.semester} </Chip>
    ))
  }

  async function resetPhoto() {
    await getPhotoFromENT();
    getPhotoFromLocal().then((value) => {
      setTempPhoto(value);
    });
  }

  return (
    <View style={styleScrollable.container}>
      <Appbar.Header elevated>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => logout(navigation)} />
        </Tooltip>
        <Appbar.Content title="Semestres" />
        <Tooltip title="Semestres">
          <Appbar.Action icon="cog" onPress={() => goToSettings(navigation)} />
        </Tooltip>
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Avatar.Image style={{ alignSelf: "center", marginTop: 32, marginBottom: 16 }} size={128} source={{ uri: tempPhoto }} />
        <IconButton style={{ alignSelf: 'center', marginTop: -48, marginLeft: 96 }} icon="refresh" mode="contained-tonal" onPress={ () => resetPhoto() } />
        <Text style={{ textAlign: 'center', marginBottom: 16 }} variant="titleMedium">{name}</Text>
        <Text style={{ textAlign: 'center', marginBottom: 8 }} variant='titleLarge'>Veuillez sélectionner un semestre.</Text>

        <Card style={{ marginBottom: 16 }}>
          <Card.Title left={(props) => <Avatar.Icon {...props} icon="information" />} />
          <Card.Content>
            <Text style={{ textAlign: 'left' }} variant="bodyMedium">Les semestres disponibles au visionnage sont déterminés par l'I.U.T. Le semestre en cours peut donc, ne pas être visible en ce moment.</Text>
          </Card.Content>
        </Card>

        <Divider style={{ marginBottom: 16 }} />

        <Chip style={{ height: 48, marginBottom: 8, justifyContent: 'center' }} textStyle={{ paddingVertical: 8 }} disabled={!selectable} onPress={ () => loadGrades("latest") } icon="calendar-search" > Dernier semestre disponible ({latestSemester}) </Chip>
        {getMySemesters()}

        <ActivityIndicator style={{ marginTop: 16 }} animating={loading} size="large" />
      </ScrollView>
    </View>
  );
}

// Page de chargement des données des notes
function APIConnect ({ navigation }) {
  const [progress, setProgress] = useState(0.1);
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

  useEffect(() => {
    loginAPI();
  }, []);

  function showError(action) {
    haptics("error");
    if(action == "noserver") {
      setTitleError("Serveur indisponible");
      setSubtitleError("Le serveur n'est pas accessible ! Essayez de changer de serveur dans les paramètres. EC=0xS");
    } else if(action == "nointernet") {
      setTitleError("Internet indisponible");
      setSubtitleError("Vous n'êtes pas connecté à Internet ! EC=0xT");
    } else if(action == "nogrades") {
      setTitleError("Erreur");
      setSubtitleError("Une erreur est survenue. Consultez la F.A.Q. pour plus d'infos. EC=0xG");
    } else if(action == "nologin") {
      setTitleError("Erreur");
      setSubtitleError("Une erreur est survenue. Consultez la F.A.Q. pour plus d'infos. EC=0xL");
    } else if(action == "emptypdf") {
      setTitleError("Erreur");
      setSubtitleError("Aucun PDF n'a été trouvé. Si vous êtes en Licence/Master hors IUT, alors vous ne pouvez pas utiliser le module Notes de l'application. EC=0xP");
    }
    if(bottomSheetError != null) {
      bottomSheetError.expand()
    }
  }

  async function loginAPI() {
    if (internetAvailable == false) {
      showError("nointernet");
      return;
    }

    if(dataIsLoaded == false){
      let response = await fetch(selectedServer + '/load_pdf?sem=' + semester)
      .catch((error) => {
        showError("nologin");
      });
      if(response.status == 200) {
        setProgress(0.5);
      
        let pdfAPI = await fetch(selectedServer + '/scrape_pdf?sem=' + semester)
        .catch((error) => {
          showError("noserver");
        });
      
        if(pdfAPI.status != 200){
          showError("noserver");
        }
      
        let json = await pdfAPI.json();
      
        setProgress(1);
        if(json.grades) {
          grades = json.grades; // toutes les notes, moyennes, noms des profs, etc.
        } else {
          showError("nogrades");
        }
        admission = json.admission; // admission oui/non
        average = json.average; // moyenne générale
        position = json.position; // position dans le classement
        dataIsLoaded = true;
        navigation.goBack();
        navigation.navigate('ShowGrades');
      } else if (response.status == 404) {
        showError("emptypdf");
      }else {
        showError("nologin");
      }
    }
    dataIsLoaded = true;
  }

  return (
    <View style={style.container}>
      <Avatar.Icon style={{ alignSelf: "center", marginBottom: 32 }} size={150} icon="sync" />
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Chargement des données...</Text>
      <ProgressBar progress={progress} style={{ marginBottom: 32 }} />
      <Button style={{ marginBottom: 16 }}icon="location-exit" mode="contained" onPress={ () => logout(navigation) }> Annuler </Button>
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

// Page d'affichage des notes
function ShowGrades({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("Infos");
  const [subtitle, setSubtitle] = useState("");
  const [gradeRefs, setGradeRefs] = useState([]);
  const [moyenneString, setMoyenneString] = useState("");
  const [calculated, setCalculated] = useState(false);
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

  var moyenneGenerale = 0.0;
  var moyenneCache = 0.0;
  var coeffGeneral = 0.0;
  var coeff = 0.0;
  var bonus = 0.0;

  grades.map((item) => {
    subjects.push(item.subject);
  })

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (forceRefresh() == true) {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    isCalculated();
  }, []);

  async function forceRefresh() {
    var res;
    dataIsLoaded = false;

    await fetch(selectedServer + '/whoami')
    .then((response) => response.json())
    .then((json) => {
      logged = json.username;
    })

    if(logged == username) { // Si l'utilisateur est connecté
      res = true;
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'APIConnect' }
          ],
        })
      );
    } else { // Si l'utilisateur n'est pas connecté
      let apiResp = await fetch(selectedServer + '/login', {
        method: 'POST',
        body: JSON.stringify({
          username: username,
          password: password
        }),
        headers: {
          "Accept": "application/json",
          "Content-type": "application/json",
          "Charset": "utf-8"
        }
      })
    
      if(!apiResp.ok){
        haptics("error");
        Alert.alert("Erreur", "Connexion au serveur impossible. EC=0xS");
      } else {
        res = true;
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'APIConnect' }
            ],
          })
        );
      }
    }
    return res; // Retourne true/false pour terminer le refresh
  }

  async function changeSemester() {
    haptics("medium");
    setLoading(true);
    dataIsLoaded = false;

    var logged;

    await fetch(selectedServer + '/whoami')
    .then((response) => response.json())
    .then((json) => {
      logged = json.username;
      semesters = json.semesters;
    })

    if (logged == username) { // Si l'utilisateur est toujours connecté, on peut changer de semestre
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'Semesters' }
          ],
        })
      );
    } else { // Si l'utilisateur n'est pas connecté, se reconnecter
      let apiResp = await fetch(selectedServer + '/login', {
        method: 'POST',
        body: JSON.stringify({
          username: username,
          password: password
        }),
        headers: {
          "Accept": "application/json",
          "Content-type": "application/json",
          "Charset": "utf-8"
        }
      })
  
      if(!apiResp.ok){
        haptics("error");
        Alert.alert("Erreur", "Connexion au serveur impossible. EC=0xS");
      } else {
        setLoading(false);
        let json = await apiResp.json();

        if(json.success) { 
          semesters = json.semesters;
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                { name: 'Semesters' }
              ],
            })
          );
        }
      }
    }
  }

  function showInfos(grade){
    haptics("selection");
    var res;
    if(!grade[1][0].includes("coeff")){
      res = "Note : " + grade[1][0] + '\nCoefficient : ' + grade[1][1];
    }
    else {
      res = "Note : Non disponible" + '\nCoefficient : ' + (grade[1][0].replace("(coeff ", "")).replace(")","");
    }
    setTitle(grade[0]);
    setSubtitle(res);
    bottomSheetInfo.expand()
  }

  function isCalculated() {
    if (average != "") {
      setCalculated(false);
      setMoyenneString(average);
    } else {
      setCalculated(true);
      globalAvg = showGlobalAverage();
      if (globalAvg != "Non disponible") {
        setMoyenneString(globalAvg + " (calculée)");
      } else {
        setMoyenneString(globalAvg);
      }
    }
  }

  async function shareWith(ref) {
    haptics("medium");
    await captureRef(ref, {
          quality: 1,
    }).then((uri) => Sharing.shareAsync(`file://${uri}`))
  }

  function showTable() {
    return (grades.map((item) => (
      <View ref={(view) => gradeRefs.push(view)} collapsable={false}>
        <Card style={{ marginBottom: 16 }} >
          <Card.Cover style={{ height: 10, backgroundColor: stringToColour(item.name) }} />
          <Card.Title title={item.name} subtitle={"Professeur : " + item.teacher} right={(props) => <IconButton {...props} icon="monitor-share" onPress={() => { shareWith(gradeRefs[grades.indexOf(item)]) }} />} />
          <Card.Content>
            <Text>Moyenne : {item.average}</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Examen</DataTable.Title>
                <DataTable.Title numeric>Note</DataTable.Title>
                <DataTable.Title numeric>Coeff.</DataTable.Title>
              </DataTable.Header>
              {item.grades.map((grade) => (
                <DataTable.Row onPress={ () => showInfos(grade)}>
                  <DataTable.Cell>{grade[0]}</DataTable.Cell>
                  {isCoeff(grade)}
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
        <Divider style={{ marginBottom: 16 }} />
      </View>
    )))
  }

  function isCoeff(grade) {
    if(!grade[1][0].includes("coeff")){
      return (
        <><DataTable.Cell numeric>{grade[1][0]}</DataTable.Cell>
        <DataTable.Cell numeric>{grade[1][1]}</DataTable.Cell></>
      )
    }
    else {
      if(grade[1][0].includes("ABI")) {
        return (
          <><DataTable.Cell numeric> ABI (0) </DataTable.Cell>
          <DataTable.Cell numeric>{(((grade[1][0].replace("ABI (coeff ", "")).replace(")",""))).replace(")","")}</DataTable.Cell></>
        )
      }
      return (
        <><DataTable.Cell numeric> X </DataTable.Cell>
        <DataTable.Cell numeric>{(grade[1][0].replace("(coeff ", "")).replace(")","")}</DataTable.Cell></>
      )
    }
  }

  /* 
  -- ALGORITHME DE CALCUL DE MOYENNE UNICENOTES - COPYRIGHT (c) hugofnm / MetrixMedia - Licence MIT 
  */
  function showGlobalAverage() {
    grades.forEach(element => {
      const condition = element.name.toString().toLowerCase(); // On récupère le nom de la matière en minuscule

      if(element.average.toString() != "Pas de moyenne disponible") { // Si la moyenne est disponible

        // Vérification automatique/manuelle des absences et bonus
        if((condition.includes("absences") || condition.includes("absence") || condition.includes("bonus"))) { // Vérification automatique
          if(condition.includes("bonus")) { // Si c'est un bonus on l'ajoute à la moyenne
            bonus += parseFloat(element.average.toString());
          }
          if(condition.includes("absences") || condition.includes("absence")) { // Si c'est un malus on le soustrait à la moyenne
            bonus -= parseFloat(element.average.toString());
          }
        }

        // Calcul
        if (!(condition.includes("absences") || condition.includes("absence") || condition.includes("bonus"))) { 
          // Sinon on compte comme une matière normale
          moyenneCache = parseFloat(element.average.replace(" (calculée)", "").toString()); // On récupère la moyenne en chiffre lisible

          element.grades.forEach((grade) => { // On récupère les coefficients
            if(!grade[1][0].includes("coeff")){
              coeff += parseFloat(grade[1][1]);
            }
            else {
              if(grade[1][0].includes("ABI")) {
                coeff += parseFloat((grade[1][0].replace("ABI (coeff ", "")).replace(")","")); // Si c'est un ABI
              } else {
                coeff += parseFloat((grade[1][0].replace("(coeff ", "")).replace(")","")); // Si c'est un coefficient
              }
            }
          })
          moyenneGenerale += moyenneCache * coeff; // On multiplie la moyenne cache par le coefficient et on l'ajoute à la moyenne générale
          coeffGeneral += coeff; // On ajoute le coefficient au coefficient général
          coeff = 0; // On remet le coefficient à 0
          moyenneCache = 0; // On remet la moyenne cache à 0
        }
      }
    });
    moyenneGenerale = moyenneGenerale / coeffGeneral; // On divise la moyenne générale par le coefficient général
    moyenneGenerale += bonus; // On ajoute le bonus à la moyenne générale
    moyenneGenerale = moyenneGenerale.toFixed(2); // On arrondi la moyenne générale à 2 chiffres après la virgule

    if (moyenneGenerale == "NaN") { // Si la moyenne générale est not a number
      return "Non disponible";
    }

    return moyenneGenerale;
  }

  return (
    <View style={styleScrollable.container}>
      <Appbar.Header elevated>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => logout(navigation)} />
        </Tooltip>
        <Appbar.Content title="Notes" />
        <Tooltip title="Paramètres">
          <Appbar.Action icon="cog" onPress={() => goToSettings(navigation)} />
        </Tooltip>
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }} 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
        <Button style={[style.buttonActionChange, { marginTop: 16 }]} loading={loading} icon="sync" mode="contained-tonal" onPress={ () => changeSemester() }> Changer de semestre </Button>
        <View style={{ display: "flex", flexDirection: 'row', justifyContent:'left' }}>
          <Text style={{ textAlign: 'left', marginTop: 16 }} variant="titleMedium">Moyenne générale : {moyenneString}</Text>
          {calculated ? 
            <IconButton style={{ marginLeft: 8, marginTop: 8 }} mode='contained-tonal' icon="information" onPress={() => { 
              setTitle("Attention !"); 
              setSubtitle('Lorsqu\'elle est accompagnée de la mention "Calculée", la moyenne générale est calculée par UniceNotes et ne tient pas compte des UE et de certains coefficients. Elle est donc à titre indicatif et peut être erronée.'); 
              if(bottomSheetInfo != null) {
                bottomSheetInfo.expand() 
              }
            }} />
          : null}
        </View>

        { // Affiche position si disponible
          position != "" ? ( 
            <Text style={{ textAlign: 'left' }} variant="titleMedium">Position : {position}</Text>
          ) : null
        }

        { // Affiche admission si disponible
          admission != "" ? ( 
            <Text style={{ textAlign: 'left' }} variant="titleMedium">Admission : {admission}</Text>
          ) : null
        }

        <Divider style={{ marginBottom: 16, marginTop: 8 }} />

        <Card style={{ marginBottom: 16 }}>
          <Card.Title left={(props) => <Avatar.Icon {...props} icon="information" />} />
          <Card.Content>
            <Text style={{ textAlign: 'left' }} variant="bodyMedium">Les notes et moyennes sont affichées à but purement indicatif (elles peuvent être modifiées à tout instant) et ne représentent en aucun cas un justificatif de notes officiel.</Text>
          </Card.Content>
        </Card>
        
        {showTable()}
        
        <Card style={{ marginBottom: insets.bottom*2 }}>
          <Card.Title left={(props) => <Avatar.Icon {...props} icon="alert" />} />
          <Card.Content>
            <Text style={{ textAlign: 'left' }} variant="bodyMedium">La mention "Calculée" représente une moyenne calculée par UniceNotes et ne tient pas compte des UE et de certains coefficients.</Text>
            <Text style={{ textAlign: 'left' }} variant="titleSmall">En aucun cas UniceNotes ne pourrait se tenir responsable d'un mauvais affichage des notes/moyennes.</Text>
          </Card.Content>
        </Card>
      </ScrollView>

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

// Page d'affichage de l'emploi du temps
function ShowEDT({ navigation }) {
  const [cal, setCalendar] = useState(calendar);
  const [view, setView] = useState("threeDays");
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
    if(cal == null) {
      async function readJSONonAwait() {
        return await readJSONFromFile();
      }
      cal = JSON.parse(readJSONonAwait());
      setCalendar(cal);
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
    if(view == "workWeek") {
      setView("threeDays");
      setViewIcon("magnify-minus");
    } else {
      setView("workWeek");
      setViewIcon("magnify-plus");
    }
  }

  function changeDate(date) {
    var resDate = new Date(date.date.toString());
    resMonth = month[resDate.getMonth()];
    resYear = resDate.getFullYear();
    setSelectedMonth(resMonth);
    setSelectedYear(resYear);
  }

  function showInfos(eventItem){
    haptics("selection");
    var res;

    const baseDate = new Date();
    baseDate.setHours(7, 0, 0, 0);
    const startTime = new Date(baseDate.getTime() + eventItem.startHour * 60 * 60 * 1000);

    const durationMilliseconds = eventItem.duration * 60 * 60 * 1000;
    const durationTime = new Date(durationMilliseconds);
    const stopTime = new Date(startTime.getTime() + durationMilliseconds);
    
    res = eventItem.subtitle + "\n\nSalle : " + eventItem.description + "\n" + startTime.getHours() + ":" + startTime.getMinutes() + " → " + stopTime.getHours() + ":" + stopTime.getMinutes() + " (" + durationTime.getUTCHours() + "h" + durationTime.getMinutes() + ")"
    setTitle(eventItem.title);
    setSubtitle(res);
    if(bottomSheetInfo != null) {
      bottomSheetInfo.expand()
    }
  }

  function menuNavigator(navigateTo) {
    if(navigateTo == "settings") {
      toggleMenu();
      goToSettings(navigation);
    } else if (navigateTo == "edtconfig") {
      navigation.navigate('EDTConfig');
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

      <TimelineCalendar theme={styleCalendar.container} ref={calendarRef} onPressEvent={(eventItem) => showInfos(eventItem)} onChange={(date) => changeDate(date)} scrollToNow={true} viewMode={view} events={cal} allowPinchToZoom start={7} end={20} renderEventContent={(event) => {
          return (
            <SafeAreaView style={{ margin: 10 }}>
              <Text style={{ fontFamily:'', fontWeight:'bold', color:'black', marginBottom: 4 }}>{event.title}</Text>
              <Text style={{ color:'black' }}>{event.description}</Text>
            </SafeAreaView>
          );
      }}/>

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
    } else if(mode == "deletephoto") {
      FileSystem.deleteAsync(FileSystem.documentDirectory + 'profile.png');
    } else if(mode == "deleteprofile") {
      deleteData(false);
      AsyncStorage.clear();
      haptics("success");
      Alert.alert(
        "Données supprimées", 
        "Les données ont été supprimées avec succès. L'application va redémarrer.", 
        [{ text: "Fermer", onPress: () => { throw new Error('Data deletion forced') } }]
      );
    } else if(mode == "downphoto") {
      getPhotoFromENT();
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
        {
          username != null ? (
            <Button style={[style.buttonActionChange, { marginBottom: 8, marginTop: 16, height: 48, justifyContent: 'center' }]} labelStyle={{ paddingVertical: 4 }} icon="account" mode="contained-tonal" onPress={ () => navigation.navigate('ShowUser')}>Mon compte</Button>
          ) : null 
        }
        <Button icon="bug" mode="contained-tonal" onPress={ () => handleURL("https://notes.metrixmedia.fr/support") }> F.A.Q. / Signaler un bug </Button>

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

        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">UniceNotes</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">Votre ENT. Dans votre poche.</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">© {new Date().getFullYear()} - MetrixMedia / hugofnm</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">Merci d'avoir téléchargé UniceNotes :)</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">⚡ Version : {appVersion}</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">❤️ Fièrement développé par un GEII : 
          <Text style={style.textLink} onPress={() => handleURL("https://github.com/hugofnm")}> @hugofnm </Text>
        </Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">🛠️ Hash local du commit Git : {hash}</Text>

        <Card style={{ marginTop: 16, textAlign: 'left' }}>
          <Card.Title left={(props) => <Avatar.Icon {...props} icon="alert" />} />
          <Card.Content>
            <Text style={{ textAlign: 'left' }} variant="bodyMedium">UniceNotes n'est lié d'aucune forme à l'Université Côte d'Azur ou à l'I.U.T. de Nice Côte d'Azur.</Text>
            <Text style={{ textAlign: 'left' }} variant="titleSmall">Tout usage de cette application implique la seule responsabilité de l'utilisateur comme prévue dans les conditions d'utilisation.</Text>
          </Card.Content>
        </Card>

        <Button style={{ marginTop: 16 }} icon="license" onPress={ () => handleURL("https://notes.metrixmedia.fr/credits") }> Mentions légales </Button>
        <Button style={{ marginTop: 4 }} icon="account-child-circle" onPress={ () => handleURL("https://notes.metrixmedia.fr/privacy") }> Politique de confidentialité </Button>
        <Button style={{ marginTop: 4 }} icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }> Code source </Button>
        <Button style={{ marginTop: 4 }} icon="account-remove" onPress={ () => devToolbox("deleteprofile") }> Forcer la suppression de données </Button>

        { // Bouton de test de crash
          isBeta ? ( 
            <>
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

// Page d'affichage des informations de l'utilisateur
function ShowUser({ navigation }) {
  const [count, setCount] = useState(0);
  const [tempPhoto, setTempPhoto] = useState(null);
  const [tempName, setTempName] = useState(name);

  useEffect(() => {
    if(count == 0) {
      getPhotoFromLocal().then((value) => {
        setTempPhoto(value);
      });
      setCount(1);
    }
  });

  function askDeleteData() {
    haptics("warning");
    Alert.alert("Suppression des données", "Voulez-vous vraiment supprimer les données de l'application ? \nCela aura pour effet de vous déconnecter de l'application UniceNotes.", [
      {
        text: "Annuler",
        style: "cancel"
      },
      { 
        text: "Supprimer", 
        onPress: (() => deleteData(true, navigation))
      }]);
  }

  function saveName(value) {
    if(value == "" || value == null) {
      haptics("error");
      Alert.alert("Erreur", "Votre nom et prénom doivent faire au moins 3 caractères.");
      return;
    }
    if(value.length > 32) {
      haptics("error");
      Alert.alert("Erreur", "Votre nom et prénom ne peuvent pas dépasser 32 caractères.");
      return;
    }
    if(value.length < 3) {
      haptics("error");
      Alert.alert("Erreur", "Votre nom et prénom doivent faire au moins 3 caractères.");
      return;
    }
    haptics("success");
    name = value;
    saveAsyncStore("name", value);
    setTempName(value);
    Keyboard.dismiss();
  }

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (result.canceled == false) {
      FileSystem.copyAsync({
        from: result.assets[0].uri,
        to: FileSystem.documentDirectory + 'profile.png'
      });
      setCount(0);
    }
  };

  return (
    <View style={styleScrollable.container}>
      <Appbar.Header elevated statusBarHeight={0}>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => navigation.goBack()} />
        </Tooltip>
        <Appbar.Content title="Mon compte" />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Avatar.Image style={{ marginTop: 16, alignSelf: 'center' }} size={96} source={{ uri: tempPhoto }} />
        <IconButton style={{ alignSelf: 'center', marginTop: -48, marginLeft: 96 }} icon="pencil" mode="contained-tonal" onPress={ () => pickImageAsync() } />
        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">Nom et prénom :</Text>
        <TextInput style={{ textAlign: 'left', marginTop: 4, height: 42 }} mode='outlined' value={tempName} onChangeText={(value) => setTempName(value)} right={<TextInput.Icon icon="content-save" onPress={() => saveName(tempName)}/>} />
        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">Nom d'utilisateur :</Text>
        <TextInput style={{ textAlign: 'left', marginTop: 4, height: 42 }} mode='outlined' value={username} editable={false} />
        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">Code Apogée - ADE :</Text>
        <TextInput style={{ textAlign: 'left', marginTop: 4, height: 42 }} mode='outlined' value={adeid} editable={false} right={<TextInput.Icon icon="pencil" onPress={() => navigation.navigate("EDTConfig")}/>} />
        <Divider style={{ marginVertical: 16 }} />
        <Button icon="calendar-edit" mode="contained-tonal" onPress={() => navigation.navigate("EDTConfig")}> Changer l'emploi du temps affiché </Button>
        <Button style={{ marginTop: 8 }} icon="form-textbox-password" mode="contained-tonal" onPress={ () => handleURL("https://sesame.unice.fr/web/app/prod/Compte/Gestion/mdp") }> Modifier mon mot de passe </Button>
        <Button style={[style.buttonLogout, { marginTop: 8, height: 48, justifyContent: 'center' }]} labelStyle={{ paddingVertical: 4 }} icon="delete" mode="contained-tonal" onPress={ () => askDeleteData() }> Supprimer toutes mes données </Button>
        <Card style={{ marginTop: 16, marginBottom: 32 }}>
          <Card.Title left={(props) => <Avatar.Icon {...props} icon="information" />} />
          <Card.Content>
            <Text style={{ textAlign: 'left' }} variant="bodyLarge">Pour restaurer votre photo par défaut, veuillez vous connecter grâce à l'onglet "Notes", puis cliquez sur la flèche sous votre photo.</Text>
          </Card.Content>
        </Card>
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
  const [title, setTitle] = useState("Infos");
  const [subtitle, setSubtitle] = useState("");
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [statusUniceNotes, setStatusUniceNotes] = useState("timer-sand");
  const [statusIntracursus, setStatusIntracursus] = useState("timer-sand");
  const [statusDW, setStatusDW] = useState("timer-sand");
  const [statusADE, setStatusADE] = useState("timer-sand");
  const [statusLoginUniCA, setStatusLoginUniCA] = useState("timer-sand");

  useEffect(() => {
    if(selectedServer != servers[0].toString()) {
      setIsCustom(true);
    }
  }, []);

  const renderBackdrop = useCallback(
		(props) => (
			<BottomSheetBackdrop {...props}
        opacity={0.9}
        enableTouchThrough={false}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        style={[{ backgroundColor: 'rgba(0, 0, 0, 1)' }, StyleSheet.absoluteFillObject]} 
      />
		),
		[]
	);

  function whatSelectedServer(value) {
    var res = "contained-tonal";
    if (selectedServer == servers[0].toString() && value == "P") {
      res = "contained";
    } else if (selectedServer != servers[0].toString() && value == "C") {
      res = "contained";
    }
    return res;
  }

  function setSelectedServer(value) {
    haptics("heavy");
    if (value == "C") {
      haptics("error");

      setTitle("Attention !")
      setSubtitle("Vous vous apprêtez à changer de serveur UniceNotes. \n\nPasser à un serveur non-officiel expose vos données à des risques de sécurité majeurs, incluant le vol d'informations sensibles et les attaques de logiciels malveillants. \n\nUniceNotes ainsi que ses développeurs ne sauraient être tenus responsables des conséquences de ce changement. \n\nVoulez-vous vraiment continuer ?");
      if(bottomSheetInfo != null) {
        bottomSheetInfo.expand();
      }
    }
    if (value == "P") {
      selectedServer = servers[0];
      saveAsyncStore("server", servers[0].toString());
      isConnected = false;
      dataIsLoaded = false;
      navigation.reset({
        index: 0,
        routes: [
          { name: 'SplashScreen' }
        ],
      });
    }
  }

  async function setCustomServer(value) {
    haptics("heavy");
    if(value.includes("https://")) {
      res = await fetch(value.toString())
      if(res.status == 200) {
        selectedServer = value.toString();
        saveAsyncStore("server", selectedServer);
        isConnected = false;
        dataIsLoaded = false;
        Alert.alert("Succès", "Veuillez redémarrer l'application pour appliquer les changements.");
      } else {
        haptics("error");
        Alert.alert("Erreur", "Le serveur personnalisé n'a pas répondu correctement. \nVeuillez vérifier l'URL et réessayer.");
        return;
      }
    } else {
      haptics("error");
      Alert.alert("Erreur", "L'URL n'est pas valide ou n'utilise pas le protocole HTTPS. \nExemple : https://api.example.com");
      return;
    }
  }

  function actionBottomSheet(value) {
    if(value == false && bottomSheetInfo != null) {
      bottomSheetInfo.close();
    } else if(value == true && bottomSheetInfo != null) {
      selectedServer = "";
      setIsCustom(true);
      bottomSheetInfo.close();
    }
  }

  async function startTest() {
    setLoading(true)

    await fetch(servers[0].toString()).then((res) => {
      if(res.status == 200) {
        setStatusUniceNotes("check");
      } else {
        setStatusUniceNotes("close");
      }
    }).catch((err) => {
      setStatusUniceNotes("close");
    });

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
        <Card style={{ marginBottom: 16, marginTop: 16 }}>
          <Card.Title
              title="Changer le serveur UniceNotes"
              subtitle="⚠️ - Attention, risque de sécurité"
              left={(props) => <Avatar.Icon {...props} icon="server-network" />}
          />
          <Card.Actions>
            <Button mode={ whatSelectedServer("C") } onPress={ () => setSelectedServer("C") }>Personnalisé</Button>
            <Button mode={ whatSelectedServer("P") } onPress={ () => setSelectedServer("P") }>Par défaut</Button>
          </Card.Actions>
          { 
            isCustom ? (
              <Card.Actions>
                <TextInput
                  label="URL"
                  defaultValue={selectedServer}
                  onPressIn={() => haptics("selection")}
                  onSubmitEditing={(text) => setCustomServer(text.nativeEvent.text)}
                  style={{ marginBottom: 8, width: '100%' }}
                />
              </Card.Actions>
            ) : null 
          }
        </Card>

        <Text style={{ marginBottom: 16, textAlign: 'left' }} variant="titleMedium">Status des serveurs :</Text>

        <Button mode={"contained-tonal"} onPress={ () => startTest() } loading={loading} >Démarrer test serveurs</Button>

        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleSmall">Si ce serveur ne marche pas, c'est sûrement de ma faute (oups).</Text>
        <Chip style={{ height: 48, justifyContent: 'center', marginTop: 16 }} mode='outlined' icon={statusUniceNotes} disabled > Serveur UniceNotes Officiel </Chip>

        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleSmall">En revanche, si c'est de ce côté-ci, ce sont les serveurs de l'Université / I.U.T. qui ne fonctionnent pas. (Spoiler : je n'y peux rien :/)</Text>
        <Chip style={{ height: 48, justifyContent: 'center', marginTop: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} mode='outlined' icon={statusIntracursus} disabled > Serveur Intracursus (Notes) </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0 }} mode='outlined' icon={statusDW} disabled > Serveur Mon Dossier Web (Notes) </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderRadius: 0 }} mode='outlined' icon={statusADE} disabled > Serveur ADE (Emploi du temps) </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderTopLeftRadius: 0, borderTopRightRadius: 0, marginBottom: insets.bottom }} mode='outlined' icon={statusLoginUniCA} disabled > Serveur Login UniCA (Connexion) </Chip>
      </ScrollView>

      <BottomSheet ref={(sheet) => bottomSheetInfo = sheet} index={-1} enableDynamicSizing enablePanDownToClose contentHeight={64} bottomInset={ insets.bottom } detached={true} style={{ marginHorizontal: 24 }} backgroundStyle={{ backgroundColor: style.container.errorContainer }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onErrorContainer }} backdropComponent={renderBackdrop}>
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="headlineSmall">{title}</Text>
          <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">{subtitle}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', }}>
            <Button style={{ marginBottom: 16, marginRight: 8 }} icon="close" mode="contained" onPress={() => actionBottomSheet(false)}> Non </Button>
            <Button style={{ marginBottom: 16, backgroundColor: style.container.error }} icon="check" mode="contained" onPress={() => actionBottomSheet(true)}> Oui </Button>
          </View>
        </BottomSheetView>
      </BottomSheet>
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
            <Text style={{ marginBottom: 8, textAlign: 'left' }} variant="labelLarge">Entrez un numéro étudiant pour changer l'emploi du temps affiché :</Text>
            <TextInput style={{ marginTop: 8, marginBottom: 8 }} keyboardType='number-pad' maxLength={ 12 } label="Numéro étudiant" value={tempAde} onChangeText={setTempAde} right={<TextInput.Icon icon="content-save" onPress={() => selectCursus(tempAde, true)} />} />
            <Text style={{ marginTop: 8, textAlign: 'left' }} variant="labelLarge">Ou cliquez ci-dessous pour restaurer votre emploi du temps individuel.</Text>
            <Chip style={{ height: 48, justifyContent: 'center', marginTop: 16 }} textStyle={{ paddingVertical: 8 }} icon="information" onPress={() => selectCursus(userADEData.uid, true)}> Restaurer votre numéro : {userADEData.uid} </Chip>
            <Card style={{ marginTop: 16 }}>
              <Card.Title left={(props) => <Avatar.Icon {...props} icon="information" />} />
              <Card.Content>
                <Text style={{ textAlign: 'left' }} variant="bodyLarge">
                  {userADEData.uid == "demo" || userADEData.uid == "" || userADEData.uid == null ? 
                  "Veuillez vous connecter (sur l'onglet Notes) afin de récupérer votre numéro étudiant." : 
                  "L'emploi du temps individuel comprend les cours de votre cursus (TD, ...) ainsi que les cours de groupes dont vous faites partie (TP, ...). "}
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
            <Card style={{ marginBottom: 8 }} onPress={() => selectCursus(userADEData.cursus, true)}>
                  <Card.Cover style={{ marginBottom: 8, height: 10, backgroundColor: stringToColour(userADEData.cursus) }} />
                  <Card.Content>
                    <Text variant="titleMedium">Restaurer votre cursus : {userADEData.cursus}</Text>
                  </Card.Content>
            </Card>
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
        <Stack.Screen name="Semesters" component={Semesters} options={{ title: 'Semestres', headerShown: false, gestureEnabled: false }} />  
        <Stack.Screen name="APIConnect" component={APIConnect} options={{ title: 'Chargement en cours...', presentation: 'modal', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="ShowGrades" component={ShowGrades} options={{ title: 'Notes', headerShown: false, gestureEnabled: false}} />
        <Stack.Screen name="ShowEDT" component={ShowEDT} options={{ title: 'Emploi du temps', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="ShowENT" component={ShowENT} options={{ title: 'Espace Numérique de Travail', presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="ShowSettings" component={ShowSettings} options={{ title: 'Paramètres', headerShown: false }} />
        <Stack.Screen name="ShowUser" component={ShowUser} options={{ title: 'Mon compte', presentation: 'modal', headerShown: false, gestureEnabled: true }} />
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
    backgroundColor: choosenTheme.colors.background,
    cellBorderColor: choosenTheme.colors.surfaceVariant,
    hourText: {color: choosenTheme.colors.onBackground}
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
        title: "Notes",
        icon: Platform.OS === "ios" ? "symbol:graduationcap" : undefined,
        params: { href: "/notes" }
      },
      {
        id: "1",
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