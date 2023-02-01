/*

UniceNotes
Développé par Hugo Meleiro (@hugofnm)
MIT License

*/

import React, { useState, useEffect } from 'react';
import { Alert, View, StyleSheet, 
  StatusBar, ScrollView, Image, 
  Appearance, BackHandler 
} from 'react-native';

// Material Design 3 API (React Native Paper)
import { Avatar, Text, TextInput, 
  Button, Switch, Divider, 
  ActivityIndicator, ProgressBar, BottomNavigation, 
  DataTable, Card, Provider as PaperProvider,
  withTheme
} from 'react-native-paper';

// Expo API
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

var appVersion = '1.0.0b3';

var isLoggedIn = false; // App login
var isConnected = false; // UniceAPI login
var dataIsLoaded = false; // JSONPDF loaded
var semesters = []; // User's all semesters
var name = ''; // User's name
var semester = ''; // Selected semesters

// Temporary variables
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

var rememberMe = true; // Remember me

var grades = []; // User's grades
var average = ""; // User's average
var admission = ""; // User's admission
var position = ""; // User's position

// SecureStore API
async function save(key, value) {
  await SecureStore.setItemAsync(key, value);
}

// Ouverture de pages web dans le navigateur par défaut
const handleURL = async (url) => {
  await WebBrowser.openBrowserAsync(url);
};

// Fonction de déconnexion (API UniceNotes + app si "Se souvenir de moi" est désactivé)
function logout(navigation) {
  isConnected = false;
  isLoggedIn = false;
  dataIsLoaded = false;
  if (rememberMe == false) {
    password = null;
  }
  fetch('https://api.unice.hugofnm.fr/logout');
  navigation.navigate('Login', { isConnected: isConnected, dataIsLoaded: dataIsLoaded, isLoggedIn: isLoggedIn });
}

