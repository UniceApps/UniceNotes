/*

UniceNotes
Visualisez vos notes. Sans PDF.
Développé par Hugo Meleiro (@hugofnm) / MetrixMedia
MIT License
2023

*/

// ---------------------------------------------
// IMPORTS
// ---------------------------------------------

// React components
import React, { useState, useEffect, useRef, 
  useMemo, createRef, forwardRef 
} from 'react';
import { Alert, View, StyleSheet, 
  AppState, ScrollView, RefreshControl,
  Appearance, BackHandler, SafeAreaView,
  SafeAreaProvider, Keyboard
} from 'react-native';

// Material Design 3 components (React Native Paper)
import { Avatar, Text, TextInput, 
  Button, Switch, Divider, 
  ActivityIndicator, ProgressBar, Chip,
  DataTable, Card, Provider as PaperProvider,
  IconButton, Appbar, Tooltip,
  List, configureFonts
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
import BottomSheet, { BottomSheetView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

// Disable this when using Expo Go
import { setAppIcon } from "expo-dynamic-app-icon";

// ---------------------------------------------
// VARIABLES GLOBALES
// ---------------------------------------------

// IMPORTANT !!!
var appVersion = '1.4.2';
var isBeta = false;
// IMPORTANT !!!

var isConnected = false; // UniceAPI login
var dataIsLoaded = false; // JSONPDF loaded
var apiMode = "notes"; // API mode (notes, absences)
var semesters = []; // User's all semesters
var semester = ''; // Selected semesters
var calendar = {}; // User's calendar

const servers = [
  "https://api.unice.hugofnm.fr",
  "https://backup.api.unice.hugofnm.fr"
]; // UniceAPI servers

// Temporary variables - SecureStore
var username = SecureStore.getItemAsync("username").then((result) => {
  if (result != "") {
    username = result;
  } else {
    username = null;
  }
}); // User's username

var password = SecureStore.getItemAsync("passkey").then((result) => {
  if (result != "") {
    password = result;
  } else {
    password = null;
  }
}); // User's password

var name = SecureStore.getItemAsync("name").then((result) => {
  if (result != "") {
    name = result;
  } else {
    name = null;
  }
}); // User's name

// Temporary variables - AsyncStorage
var autoSet = AsyncStorage.getItem("autoSet").then((result) => {
  if (result != null) {
    autoSet = (result === 'true');
  } else {
    autoSet = true;
  }
}); // autoSet pour la moyenne générale

var hapticsOn = AsyncStorage.getItem("haptics").then((result) => {
  if (result != null) {
    hapticsOn = (result === 'true');
  } else {
    hapticsOn = true;
  }
}); // Haptics on/off

var configAverage = AsyncStorage.getItem("configAverage").then((result) => {
  if (result != null) {
    configAverage = result.toString();
  } else {
    configAverage = "";
  }
}); // Configuration de la moyenne générale

var matiereBonus = AsyncStorage.getItem("matiereBonus").then((result) => {
  if (result != null) {
    matiereBonus = result.split(";");
  } else {
    matiereBonus = [];
  }
}); // Matières bonus

var matiereMalus = AsyncStorage.getItem("matiereMalus").then((result) => {
  if (result != null) {
    matiereMalus = result.split(";");
  } else {
    matiereMalus = [];
  }
}); // Matières malus

var selectedServer = AsyncStorage.getItem("server").then((result) => {
  if (result != null && servers.includes(result.toString())) {
    selectedServer = result.toString();
  } else {
    selectedServer = servers[0].toString();
  }
}); // Serveur sélectionné

var rememberMe = true; // Remember me

var grades = []; // User's grades
var average = ""; // User's average
var admission = ""; // User's admission
var position = ""; // User's position

var absences = []; // User's absences
var retards = []; // User's retards
var exclusions = []; // User's exclusions

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
async function save(key, value) {
  await SecureStore.setItemAsync(key, value);
}

async function saveUserdata(key, value) {
  await AsyncStorage.setItem(key, value);
}

async function deleteData(warnings = false, navigation) {
  if (warnings) {
    haptics("warning");
  }

  // Suppression des données
  await SecureStore.deleteItemAsync("username");
  username = null;
  await SecureStore.deleteItemAsync("passkey");
  password = null;
  await SecureStore.deleteItemAsync("name");
  name = null;
  await AsyncStorage.removeItem("autoSet");
  autoSet = true;
  await AsyncStorage.removeItem("haptics");
  hapticsOn = true;
  await saveJSONToFile({});
  calendar = {};
  await AsyncStorage.removeItem("configAverage");
  configAverage = "";
  await AsyncStorage.removeItem("matiereBonus");
  matiereBonus = [];
  await AsyncStorage.removeItem("matiereMalus");
  matiereMalus = [];
  await AsyncStorage.removeItem("server");
  selectedServer = servers[0].toString();

  Image.clearDiskCache();
  Image.clearMemoryCache();
  if (warnings) {
    Alert.alert("Données supprimées", "Retour à la page de connexion.");
    haptics("success");
  }
  logout(navigation);
}

// Ouverture de pages web dans le navigateur par défaut
const handleURL = async (url) => {
  haptics("selection");
  await WebBrowser.openBrowserAsync(url);
};

// Fonction de déconnexion (API UniceNotes + app si "Se souvenir de moi" est désactivé)
function logout(navigation) {
  haptics("heavy");
  isConnected = false;
  isLoggedIn = false;
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

  cal.map((item) => {
    formattedCal.push({
      id : item.id,
      start: item.start_time,
      end: item.end_time,
      title: item.description,
      subtitle: item.summary,
      description: item.location,
      color: stringToColour(item.description)
    })
  });

  calendar = formattedCal;
  return formattedCal;
}

// Récupération du calendrier de l'utilisateur
async function getCalendar() {
    haptics("medium");
    var netInfos = (await Network.getNetworkStateAsync()).isInternetReachable;

    if (netInfos == true) {
      var cal = await fetch(selectedServer + '/edt/' + username.toString(), {
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Charset": "utf-8"
        }
      })

      cal = await cal.json();
      saveJSONToFile(cal);

      formattedCal = [];

      cal.map((item) => {
        formattedCal.push({
          id : item.id,
          start: item.start_time,
          end: item.end_time,
          title: item.description,
          subtitle: item.summary,
          description: item.location,
          color: stringToColour(item.description)
        })
      });

      return formattedCal;
    } else {
      formattedCal = await getCalendarFromCache();
      return formattedCal;
    }
}

// ---------------------------------------------
// FONCTIONS VIEW (ECRANS DE L'APPLICATION)
// ---------------------------------------------

// Page de transition (splashscreen)
function SplashScreen({ navigation }) {
  const [count, setCount] = useState(0);
  const [isDataStored, setIsDataStored] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(true);
  const [title, setTitle] = useState("Infos");
  const [subtitle, setSubtitle] = useState("");
  const [action, setAction] = useState("");
  const insets = useSafeAreaInsets();

  useEffect(() => { 
    if(count == 0) {
      setCount(1);
      setLoading(true);
      access();
    }
  });

  async function verifyLogin() {
    // Vérification de la version de l'application en récupérant le json contenant la dernière version
    var version, isAvailable, maintenance, netInfos = true;

    netInfos = (await Network.getNetworkStateAsync()).isInternetReachable;

    if (netInfos == false) {
      setLoading(false);
      Alert.alert("Erreur", "Vous n'êtes pas connecté à Internet ! EC=0xT");
      return false;
    }

    if (selectedServer == servers[1]) {
      Alert.alert("Serveur Backup", "Toutes les fonctionnalités ne sont pas disponibles en mode Backup.");
    }

    if (!servers.includes(selectedServer)) {
      selectedServer = servers[0];
    }

    await fetch(selectedServer + "/status")
    .then((response) => response.json())
    .then((json) => {
      version = json.version;
      if(version != null) {
        version = version.toString().replace("v", "");
      } else {
        setLoading(false);
        Alert.alert("Erreur", "Le serveur n'est pas accessible ! Essayez de changer de serveur dans les paramètres. EC=0xS");
        return false;
      }
      isAvailable = json.isAvailable;
      maintenance = json.maintenance;
    })
    .catch((error) => {
      setLoading(false);
      Alert.alert("Erreur", "Le serveur n'est pas accessible ! Essayez de changer de serveur dans les paramètres. EC=0xS");
      return false;
    });

    if (maintenance != "") {
      setLoading(false);
      showInfos("maintenance", maintenance);
      return false;
    }

    if(!isBeta && isAvailable == true && version != appVersion) {
      setLoading(false);
      showInfos("update");
      return false;
    }

    return true;
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
      setTitle("Mise à jour disponible");
      setSubtitle("Une nouvelle version de l'application est disponible. Veuillez la mettre à jour pour continuer à utiliser UniceNotes.");
      setAction("update");
    } else if(action == "maintenance") {
      setTitle("Maintenance");
      setSubtitle(overrideSubtitle);
      setAction("maintenance");
    }
    bottomSheetInfo.expand()
  }

  async function getMyCal(navigation) {
    if (selectedServer.toString() == servers[1].toString()) {
      haptics("error");
      Alert.alert("Erreur", "Le serveur backup ne peut pas être utilisé pour récupérer le calendrier. EC=0xF");
      return;
    }
    bottomSheetInfo.close();
    calendar = await getCalendarFromCache();
    navigation.navigate('ShowEDT');
  }

  function refresh() {
    bottomSheetInfo.close();
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

      <BottomSheet ref={(sheet) => bottomSheetInfo = sheet} index={-1} enableDynamicSizing enablePanDownToClose contentHeight={64} bottomInset={ insets.bottom } detached={true} style={{ marginHorizontal: 24 }} backgroundStyle={{ backgroundColor: style.container.surfaceVariant }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onSurfaceVariant }}>
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
          <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="headlineSmall">{title}</Text>
          <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">{subtitle}</Text>
          {
            action == "update" ? (
              <Button style={{ marginBottom: 16 }} icon="download" mode="contained" onPress={() => handleURL("https://notes.metrixmedia.fr/get")}>Mettre à jour</Button>
            ) : ( null )
          }
          {
            action == "maintenance" ? (
              <Button style={{ marginBottom: 16 }} icon="chef-hat" mode="contained" onPress={() => access(true)}>Ok chef !</Button>
            ) : ( null )
          }
        </BottomSheetView>
      </BottomSheet>

      <ActivityIndicator style={{ marginTop: 16 }} animating={loading} size="large" />
    </View>
  );
}

