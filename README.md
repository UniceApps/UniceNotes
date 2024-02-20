<p align="center">
      <img alt="UniceNotes" height="200" src="https://raw.githubusercontent.com/UniceApps/UniceNotes/main/.docs/assets/logo.png">
  <h2 align="center">UniceNotes</h2>

<p align="center">
  <b>UniceNotes</b> est un client mobile non-officiel donnant accès à de multiples ressources provenant de l'Espace Numérique de Travail de l'I.U.T de Nice Côte d'Azur (Notes via Intracursus / Emploi du temps et Absences via GPU). Utilisant React Native, il est compatible avec la grande majorité des dispositifs mobiles (<b>iOS et Android</b>). <b>Votre ENT. Dans votre poche.</b>
</p>

## ⚡️ Téléchargement

**✨ Disponible sur iOS**

<a href='https://apps.apple.com/fr/app/unicenotes/id1668992337'><img width='200' alt='Get the app on App Store' src='https://github.com/UniceApps/UniceNotes-Website/raw/main/assets/img/appstore.png'/></a>

**✨ Disponible sur Android**

<a href='https://play.google.com/store/apps/details?id=fr.hugofnm.unicenotes'><img width='200' alt='Get the app on Play Store' src='https://github.com/UniceApps/UniceNotes-Website/raw/main/assets/img/googleplay.png'/></a>

## ⚠️ Documentation

- Données : [Voir la documentation](https://github.com/UniceApps/UniceNotes/tree/main/.docs/DATA.md)
- Erreurs : [Voir la documentation](https://github.com/UniceApps/UniceNotes/tree/main/.docs/ERRORS.md)
- Haptics : [Voir la documentation](https://github.com/UniceApps/UniceNotes/tree/main/.docs/HAPTICS.md)
- Utilisation : [Voir la documentation](https://github.com/UniceApps/UniceNotes/tree/main/.docs/USAGE.md)
- API : [Voir la documentation](https://github.com/UniceApps/UniceAPI)

## ⚙️ Contribution

Merci pour votre intérêt pour le projet ! Si vous souhaitez contribuer, contactez-nous grâce à l'email suivant : [app at metrixmedia.fr](mailto://app@metrixmedia.fr) ou en créant une issue / pull request sur GitHub.

## 📜 Licence

L'application UniceNotes et son site web sont sous licence [MIT License](https://github.com/UniceApps/UniceNotes/raw/main/LICENSE).
\
Le logo UniceNotes est sous licence [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International](
https://creativecommons.org/licenses/by-nc-nd/4.0/).
\
Certains composants intégrés peuvent être sous des licences différentes, consultez le [site web](https://notes.metrixmedia.fr/credits) pour plus d'informations.

## 🔒 Confidentialité

L'application UniceNotes ne collecte **aucune** donnée personnelle. 
\
L'application UniceNotes utilise :
- Le nom d'utilisateur 
- Le nom complet
- La photo de profil
- Les notes (avec les moyennes)
- L'emploi du temps
- Les absences, retards et exclusions


avec votre consentement (en vous connectant sur l'application) afin de vous fournir une expérience utilisateur optimale.
Ces données sont récupérées depuis le site web Intracursus ou GPU de l'Université Côte d'Azur et ne quittent pas votre appareil.
\
Les données de connexion sont **stockées sur votre appareil** et ne sont pas stockées sur un serveur (Seuls vos identifiants sont utilisés sur ```login.univ-cotedazur.fr``` afin de vous identifier et créer un token). 
\
Les données de connexion (critiques) sont stockées dans un format **crypté** dans la Keychain d'Apple / Keystore d'Android et ne peuvent être déchiffrées que par l'utilisateur lorsqu'il s'identifie grâce à un code ou grâce à une option de connxion biométrique. [Voir l'API SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
\
Les données non-critiques sont stockées dans un stockage persistant nommé AsyncStorage de React Native. [Voir l'API AsyncStorage](https://react-native-async-storage.github.io/async-storage/docs/usage/)

## 🛠️ Build

Pour construire l'application, vous aurez besoin de Node.js, npm, Expo CLI, EAS CLI et un compte Expo.

> [!IMPORTANT]
> Attention, vous devez posséder un compte payant Apple Developer ou Google Play Console pour pouvoir construire l'application pour iOS ou Android.

```bash
# Installer Expo CLI et EAS CLI
npm install -g expo-cli eas-cli

# Cloner le dépôt
git clone https://github.com/UniceApps/UniceNotes.git

# Aller dans le dossier
cd UniceNotes

# Installer les dépendances
npm install

# Démarrer l'application en mode développement
# Vous devez posséder Expo Go sur votre appareil
npx expo

# Construire l'application
eas login
eas build --platform all
```

Si le code source de l'application est modifié, il se peut que les fonctionnalités de l'application ne fonctionnent plus correctement à cause d'une vérification du hash de l'application par le serveur API.

## 📄 Légal

The Apple logo® and the App Store® are trademarks of Apple Inc., registered in the U.S. and other countries. 

The Google Play Store logo® and the Google Play Store® are trademarks of Google Inc., registered in the U.S. and other countries.

## 📝 Notes

UniceNotes n'est aucunement affilié à l'Université Côte d'Azur ou à l'I.U.T. Nice Côte d'Azur.

Toute ressemblance avec le nom de l'application, le logo et l'interface ne saurait être que fortuite.

L'application UniceNotes utilise Expo, un framework basé sur React Native.
\
<img src='https://raw.githubusercontent.com/UniceApps/UniceNotes/main/.docs/assets/expo-bottomlogo.png'/>