/*

UniceNotes
Visualisez vos notes. Sans PDF.
Développé par Hugo Meleiro (@hugofnm)
MIT License

*/

// ---------------------------------------------
// IMPORTS
// ---------------------------------------------

// React API
import React, { useState, useEffect, useRef } from 'react';
import { Alert, View, StyleSheet, 
  StatusBar, ScrollView, RefreshControl,
  Appearance, BackHandler, SafeAreaView,
  SafeAreaProvider, Keyboard, AppState
} from 'react-native';

// Material Design 3 API (React Native Paper)
import { Avatar, Text, TextInput, 
  Button, Switch, Divider, 
  ActivityIndicator, ProgressBar, Chip,
  DataTable, Card, Provider as PaperProvider,
  IconButton, Banner
} from 'react-native-paper';

// Expo API
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

// Third-party API
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TimelineCalendar, EventItem, MomentConfig } from '@howljs/calendar-kit';
import 'react-native-gesture-handler';
import { log } from 'react-native-reanimated';

// ---------------------------------------------
// VARIABLES GLOBALES
// ---------------------------------------------

// IMPORTANT !!!
var appVersion = '1.2.1';
var isBeta = false;
// IMPORTANT !!!

var isConnected = false; // UniceAPI login
var dataIsLoaded = false; // JSONPDF loaded
var semesters = []; // User's all semesters
var semester = ''; // Selected semesters

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

var calendar = AsyncStorage.getItem("calendar").then((result) => {
  if (result != null) {
    calendar = JSON.parse(result);
  } else {
    calendar = null;
  }
}); // Emploi du temps sur le calendrier

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
  if (result != null && servers.includes(result)) {
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

var subjects = []; // User's subjects

// ---------------------------------------------
// FONCTIONS GLOBALES
// ---------------------------------------------

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
  await AsyncStorage.removeItem("calendar");
  calendar = null;
  await AsyncStorage.removeItem("configAverage");
  configAverage = "";
  await AsyncStorage.removeItem("matiereBonus");
  matiereBonus = [];
  await AsyncStorage.removeItem("matiereMalus");
  matiereMalus = [];

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
    return pSBC(0.4, colour);
}

// Récupération du calendrier de l'utilisateur
async function getCalendar() {
    haptics("medium");
    let cal = await fetch(selectedServer + '/edt', {
      method: 'POST',
      body: JSON.stringify({
        username: username
      }),
      headers: {
        "Accept": "application/json",
        "Content-type": "application/json",
        "Charset": "utf-8"
      }
    })

    // TODO : Offline mode
    /*
    if (cal.status != 200) {
      cal = AsyncStorage.getItem("calendar").then((result) => {
        if (result != null) {
          cal = JSON.parse(result);
          setLoading(false);
        } else {
          setLoading(false);
          haptics("error");
          Alert.alert("Erreur", "Impossible de récupérer le calendrier. EC=0xC");
          return;
        }
      });
    }
    */

    cal = await cal.json();

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

    saveUserdata("calendar", formattedCal.toString());
    calendar = formattedCal;
}

// ---------------------------------------------
// FONCTIONS VIEW (ECRANS DE L'APPLICATION)
// ---------------------------------------------

