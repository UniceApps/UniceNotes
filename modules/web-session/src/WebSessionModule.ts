import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class WebSessionModule extends NativeModule {
  // réinjecte les cookies de session sauvegardés qui manquent, renvoie leur nombre
  restoreAsync(): Promise<number>;
  // sauvegarde les cookies de session (iOS) ou force leur écriture sur le disque (Android)
  persistAsync(): Promise<number>;
  // efface cookies, stockage web et sauvegarde
  clearAsync(): Promise<void>;
}

// null sans build natif (Expo Go, web)
export default requireOptionalNativeModule<WebSessionModule>('WebSession');
