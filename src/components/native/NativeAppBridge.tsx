import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Root-level tab paths — pressing Back here minimizes the app instead of going back
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

  // Always keep a fresh ref to the current path so the back-button handler
  // (which is registered in a closure) never uses a stale value.
  const pathRef = useRef(location.pathname);

  useEffect(() => {
    pathRef.current = location.pathname;
  }, [location.pathname]);

  // ── One-time native setup ─────────────────────────────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.body.classList.add('native-app');

    // Keep status bar below the web content (no overlay = respects safe area)
    void StatusBar.setStyle({ style: Style.Dark });
    void StatusBar.setBackgroundColor({ color: '#0b0b11' });
    void StatusBar.setOverlaysWebView({ overlay: false });

    void SplashScreen.hide({ fadeOutDuration: 280 });

    // Deep-link handler (register once; navigate ref is re-used via closure below)
    let deepLinkHandle: PluginListenerHandle | null = null;
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
      deepLinkHandle?.remove();
      document.body.classList.remove('native-app');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once

  // ── Back-button handler — re-registered when navigate changes ─────────────
  // Keeping this in a separate effect tied to `navigate` ensures we always
  // hold a fresh `navigate` reference without re-running the whole setup.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let backHandle: PluginListenerHandle | null = null;

    void CapApp.addListener('backButton', () => {
      const currentPath = pathRef.current;

      // On root tabs → minimize the app (Android home screen behaviour)
      if (ROOT_PATHS.has(currentPath)) {
        void CapApp.minimizeApp();
        return;
      }

      // On any sub-page → go back to the previous screen in history
      navigate(-1);
    }).then((handle) => {
      backHandle = handle;
    });

    return () => {
      backHandle?.remove();
    };
  }, [navigate]);

  return null;
}