// Page de transition (splashscreen)
function SplashScreen({ navigation }) {
  const [count, setCount] = useState(0);
  const [isDataStored, setIsDataStored] = useState(false);

  useEffect(() => { 
    if(count == 0) {
      setCount(1);
      verifyLogin();
    }
  });

  async function verifyLogin() {
    // Vérification de la version de l'application en récupérant le json contenant la dernière version
    var version, isAvailable, maintenance;

    if (selectedServer == servers[1]) {
      Alert.alert("Backup", "Vous êtes actuellement connecté au serveur Backup. Toutes les fonctionnalités ne sont pas disponibles.");
    }

    await fetch(selectedServer + '/status')
    .then((response) => response.json())
    .then((json) => {
      version = json.version;
      isAvailable = json.isAvailable;
      maintenance = json.maintenance;
    })

    if (maintenance != "") {
      Alert.alert("Maintenance", maintenance);
    }

    version = version.toString().replace("v", "")
    if(!isBeta) {
      if(isAvailable == true) {
        if(version != appVersion) {
          Alert.alert("Mise à jour disponible", "Une nouvelle version de l'application est disponible. Veuillez la mettre à jour pour continuer à utiliser UniceNotes.", 
          [ { text: "Mettre à jour", onPress: () => handleURL("https://notes.metrixmedia.fr/get") } ]);
        }
      }
    }

    // Vérification de la disponibilité des usernames et mots de passe enregistrés
    if(!isDataStored) {
      setUsername(await SecureStore.getItemAsync("username"));
      setPassword(await SecureStore.getItemAsync("passkey"));

      if (username != null && password != null) {
        navigation.navigate('LoggedPage');
      } else {
        username = null;
        password = null;
        setIsDataStored(false);
        navigation.navigate('Login');
      }
    }
  }

  function setUsername(text) {
    username = text;
  }

  function setPassword(text) {
    password = text;
  }

  function betaText() {
    if(isBeta) {
      return (
        <Text style={{ textAlign: 'center' }} variant="displaySmall">BETA</Text>
      );
    }
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: choosenTheme.colors.background }}>
      <Image source={require('./assets/color.png')} style={{ width: 200, height: 200, marginBottom: 16 }} />
      <Text style={{ textAlign: 'center' }} variant="displayLarge">UniceNotes</Text>

      {betaText()}

    </View>
  );
}

// Page de connexion à l'application (login)
function LoginPage({ navigation }) {

  const [loading, setLoading] = useState(false);
  const [seePassword, setSeePassword] = useState(true);
  const [editable, setEditable] = useState(true);
  const [remember, setRemember] = useState(rememberMe);

  
  // Résultat du bouton "Se connecter"
  function handleLogin() {
    if (username == null || password == null) {
      haptics("warning");
      Alert.alert("Erreur", "Veuillez entrer un nom d'utilisateur et un mot de passe.");
    } else {
      Keyboard.dismiss();
      haptics("medium");
      setLoading(true);
      setEditable(false);
      ssoUnice(username, password);
    }
  }

  // Connexion au SSO de l'Université Nice Côte d'Azur et vérification des identifiants
  async function ssoUnice(username, password) {
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
        setLoading(false);
        setEditable(true);
      }

      let json = await apiResp.json();
    
      if(json.success) {

        // Sauvegarde des identifiants si "Se souvenir de moi" est activé
        if(rememberMe) {
          save("username", username);
          save("passkey", password);
        }

        isConnected = true;
        name = json.name;
        semesters = json.semesters;
        setLoading(false);
        haptics("success");
        navigation.navigate('Semesters');
      } else {
        setLoading(false);
        setEditable(true);
        haptics("warning");
        Alert.alert("Erreur", "Vos identifiants sont incorrects. EC=0xI");
      }
    }
  };

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

  return (
    <View style={style.container}>
      <Avatar.Image style={{ alignSelf: "center", marginBottom: 8, marginTop: 64 }} size={100} source={require('./assets/white.png')} />
      <Text style={{ textAlign: 'center' }} variant="displayLarge">Bienvenue.</Text>
      <Text style={{ textAlign: 'center', marginBottom: 16 }} variant='titleMedium'>Veuillez entrer vos identifiants Sésame (I.U.T. Nice Côte d'Azur) pour continuer.</Text>
      <TextInput
        label="Nom d'utilisateur"
        defaultValue={username}
        onChangeText={(text) => setUsername(text)}
        onPressIn={() => haptics("selection")}
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.focus()}
        editable={editable}
        style={{ marginBottom: 8 }}
      />
      <TextInput
        ref={(input) => passwordInput = input}
        label='Mot de passe'
        defaultValue={password}
        onChangeText={(text) => setPassword(text)}
        onPressIn={() => haptics("selection")}
        secureTextEntry={seePassword}
        returnKeyType="go"
        editable={editable}
        right={<TextInput.Icon icon="eye" onPress={ () => setSeePassword(!seePassword) } />}
        style={{ marginBottom: 16 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }} >
          <Switch onValueChange={ (value) => setRememberMe(value) } disabled={!editable} value={rememberMe}/>
          <Text style={{ marginLeft:8}}> Se souvenir de moi</Text>
      </View>
      <Button style={{ marginBottom: 16 }} disabled={!editable} icon="login" mode="contained-tonal" onPress={ () => handleLogin() }> Se connecter </Button>
      <Divider style={{ marginBottom: 16 }} />
      <Text style={{ textAlign: 'center', marginBottom: 16 }} variant='titleMedium'>Vos données sont sécurisées et ne sont sauvegardées que sur votre téléphone.</Text>
      <Button style={{ marginBottom: 4 }} icon="shield-account" onPress={ () => handleURL("https://sesame.unice.fr") }> J'ai oublié mon mot de passe </Button>
      <Button style={{ marginBottom: 4 }} icon="license" onPress={ () => handleURL("https://notes.metrixmedia.fr/credits") }> Mentions légales </Button>
      <Button style={{ marginBottom: 16 }} icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }> Code source </Button>
      <ActivityIndicator animating={loading} size="large" />
    </View>
  );
}

