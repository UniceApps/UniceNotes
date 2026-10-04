<p align="center">
      <img alt="UniceNotes" height="200" src="https://raw.githubusercontent.com/UniceApps/UniceNotes/main/src/assets/ios/default.png">
  <h2 align="center">UniceNotes</h2>

<p align="center">
  <b>UniceNotes</b> est un client mobile non-officiel donnant accès à de multiples ressources provenant de l'Espace Numérique de Travail de l'Université Côte d'Azur. Utilisant React Native, il est compatible avec la grande majorité des dispositifs mobiles (<b>iOS et Android</b>). <b>Ton ENT. Dans ta poche.</b>
</p>

## ⚡️ Téléchargement

**✨ Disponible sur iOS**

<a href='https://apps.apple.com/fr/app/unicenotes/id1668992337'><img width='200' alt='Get the app on App Store' src='https://github.com/UniceApps/UniceNotes-Website/raw/main/assets/img/appstore.png'/></a>

**✨ Disponible sur Android**

<a href='https://play.google.com/store/apps/details?id=fr.hugofnm.unicenotes'><img width='200' alt='Get the app on Play Store' src='https://github.com/UniceApps/UniceNotes-Website/raw/main/assets/img/googleplay.png'/></a>

## ⚠️ Documentation

- Données : [Voir la documentation](https://github.com/UniceApps/UniceNotes/tree/main/.docs/DATA.md)
- Haptics : [Voir la documentation](https://github.com/UniceApps/UniceNotes/tree/main/.docs/HAPTICS.md)
- API ADE : [Voir la documentation](https://github.com/UniceApps/UniceNotes/tree/main/.docs/ADE_API.md)
- Utilisation : [Voir la documentation](https://github.com/UniceApps/UniceNotes/tree/main/.docs/USAGE.md)
- API : [Voir la documentation](https://github.com/UniceApps/UniceAPI)

## 🗂️ Architecture

```
modules/
└── web-session/  module natif local : garde la connexion aux services de l'ENT (cookies de session)
src/
├── app/          écrans (expo-router : un fichier = une route, (tabs)/ = barre d'onglets)
├── components/
│   ├── ui/       briques communes : Screen, Card, ListItem, Tile, Sheet, Banner…
│   └── …         composants propres à un écran (home, rooms, timetable, browser, ent, appearance)
├── context/      réglages et emploi du temps partagés par toute l'app
├── hooks/        logique réutilisable des écrans
├── services/     accès réseau : ADE, UniceAPI, cache, widgets
├── theme/        palettes Material 3 et thème choisi
├── utils/        fonctions pures : dates, couleurs, parseurs ADE…
└── widgets/      widgets iOS / Android et Live Activity
```

L'emploi du temps n'est téléchargé qu'à un seul endroit (`src/context/CalendarContext.tsx`) : l'accueil, l'écran emploi du temps, les widgets et la Live Activity partagent les mêmes données.

Les services de l'ENT (`src/constants/ent.ts`) s'ouvrent dans le navigateur de l'app (`src/app/browser.tsx`), qui n'accepte que les services de ce catalogue : un lien profond ne peut pas lui faire ouvrir une autre adresse.

## ⚙️ Contribution

Merci pour ton intérêt pour le projet ! Si tu souhaites contribuer, contacte-nous grâce à l'email suivant : [app at metrixmedia.fr](mailto://app@metrixmedia.fr) ou en créant une issue / pull request sur GitHub.

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
- Le nom d'utilisateur / numéro étudiant
- L'emploi du temps

avec ton consentement (en te connectant sur l'application et en acceptant les conditions d'utilisation) afin de te fournir une expérience utilisateur optimale.
\
Les données critiques sont stockées dans un format **chiffré** dans la Keychain d'Apple / Keystore d'Android et ne peuvent être déchiffrées que par l'utilisateur lorsqu'il s'identifie grâce à un code ou grâce à une option de connexion biométrique. [Voir l'API SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
\
Les données non-critiques sont stockées dans un stockage persistant nommé AsyncStorage de React Native. [Voir l'API AsyncStorage](https://react-native-async-storage.github.io/async-storage/docs/usage/)

## 🛠️ Build

Pour construire l'application, vous aurez besoin de Node.js, npm, EAS CLI et un compte Expo.

> [!IMPORTANT]
> Attention, vous devez posséder un compte payant Apple Developer ou Google Play Console pour pouvoir construire l'application pour iOS ou Android.

```bash
# Installer EAS CLI
npm install -g eas-cli

# Cloner le dépôt
git clone https://github.com/UniceApps/UniceNotes.git
cd UniceNotes

# Installer les dépendances
npm install

# Renseigner le jeton ADE et les clés Measure
cp .env.example .env

# Vérifier le code
npm run lint
npm run typecheck

# Démarrer l'application en mode développement
# L'app utilise des modules natifs (widgets, icônes…) : Expo Go ne suffit pas, il faut un build de développement
npx expo run:ios     # ou npx expo run:android

# Construire l'application
eas login
eas build --platform all
```

## 📄 Légal

The Apple logo® and the App Store® are trademarks of Apple Inc., registered in the U.S. and other countries. 

The Google Play Store logo® and the Google Play Store® are trademarks of Google Inc., registered in the U.S. and other countries.

## 📝 Notes

UniceNotes n'est aucunement affilié à l'Université Côte d'Azur, Polytech Nice Sophia Antipolis ou à l'I.U.T. Nice Côte d'Azur.
Toute ressemblance avec le nom de l'application, le logo et l'interface ne saurait être que fortuite.

Toute utilisation de l'application UniceNotes est sous la seule responsabilité de l'utilisateur.

Cette application agit comme un client internet où l'utilisateur effectue des pseudos-requêtes (GET HTTPS) sur l'intranet de l'Université Côte d'Azur à travers des API exposées. Cette application ne contient aucun code malveillant et ne vise pas à nuire à l'Université Côte d'Azur ou à ses utilisateurs. Les éventuelles suspicions de "fuites de données" sont infondées du fait de la nature de l'application (les données sont stockées sur l'appareil de l'utilisateur et non sur des serveurs tiers).

## 🤝 Conditions d'utilisation :
[Consulter les conditions d'utilisation](https://notes.metrixmedia.fr/eula)

---
L'application UniceNotes utilise Expo, un framework basé sur React Native.
\
<a href="https://expo.dev"> <img src='https://raw.githubusercontent.com/UniceApps/UniceNotes/main/.docs/assets/expo-bottomlogo.png'/></a>