// Page de connexion à l'application (login)
function LoginPage({ navigation }) {

  const [loading, setLoading] = useState(false);
  const [seePassword, setSeePassword] = useState(true);
  const [isDataStored, setIsDataStored] = useState(false);
  const [count, setCount] = useState(0);

  // Text and icons variables
  const [loginMethod, setLoginMethod] = useState("login");
  const [loginText, setLoginText] = useState("Se connecter");
  const [rememberMeOn, setRememberMeOn] = useState(false); // "Se souvenir de moi" clickable

  useEffect(() => {
    if(count == 0) {
      setCount(1);
      verifyLogin();
    }
  });
  
  async function verifyLogin() {
    if(!isDataStored) {
      if (username != null && password != null) {
        setLoginMethod("face-recognition");
        setLoginText("Se connecter avec TouchID/FaceID");
        setRememberMeOn(true);
        setIsDataStored(true);
      } else {
        username = null;
        password = null;
        setIsDataStored(false);
      }
    }
  }
  
  // Résultat du bouton "Se connecter"
  function handleLogin() {
    setLoading(true);
    // Sauvegarde des identifiants si "Se souvenir de moi" est activé
    if(rememberMe) {
      save("username", username);
      save("passkey", password);
    }
    // Connexion par TouchID/FaceID
    LocalAuthentication.authenticateAsync({ promptMessage:"Authentifiez-vous pour accéder à UniceNotes." }).then((result) => {
      if (result.success) {
        ssoUnice(username, password);
      } else {
        setLoading(false);
        Alert.alert("Erreur", "Authentification annulée. EC=0xB");
      }
    });
  }

  // Connexion au SSO de l'Université Nice Côte d'Azur et vérification des identifiants
  async function ssoUnice(username, password) {
    if(!isConnected) {
      let apiResp = await fetch('https://api.unice.hugofnm.fr/login', {
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
        setLoading(false);
      }

      let json = await apiResp.json();
    
      console.log(json);
    
      if(json.success) {
        isConnected = true;
        name = json.name;
        semesters = json.semesters;
        console.log(semesters);
        setLoading(false);
        navigation.navigate('Semesters');
      } else {
        setLoading(false);
        Alert.alert("Erreur", "Vos identifiants sont incorrects. EC=0xI");
      }
    }
  };

  // Affichage en clair du mot de passe si clic sur l'oeil
  function viewPass() {
    if (seePassword == false) {
      setSeePassword(!seePassword);
    } else if (isDataStored == true) {
      LocalAuthentication.authenticateAsync().then((result) => {
        if (result.success) {
          setSeePassword(!seePassword);
        } else {
          Alert.alert("Erreur", "Authentification annulée. EC=0xB");
        }
      });
    } else {
      setSeePassword(!seePassword);
    }
  }

  function setUsername(text) {
    username = text;
  }

  function setPassword(text) {
    password = text;
  }

  function setRememberMe(bool) {
    rememberMe = bool;
  }

  return (
    <View style={style.container}>
      <Avatar.Image style={{ alignSelf: "center", marginBottom: 16, marginTop: 32 }} size={100} source={require('./assets/icon.png')} />
      <Text style={{ textAlign: 'center' }} variant="displayLarge">Bienvenue.</Text>
      <Text style={{ textAlign: 'center', marginBottom: 16 }} variant='titleMedium'>Veuillez entrer vos identifiants Sésame (I.U.T. Nice Côte d'Azur) pour continuer.</Text>
      <TextInput
        label="Nom d'utilisateur"
        defaultValue={username}
        onChangeText={(text) => setUsername(text)}
        returnKeyType="next"
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label='Mot de passe'
        defaultValue={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry={seePassword}
        returnKeyType="go"
        right={<TextInput.Icon icon="eye" onPress={ () => viewPass() } />}
        style={{ marginBottom: 16 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom:16 }} >
          <Switch disabled={rememberMeOn} value={rememberMe} onValueChange={setRememberMe} color="#3f51b5"/>
          <Text style={{ marginLeft:8}}> Se souvenir de moi</Text>
        </View>
      <Button style={{ marginBottom: 16 }} icon={loginMethod} mode="contained-tonal" onPress={ () => handleLogin() }> {loginText} </Button>
      <Divider style={{ marginBottom: 16 }} />
      <Text style={{ textAlign: 'center', marginBottom: 16 }} variant='titleMedium'>Vos données sont sécurisées et ne sont sauvegardées que sur votre téléphone.</Text>
      <Button style={{ marginBottom: 4 }} icon="license" onPress={ () => handleURL("https://notes.unice.cf/credits") }> Mentions légales </Button>
      <Button style={{ marginBottom: 16 }} icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }> Code source </Button>
      <ActivityIndicator animating={loading} size="large" />
    </View>
  );
}

// Page de sélection du semestre
function Semesters ({ navigation }) {
  const [jourNuit, setJourNuit] = useState("Bonjour");

  // Correction du nom de l'étudiant
  name = name
    .split(" ")
    .map(word => word[0].toUpperCase() + word.substring(1).toLowerCase())
    .join(" ");

  // Fonction de chargement des notes
  function loadGrades(sel) {
      semester = sel.toString();
      navigation.navigate('APIConnect', { semester: sel });
  }

  // Changement du texte en fonction de l'heure
  useEffect(() => {
    let date = new Date();
    let hours = date.getHours();
    if (hours >= 5 && hours < 17) {
      setJourNuit("Bonjour");
    } else {
      setJourNuit("Bonsoir");
    }
  }, []);

  return (
    <View style={style.container}>
      <Avatar.Image style={{ alignSelf: "center", marginBottom: 16 }} size={100} source={{ uri: "https://api.unice.hugofnm.fr/avatar" }} />
      <Text style={{ textAlign: 'left' }} variant="displayLarge">{jourNuit},</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayMedium">{name} !</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Veuillez sélectionner un semestre.</Text>

      {semesters.map((semester) => (
        <Button style={{ marginBottom: 16 }} icon="arrow-right-drop-circle" mode="contained-tonal" onPress={ () => loadGrades(semester) }> {semester} </Button>
      ))}

      <Button style={{ marginBottom: 8 }} icon="cog" mode="contained-tonal" onPress={ () => navigation.navigate('ShowSettings') }> Paramètres </Button>
      <Button style={style.buttonLogout} icon="logout" mode="contained-tonal" onPress={ () => logout(navigation) }> Se déconnecter </Button>
    </View>
  );
}

// Page de chargement des données
function APIConnect ({ navigation }) {
  const [progress, setProgress] = useState(0.1);

  async function loginAPI() {
    if(dataIsLoaded == false){
      let response = await fetch('https://api.unice.hugofnm.fr/load_pdf?sem=' + semester)
      if(response.status == 200) {
        setProgress(0.5);
  
        let pdfAPI = await fetch('https://api.unice.hugofnm.fr/scrape_pdf?sem=' + semester);
    
        if(pdfAPI.status != 200){
          Alert.alert("Erreur", "Connexion au serveur impossible. EC=0xS");
        }
    
        let json = await pdfAPI.json();
      
        setProgress(1);
        if(json.grades) {
          grades = json.grades; // toutes les notes, moyennes, noms des profs, etc.
        } else {
          Alert.alert("Erreur", "Une erreur est survenue. EC=0xG");
        }
        admission = json.admission; // admission oui/non
        average = json.average; // moyenne générale
        position = json.position; // position dans le classement
        dataIsLoaded = true;
        navigation.navigate('ShowGrades', { grades : grades, admission : admission, average : average, position : position });
      }
      else {
        Alert.alert("Erreur", "Une erreur est survenue. EC=0xL");
      }
    }
    dataIsLoaded = true;
  }

  loginAPI();

  return (
    <View style={style.container}>
      <Avatar.Icon style={{ alignSelf: "center", marginBottom: 32 }} size={200} icon="sync" />

      <ProgressBar progress={progress} style={{ marginBottom: 32 }} />

      <Button style={{ marginBottom: 16 }}icon="account-child-circle" mode="contained-tonal" onPress={ () => logout(navigation) }> Annuler </Button>
    </View>
  );
}

// Page d'affichage des notes
function ShowGrades( { navigation } ) {

  var moyenneGenerale = 0.0;
  var moyenneCache = 0.0;
  var coeffGeneral = 0.0;
  var coeff = 0.0;

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

  function showHeader() {
    if(admission != "" && average != "" && position != "") {
      return (
        <View>
          <Text style={{ textAlign: 'left' }} variant="titleMedium"> {semester} </Text>
          <Text style={{ textAlign: 'left' }} variant="titleMedium"> {average} </Text>
          <Text style={{ textAlign: 'left' }} variant="titleMedium"> {admission} </Text>
          <Text style={{ textAlign: 'left' }} variant="titleMedium"> Position bientôt affichée... </Text>
        </View>
      );
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
      return (
        <><DataTable.Cell numeric> X </DataTable.Cell>
        <DataTable.Cell numeric>{(grade[1][0].replace("(coeff ", "")).replace(")","")}</DataTable.Cell></>
      )
    }
  }

  function showGlobalAverage() {
    grades.forEach(element => {
      if(element.average.toString() != "Pas de moyenne disponible") {
        moyenneCache = parseFloat(element.average.replace(" (calculée)", "").toString());
        element.grades.forEach((grade) => {
          if(!grade[1][0].includes("coeff")){
            coeff += parseFloat(grade[1][1]);
          }
          else {
            coeff += parseFloat((grade[1][0].replace("(coeff ", "")).replace(")",""));
          }
        })
        moyenneGenerale += moyenneCache * coeff;
        coeffGeneral += coeff;
        coeff = 0;
        moyenneCache = 0;
      }
    });
    moyenneGenerale = moyenneGenerale / coeffGeneral;
    return moyenneGenerale.toFixed(2);
  }

  return (
    <View style={styleShowGrades.container}>
      <Text style={{ textAlign: 'left', marginBottom: 16, paddingLeft: 25 }} variant="displayLarge">Notes</Text>
      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }}>
        <Button style={style.buttonLogout} icon="logout" mode="contained-tonal" onPress={ () => logout(navigation) }> Se déconnecter </Button>
        <Button style={{ marginTop: 8, marginBottom: 16 }} icon="cog" mode="contained-tonal" onPress={ () => navigation.navigate('ShowSettings') }> Paramètres </Button>
        <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">[BETA] Moyenne générale : {showGlobalAverage()}</Text>
        <Divider style={{ marginBottom: 16 }} />
        {showHeader()}
        {showTable()}
      </ScrollView>
    </View>
  );
}

