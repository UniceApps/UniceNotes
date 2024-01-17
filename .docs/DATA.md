# Data guide

## Data stored in SecureStore

<p align="center">
  <img src="https://docs.expo.dev/static/images/packages/expo-secure-store.png" alt="SecureStore" width="50"/>

This data is stored in the secure enclave (Keychain from Apple / Keystore from Android) of the device, which is a secure storage system that is used to store sensitive data. The data is encrypted and can only be accessed by the user with biometrical authentication or a password (phone PIN).

- ```username```: Username of the user
- ```password```: Password of the user
- ```name```: Full name of the user

## Data stored in AsyncStorage

<p align="center">
  <img src="https://docs.expo.dev/static/images/packages/expo-file-system.png" alt="AsyncStorage" width="50"/>

This data is stored in the AsyncStorage of the device, which is a storage system that is used to store data. The data is not encrypted and can be accessed by the user.

- ```autoSet```: Boolean value to check if the user has chosen to automatically calculate the overall average
- ```haptics```: Boolean value to check if the user has chosen to enable haptics
- ```configAverage```: String value that contains or the letter B for bonus or the letter M for malus
- ```matiereBonus```: String value that contains the name of the subject that will be used for the bonus
- ```matiereMalus```: String value that contains the name of the subject that will be used for the malus
- ```calendar```: Array of objects containing the calendar events	
- ```server```: String value that contains the name of the server that the user has chosen