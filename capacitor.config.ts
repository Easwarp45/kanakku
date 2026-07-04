import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kanakku.personal',
  appName: 'Kanakku',
  webDir: 'dist',
  android: {
    backgroundColor: '#0b0b11',
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 0,
      backgroundColor: '#0b0b11',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b0b11',
      overlaysWebView: false, // WebView must NOT extend under status bar
    },
    Keyboard: {
      resize: 'none',
    },
  },
};

export default config;