// Page OOBE (On-boarding experience aka LoginPage)
function OOBE({ navigation }) {
  const [secondCard, setSecondCard] = useState(false);
  const [thirdCard, setThirdCard] = useState(false);
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

  
  // Résultat du bouton "Se connecter"
  function handleLogin() {
    if (username == null || password == null) {
      haptics("warning");
      Alert.alert("Erreur", "Veuillez entrer un nom d'utilisateur et un mot de passe.");
    } else {
      Keyboard.dismiss();
      haptics("medium");
      setEditable(false);
      handleButtonPress();
      ssoUnice(username, password);
    }
  }

  // Connexion au SSO de l'Université Nice Côte d'Azur et vérification des identifiants
  async function ssoUnice(username, password) {
    if(!isConnected || !ok) {
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
        setEditable(true);
      }

      let json = await apiResp.json();
    
      if(json.success) {

        // Sauvegarde des identifiants si "Se souvenir de moi" est activé
        if(rememberMe) {
          save("username", username);
          save("passkey", password);
        }

        setOk(true);
        name = json.name;

        if (name == null) {
          name = "Étudiant";
        }
  
        save("name", name);

        semesters = json.semesters;
        haptics("success");
      } else {
        setEditable(true);
        haptics("warning");
        Alert.alert("Erreur", "Vos identifiants sont incorrects. EC=0xI");
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
    if(!secondCard && !thirdCard) {
      setSecondCard(!secondCard);
    }
    if(secondCard && !thirdCard) {
      setThirdCard(!thirdCard);
    }
  };

  function goToSettingsSpecial(navigation) {
    haptics("medium");
    navigation.goBack();
    navigation.navigate('ShowSettings');
  }

  return (  
    <SafeAreaView style={style.container}>
      <LottieView
        autoPlay
        loop
        resizeMode='cover'
        source={require('./assets/lottie/background_login')}
      />
      <View style={{ flex: 1, alignSelf: 'center', height:'auto', marginTop: insets.top*2 }}>
        <Animated.View style={[ animatedStyleLogo ]}>
          <Image source={require('./assets/color.png')} style={{ width: 200, height: 200 }} />
        </Animated.View>
      </View>
      {secondCard ? (
        thirdCard ? (
          <BottomSheet enableDynamicSizing contentHeight={32} bottomInset={ insets.bottom } detached={true} style={{ marginHorizontal: 24 }} backgroundStyle={{ backgroundColor: style.container.backgroundColor }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onBackground }}>
            <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
              <Text style={{ textAlign: 'left', marginBottom: 16, marginTop: 8 }} variant="displayMedium">Connexion ...</Text>
              <ActivityIndicator style={{ marginBottom: 32 }} animating={true} size="large" />
            </BottomSheetView>
          </BottomSheet>
        ) : (
          <BottomSheet enableDynamicSizing keyboardBehavior={'interactive'} keyboardBlurBehavior={"restore"} backgroundStyle={{ backgroundColor: style.container.backgroundColor }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onBackground }}>
            <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
              <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="displayMedium">Se connecter</Text>
              <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Utilisez votre compte Sésame (np123456) afin de vous connecter.</Text>
              <BottomSheetTextInput 
                  placeholder="Nom d'utilisateur"
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
                  style={{ marginBottom: 16, borderRadius: 10, fontSize: 16, lineHeight: 20, padding: 8, backgroundColor: 'rgba(151, 151, 151, 0.25)', color: choosenTheme.colors.onBackground }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} >
                  <Switch onValueChange={ (value) => setRememberMe(value) } disabled={!editable} value={rememberMe}/>
                  <Text style={{ marginLeft:8}}> Se souvenir de moi</Text>
                </View>
                <Button style={{ marginBottom: 8 }} disabled={!editable} icon="login" mode="contained" onPress={ () => handleLogin() }> Se connecter </Button>
                <Button style={{ marginBottom: insets.bottom }} icon="shield-account" onPress={() => handleURL("https://sesame.unice.fr/web/app/prod/Compte/Reinitialisation/saisieNumeroEtudiant")} > J'ai oublié mon mot de passe </Button>
            </BottomSheetView>
          </BottomSheet>
        )
      ) : (
        <BottomSheet enableDynamicSizing contentHeight={128} backgroundStyle={{ backgroundColor: style.container.backgroundColor }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onBackground }}>
            <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25}}>
              <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="displayMedium">UniceNotes</Text>
              <Text style={{ textAlign: 'left', marginBottom: 8 }} variant='titleLarge'>Application réservée à l'I.U.T. de Nice Côte d'Azur.</Text>
              <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Bienvenu·e·s sur l'application qui remplace des sites datant de la préhistoire, par une interface moderne, rapide et facile d'utilisation.</Text>
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
  const [mode, setMode] = useState("notes");
  const [jourNuit, setJourNuit] = useState("Bonjour");
  const [nextEvent, setNextEvent] = useState({summary: "Chargement...", location: "Chargement..."});
  const [nextEventLoaded, setNextEventLoaded] = useState(false);
  const insets = useSafeAreaInsets();

  function handleLogin(mode = "notes") {
    haptics("medium");
    setMode(mode);
    setLoading(true);
    if(username == "demo") {
      ssoUnice(username, password);
    } else {
      // Connexion par TouchID/FaceID
      LocalAuthentication.authenticateAsync({ promptMessage:"Authentifiez-vous pour accéder à UniceNotes." }).then((result) => {
        if (result.success) {
          ssoUnice(username, password);
        } else {
          setLoading(false);
          haptics("error");
          Alert.alert("Erreur", "Authentification annulée. EC=0xB");
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
        Alert.alert("Erreur", "Connexion au serveur impossible. EC=0xS");
        setSelectable(true);
        setLoading(false);
      }

      let json = await apiResp.json();
    
      if(json.success) { 
        isConnected = true;
        semesters = json.semesters;
        setLoading(false);
        setSelectable(true);
        haptics("success");
      } else {
        setLoading(false);
        setSelectable(true);
        haptics("warning");
        Alert.alert("Erreur", "Vos identifiants sont incorrects. EC=0xI");
      }
    }
  };

  async function getNextEvent(mode = "normal") {
    if(mode == "force") {
      setNextEvent({summary: "Chargement...", location: "Chargement..."});
    }

    if(mode == "force" || ( mode == "normal" && nextEventLoaded == false )) {
      fetch(selectedServer + "/edt/" + username.toString() + "/nextevent", {
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
        }
      });
    }
  }

  useEffect(() => {
    let date = new Date();
    let hours = date.getHours();
    if (hours >= 5 && hours < 17) {
      setJourNuit("Bonjour");
    } else {
      setJourNuit("Bonsoir");
    }

    if(isConnected) {
      switch(mode) {
        case "notes":
          apiMode = "notes";
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                { name: 'Semesters' }
              ],
            })
          );
          break;

        case "absences":
          apiMode = "absences";
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                { name: 'APIConnect'}
              ],
            })
          );
          break;
      }
    }
  }, [isConnected]);

  async function getMyCal(navigation) {
    setSelectable(false);
    setLoading(true);
    if (selectedServer.toString() == servers[1].toString()) {
      setSelectable(true);
      setLoading(false);
      haptics("error");
      Alert.alert("Erreur", "Le serveur backup ne peut pas être utilisé pour récupérer le calendrier. EC=0xF");
      return;
    }
    calendar = await getCalendar();
    setSelectable(true);
    setLoading(false);
    navigation.navigate('ShowEDT');
  }

  function getMyAbs() {
    if (selectedServer.toString() == servers[1].toString()) {
      setSelectable(true);
      setLoading(false);
      haptics("error");
      Alert.alert("Erreur", "Le serveur backup ne peut pas être utilisé pour récupérer les absences. EC=0xF");
      return;
    } else {
      handleLogin("absences");
    }
  }

  getNextEvent("normal");

  return (
    <View style={style.container}>
      <SafeAreaView style={style.container}>
        <Avatar.Image style={{ alignSelf: "left", marginBottom: 16, marginTop: insets.top*2 }} size={100} source={require('./assets/white.png')} />
        <Text style={{ textAlign: 'left' }} variant="displayLarge">{jourNuit} 👋</Text>
        <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Vous êtes connecté·e·s sous le compte de : {username} - {name}</Text>
        <Chip style={{ height: 48, marginBottom: 8, justifyContent: 'center' }} disabled={!selectable} onPress={ () => handleLogin("notes") } icon="school" >Notes</Chip>
        <Chip style={{ height: 48, marginBottom: 8, justifyContent: 'center' }} disabled={!selectable} onPress={ () => getMyAbs() } icon="account-question" >Absences</Chip>

        <Card style={{ marginBottom: 16 }} disabled={!selectable} onPress={ () => getMyCal(navigation) }>
          <Card.Title title="Prochain Cours" />
          <Card.Content>
            <Text variant="titleLarge">{nextEvent.summary}</Text>
            <Text variant="bodyMedium">{nextEvent.location}</Text>
          </Card.Content>
          <Card.Actions>
            <Chip disabled={!selectable} onPress={ () => getNextEvent("force") } icon="refresh" >Rafraîchir</Chip>
            <Chip disabled={!selectable} onPress={ () => getMyCal(navigation) } icon="calendar" >Emploi du temps</Chip>
          </Card.Actions>
        </Card>

        <View style={{ display: "flex", flexDirection: 'row', justifyContent:'center', marginBottom: 16 }}>
          <Button style={{ marginRight: 4 }} icon="account" mode="contained-tonal" onPress={ () => deleteData(false, navigation) }> Se déconnecter </Button>
          <Button style={{ marginLeft: 4 }} icon="cog" mode="contained-tonal" onPress={ () => goToSettings(navigation) }> Paramètres </Button>
        </View>

        <Divider style={{ marginBottom: 8 }} />
        <View style={{ display: "flex", flexDirection: 'row', justifyContent:'center' }}>
        <Tooltip title="Mentions légales">
            <IconButton style={{ marginBottom: 4 }} icon="license" mode="contained" onPress={ () => handleURL("https://notes.metrixmedia.fr/credits") }/>
          </Tooltip>
          <Tooltip title="Code source">
            <IconButton style={{ marginBottom: 16 }} icon="source-branch" mode="contained" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }/>
          </Tooltip>
        </View>
        <Text style={{ textAlign: 'center' }} variant='titleSmall'>Version {appVersion}</Text>
        <ActivityIndicator style={{ marginTop: 8, marginBottom: insets.bottom }} animating={loading} size="large" />
      </SafeAreaView>
    </View>
  );
}

