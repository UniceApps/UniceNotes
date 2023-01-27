import React, { useState } from 'react';
import { Alert, View, StyleSheet, StatusBar } from 'react-native';
import { Avatar, Text, TextInput, Button, Switch, Divider, ActivityIndicator, ProgressBar } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

var isLoggedIn = false; // App login
var isConnected = false; // UniceAPI login
var dataIsLoaded = false; // JSONPDF loaded
var name = ''; // User's name
var semesters = []; // User's semesters
var username = ''; // User's username
var password = ''; // User's password

// SecureStore API
async function save(key, value) {
  await SecureStore.setItemAsync(key, value);
}

async function verifyLogin() {
  username = await SecureStore.getItemAsync(username);
  password = await SecureStore.getItemAsync(password);
  if (username && password) {
    isLoggedIn = true;
  } else {
    isLoggedIn = false;
  }
}

// Page de connexion à l'application (login)
function LoginPage({ navigation }) {
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [seePassword, setSeePassword] = useState(true);

  // Résultat du bouton "Se connecter"
  const handleLogin = () => {
    setLoading(true);
    verifyLogin();
    if (isLoggedIn) {
      // Connexion par TouchID/FaceID et récupération des identifiants
      LocalAuthentication.authenticateAsync().then((result) => {
        if (result.success) {
          ssoUnice(username, password);
        }
      });
    }
    else {
      // Sauvegarde des identifiants si "Se souvenir de moi" est activé
      if(rememberMe) {
        save('username', username);
        save('password', password);
      }
      // Connexion par TouchID/FaceID
      LocalAuthentication.authenticateAsync().then((result) => {
        if (result.success) {
          ssoUnice(username, password);
        }
      });
    }
  }

  // Résultat du bouton "Clause de confidentialité"
  const privacy = async () => {
    let result = await WebBrowser.openBrowserAsync('https://metrixmedia.fr/privacy');
    setResult(result);
  };

  // Vérifie si l'utilisateur est déjà connecté (si oui auth par TouchID/FaceID)
  verifyLogin();
  if(isLoggedIn) {
    handleLogin();
  }

  // Vérifie si les données sont chargées (si oui redirection vers la page d'accueil)
  if(dataIsLoaded) {
    navigation.navigate('Home');
  }

  // Connexion au SSO de l'Université Nice Côte d'Azur et vérification des identifiants
  async function ssoUnice(username, password) {
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
      Alert.alert("Erreur", "Connexion au serveur impossible.");
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
      Alert.alert("Erreur", "Vos identifiants sont incorrects.");
    }
  };

  // Affichage en clair du mot de passe si clic sur l'oeil
  function viewPass() {
    setSeePassword(!seePassword);
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 25, marginRight: 25 }}>
      <Avatar.Icon style={{ alignSelf: "center", marginBottom: 16 }} size={100} icon="account" />
      <Text style={{ textAlign: 'center' }} variant="displayLarge">Bienvenue.</Text>
      <Text style={{ textAlign: 'center', marginBottom: 16 }} variant='titleMedium'>Veuillez entrer vos identifiants Sésame - IUT Nice pour continuer.</Text>
      <TextInput
        label="Nom d'utilisateur"
        value={username}
        onChangeText={(text) => setUsername(text)}
        style={{ marginBottom: 8 }}
        autoComplete = {{ url: "https://login.unice.fr" }}
      />
      <TextInput
        label='Mot de passe'
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry={seePassword}
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
      <Button style={{ marginBottom: 16 }}icon="account-child-circle" mode="contained-tonal" onPress={ () => privacy() }> Clause de confidentialité </Button>
      <ActivityIndicator animating={loading} size="large" />
    </View>
  );
}

function Semesters ({ navigation }) {

  name = name
    .split(" ")
    .map(word => word[0].toUpperCase() + word.substring(1).toLowerCase())
    .join(" ");

  function loadGrades(semester) {
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
  const [progress, setProgress] = useState(0);

  function logout() {
    isConnected = false;
    dataIsLoaded = false;
    fetch('https://api.unice.hugofnm.fr/logout');
    navigation.navigate('Login', { isConnected: isConnected, dataIsLoaded: dataIsLoaded });
  }


  async function loginAPI() {
    fetch('https://api.unice.hugofnm.fr/load_pdf').then(response => response.json())
    if(response.success) {
      setProgress(0.5);

      let apiResp = await fetch('https://api.unice.hugofnm.fr/scrape_pdf').then(response => response.json());
  
      if(!apiResp.ok || response.success == false){
        Alert.alert("Erreur", "Connexion au serveur impossible.");
      }
  
      let json = await apiResp.json();
  
      console.log(json);
  
      if(json.success) {
        setProgress(1);
        dataIsLoaded = true;
        grades = json.grades;
        admission = json.admission;
        average = json.average;
        position = json.position;
        console.log(grades);
        dataIsLoaded = true;
        navigation.navigate('Home', { dataIsLoaded: dataIsLoaded, grades: grades, admission: admission, average: average, position: position });
      } else {
        Alert.alert("Erreur", "Vos identifiants sont incorrects.");
      }
    }
    else {
      Alert.alert("Erreur", "Une erreur est survenue. EC=L");
    }
    return username, password;
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

function Home ({ navigation }) {
  <View>
    <Appbar.Header>
      <Appbar.BackAction disabled={true} />
    </Appbar.Header>
  </View>
}

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginPage} options={{ title: 'Se connecter', headerShown: false }} />
        <Stack.Screen name="Semesters" component={Semesters} options={{ title: 'Semestres', headerShown: false }} />  
        <Stack.Screen name="APIConnect" component={APIConnect} options={{ title: 'Chargement en cours...', gestureEnabled: false, presentation: "modal" }} />
        <Stack.Screen name="Home" component={Home} options={{ title: 'UniceNotes', gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;