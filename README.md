<p align="center">
      <img alt="UniceNotes" height="200" src="https://github.com/UniceApps/UniceNotes/raw/main/assets/icon.png">
  <h2 align="center">UniceNotes</h2>

<p align="center">
  <b>UniceNotes</b> est un client mobile non-officiel du site web Intracursus de l'Université Côte d'Azur. Utilisant React Native, il est compatible avec la grande majorité des dispositifs mobiles (<b>iOS et Android</b>). <b>Visualisez vos notes. Sans PDF.</b>
</p>

## ⚡️ Téléchargement

**✨ Disponible sur iOS**

<a href='https://get.unice.cf/ios'><img width='200' alt='Get the beta on TestFlight' src='https://github.com/UniceApps/UniceNotes-Website/raw/main/assets/img/appstore.png'/></a>

**✨ Disponible sur Android**

<a href='https://get.unice.cf/android'><img width='200' alt='Get the beta on TestFlight' src='https://github.com/UniceApps/UniceNotes-Website/raw/main/assets/img/android.png'/></a>

## ⚠️ Erreurs pouvant apparaître sur l'application

- ```EC=0xL``` -> Erreur au login
- ```EC=0xG``` -> Erreur à la récupération des notes
- ```EC=0xS``` -> Erreur à la connexion au serveur
- ```EC=0xI``` -> Mot de passe ou nom d'utilisateur incorrect
- ```EC=0xB``` -> Authentification via SecureStore annulée (FaceID ou TouchID)

## ⚙️ Contribution

Merci pour votre intérêt pour le projet ! Si vous souhaitez contribuer, contactez-nous grâce à l'email suivant : [app at unice.cf](mailto://app@unice.cf) ou en créant une issue / pull request sur GitHub.

## 📜 Licence

L'application UniceNotes, son logo et son site web sont sous licence [MIT License](https://github.com/UniceApps/UniceNotes/raw/main/LICENSE).
\
Certains composants intégrés peuvent être sous des licences différentes, consultez le [site web](https://notes.unice.cf/credits) pour plus d'informations.

## 🔒 Confidentialité

L'application UniceNotes ne collecte aucune donnée personnelle. 
\
Les données sont **stockées sur votre appareil** et ne sont pas envoyées sur un serveur (sauf l'API communiquant avec Intracursus). 
\
Les données sont stockées dans un format **crypté** et ne peuvent être lues que par l'application lorsque l'utilisateur s'identifie grâce à un moyen biométrique / code. [Voir l'API SecureStore](https://docs.expo.dev/versions/v47.0.0/sdk/securestore/)
