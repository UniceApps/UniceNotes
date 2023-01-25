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
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = () => {
    loading = true;
    verifyLogin();
    if (isLoggedIn) {
      LocalAuthentication.authenticateAsync().then((result) => {
        if (result.success) {
          ssoUnice(username, password);
        }
      });
    }
    else {
      if(rememberMe) {
        save('username', username);
        save('password', password);
      }
      LocalAuthentication.authenticateAsync().then((result) => {
        if (result.success) {
          ssoUnice(username, password);
        }
      });
    }
  }

  const privacy = async () => {
    let result = await WebBrowser.openBrowserAsync('https://metrixmedia.fr/privacy');
    setResult(result);
  };

  verifyLogin();
  if(isLoggedIn) {
    handleLogin();
  }

  if(dataIsLoaded) {
    navigation.navigate('Home');
  }

  function ssoUnice(username, password) {
    console.log("Logging in...");
  };

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
      />
      <TextInput
        label='Mot de passe'
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry={true}
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
      <Button style={{ marginBottom: 16 }}icon="bug" mode="contained-tonal" onPress={() => navigation.navigate('APIConnect')}> Debug skip </Button>
      <ActivityIndicator animating={loading} size="large" />
    </View>
  );
}

function APIConnect ({ navigation }) {

  function ok() {
    dataIsLoaded = true;
    navigation.navigate('Login', { dataIsLoaded: dataIsLoaded });
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 25, marginRight: 25 }}>
      <Avatar.Icon style={{ alignSelf: "center", marginBottom: 16 }} size={200} icon="account" />
      <ProgressBar progress={0.5} style={{ marginBottom: 16 }} />
      <Button style={{ marginBottom: 16 }}icon="account-child-circle" mode="contained-tonal" onPress={() => navigation.navigate('Login')}> back to login </Button>
      <Button style={{ marginBottom: 16 }}icon="bug" mode="contained-tonal" onPress={ok}> skip (connexion OK) </Button>
    </View>
  );
}

function Home ({ navigation }) {
  var name = "Hugo";

  function ok() {
    dataIsLoaded = true;
    navigation.navigate('Login', { dataIsLoaded: dataIsLoaded });
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 25, marginRight: 25 }}>
      <Avatar.Icon style={{ alignSelf: "center", marginBottom: 16 }} size={100} icon="bug" />
      <Text style={{ textAlign: 'left' }} variant="displayLarge">Bonjour,</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayLarge">{name} !</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant='titleMedium'>Veuillez sélectionner un semestre.</Text>
      <Button style={{ marginBottom: 16 }} icon="account-child-circle" mode="contained-tonal" onPress={() => navigation.navigate('Login')}> back to login </Button>
      <Button style={{ marginBottom: 16, backgroundColor: "#FF0000" }} icon="logout" mode="contained-tonal" onPress={() => navigation.navigate('Login')}> Se déconnecter </Button>
    </View>
  );
}

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginPage} options={{ title: 'Se connecter', headerShown: false }} />
        <Stack.Screen name="APIConnect" component={APIConnect} options={{ title: 'Connexion en cours...', gestureEnabled: false, presentation: "modal" }} />
        <Stack.Screen name="Home" component={Home} options={{ title: 'UniceNotes', headerShown: false }} />  
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;