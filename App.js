import React, { useState } from 'react';
import { Alert, View, StyleSheet, StatusBar } from 'react-native';
import { Avatar, Text, TextInput, Button, Switch, Divider, ActivityIndicator, ProgressBar } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

var isLoggedIn = false;
var loading = false;
var dataIsLoaded = false;
var name = '';
var semesters = [];
var username = '';
var password = '';

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
      isLoggedIn = true;
      name = json.name;
      semesters = json.semesters;
      console.log(semesters);
      loading = false;
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
        right={<TextInput.Icon icon="eye" onPress={viewPass} />}
        style={{ marginBottom: 16 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom:16}}>
          <Switch value={rememberMe} onValueChange={setRememberMe} color="#3f51b5"/>
          <Text style={{ marginLeft:8}}> Se souvenir de moi</Text>
        </View>
      <Button style={{ marginBottom: 16 }}icon="login" mode="contained-tonal" onPress={handleLogin}> Se connecter </Button>
      <Divider style={{ marginBottom: 16 }} />
      <Text style={{ textAlign: 'center', marginBottom: 16 }} variant='titleMedium'>Vos données sont sécurisées et ne sont sauvegardées que sur votre téléphone.</Text>
      <Button style={{ marginBottom: 16 }}icon="account-child-circle" mode="contained-tonal" onPress={privacy}> Clause de confidentialité </Button>
      <ActivityIndicator animating={loading} size="large" />
    </View>
  );
}

function Semesters ({ navigation }) {
  function loadGrades(semester) {
      navigation.navigate('APIConnect', { semester: semester });
  }

  function includeSemesters(semesters) {
    let buttons = [];
    semesters.forEach(semester => {
      buttons.push(
        <Button style={{ marginTop: 8 }} icon="arrow-right-drop-circle" mode="contained-tonal" onPressOut={ () => loadGrades(semester) }> {semester} </Button>
      )
    });
    return buttons;
  }
  
  function logout() {
    isLoggedIn = false;
    dataIsLoaded = false;
    fetch('https://api.unice.hugofnm.fr/logout');
    navigation.navigate('Login', { isLoggedIn: isLoggedIn, dataIsLoaded: dataIsLoaded });
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 25, marginRight: 25 }}>
      <Avatar.Icon style={{ alignSelf: "center", marginBottom: 16 }} size={100} icon="check" />
      <Text style={{ textAlign: 'left' }} variant="displayLarge">Bonjour,</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displaySmall">{name} !</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Veuillez sélectionner un semestre.</Text>

      {includeSemesters(semesters)}

      <Button style={{ marginTop : 16, backgroundColor: "#FF0000" }} icon="logout" mode="contained-tonal" onPress={logout}> Se déconnecter </Button>
    </View>
  );
}

function APIConnect ({ navigation }) {
  const [progress, setProgress] = useState(0);

  function ok() {
    dataIsLoaded = true;
    navigation.navigate('Login', { dataIsLoaded: dataIsLoaded });
  }

  function loginAPI() {
    return username, password;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 25, marginRight: 25 }}>
      <Avatar.Icon style={{ alignSelf: "center", marginBottom: 16 }} size={200} icon="account" />
      <ProgressBar progress={progress} style={{ marginBottom: 16 }} />

      <Button style={{ marginBottom: 16 }}icon="account-child-circle" mode="contained-tonal" onPress={() => navigation.navigate('Login')}> back to login </Button>
      <Button style={{ marginBottom: 16 }}icon="bug" mode="contained-tonal" onPress={ok}> skip (connexion OK) </Button>
    </View>
  );
}

function Home ({ navigation }) {

}

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginPage} options={{ title: 'Se connecter', headerShown: false }} />
        <Stack.Screen name="Semesters" component={Semesters} options={{ title: 'Semestres', headerShown: false }} />  
        <Stack.Screen name="APIConnect" component={APIConnect} options={{ title: 'Chargement en cours...', gestureEnabled: false, presentation: "modal" }} />
        <Stack.Screen name="Home" component={Home} options={{ title: 'UniceNotes', headerShown: false, gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;