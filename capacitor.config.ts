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
      launchShowDuration: 2500,
      backgroundColor: '#0b0b11',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      // NOTE: splashFullScreen / splashImmersive intentionally omitted.
      // Those flags force Android into immersive mode which hides the status bar
      // and causes the WebView to extend behind the notch after launch.
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b0b11',
      overlaysWebView: false, // WebView must NOT extend under status bar
    },
    Keyboard: {
      style: 'dark',
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
