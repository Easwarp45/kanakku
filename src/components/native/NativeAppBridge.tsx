import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

const ROOT_PATHS = new Set([
  '/dashboard',
  '/expenses',
  '/income',
  '/groups',
  '/intelligence',
  '/profile',
  '/analytics',
  '/insights/history',
]);

export function NativeAppBridge() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathRef = useRef(location.pathname);

  useEffect(() => {
    pathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    document.body.classList.add('native-app');

    void StatusBar.setStyle({ style: Style.Dark });
    void StatusBar.setBackgroundColor({ color: '#0b0b11' });
    void StatusBar.setOverlaysWebView({ overlay: false });
    void Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    void SplashScreen.hide({ fadeOutDuration: 280 });

    let backHandle: PluginListenerHandle | null = null;
    let deepLinkHandle: PluginListenerHandle | null = null;

    void CapApp.addListener('backButton', () => {
      const path = pathRef.current;
      if (ROOT_PATHS.has(path)) {
        void CapApp.minimizeApp();
        return;
      }

      navigate(-1);
    }).then((handle) => {
      backHandle = handle;
    });

    void CapApp.addListener('appUrlOpen', (event) => {
      try {
        const url = new URL(event.url);
        const targetPath = `${url.pathname}${url.search}${url.hash}`;
        if (targetPath && targetPath !== '/') {
          navigate(targetPath);
        }
      } catch {
        // Ignore invalid deep-link URLs.
      }
    }).then((handle) => {
      deepLinkHandle = handle;
    });

    return () => {
      backHandle?.remove();
      deepLinkHandle?.remove();
      document.body.classList.remove('native-app');
    };
  }, [navigate]);

  return null;
}