// Page de sélection du semestre
function Semesters ({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [selectable, setSelectable] = useState(true);
  const [done, setDone] = useState(false);

  // Fonction de chargement des notes
  function loadGrades(sel) {
      setSelectable(false);
      haptics("medium");
      semester = sel.toString();
      setSelectable(true);
      navigation.navigate('APIConnect');
  }
  
  // Changement du texte en fonction de l'heure
  useEffect(() => {
    if(!done) {  
      if (semesters.length == 0 || semesters == null) {
        logout(navigation)
        Alert.alert("Erreur", "Session invalide, veuillez vous reconnecter. EC=0xP");
        return;
      }
      setDone(true);
    }
  }, [done]);

  function getMySemesters() {
    if (semesters.length == 0 || semesters == null) {
      return <Text style={{ textAlign: 'center' }} variant="titleMedium">Aucun semestre disponible. Veuillez vous reconnecter ultérieurement.</Text>

    }
    return semesters.map((semester) => (
      <Chip style={{ height: 48, marginBottom: 8, justifyContent: 'center' }} disabled={!selectable} onPress={ () => loadGrades(semester) } icon="adjust" > {semester} </Chip>
    ))
  }

  return (
    <View style={styleScrollable.container}>

      <Appbar.Header style={{ paddingTop: 0 }}>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => logout(navigation)} />
        </Tooltip>
        <Appbar.Content title="Semestres" />
        <Tooltip title="Semestres">
          <Appbar.Action icon="cog" onPress={() => goToSettings(navigation)} />
        </Tooltip>
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Image 
          source={{
            uri: selectedServer + "/avatar"
          }} 
          style={{ alignSelf: "center", marginBottom: 4, marginTop: 16, width: 125, height: 125, borderRadius: 100 }}
          placeholder={require('./assets/profile.png')}
        />
        <Text style={{ textAlign: 'center', marginBottom: 16 }} variant="titleMedium">{name}</Text>
        <Text style={{ textAlign: 'center', marginBottom: 8 }} variant='titleLarge'>Veuillez sélectionner un semestre.</Text>
        <Text style={{ textAlign: 'center', marginBottom: 16 }} variant='titleSmall'>Les semestres disponibles au visionnage sont déterminés par l'I.U.T. Le semestre en cours peut donc, ne pas étre visible en ce moment.</Text>

        <Divider style={{ marginBottom: 16 }} />

        {getMySemesters()}

        <ActivityIndicator style={{ marginTop: 16 }} animating={loading} size="large" />
      </ScrollView>
    </View>
  );
}

