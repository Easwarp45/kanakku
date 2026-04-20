import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

const ROOT_ROUTES = ['/dashboard', '/expenses', '/income', '/budget', '/analytics'];

export default function NativeAppBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPress = useRef<number>(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.body.classList.add('native-app');

    const setup = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0b0b11' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch {
        // Ignore status bar setup failures silently.
      }

      window.setTimeout(async () => {
        try {
          await SplashScreen.hide({ fadeOutDuration: 300 });
        } catch {
          // Ignore splash hide failures silently.
        }
      }, 400);

      try {
        await Keyboard.setAccessoryBarVisible({ isVisible: false });
        await Keyboard.setScroll({ isDisabled: true });
      } catch {
        // Ignore keyboard setup failures silently.
      }
    };

    void setup();

    return () => {
      document.body.classList.remove('native-app');
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backHandler = App.addListener('backButton', async () => {
      const isRootRoute = ROOT_ROUTES.some((route) => location.pathname === route);

      if (isRootRoute) {
        const now = Date.now();

        if (now - lastBackPress.current < 2000) {
          try {
            await Haptics.impact({ style: ImpactStyle.Medium });
          } catch {
            // Ignore haptics failures silently.
          }
          await App.exitApp();
          return;
        }

        lastBackPress.current = now;
        try {
          await Haptics.impact({ style: ImpactStyle.Light });
        } catch {
          // Ignore haptics failures silently.
        }
        window.dispatchEvent(new CustomEvent('native:back-press-hint'));
        return;
      }

      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {
        // Ignore haptics failures silently.
      }
      navigate(-1);
    });

    return () => {
      void backHandler.then((handle) => handle.remove());
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const stateHandler = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        window.dispatchEvent(new CustomEvent('native:app-foreground'));
      }
    });

    return () => {
      void stateHandler.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
