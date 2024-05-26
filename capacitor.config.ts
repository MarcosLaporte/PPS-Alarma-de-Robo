import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pp3.app',
  appName: 'Alarma de Robo',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchFadeOutDuration: 2000,
      launchShowDuration: 2000,
      splashFullScreen: false
    }
  }
};

export default config;