// Page de chargement des données (notes, absences, etc.)
function APIConnect ({ navigation }) {
  const [progress, setProgress] = useState(0.1);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if(count == 0) {
      setCount(1);
      loginAPI(apiMode);
    }
  });

  async function loginAPI(mode) {
    if(mode == "notes") {
      if(dataIsLoaded == false){
        let response = await fetch(selectedServer + '/load_pdf?sem=' + semester)
        if(response.status == 200) {
          setProgress(0.5);
        
          let pdfAPI = await fetch(selectedServer + '/scrape_pdf?sem=' + semester);
        
          if(pdfAPI.status != 200){
            Alert.alert("Erreur", "Connexion au serveur impossible. EC=0xS");
          }
        
          let json = await pdfAPI.json();
        
          setProgress(1);
          if(json.grades) {
            grades = json.grades; // toutes les notes, moyennes, noms des profs, etc.
          } else {
            haptics("error");
            Alert.alert("Erreur", "Une erreur est survenue. EC=0xG");
          }
          admission = json.admission; // admission oui/non
          average = json.average; // moyenne générale
          position = json.position; // position dans le classement
          dataIsLoaded = true;
          navigation.goBack();
          navigation.navigate('ShowGrades');
        }
        else {
          haptics("error");
          Alert.alert("Erreur", "Une erreur est survenue. EC=0xL");
        }
      }
      dataIsLoaded = true;
    } else if(mode == "absences") {
      let absAPI = await fetch(selectedServer + '/absences');
        
      if(absAPI.status != 200){
        Alert.alert("Erreur", "Connexion au serveur impossible. EC=0xS");
      }
    
      let json = await absAPI.json();
    
      setProgress(1);
      absences = json.absences; // toutes les absences
      retards = json.retards; // tous les retards
      exclusions = json.exclusions; // toutes les exclusions
      navigation.navigate('ShowAbsences');
    }
  }

  return (
    <View style={style.container}>
      <Avatar.Icon style={{ alignSelf: "center", marginBottom: 32 }} size={150} icon="sync" />
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Chargement des données...</Text>
      <ProgressBar progress={progress} style={{ marginBottom: 32 }} />
      <Button style={{ marginBottom: 16 }}icon="location-exit" mode="contained" onPress={ () => logout(navigation) }> Annuler </Button>
    </View>
  );
}

