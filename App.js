/*

UniceNotes
Développé par Hugo Meleiro (@hugofnm)
MIT License

*/

import React, { useState, useEffect } from 'react';
import { Alert, View, StyleSheet, StatusBar, ScrollView, Image } from 'react-native';

// Material Design 3 API (React Native Paper)
import { Avatar, Text, TextInput, 
  Button, Switch, Divider, 
  ActivityIndicator, ProgressBar, BottomNavigation, 
  DataTable
} from 'react-native-paper';

// Expo API
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

var appVersion = '1.0.0';

var isLoggedIn = false; // App login
var isConnected = false; // UniceAPI login
var dataIsLoaded = false; // JSONPDF loaded
var semesters = []; // User's all semesters
var name = ''; // User's name
var semester = ''; // User's semesters
var username = ''; // User's username
var password = ''; // User's password

var grades = []; // User's grades

// SecureStore API
async function save(key, value) {
  await SecureStore.setItemAsync(key, value);
}

// Ouverture de pages web dans le navigateur par défaut
const handleURL = async (url) => {
  await WebBrowser.openBrowserAsync(url);
};

// Page de connexion à l'application (login)
function LoginPage({ navigation }) {

  var [username, setUsername] = useState(username);
  var [password, setPassword] = useState(password);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [seePassword, setSeePassword] = useState(true);
  const [isBooted, setIsBooted] = useState(false);
  const [count, setCount] = useState(0);

  if(count == 0) {
    setCount(1);
    // Vérifie si l'utilisateur est déjà connecté (si oui auth par TouchID/FaceID)
    verifyLogin();
  }
  
  async function verifyLogin() {
    var res = true;
    
    if(!isBooted) {
      setPassword(await SecureStore.getItemAsync("passkey"));
      setUsername(await SecureStore.getItemAsync("username"));
      if (username != "" || password != "") {
        setIsBooted(true);
        isConnected = false;
        handleLogin();
      } else {
        setIsBooted(true);
      }
      return res;
    }
  }
  
  // Résultat du bouton "Se connecter"
  function handleLogin() {
    setLoading(true);
    // Sauvegarde des identifiants si "Se souvenir de moi" est activé
    if(rememberMe) {
      save('username', username);
      save('passkey', password);
    }
    // Connexion par TouchID/FaceID
    LocalAuthentication.authenticateAsync().then((result) => {
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
          "Content-type": "application/json"
        }
      })
    
      if(!apiResp.ok){
        setLoading(false);
        Alert.alert("Erreur", "Connexion au serveur impossible. EC=0xS");
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
    setSeePassword(!seePassword);
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 25, marginRight: 25 }}>
      <Avatar.Image style={{ alignSelf: "center", marginBottom: 16 }} size={100} source={require('./assets/icon.png')} />
      <Text style={{ textAlign: 'center' }} variant="displayLarge">Bienvenue.</Text>
      <Text style={{ textAlign: 'center', marginBottom: 16 }} variant='titleMedium'>Veuillez entrer vos identifiants Sésame - IUT Nice pour continuer.</Text>
      <TextInput
        label="Nom d'utilisateur"
        value={username}
        defaultValue={username}
        onChangeText={(text) => setUsername(text)}
        returnKeyType="next"
        style={{ marginBottom: 8 }}
        
      />
      <TextInput
        label='Mot de passe'
        value={password}
        defaultValue={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry={seePassword}
        returnKeyType="go"
        right={<TextInput.Icon icon="eye" onPress={ () => viewPass() } />}
        style={{ marginBottom: 16 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom:16}}>
          <Switch value={rememberMe} onValueChange={setRememberMe} color="#3f51b5"/>
          <Text style={{ marginLeft:8}}> Se souvenir de moi</Text>
        </View>
      <Button style={{ marginBottom: 16 }}icon="login" mode="contained-tonal" onPress={ () => handleLogin() }> Se connecter </Button>
      <Divider style={{ marginBottom: 16 }} />
      <Text style={{ textAlign: 'center', marginBottom: 16 }} variant='titleMedium'>Vos données sont sécurisées et ne sont sauvegardées que sur votre téléphone.</Text>
      <Button style={{ marginBottom: 4 }} icon="license" onPress={ () => handleURL("https://notes.unice.cf/credits") }> Mentions légales </Button>
      <Button icon="account-child-circle" onPress={ () => handleURL("https://metrixmedia.fr/privacy") }> Clause de confidentialité </Button>
      <ActivityIndicator animating={loading} size="large" />
    </View>
  );
}

function Semesters ({ navigation }) {

  // Correction du nom de l'étudiant
  name = name
    .split(" ")
    .map(word => word[0].toUpperCase() + word.substring(1).toLowerCase())
    .join(" ");

  // Fonction de chargement des notes
  function loadGrades(semester) {
      global.semester = semester;
      navigation.navigate('APIConnect', { semester: semester });
  }
  
  function logout() {
    isConnected = false;
    dataIsLoaded = false;
    fetch('https://api.unice.hugofnm.fr/logout');
    navigation.navigate('Login', { isConnected: isConnected, dataIsLoaded: dataIsLoaded });
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 25, marginRight: 25 }}>
      <Avatar.Icon style={{ alignSelf: "center", marginBottom: 16 }} size={100} icon="check" />
      <Text style={{ textAlign: 'left' }} variant="displayLarge">Bonjour,</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displaySmall">{name} !</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Veuillez sélectionner un semestre.</Text>

      {semesters.map((semester) => (
        <Button style={{ marginTop: 8 }} icon="arrow-right-drop-circle" mode="contained-tonal" onPress={ () => loadGrades(semester) }> {semester} </Button>
      ))}

      <Button style={{ marginTop : 16, backgroundColor: "#FF0000" }} icon="logout" mode="contained-tonal" onPress={ () => logout() }> Se déconnecter </Button>
    </View>
  );
}