// Page de connexion à l'application si les identifiants sont sauvegardés
function LoggedPage({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [selectable, setSelectable] = useState(true);

  function handleLogin() {
    haptics("medium");
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
        navigation.navigate('Semesters');
      } else {
        setLoading(false);
        setSelectable(true);
        haptics("warning");
        Alert.alert("Erreur", "Vos identifiants sont incorrects. EC=0xI");
      }
    }
  };

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
    await getCalendar(navigation);
    setSelectable(true);
    setLoading(false);
    navigation.navigate('ShowEDT');
  }

  return (
    <View style={style.container}>
      <SafeAreaView style={style.container}>
        <Avatar.Image style={{ alignSelf: "center", marginBottom: 16, marginTop: 32 }} size={100} source={require('./assets/white.png')} />
        <Text style={{ textAlign: 'center' }} variant="displayLarge">Bienvenue.</Text>
        <Text style={{ textAlign: 'center', marginBottom: 16 }} variant='titleMedium'>Veuillez sélectionner votre nom d'utilisateur pour continuer.</Text>
        <Chip style={{ height: 64, marginBottom: 8 }} disabled={!selectable} onPress={ () => handleLogin() } icon="face-recognition" >Notes | {username} - {name}</Chip>
        <Chip style={{ height: 32, marginBottom: 16 }} disabled={!selectable} onPress={ () => getMyCal(navigation) } icon="calendar" >Emploi du temps</Chip>
        <Button style={{ marginBottom: 8 }} icon="account" mode="contained-tonal" onPress={ () => deleteData(false, navigation) }> Changer d'utilisateur </Button>
        <Button style={{ marginBottom: 16 }} icon="cog" mode="contained-tonal" onPress={ () => goToSettings(navigation) }> Paramètres </Button>
        <Divider style={{ marginBottom: 16 }} />
        <Button style={{ marginBottom: 4 }} icon="license" onPress={ () => handleURL("https://notes.metrixmedia.fr/credits") }> Mentions légales </Button>
        <Button style={{ marginBottom: 16 }} icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }> Code source </Button>
        <ActivityIndicator animating={loading} size="large" />
      </SafeAreaView>
    </View>
  );
}

