/*

UniceNotes
Développé par Hugo Meleiro (@hugofnm)
MIT License

*/

import React, { useState, useEffect, useRef } from 'react';
import { Alert, View, StyleSheet, 
  StatusBar, ScrollView, RefreshControl,
  Appearance, BackHandler, SafeAreaView,
  SafeAreaProvider, Keyboard
} from 'react-native';

// Material Design 3 API (React Native Paper)
import { Avatar, Text, TextInput, 
  Button, Switch, Divider, 
  ActivityIndicator, ProgressBar, BottomNavigation, 
  DataTable, Card, Provider as PaperProvider,
  withTheme, Chip
} from 'react-native-paper';

// Expo API
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// IMPORTANT !!!
var appVersion = '1.1.3';
var isBeta = true;
// IMPORTANT !!!

var isConnected = false; // UniceAPI login
var dataIsLoaded = false; // JSONPDF loaded
var semesters = []; // User's all semesters
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

var name = SecureStore.getItemAsync("name").then((result) => {
  if (result != "") {
    name = result;
  } else {
    name = null;
  }
}); // User's name

var rememberMe = true; // Remember me

var grades = []; // User's grades
var average = ""; // User's average
var admission = ""; // User's admission
var position = ""; // User's position

// ---------------------------------------------
// FONCTIONS GLOBALES
// ---------------------------------------------

// SecureStore API
async function save(key, value) {
  await SecureStore.setItemAsync(key, value);
}

// Ouverture de pages web dans le navigateur par défaut
const handleURL = async (url) => {
  Haptics.selectionAsync();
  await WebBrowser.openBrowserAsync(url);
};

// Fonction de déconnexion (API UniceNotes + app si "Se souvenir de moi" est désactivé)
function logout(navigation) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  isConnected = false;
  isLoggedIn = false;
  dataIsLoaded = false;
  if (rememberMe == false) {
    password = null;
  }
  fetch('https://api.unice.hugofnm.fr/logout');
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        { name: 'SplashScreen' }
      ],
    })
  );
  
}

// Fonction navigate vers paramètres
function goToSettings(navigation) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  navigation.navigate('ShowSettings');
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
    var res;
    await fetch('https://api.unice.hugofnm.fr/version')
    .then((response) => response.json())
    .then((json) => {
      res = json.version;
    })
    
    res = res.toString().replace("v", "")
    if(!isBeta) {
      if(res != appVersion) {
        Alert.alert("Mise à jour disponible", "Une nouvelle version de l'application est disponible. Veuillez la mettre à jour pour continuer à utiliser UniceNotes.", 
        [ { text: "Mettre à jour", onPress: () => handleURL("https://notes.metrixmedia.fr/get") } ]);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Erreur", "Veuillez entrer un nom d'utilisateur et un mot de passe.");
    } else {
      Keyboard.dismiss();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);
      if(username == "demo") {
        setEditable(false);
        ssoUnice(username, password);
      } else {
        // Connexion par TouchID/FaceID
        LocalAuthentication.authenticateAsync({ promptMessage:"Authentifiez-vous pour accéder à UniceNotes." }).then((result) => {
          if (result.success) {
            setEditable(false);
            ssoUnice(username, password);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setLoading(false);
            Alert.alert("Erreur", "Authentification annulée. EC=0xB");
          }
        });
      }
    }
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate('Semesters');
      } else {
        setLoading(false);
        setEditable(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
        onPressIn={() => Haptics.selectionAsync()}
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
        onPressIn={() => Haptics.selectionAsync()}
        secureTextEntry={seePassword}
        returnKeyType="go"
        editable={editable}
        right={<TextInput.Icon icon="eye" onPress={ () => setSeePassword(!seePassword) } />}
        style={{ marginBottom: 16 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom:16 }} >
          <Switch onValueChange={ (value) => setRememberMe(value) } value={rememberMe}/>
          <Text style={{ marginLeft:8}}> Se souvenir de moi</Text>
        </View>
      <Button style={{ marginBottom: 16 }} icon="login" mode="contained-tonal" onPress={ () => handleLogin() }> Se connecter </Button>
      <Divider style={{ marginBottom: 16 }} />
      <Text style={{ textAlign: 'center', marginBottom: 16 }} variant='titleMedium'>Vos données sont sécurisées et ne sont sauvegardées que sur votre téléphone.</Text>
      <Button style={{ marginBottom: 4 }} icon="license" onPress={ () => handleURL("https://notes.metrixmedia.fr/credits") }> Mentions légales </Button>
      <Button style={{ marginBottom: 16 }} icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }> Code source </Button>
      <ActivityIndicator animating={loading} size="large" />
    </View>
  );
}