function APIConnect ({ navigation }) {
  const [progress, setProgress] = useState(0.1);

  function logout() {
    isConnected = false;
    dataIsLoaded = false;
    fetch('https://api.unice.hugofnm.fr/logout');
    navigation.navigate('Login', { isConnected: isConnected, dataIsLoaded: dataIsLoaded });
  }


  async function loginAPI() {
    if(!dataIsLoaded){
      let response = await fetch('https://api.unice.hugofnm.fr/load_pdf')
      if(response.status == 200) {
        setProgress(0.5);
  
        let pdfAPI = await fetch('https://api.unice.hugofnm.fr/scrape_pdf');
    
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
    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 25, marginRight: 25 }}>
      <Avatar.Icon style={{ alignSelf: "center", marginBottom: 32 }} size={200} icon="sync" />

      <ProgressBar progress={progress} style={{ marginBottom: 32 }} />

      <Button style={{ marginBottom: 16 }}icon="account-child-circle" mode="contained-tonal" onPress={ () => logout() }> Annuler </Button>
    </View>
  );
}

function ShowGrades( { route, navigation } ) {

  const [admission, setAdmission] = route.params.admission;
  const [average, setAverage] = route.params.average;
  const [position, setPosition] = route.params.position;

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
    if(admission || average || position) {
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
        <Text>{item.name}</Text>
        <Text>Professeur : {item.teacher}</Text>
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
  
  function logout() {
    isConnected = false;
    isLoggedIn = false;
    dataIsLoaded = false;
    fetch('https://api.unice.hugofnm.fr/logout');
    navigation.navigate('Login', { isConnected: isConnected, dataIsLoaded: dataIsLoaded, isLoggedIn: isLoggedIn });
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 25, marginRight: 25, marginTop: 50 }}>
      <ScrollView>
        <Text style={{ textAlign: 'left' }} variant="displayLarge">Notes</Text>
        <Button style={{ marginTop: 16, marginBottom: 8 }} icon="logout" mode="contained-tonal" onPress={ () => logout() }> Se déconnecter </Button>
        <Button style={{ marginBottom: 16 }} icon="cog" mode="contained-tonal" onPress={ () => navigation.navigate('ShowSettings') }> Paramètres </Button>
        {showHeader()}
        {showTable()}
      </ScrollView>
    </View>
  );
}

function ShowSettings( { navigation } ) {
  const [confirm, setConfirm] = useState(false);

  function logout() {
    isConnected = false;
    isLoggedIn = false;
    dataIsLoaded = false;
    fetch('https://api.unice.hugofnm.fr/logout');
    navigation.navigate('Login', { isConnected: isConnected, dataIsLoaded: dataIsLoaded, isLoggedIn: isLoggedIn });
  }

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
      save("username", '');
      save("passkey", '');
      username = '';
      password = '';
      Alert.alert("Données supprimées", "Retour au menu principal.");
      logout();
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 25, marginRight: 25 }}>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayLarge">Paramètres</Text>
      <Button style={{ marginBottom: 8 }} icon="bug" mode="contained-tonal" onPress={ () => handleURL("https://notes.unice.cf/bug") }> Signaler un bug </Button>
      <Button style={{ marginBottom: 8 }} icon="logout" mode="contained-tonal" onPress={ () => logout() }> Se déconnecter </Button>
      <Button style={{ marginBottom: 16, backgroundColor: "#FF0000" }} icon="delete" mode="contained-tonal" onPress={ () => askDeleteData() }> Supprimer les données de connexion </Button>
      
      <Text style={{ textAlign: 'left' }} variant="titleMedium">UniceNotes</Text>
      <Text style={{ textAlign: 'left' }} variant="titleMedium">Visualisez vos notes. Sans PDF.</Text>
      <Text style={{ textAlign: 'left' }} variant="titleMedium">Version: {appVersion}</Text>
      <Text style={{ textAlign: 'left' }} variant="titleMedium">Développé par @hugofnm</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">GitHub:
        <Text style={{ color: 'blue' }} onPress={() => handleURL("https://github.com/UniceApps/UniceNotes")}> github.com/UniceApps/UniceNotes </Text>
      </Text>
      <Text style={{ textAlign: 'left' }} variant="titleMedium">UniceNotes n'est lié d'aucune forme à l'Université Côte d'Azur.</Text>
      <Button style={{ marginTop: 32 }} icon="license" onPress={ () => handleURL("https://notes.unice.cf/credits") }> Mentions légales </Button>
      <Button style={{ marginTop: 4 }} icon="account-child-circle" onPress={ () => handleURL("https://metrixmedia.fr/privacy") }> Clause de confidentialité </Button>
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
        <Stack.Screen name="APIConnect" component={APIConnect} options={{ title: 'Chargement en cours...', gestureEnabled: false, headerShown: false }} />
        <Stack.Screen name="ShowGrades" component={ShowGrades} options={{ title: 'Notes', headerShown: false, gestureEnabled: false}} />
        <Stack.Screen name="ShowSettings" component={ShowSettings} options={{ title: 'Paramètres' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;