// Page d'affichage des notes
function ShowGrades( { navigation } ) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("Infos");
  const [subtitle, setSubtitle] = useState("");
  const [gradeRefs, setGradeRefs] = useState([]);
  const insets = useSafeAreaInsets();

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
      return (average)
    } else {
      return (showGlobalAverage() + " (calculée)")
    }
  }

  async function shareWith(ref) {
    haptics("medium");
    const onSaveImageAsync = async () => {
      try {
        const localUri = await captureRef(ref, {
          fileName: 'UniceNotes',
          quality: 1,
        });
        const result = await Sharing.shareAsync(localUri);
      } catch (error) {
        console.error(error);
      }
    };
    await onSaveImageAsync();
  }

  function showTable() {
    return (grades.map((item) => (
      <View ref={(view) => gradeRefs.push(view)}>
        <Card style={{ marginBottom: 16 }} >
          <Card.Title title={item.name} subtitle={"Professeur : " + item.teacher} right={(props) => <IconButton {...props} icon="dots-vertical" onPress={() => { shareWith(gradeRefs[grades.indexOf(item)]) }} />} />
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
  -- ALGORITHME DE CALCUL DE MOYENNE UNICENOTES - COPYRIGHT (c) HUGO MELEIRO - Licence MIT 
  */
  function showGlobalAverage() {
    grades.forEach(element => {
      const condition = element.name.toString().toLowerCase(); // On récupère le nom de la matière en minuscule

      if(element.average.toString() != "Pas de moyenne disponible") { // Si la moyenne est disponible

        // Vérification automatique/manuelle des absences et bonus
        if((condition.includes("absences") || condition.includes("absence") || condition.includes("bonus")) && autoSet) { // Vérification automatique
          if(condition.includes("bonus")) { // Si c'est un bonus on l'ajoute à la moyenne
            bonus += parseFloat(element.average.toString());
          }
          if(condition.includes("absences") || condition.includes("absence")) { // Si c'est un malus on le soustrait à la moyenne
            bonus -= parseFloat(element.average.toString());
          }
        } else if (!autoSet) { // Sinon vérification manuelle
          if (configAverage.includes("B")) { // User a choisi de mettre le bonus manuel
            if (matiereBonus.find((matiere) => matiere == element.name.toString())) {
              bonus += parseFloat(element.average.toString());
            }
          }
          if (configAverage.includes("M")) { // User a choisi de mettre le malus manuel
            if (matiereMalus.find((matiere) => matiere == element.name.toString())) {
              bonus -= parseFloat(element.average.toString());
            }
          }
        } 

        // Calcul
        if ((!matiereBonus.find((matiere) => matiere == element.name.toString()) && !matiereMalus.find((matiere) => matiere == element.name.toString())) && !(condition.includes("absences") || condition.includes("absence") || condition.includes("bonus")) ) { 
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

      <Appbar.Header style={{ paddingTop: 0 }}>
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
        <Button style={style.buttonActionChange} loading={loading} icon="sync" mode="contained-tonal" onPress={ () => changeSemester() }> Changer de semestre </Button>
        <Text style={{ textAlign: 'left', marginTop: 16 }} variant="titleMedium">Moyenne générale : {isCalculated()}</Text>

        { // Affiche position si disponible
          position != "" ? ( 
            <Text style={{ textAlign: 'left', marginTop: 8 }} variant="titleMedium">Position : {position}</Text>
          ) : null
        }

        <Divider style={{ marginBottom: 16, marginTop: 16 }} />
        {showTable()}
      </ScrollView>

      <BottomSheet ref={(sheet) => bottomSheetInfo = sheet} index={-1} enableDynamicSizing enablePanDownToClose contentHeight={64} bottomInset={ insets.bottom } detached={true} style={{ marginHorizontal: 24 }} backgroundStyle={{ backgroundColor: style.container.surfaceVariant }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onSurfaceVariant }}>
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
          <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="headlineSmall">{title}</Text>
          <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">{subtitle}</Text>
          <Button style={{ marginBottom: 16 }} icon="close" mode="contained" onPress={() => bottomSheetInfo.close()}> Fermer </Button>
        </BottomSheetView>
      </BottomSheet>

    </View>
  );
}

// Page d'affichage des absences
function ShowAbsences({ navigation }) {
  const [totalHours, setTotalHours] = useState(0); // Total des heures d'absences
  const [totalHoursNonJustified, setTotalHoursNonJustified] = useState(0);
  const [totalHoursJustified, setTotalHoursJustified] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if(count == 0) {
      setCount(1);
      makeStats();
    }
  });

  function calculateDuration(timeRange, string = true) {
    // Split the string into start and end time components
    const [startTimeStr, endTimeStr] = timeRange.split('-');
  
    // Extract the hour and minute components
    var startHour = parseInt(startTimeStr.slice(0, 2), 10);
    var startMinute = parseInt(startTimeStr.slice(3, 5), 10);
    var endHour = parseInt(endTimeStr.slice(0, 2), 10);
    var endMinute = parseInt(endTimeStr.slice(3, 5), 10);
  
    // Create Date objects for the start and end times
    var startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);
  
    var endDate = new Date();
    endDate.setHours(endHour, endMinute, 0, 0);
  
    // Calculate the time difference in milliseconds
    var durationMs = endDate - startDate;
  
    // Convert milliseconds to hours and minutes
    var hours = Math.floor(durationMs / 3600000); // 1 hour = 3600000 ms
    var minutes = Math.round((durationMs % 3600000) / 60000); // 1 minute = 60000 ms
  
    // Format the duration as a string
    var durationString = `${hours}h${minutes}`;

    if(string) {
      return durationString;
    } else {
      return hours + (minutes / 60);
    }
  }

  function makeStats() {
    var totalHours = 0;
    var totalHoursNonJustified = 0;
    var totalHoursJustified = 0;
    absences.map((item) => {
      justified = item.justified ? true : false;
      if(justified == true) {
        totalHoursJustified += calculateDuration(item.hour, false);
      } else {
        totalHoursNonJustified += calculateDuration(item.hour, false);
      }
      totalHours += calculateDuration(item.hour, false);
    })
    retards.map((item) => {
      justified = item.justified ? true : false;
      if(justified == true) {
        totalHoursJustified += calculateDuration(item.hour, false);
      } else {
        totalHoursNonJustified += calculateDuration(item.hour, false);
      }
      totalHours += calculateDuration(item.hour, false);
    })
    exclusions.map((item) => {
      justified = item.justified ? true : false;
      if(justified == true) {
        totalHoursJustified += calculateDuration(item.hour, false);
      } else {
        totalHoursNonJustified += calculateDuration(item.hour, false);
      }
      totalHours += calculateDuration(item.hour, false);
    })

    setTotalHours(totalHours);
    setTotalHoursNonJustified(totalHoursNonJustified);
    setTotalHoursJustified(totalHoursJustified);
  }

  function showAbsences() {
    if (absences.length > 0) {
      return (absences.map((item) => (
        <View>
          <Card style={{ marginBottom: 16, backgroundColor: choosenTheme.colors.primaryContainer }} >
            <Card.Title title={item.class} subtitle={"Professeur : " + item.prof} />
            <Card.Content>
              <Text>Date : {item.date}</Text>
              <Text>Heure : {item.hour}</Text>
              <Text>Durée : {calculateDuration(item.hour)}</Text>
              <Text>Type de cours : {item.type}</Text>
              <Text>Raison : {item.reason}</Text>
              <Text>Justifié : {item.justified ? 'Oui' : 'Non'}</Text>
            </Card.Content>
          </Card>
          <Divider style={{ marginBottom: 16 }} />
        </View>
      )))
    }
  }

  function showRetards() {
    if (retards.length > 0) {
      return (retards.map((item) => (
        <View>
          <Card style={{ marginBottom: 16, backgroundColor: choosenTheme.colors.retard }} >
            <Card.Title title={item.class} subtitle={"Professeur : " + item.prof} />
            <Card.Content>
              <Text>Date : {item.date}</Text>
              <Text>Heure : {item.hour}</Text>
              <Text>Durée : {calculateDuration(item.hour)}</Text>
              <Text>Type de cours : {item.type}</Text>
              <Text>Raison : {item.reason}</Text>
              <Text>Justifié : {item.justified ? 'Oui' : 'Non'}</Text>
            </Card.Content>
          </Card>
          <Divider style={{ marginBottom: 16 }} />
        </View>
      )))
    }
  }

  function showExclusions() {
    if (exclusions.length > 0) {
      return (exclusions.map((item) => (
        <View>
          <Card style={{ marginBottom: 16, backgroundColor: choosenTheme.colors.errorContainer }} >
            <Card.Title title={item.class} subtitle={"Professeur : " + item.prof} />
            <Card.Content>
              <Text>Date : {item.date}</Text>
              <Text>Heure : {item.hour}</Text>
              <Text>Durée : {calculateDuration(item.hour)}</Text>
              <Text>Type de cours : {item.type}</Text>
              <Text>Raison : {item.reason}</Text>
              <Text>Justifié : {item.justified ? 'Oui' : 'Non'}</Text>
            </Card.Content>
          </Card>
          <Divider style={{ marginBottom: 16 }} />
        </View>
      )))
    }
  }

  return (
    <View style={styleScrollable.container}>
      <Appbar.Header style={{ paddingTop: 0 }}>
        <Appbar.BackAction onPress={() => logout(navigation)} />
        <Appbar.Content title="Absences" />
        <Appbar.Action icon="cog" onPress={() => goToSettings(navigation)} />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Button style={ style.buttonActionChange } icon="plus" mode="contained-tonal" onPress={() => handleURL("https://absences.metrixmedia.fr")}> Justifier mon absence </Button>

        <Text style={{ textAlign: 'left', marginTop: 16 }} variant="titleMedium">Total des heures d'absences : {totalHours}h</Text>
        <Text style={{ textAlign: 'left' }} variant="titleMedium">Non justifiées : {totalHoursNonJustified}h</Text>
        <Text style={{ textAlign: 'left' }} variant="titleMedium">Justifiées : {totalHoursJustified}h</Text>

        <List.Accordion style={{ marginTop: 16 }}
          title={absences.length + " absence(s)"}
          left={props => <List.Icon {...props} icon="account-question" />}>
          {showAbsences()}
        </List.Accordion>

        <List.Accordion
          title={retards.length + " retard(s)"}
          left={props => <List.Icon {...props} icon="camera-timer" />}>
          {showRetards()}
        </List.Accordion>

        <List.Accordion
          title={exclusions.length + " exclusion(s)"}
          left={props => <List.Icon {...props} icon="skull-crossbones" />}>
          {showExclusions()}
        </List.Accordion>
      </ScrollView>
    </View>
  );
}

// Page d'affichage de l'emploi du temps
function ShowEDT( { navigation } ) {
  const [cal, setCalendar] = useState(calendar);
  const [count, setCount] = useState(0);
  const [view, setView] = useState("threeDays");
  const [viewIcon, setViewIcon] = useState("magnify-plus");
  const [title, setTitle] = useState("Infos");
  const [subtitle, setSubtitle] = useState("");
  const insets = useSafeAreaInsets();
  const calendarRef = useRef(null);
  
  useEffect(() => { 
    if(count == 0) {
      setCount(1);
      if(cal == null) {
        async function readJSONonAwait() {
          return await readJSONFromFile();
        }
        cal = JSON.parse(readJSONonAwait());
        setCalendar(cal);
      }
      setTimeout(() => goToToday(), 500);
    }
  });

  function goToToday() {
    haptics("medium");
    var today = new Date();
    calendarRef.current?.goToDate({date: today, hourScroll: true, animatedDate: true, animatedHour: true})
  }

  function changeView() {
    haptics("medium");
    if(view == "threeDays") {
      setView("day");
      setViewIcon("magnify-minus");
    } else {
      setView("threeDays");
      setViewIcon("magnify-plus");
    }
    setTimeout(() => goToToday(), 500);
  }

  function showInfos(eventItem){
    var res;
    res = eventItem.subtitle + "\nSalle : " + eventItem.description
    setTitle(eventItem.title);
    setSubtitle(res);
    bottomSheetInfo.expand()
  }

  return (
    <View style={styleScrollable.container}>
      <Appbar.Header style={{ paddingTop: 0 }}>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => navigation.goBack()} />
        </Tooltip>
        <Appbar.Content title="EDT" />
        <Tooltip title="Aujourd'hui">
          <Appbar.Action icon="update" onPress={() => goToToday()}/>
        </Tooltip>
        <Tooltip title="Changer la vue">
          <Appbar.Action icon={viewIcon} onPress={() => changeView()} />
        </Tooltip>
        <Tooltip title="Paramètres">
          <Appbar.Action icon="cog" onPress={() => goToSettings(navigation)} />
        </Tooltip>
      </Appbar.Header>

      <TimelineCalendar theme={styleCalendar.container} ref={calendarRef} onPressEvent={(eventItem) => showInfos(eventItem)} scrollToNow={true} viewMode={view} events={cal} allowPinchToZoom start={5} end={22} renderEventContent={(event) => {
          return (
            <SafeAreaView style={{ margin: 10 }}>
              <Text style={{ fontFamily:'', fontWeight:'bold', color:'black' }}>{event.title}</Text>
              <Text style={{ color:'black' }}>{event.subtitle}</Text>
              <Text style={{ color:'black' }}>{event.description}</Text>
            </SafeAreaView>
          );
      }}/>
      <BottomSheet ref={(sheet) => bottomSheetInfo = sheet} index={-1} enableDynamicSizing enablePanDownToClose contentHeight={64} bottomInset={ insets.bottom } detached={true} style={{ marginHorizontal: 24 }} backgroundStyle={{ backgroundColor: style.container.surfaceVariant }} handleIndicatorStyle={{ backgroundColor: choosenTheme.colors.onSurfaceVariant }}>
        <BottomSheetView style={{ paddingLeft: 25, paddingRight: 25 }}>
          <Text style={{ textAlign: 'left', marginBottom: 8, marginTop: 8 }} variant="headlineSmall">{title}</Text>
          <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">{subtitle}</Text>
          <Button style={{ marginBottom: 16 }} icon="close" mode="contained" onPress={() => bottomSheetInfo.close()}> Fermer </Button>
        </BottomSheetView>
      </BottomSheet>

    </View>
  );
}

// Page de paramètres
function ShowSettings( { navigation } ) {
  const [vibrations, setVibrations] = useState(hapticsOn);

  function askDeleteData() {
    haptics("warning");
    Alert.alert("Suppression des données", "Voulez-vous vraiment supprimer les données de l'application ?", [
      {
        text: "Annuler",
        style: "cancel"
      },
      { 
        text: "Supprimer", 
        onPress: (() => deleteData(true, navigation))
      }]);
  }

  function goBack() {
    haptics("medium");
    navigation.goBack();
  }

  function setHapticsBool(value) {
    setVibrations(value);
    hapticsOn = value;
    saveUserdata("haptics", value.toString());
    haptics("error");
  }

  function setSelectedServer(value) {
    if (value == "B") {
      selectedServer = servers[1];
      saveUserdata("server", servers[1].toString());
      fetch(servers[1].toString());
    }
    if (value == "P") {
      selectedServer = servers[0];
      saveUserdata("server", servers[0].toString());
    }
    logout(navigation);
  }

  function whatSelectedServer(value) {
    var res = "contained-tonal";
    if (selectedServer == servers[1].toString() && value == "B") {
      res = "contained";
    } else if (selectedServer == servers[0].toString() && value == "P") {
      res = "contained";
    }
    return res;
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

  function crashIt() {
    throw new Error('This is a crash');
  }

  return (
    <View style={styleScrollable.container}>

      <Appbar.Header style={{ paddingTop: 0 }}>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => goBack()} />
        </Tooltip>
        <Appbar.Content title="Paramètres" />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Button style={{ marginBottom: 8 }} icon="calculator" mode="contained-tonal" onPress={ () => navigation.navigate('AverageConfig')}>Configuration de la moyenne générale</Button>
        <Button style={{ marginBottom: 8 }} icon="bug" mode="contained-tonal" onPress={ () => handleURL("https://notes.metrixmedia.fr/bug") }> Signaler un bug </Button>
        <Button style={[style.buttonLogout, { height: 48, justifyContent: 'center' }]} icon="delete" mode="contained-tonal" onPress={ () => askDeleteData() }> Supprimer toutes mes données </Button>

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
              title="Sélection du serveur"
              subtitle="Ne fonctionnera plus sous v1.5"
              left={(props) => <Avatar.Icon {...props} icon="server-network" />}
          />
          <Card.Actions>
            <Button mode={ whatSelectedServer("B") } onPress={ () => setSelectedServer("B") }>Allemagne</Button>
            <Button mode={ whatSelectedServer("P") } onPress={ () => setSelectedServer("P") }>France</Button>
          </Card.Actions>
        </Card>

        <Divider style={{ marginTop: 16 }} />

        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">UniceNotes</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">Visualisez vos notes. Sans PDF.</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">© 2023 - MetrixMedia / hugofnm</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">⚡ Version : {appVersion}</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">❤️ Fièrement développé par un GEII : 
          <Text style={style.textLink} onPress={() => handleURL("https://github.com/hugofnm")}> @hugofnm </Text>
        </Text>

        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleSmall">UniceNotes n'est lié d'aucune forme à l'Université Côte d'Azur ou à l'I.U.T. de Nice Côte d'Azur.</Text>
        <Button style={{ marginTop: 16 }} icon="license" onPress={ () => handleURL("https://notes.metrixmedia.fr/credits") }> Mentions légales </Button>
        <Button style={{ marginTop: 4 }} icon="account-child-circle" onPress={ () => handleURL("https://notes.metrixmedia.fr/privacy") }> Clause de confidentialité </Button>
        <Button style={{ marginTop: 4 }} icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }> Code source </Button>

        { // Bouton de test de crash
          isBeta ? ( 
            <>
              <Button style={{ marginTop: 4 }} icon="bug" onPress={ () => crashIt() }> Forcer un crash de l'app </Button> 
            </>
            ) : null
        }

        <Divider style={{ marginTop: 16 }} />
        
      </ScrollView>
    </View>
  );
}

// Page de changement d'icône
function IconConfig( { navigation } ) {
  
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
      <Appbar.Header>
        <Tooltip title="Accueil">
          <Appbar.BackAction onPress={() => navigation.goBack()} />
        </Tooltip>
        <Appbar.Content title="Icône" />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleSmall">Choisissez votre icône :</Text>
        <Chip style={{ height: 48, justifyContent: 'center', marginTop: 16, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} avatar={<Image size={24} source={require('./assets/icon.png')}/>} onPress={ () => changeIconHome("unicenotes") }> Par défaut </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginTop: 1 }} avatar={<Image size={24} source={require('./assets/icons/icon_magnet.png')}/>} onPress={ () => changeIconHome("magnet") }> Magnet </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginTop: 1 }} avatar={<Image size={24} source={require('./assets/icons/icon_ardente.png')}/>} onPress={ () => changeIconHome("ardente") }> Ardente </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginTop: 1 }} avatar={<Image size={24} source={require('./assets/icons/icon_beach.png')}/>} onPress={ () => changeIconHome("beach") }> Beach </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginTop: 1 }} avatar={<Image size={24} source={require('./assets/icons/icon_glitched.png')}/>} onPress={ () => changeIconHome("glitched") }> Glitched (par @f.eli0tt)</Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginTop: 1 }} avatar={<Image size={24} source={require('./assets/icons/icon_melted.png')}/>} onPress={ () => changeIconHome("melted") }> Melted </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginTop: 1 }} avatar={<Image size={24} source={require('./assets/icons/icon_text.png')}/>} onPress={ () => changeIconHome("text") }> Text </Chip>
        <Chip style={{ height: 48, justifyContent: 'center', borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 1 }} avatar={<Image size={24} source={require('./assets/icons/icon_zoomed.png')}/>} onPress={ () => changeIconHome("zoomed") }> Zoomed </Chip>
        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleSmall">Vous trouvez pas "l'icône" qu'il vous faut ? Envoyez-nous vos oeuvres d'art à <Text style={style.textLink} onPress={() => Linking.openURL("mailto://oeuvredartpourlappliunicenotes@metrixmedia.fr")}> oeuvredartpourlappliunicenotes@metrixmedia.fr </Text></Text>
      </ScrollView>
    </View>
  );
}