// Page de connexion à l'application si les identifiants sont sauvegardés
function LoggedPage({ navigation }) {
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("Erreur", "Authentification annulée. EC=0xB");
        }
      });
    }
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("Erreur", "Connexion au serveur impossible. EC=0xS");
          setLoading(false);
        }
  
        let json = await apiResp.json();
      
        if(json.success) { 
          isConnected = true;
          semesters = json.semesters;
          setLoading(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.navigate('Semesters');
        } else {
          setLoading(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert("Erreur", "Vos identifiants sont incorrects. EC=0xI");
        }
      }
  };

  function deleteData() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      SecureStore.deleteItemAsync("username");
      SecureStore.deleteItemAsync("passkey");
      SecureStore.deleteItemAsync("name");
      username = null;
      password = null;
      Image.clearDiskCache();
      Image.clearMemoryCache();
      logout(navigation);
  }
  
  return (
    <View style={style.container}>
      <SafeAreaView style={style.container}>
        <Avatar.Image style={{ alignSelf: "center", marginBottom: 16, marginTop: 32 }} size={100} source={require('./assets/white.png')} />
        <Text style={{ textAlign: 'center' }} variant="displayLarge">Bienvenue.</Text>
        <Text style={{ textAlign: 'center', marginBottom: 16 }} variant='titleMedium'>Veuillez sélectionner votre nom d'utilisateur pour continuer.</Text>
        <Chip style={{ height: 64, marginBottom: 8 }} onPress={ () => handleLogin() } icon="face-recognition" >{username} - {name}</Chip>
        <Button style={{ marginBottom: 16 }} icon="account" mode="contained-tonal" onPress={ () => deleteData() }> Changer d'utilisateur </Button>
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

  // Correction du nom de l'étudiant
  name = name
    .split(" ")
    .map(word => word[0].toUpperCase() + word.substring(1).toLowerCase())
    .join(" ");

  // Fonction de chargement des notes
  function loadGrades(sel) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      semester = sel.toString();
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

  return (
    <View style={style.container}>
      <Image 
        source={{
          uri: "https://api.unice.hugofnm.fr/avatar"
        }} 
        style={{ alignSelf: "center", marginBottom: 16, width: 125, height: 125, borderRadius: 100 }}
        placeholder={require('./assets/profile.png')}
      />
      <Text style={{ textAlign: 'left' }} variant="displayLarge">{jourNuit},</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayMedium">{name} !</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Veuillez sélectionner un semestre.</Text>

      {semesters.map((semester) => (
        <Button style={{ marginBottom: 8 }} icon="arrow-right-drop-circle" mode="contained-tonal" onPress={ () => loadGrades(semester) }> {semester} </Button>
      ))}

      <Button style={{ marginBottom: 8, marginTop: 8 }} icon="cog" mode="contained-tonal" onPress={ () => goToSettings(navigation) }> Paramètres </Button>
      <Button style={ style.buttonLogout } icon="logout" mode="contained-tonal" onPress={ () => logout(navigation) }> Se déconnecter </Button>
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("Erreur", "Une erreur est survenue. EC=0xG");
        }
        admission = json.admission; // admission oui/non
        average = json.average; // moyenne générale
        position = json.position; // position dans le classement
        dataIsLoaded = true;
        navigation.navigate('ShowGrades');
      }
      else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Erreur", "Une erreur est survenue. EC=0xL");
      }
    }
    dataIsLoaded = true;
  }

  return (
    <View style={style.container}>
      <Avatar.Icon style={{ alignSelf: "center", marginBottom: 32 }} size={200} icon="sync" />
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Chargement des données...</Text>
      <ProgressBar progress={progress} style={{ marginBottom: 32 }} />
      <Button style={{ marginBottom: 16 }}icon="account-child-circle" mode="contained-tonal" onPress={ () => logout(navigation) }> Annuler </Button>
    </View>
  );
}

// Page d'affichage des notes
function ShowGrades( { navigation } ) {
  const [refreshing, setRefreshing] = useState(false);

  var moyenneGenerale = 0.0;
  var moyenneCache = 0.0;
  var coeffGeneral = 0.0;
  var coeff = 0.0;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (forceRefresh() == true) {
      setRefreshing(false);
    }
  }, []);

  async function forceRefresh() {
    var res;
    dataIsLoaded = false;
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
    return res;
  }

  async function changeSemester() {
    dataIsLoaded = false;
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", "Connexion au serveur impossible. EC=0xS");
    } else {
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

  function showGlobalAverage() {
    grades.forEach(element => {
      if(element.average.toString() != "Pas de moyenne disponible") {
        moyenneCache = parseFloat(element.average.replace(" (calculée)", "").toString());
        element.grades.forEach((grade) => {
          if(!grade[1][0].includes("coeff")){
            coeff += parseFloat(grade[1][1]);
          }
          else {
            if(grade[1][0].includes("ABI")) {
              coeff += parseFloat((grade[1][0].replace("ABI (coeff ", "")).replace(")",""));
            } else {
              coeff += parseFloat((grade[1][0].replace("(coeff ", "")).replace(")",""));
            }
          }
        })
        moyenneGenerale += moyenneCache * coeff;
        coeffGeneral += coeff;
        coeff = 0;
        moyenneCache = 0;
      }
    });
    moyenneGenerale = moyenneGenerale / coeffGeneral;
    moyenneGenerale = moyenneGenerale.toFixed(2);

    if (moyenneGenerale == "NaN") {
      return "Non disponible";
    }

    return moyenneGenerale;
  }

  return (
    <View style={styleShowGrades.container}>
      <Text style={{ textAlign: 'left', marginBottom: 16, paddingLeft: 25 }} variant="displayLarge">Notes</Text>
      <ScrollView style={{ paddingLeft: 25, paddingRight: 25 }} 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
        <Button style={style.buttonChangeSemester} icon="sync" mode="contained-tonal" onPress={ () => changeSemester() }> Changer de semestre </Button>
        <Button style={{ marginTop: 8, marginBottom: 16 }} icon="cog" mode="contained-tonal" onPress={ () => goToSettings(navigation) }> Paramètres </Button>
        <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">Moyenne générale : {showGlobalAverage()} (calculée)</Text>
        <Divider style={{ marginBottom: 16 }} />
        {showHeader()}
        {showTable()}
      </ScrollView>
    </View>
  );
}