// Page d'affichage de l'emploi du temps
function ShowEDT( { navigation } ) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 25, marginRight: 25 }}>
      <Text style={{ textAlign: 'left' }} variant="displayLarge">Emploi du temps</Text>
      <Button style={{ marginTop: 16, marginBottom: 8 }} icon="logout" mode="contained-tonal" onPress={ () => logout(navigation) }> Se déconnecter </Button>
      <Button style={{ marginBottom: 16 }} icon="cog" mode="contained-tonal" onPress={ () => navigation.navigate('ShowSettings') }> Paramètres </Button>
      <Divider style={{ marginBottom: 16 }} />
      <Text>Emploi du temps bientôt disponible...</Text>
    </View>
  );
}

// Page de paramètres
function ShowSettings( { navigation } ) {

  function askDeleteData() {
    Alert.alert("Suppression des données", "Voulez-vous vraiment supprimer les données de l'application ?", [
      {
        text: "Annuler",
        style: "cancel"
      },
      { 
        text: "Supprimer", 
        onPress: (() => deleteData())
      }]);
  }

  function deleteData() {
      SecureStore.deleteItemAsync("username");
      SecureStore.deleteItemAsync("passkey");
      username = null;
      password = null;
      Alert.alert("Données supprimées", "Retour à la page de connexion.");
      logout(navigation);
  }

  return (
    <View style={style.container}>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayLarge">Paramètres</Text>
      <Button style={{ marginBottom: 8 }} icon="arrow-left" mode="contained-tonal" onPress={ () => navigation.goBack() }> Retourner en arrière </Button>
      <Button style={{ marginBottom: 8 }} icon="bug" mode="contained-tonal" onPress={ () => handleURL("https://notes.unice.cf/bug") }> Signaler un bug </Button>
      <Button style={{ marginBottom: 8 }} icon="logout" mode="contained-tonal" onPress={ () => logout(navigation) }> Se déconnecter </Button>
      <Button style={style.buttonLogout} icon="delete" mode="contained-tonal" onPress={ () => askDeleteData() }> Supprimer les données de connexion </Button>
      
      <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">UniceNotes</Text>
      <Text style={{ textAlign: 'left' }} variant="titleMedium">Visualisez vos notes. Sans PDF.</Text>
      <Text style={{ textAlign: 'left' }} variant="titleMedium">Version: {appVersion}</Text>
      <Text style={{ textAlign: 'left' }} variant="titleMedium">Développé par 
        <Text style={style.textLink} onPress={() => handleURL("https://github.com/hugofnm")}> @hugofnm </Text>
      </Text>
      <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">UniceNotes n'est lié d'aucune forme à l'Université Côte d'Azur.</Text>
      <Button style={{ marginTop: 32 }} icon="license" onPress={ () => handleURL("https://notes.unice.cf/credits") }> Mentions légales </Button>
      <Button style={{ marginTop: 4 }} icon="account-child-circle" onPress={ () => handleURL("https://metrixmedia.fr/privacy") }> Clause de confidentialité </Button>
      <Button style={{ marginTop: 4 }} icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }> Code source </Button>
      <Button style={{ marginTop: 4 }} icon="cash-fast" onPress={ () => handleURL("https://revolut.me/hugofnm") }> Soutenir le développement de l'application </Button>
    </View>
  );
}

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginPage} options={{ title: 'Se connecter', headerShown: false }} />
        <Stack.Screen name="Semesters" component={Semesters} options={{ title: 'Semestres', headerShown: false }} />  
        <Stack.Screen name="APIConnect" component={APIConnect} options={{ title: 'Chargement en cours...', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="ShowGrades" component={ShowGrades} options={{ title: 'Notes', headerShown: false, gestureEnabled: false}} />
        <Stack.Screen name="ShowEDT" component={ShowEDT} options={{ title: 'Emploi du temps', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="ShowSettings" component={ShowSettings} options={{ title: 'Paramètres', headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Themes
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
  textLink: {
    color: choosenTheme.colors.primary
  },
});

const styleShowGrades = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: choosenTheme.colors.background,
    justifyContent: 'center',
    paddingTop: 75
  },
});

export default function Main() {
  return (
    <PaperProvider theme={choosenTheme}>
      <App/>
    </PaperProvider>
  );
}