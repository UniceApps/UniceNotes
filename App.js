import React, { useState } from 'react';
import { Alert, View, StyleSheet, StatusBar, ScrollView, Image } from 'react-native';
import { Avatar, Text, TextInput, Button, Switch, Divider, ActivityIndicator, ProgressBar, BottomNavigation, DataTable } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
        autoComplete = {{ url: "https://login.unice.fr" }}
      />
      <TextInput
        label='Mot de passe'
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry={seePassword}
        returnKeyType="go"
        onSubmitEditing={() => handleLogin()}
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
  const [progress, setProgress] = useState(0);

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
          Alert.alert("Erreur", "Connexion au serveur impossible.");
        }
    
        let json = await pdfAPI.json();
      
        setProgress(1);
        grades = json.grades; // toutes les notes, moyennes, noms des profs, etc.
        admission = json.admission; // admission oui/non
        average = json.average; // moyenne générale
        position = json.position; // position dans le classement
        dataIsLoaded = true;
        navigation.navigate('ShowGrades', { grades : grades, admission : admission, average : average, position : position });
      }
      else {
        Alert.alert("Erreur", "Une erreur est survenue. EC=L");
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
  const [result, setResult] = useState(false);

  function logout() {
    isConnected = false;
    isLoggedIn = false;
    dataIsLoaded = false;
    fetch('https://api.unice.hugofnm.fr/logout');
    navigation.navigate('Login', { isConnected: isConnected, dataIsLoaded: dataIsLoaded, isLoggedIn: isLoggedIn });
  }

  function deleteData() {
    Alert.alert("Suppression des données", "Voulez-vous vraiment supprimer les données de l'application ?", [
      {
        text: "Annuler",
        onPress: () => setConfirm(false),
        style: "cancel"
      },
      { 
        text: "Supprimer", 
        onPress: () => setConfirm(true) 
      }]);

    if(confirm){
      save('username', '');
      save('password', '');
      logout();
    }
  }

  const handleURL = async (url) => {
    let result = await WebBrowser.openBrowserAsync(url);
    setResult(result);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', marginLeft: 25, marginRight: 25 }}>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="displayLarge">Paramètres</Text>
      <Button style={{ marginBottom: 8 }} icon="bug" mode="contained-tonal" onPress={ () => handleURL("https://notes.unice.cf/bug") }> Signaler un bug </Button>
      <Button style={{ marginBottom: 8 }} icon="logout" mode="contained-tonal" onPress={ () => logout() }> Se déconnecter </Button>
      <Button style={{ marginBottom: 16, backgroundColor: "#FF0000" }} icon="delete" mode="contained-tonal" onPress={ () => deleteData() }> Supprimer les données de connexion </Button>
      

      <Text style={{ textAlign: 'left' }} variant="titleMedium">Version: 1.0.0</Text>
      <Text style={{ textAlign: 'left' }} variant="titleMedium">Développé par @hugofnm</Text>
      <Text style={{ textAlign: 'left', marginBottom: 16 }} variant="titleMedium">GitHub:
        <Text style={{ color: 'blue' }} onPress={() => handleURL("https://github.com/UniceApps/UniceNotes")}> github.com/UniceApps/UniceNotes </Text>
      </Text>
      <Text style={{ textAlign: 'left' }} variant="titleMedium">UniceNotes n'est lié d'aucune forme à l'Université Côte d'Azur.</Text>
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
        <Stack.Screen name="ShowGrades" component={ShowGrades} options={{ title: 'Notes', headerShown: false }} />
        <Stack.Screen name="ShowSettings" component={ShowSettings} options={{ title: 'Paramètres' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;