// Page d'affichage de l'emploi du temps
function ShowEDT( { navigation } ) {
  
  async function getMyCal() {
    let cal = await fetch('https://api.unice.hugofnm.fr/edt', {
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
    const data = await cal.text();

    const { VCALENDAR } = parse(data);
    const events = VCALENDAR.VEVENT;

    return(
      events.map((event) => (
        <Card key={event.UID}>
          <Card.Content>
            <Title>{event.SUMMARY}</Title>
            <Paragraph>{moment(event.DTSTART).format('MMMM Do YYYY, h:mm a')}</Paragraph>
          </Card.Content>
        </Card>
      ))
    )
  }

  return (
    <View style={style.container}>
      <Text style={{ textAlign: 'left' }} variant="displayLarge">Emploi du temps</Text>
      <Button style={{ marginTop: 16, marginBottom: 8 }} icon="logout" mode="contained-tonal" onPress={ () => logout(navigation) }> Se déconnecter </Button>
      <Button style={{ marginBottom: 16 }} icon="cog" mode="contained-tonal" onPress={ () => navigation.navigate('ShowSettings') }> Paramètres </Button>
      <Divider style={{ marginBottom: 16 }} />
      
      {getMyCal()}

    </View>
  );
}

// Page de paramètres
function ShowSettings( { navigation } ) {

  function askDeleteData() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
      SecureStore.deleteItemAsync("name");
      username = null;
      password = null;
      Image.clearDiskCache();
      Image.clearMemoryCache();
      Alert.alert("Données supprimées", "Retour à la page de connexion.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      logout(navigation);
  }

  function goBack() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.goBack();
  }

  return (
    <View style={style.container}>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayLarge">Paramètres</Text>
      <Button style={{ marginBottom: 8 }} icon="arrow-left" mode="contained-tonal" onPress={ () => goBack() }> Retourner en arrière </Button>
      <Button style={{ marginBottom: 8 }} icon="bug" mode="contained-tonal" onPress={ () => handleURL("https://notes.metrixmedia.fr/bug") }> Signaler un bug </Button>
      <Button style={{ marginBottom: 8 }} icon="logout" mode="contained-tonal" onPress={ () => logout(navigation) }> Se déconnecter </Button>
      <Button style={style.buttonLogout} icon="delete" mode="contained-tonal" onPress={ () => askDeleteData() }> Supprimer les données de connexion </Button>
      
      <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">UniceNotes</Text>
      <Text style={{ textAlign: 'left' }} variant="titleMedium">Visualisez vos notes. Sans PDF.</Text>
      <Text style={{ textAlign: 'left' }} variant="titleMedium">⚡ Version : {appVersion}</Text>
      <Text style={{ textAlign: 'left' }} variant="titleMedium">❤️ Fièrement développé par un GEII : 
        <Text style={style.textLink} onPress={() => handleURL("https://github.com/hugofnm")}> @hugofnm </Text>
      </Text>

      <Text style={{ marginTop: 16, textAlign: 'left' }} variant="titleMedium">UniceNotes n'est lié d'aucune forme à l'Université Côte d'Azur.</Text>
      <Button style={{ marginTop: 32 }} icon="license" onPress={ () => handleURL("https://notes.metrixmedia.fr/credits") }> Mentions légales </Button>
      <Button style={{ marginTop: 4 }} icon="account-child-circle" onPress={ () => handleURL("https://metrixmedia.fr/privacy") }> Clause de confidentialité </Button>
      <Button style={{ marginTop: 4 }} icon="source-branch" onPress={ () => handleURL("https://github.com/UniceApps/UniceNotes") }> Code source </Button>
    </View>
  );
}

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
  buttonChangeSemester: {
    backgroundColor: choosenTheme.colors.tertiaryContainer
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