// Page de sélection du semestre
function Semesters ({ navigation }) {
  const [jourNuit, setJourNuit] = useState("Bonjour");
  const [large, setLarge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectable, setSelectable] = useState(true);

  // Correction du nom de l'étudiant
  name = name
    .split(" ")
    .map(word => word[0].toUpperCase() + word.substring(1).toLowerCase())
    .join(" ");

  // Fonction de chargement des notes
  function loadGrades(sel) {
      setSelectable(false);
      haptics("medium");
      semester = sel.toString();
      setSelectable(true);
      navigation.navigate('APIConnect', { semester: sel });
  }
  
  // Changement du texte en fonction de l'heure
  useEffect(() => {
    save("name", name);
    let date = new Date();
    let hours = date.getHours();
    if (hours >= 5 && hours < 17) {
      setJourNuit("Bonjour");
    } else {
      setJourNuit("Bonsoir");
    }
  }, []);

  function getMySemesters() {
    if (semesters.length >= 3) {
      setLarge(true);
    }

    return semesters.map((semester) => (
      <Button style={{ marginBottom: 8 }} disabled={!selectable} icon="arrow-right-drop-circle" mode="contained-tonal" onPress={ () => loadGrades(semester) }> {semester} </Button>
    ))
  }

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
    await getCalendar(navigation);
    setSelectable(true);
    setLoading(false);
    navigation.navigate('ShowEDT');
  }

  return (
    <View style={style.container}>
      <Image 
        source={{
          uri: selectedServer + "/avatar"
        }} 
        style={{ alignSelf: "center", marginBottom: 16, width: 125, height: 125, borderRadius: 100 }}
        placeholder={require('./assets/profile.png')}
      />
      <Text style={{ textAlign: 'left' }} variant="displayLarge">{jourNuit},</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayMedium">{name} !</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Veuillez sélectionner un semestre.</Text>

      {getMySemesters()}
      <Button style={{ marginBottom: 8, marginTop: 8 }} disabled={!selectable} icon="calendar" mode="contained-tonal" onPress={ () => getMyCal(navigation) }> Emploi du temps </Button>
      <Button style={{ marginBottom: 8, marginTop: 8 }} icon="cog" mode="contained-tonal" onPress={ () => goToSettings(navigation) }> Paramètres </Button>
      <Button style={ style.buttonLogout } icon="logout" mode="contained-tonal" onPress={ () => logout(navigation) }> Se déconnecter </Button>
      <ActivityIndicator style={{ marginTop: 16 }} animating={loading} size="large" />
    </View>
  );
}