// Page de configuration de la moyenne générale
function AverageConfig( { navigation } ) {
  const [automatique, setAutomatique] = useState(autoSet);

  const [malus, setMalus] = useState(configAverage.includes("M"));
  const [bonus, setBonus] = useState(configAverage.includes("B"));

  const [matiereB, setMatiereBonus] = useState(matiereBonus.toString());
  const [matiereM, setMatiereMalus] = useState(matiereMalus.toString());

  function validate() {
    Keyboard.dismiss();
    var config = "";
    if(malus) {
      matiereMalus = matiereM.split(";");
      config += "M ";
      saveUserdata("matiereMalus", matiereMalus.toString());
      
    }
    if(bonus) {
      matiereBonus = matiereB.split(";");
      config += "B ";
      saveUserdata("matiereBonus", matiereBonus.toString());
    }
    configAverage = config;
    saveUserdata("configAverage", config);
    navigation.goBack();
  }

  function helpMe() {
    Keyboard.dismiss();
    Alert.alert("Syntaxe", "Vous devez écrire le nom de la matière à l'identique comme affichée sur UniceNotes séparée par un point-virgule. \n Exemple : 'Absences S1;Bonus Sport'");
  }

  function setAutoSet(value) {
    autoSet = value;
    setAutomatique(value);
    saveUserdata("autoSet", value.toString());
  }

  function disable(value) {
    switch(value) {
      case "B":
        setBonus(!bonus);
        SecureStore.deleteItemAsync("matiereBonus");
        matiereBonus = [];
        break;
      case "M":
        setMalus(!malus);
        SecureStore.deleteItemAsync("matiereMalus");
        matiereMalus = [];
        break;
    }
  }

  return (
    <View style={ styleScrollable.container }>
      <Appbar.Header>
        <Appbar.Content title="Moyenne" />
      </Appbar.Header>

      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleLarge'>Afin de pouvoir afficher votre moyenne générale correctement, vous devez configurer les bonus et malus appliqués.</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} >
          <Switch onValueChange={ () => setAutoSet(!autoSet) } value={autoSet}/>
          <Text style={{ marginLeft:8}}> Automatique (recommandé)</Text>
      </View>

      { // Montre switch bonus
        !autoSet ? ( 
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom:8 }} >
              <Switch onValueChange={ () => disable("B") } value={bonus}/>
              <Text style={{ marginLeft: 8, marginBottom: 8}}> Bonus</Text>
          </View>
        ) : null
      }

      { // Matière bonus
        bonus ? ( 
          <><TextInput
            label="Matières bonus"
            defaultValue={matiereB.toString()}
            onChangeText={(text) => setMatiereBonus(text)}
            onPressIn={() => haptics("selection")}
            right={<TextInput.Icon icon="information" onPress={ () => helpMe() } />}
            onSubmitEditing={() => Keyboard.dismiss()}
            style={{ marginBottom: 16 }}
          /></> ) : null
      }
        
      { // Montrer switch malus
        !autoSet ? ( 
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom:8 }} >
              <Switch onValueChange={ () => disable("M") } value={malus}/>
              <Text style={{ marginLeft:8}}> Malus</Text>
          </View>
        ) : null
      }

      { // Matière malus
        malus ? ( 
          <><TextInput
            label="Matières malus"
            defaultValue={matiereM.toString()}
            onChangeText={(text) => setMatiereMalus(text)}
            onPressIn={() => haptics("selection")}
            right={<TextInput.Icon icon="information" onPress={ () => helpMe() } />}
            onSubmitEditing={() => Keyboard.dismiss()}
            style={{ marginBottom: 8 }}
          /></> ) : null
      }

      <Button style={{ marginTop: 8 }} icon="check" mode="contained" onPress={() => validate()}> Valider </Button>
      </ScrollView>
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
        <Stack.Screen name="ShowAbsences" component={ShowAbsences} options={{ title: 'Absences', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="ShowSettings" component={ShowSettings} options={{ title: 'Paramètres', headerShown: false }} />
        <Stack.Screen name="IconConfig" component={IconConfig} options={{ title: 'Icône', presentation: 'modal', headerShown: false, gestureEnabled: true  }} />
        <Stack.Screen name="AverageConfig" component={AverageConfig} options={{ title: 'Configuration', presentation: 'modal', headerShown: false, gestureEnabled: false }} />
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
  
  useEffect(() => {
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