// Page de chargement des données
function APIConnect ({ navigation }) {
  const [progress, setProgress] = useState(0.1);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if(count == 0) {
      setCount(1);
      loginAPI();
    }
  });

  async function loginAPI() {
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
      res = "Note : " + grade[1][0] + " Coefficient : " + grade[1][1];
    }
    else {
      res = "Note : Non disponible" + " Coefficient : " + (grade[1][0].replace("(coeff ", "")).replace(")","");
    }
    Alert.alert(grade[0], res);
  }

  function isCalculated() {
    if (average != "") {
      return (average)
    } else {
      return (showGlobalAverage() + " (calculée)")
    }
  }
  
  function isRanking() {
    if (position != "") {
      return (position)
    } else {
      return ("Non disponible")
    }
  }

  function showTable() {
    return (grades.map((item) => (
      <View>
        <Card style={{ marginBottom: 16 }} >
          <Card.Title title={item.name} subtitle={"Professeur : " + item.teacher} />
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
      if(element.average.toString() != "Pas de moyenne disponible") { // Si la moyenne est disponible

        // Vérification automatique des absences et bonus
        if((element.name.toString().toLowerCase().includes("absences") || element.name.toString().toLowerCase().includes("bonus")) && autoSet) {
          if(element.name.toString().toLowerCase().includes("absences")) { // Si c'est une absence on la soustrait à la moyenne
            bonus -= parseFloat(element.average.toString());
          }
          if(element.name.toString().toLowerCase().includes("bonus")) { // Si c'est un bonus on l'ajoute à la moyenne
            bonus += parseFloat(element.average.toString());
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
        if (!matiereBonus.find((matiere) => matiere == element.name.toString()) && !matiereMalus.find((matiere) => matiere == element.name.toString())) { // Sinon on compte comme une matière normale
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

    if (moyenneGenerale == "NaN") { // Si la moyenne générale est NaN 
      return "Non disponible";
    }

    return moyenneGenerale;
  }

  return (
    <View style={styleScrollable.container}>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayLarge">
        <IconButton
          style={{ marginLeft: 25, marginRight: 12.5 }}
          icon="home"
          size={20}
          onPress={() => logout(navigation)}
        />
      Notes</Text>
      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }} 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
        <Button style={style.buttonChangeSemester} loading={loading} icon="sync" mode="contained-tonal" onPress={ () => changeSemester() }> Changer de semestre </Button>
        <Button style={{ marginTop: 8, marginBottom: 16 }} icon="cog" mode="contained-tonal" onPress={ () => goToSettings(navigation) }> Paramètres </Button>
        <Text style={{ textAlign: 'left', marginBottom: 8 }} variant="titleMedium">Moyenne générale : {isCalculated()}</Text>
        <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">Position : {isRanking()}</Text>
        <Divider style={{ marginBottom: 16 }} />
        {showTable()}
      </ScrollView>
    </View>
  );
}

// Page de premier démarrage à changer (v2.0.0) -- Non fonctionnel
function OOBE( { navigation } ) {

  const [malus, setMalus] = useState(false);
  const [bonus, setBonus] = useState(false);

  const [matiereMalus, setMatiereMalus] = useState("");
  const [matiereBonus, setMatiereBonus] = useState("");

  const [text, setText] = useState(['Afin de pouvoir afficher votre moyenne générale, vous devez configurer certains éléments.', 'Tout d\'abord, avez-vous sur vos notes, une \"Pénalité d\'absence\" ?','Ensuite, veuillez préciser si oui ou non vous avez un bonus sur votre moyenne', 'Merci, veuillez vérifier et valider vos choix.','Veuillez sélectionner la matière correspondante :']);
  const [whichText, setWhichText] = useState(0);

  const [showFirst, setShowFirst] = useState(false);
  const [showSecond, setShowSecond] = useState(false);
  const [showThird, setShowThird] = useState(false);
  const [showSubMalus, setSubMalus] = useState(false);
  const [showSubBonus, setSubBonus] = useState(false);

  function cancel() {
    // changer ca pour que ca affiche button config sur grade
    // configAverage = true;
    // navigation.goBack();
    
    setWhichText(0);
    setShowFirst(false);
    setShowSecond(false);
    setShowThird(false);
    setSubMalus(false);
    setSubBonus(false);
    setMalus(false);
    setBonus(false);
  }

  function firstDialogue() {
    setWhichText(1);
    setShowFirst(true);
  }

  function secondDialogue() {
    if(malus == true) {
      grades.map((item) => {
        console.log(item.name);
      })
      setShowFirst(false);
      setWhichText(4);
      setSubMalus(true);
    } else {
    setWhichText(2);
    setShowFirst(false);
    setShowSecond(true);
    }
  }

  function thirdDialogue() {
    if(bonus == true) {
      setShowSecond(false);
      setWhichText(4);
      setSubBonus(true);
    }
    setWhichText(3);
    setShowSecond(false);
    setShowThird(true);
  }

  function validate() {
  }

  return (
    <View style={style.container}>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayLarge">Configuration</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleLarge'>{text[whichText]}</Text>

      { // Demande si le malus est présent
      showFirst ? ( 
        <><Switch value={malus} onValueChange={() => setMalus(!malus)} />
        <Button style={{ marginTop: 16 }} mode="contained-tonal" onPress={() => secondDialogue()}> Suivant </Button></> ) : null
      }

      { // Demande si le bonus est présent
      showSecond ? ( 
        <><Switch value={bonus} onValueChange={() => setBonus(!bonus)} />
        <Button style={{ marginTop: 16 }} mode="contained-tonal" onPress={() => thirdDialogue()}> Suivant </Button></> ) : null
      }

      { // Demande validation
      showThird ? ( 
        <><Text style={{ textAlign: 'left', marginBottom: 8 }} variant='titleLarge'>Malus : {matiereMalus}</Text>
        <Text style={{ textAlign: 'left' }} variant='titleLarge'>Bonus : {matiereBonus}</Text>
        <Button style={{ marginTop: 16 }} icon="check" mode="contained" onPress={() => validate()}> Valider </Button></> ) : null
      }

      {
      showSubMalus ? (
        <View>
          {grades.map((grade) => {
              <><Chip style={{ marginTop: 16 }} mode="flat" onPress={() => setMatiereMalus(grade.name)}> {grade.name} </Chip></>
          })}
          <Chip style={{ marginTop: 16 }} mode="flat" onPress={() => setMatiereMalus("hallo")}> hallo </Chip>
        </View> ) : null
      }

      { // Demande matière malus
        grades.map((grade) => {
          if(showSubMalus == true) {
            <Chip style={{ marginTop: 16 }} mode="flat" onPress={() => setMatiereMalus(grade.name)}> {grade.name} </Chip>
          }
        })
      }

      { // Premier bouton
      !showFirst && !showSecond && !showThird && !showSubMalus && !showSubBonus ? (
        <Button style={{ marginTop: 16 }} mode="contained-tonal" onPress={ () => firstDialogue() }> Suivant </Button> ) : null
      }

      { // Bouton annuler
      !showThird ? (
        <Button style={{ marginTop: 16 }} icon="location-exit" mode="contained" onPress={ () => cancel() }> Annuler </Button> ) : null
      }
    </View>
  );
}

// Page d'affichage de l'emploi du temps
function ShowEDT( { navigation } ) {
  const [cal, setCalendar] = useState(calendar);
  const calendarRef = useRef(null);

  //MomentConfig.updateLocale('fr', {
  //  weekdaysShort: 'Lundi_Mardi_Mercredi_Jeudi_Vendredi_Samedi_Dimanche'.split('_'),
  //});
  
  if(cal == null) {
    AsyncStorage.getItem("calendar").then((result) => {
      if (result != null) {
        setCalendar(JSON.parse(result));
      } else {
        navigation.goBack();
      }
    });
  }

  function goToToday() {
    haptics("medium");
    var today = new Date();
    calendarRef.current?.goToDate({date: today, hourScroll: true, animatedDate: true, animatedHour: true})
  }

  return (
    <View style={styleScrollable.container}>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayLarge">
        <IconButton
          style={{ marginLeft: 25, marginRight: 12.5 }}
          icon="home"
          size={20}
          onPress={() => navigation.goBack()}
        />
      EDT</Text>
      <Button style={{ marginLeft: 25, marginRight: 25, marginBottom: 16 }} icon="update" mode="contained-tonal" onPress={ () => goToToday() }> Aujourd'hui </Button>  

      <TimelineCalendar theme={styleCalendar.container} ref={calendarRef} onPressEvent={(eventItem) => Alert.alert(eventItem.title, eventItem.subtitle + "\n Salle : " + eventItem.description)} scrollToNow={true} viewMode="threeDays" events={cal} allowPinchToZoom start={5} end={22} /*locale="fr"*/ renderEventContent={(event) => {
          return (
            <SafeAreaView style={{ margin: 10 }}>
              <Text style={{ fontWeight: 'bold', color:'black' }}>{event.title}</Text>
              <Text style={{ color:'black' }}>{event.subtitle}</Text>
              <Text style={{ color:'black' }}>{event.description}</Text>
            </SafeAreaView>
          );
      }}/>

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
  }

  function setSelectedServer(value) {
    if (value == "B") {
      selectedServer = servers[1];
      saveUserdata("server", servers[1].toString());
      fetch(servers[1].toString())
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

  return (
    <View style={styleScrollable.container}>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayLarge">
        <IconButton
          style={{ marginLeft: 25, marginRight: 12.5 }}
          icon="arrow-left"
          size={20}
          onPress={() => goBack() }
        />
      Paramètres</Text>
      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
      <Button style={{ marginBottom: 8 }} icon="calculator" mode="contained-tonal" onPress={ () => navigation.navigate('AverageConfig')}>Configuration de la moyenne générale</Button>
        <Button style={{ marginBottom: 8 }} icon="bug" mode="contained-tonal" onPress={ () => handleURL("https://notes.metrixmedia.fr/bug") }> Signaler un bug </Button>
        <Button style={style.buttonLogout} icon="delete" mode="contained-tonal" onPress={ () => askDeleteData() }> Supprimer les données de connexion </Button>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop:16 }} >
            <Switch onValueChange={ (value) => setHapticsBool(value) } value={hapticsOn}/>
            <Text style={{ marginLeft:8}}> Activer les retours haptiques (vibrations)</Text>
        </View>

        <Card style={{ marginTop:16 }}>
          <Card.Title
              title="Sélection du serveur"
              subtitle="En cas de problème seulement !"
              left={(props) => <Avatar.Icon {...props} icon="server-network" />}
          />
          <Card.Actions>
            <Button mode={ whatSelectedServer("B") } onPress={ () => setSelectedServer("B") }>Backup</Button>
            <Button mode={ whatSelectedServer("P") } onPress={ () => setSelectedServer("P") }>Principal</Button>
          </Card.Actions>
        </Card>

        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">UniceNotes</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">Visualisez vos notes. Sans PDF.</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">⚡ Version : {appVersion}</Text>
        <Text style={{ textAlign: 'left' }} variant="titleSmall">❤️ Fièrement développé par un GEII : 
          <Text style={style.textLink} onPress={() => handleURL("https://github.com/hugofnm")}> @hugofnm </Text>
        </Text>

        <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleSmall">UniceNotes n'est lié d'aucune forme à l'Université Côte d'Azur.</Text>
        <Button style={{ marginTop: 32 }} icon="license" onPress={ () => handleURL("https://notes.metrixmedia.fr/credits") }> Mentions légales </Button>
        <Button style={{ marginTop: 4 }} icon="account-child-circle" onPress={ () => handleURL("https://metrixmedia.fr/privacy") }> Clause de confidentialité </Button>
        <Button style={{ marginTop: 4 }} icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }> Code source </Button>
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
      console.log(matiereM)
      saveUserdata("matiereMalus", matiereMalus.toString());
      
    }
    if(bonus) {
      matiereBonus = matiereB.split(";");
      config += "B ";
      console.log(matiereB)
      saveUserdata("matiereBonus", matiereBonus.toString());
    }
    console.log(config)
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
    <View style={style.container}>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayLarge">Moyenne</Text>
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
        <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ title: 'UniceNotes', headerShown: false }} />
        <Stack.Screen name="Login" component={LoginPage} options={{ title: 'Se connecter', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="LoggedPage" component={LoggedPage} options={{ title: 'Se connecter', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="Semesters" component={Semesters} options={{ title: 'Semestres', headerShown: false }} />  
        <Stack.Screen name="APIConnect" component={APIConnect} options={{ title: 'Chargement en cours...', presentation: 'modal', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="ShowGrades" component={ShowGrades} options={{ title: 'Notes', headerShown: false, gestureEnabled: false}} />
        <Stack.Screen name="ShowEDT" component={ShowEDT} options={{ title: 'Emploi du temps', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="ShowSettings" component={ShowSettings} options={{ title: 'Paramètres', headerShown: false }} />
        <Stack.Screen name="AverageConfig" component={AverageConfig} options={{ title: 'Configuration', presentation: 'modal',headerShown: false, gestureEnabled: false}} />
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
const colorScheme = Appearance.getColorScheme();
if (colorScheme === 'dark') {
  choosenTheme = darkTheme
} else {
  choosenTheme = lightTheme
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: choosenTheme.colors.background,
    justifyContent: 'center',
    paddingLeft: 25, 
    paddingRight: 25 
  },
  buttonLogout: {
    backgroundColor: choosenTheme.colors.errorContainer
  },
  buttonChangeSemester: {
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
    justifyContent: 'center',
    paddingTop: 75
  },
});

const styleCalendar = StyleSheet.create({
  container: {
    backgroundColor: choosenTheme.colors.background,
    cellBorderColor: choosenTheme.colors.surfaceVariant,
    hourText: {color: choosenTheme.colors.onBackground},    
  },
});

// ---------------------------------------------
// MAIN
// ---------------------------------------------

export default function Main() {
  return (
    <PaperProvider theme={choosenTheme}>
      <App/>
    </PaperProvider>
  );
}