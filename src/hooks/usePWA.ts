import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [status, setStatus] = useState<PWAStatus>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
  });

  // CC-1: Improved install detection covering standalone MQ, minimal-ui,
  // iOS standalone flag, and Android TWA referrer.
  useEffect(() => {
    const checkInstalled = () => {
      const isStandaloneMq = window.matchMedia('(display-mode: standalone)').matches;
      const isMinimalUi = window.matchMedia('(display-mode: minimal-ui)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const isAndroidApp = document.referrer.startsWith('android-app://');

      setStatus((prev) => ({
        ...prev,
        isInstalled: isStandaloneMq || isMinimalUi || isIOSStandalone || isAndroidApp,
      }));
    };

    checkInstalled();
    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener('change', checkInstalled);
    return () => mq.removeEventListener('change', checkInstalled);
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setStatus((prev) => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Listen for app installed
  useEffect(() => {
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setStatus((prev) => ({ ...prev, isInstallable: false, isInstalled: true }));
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  // Listen for online/offline
  useEffect(() => {
    const handleOnline = () => setStatus((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setStatus((prev) => ({ ...prev, hasUpdate: true }));
              }
            });
          }
        });
      });
    }
  }, []);

  // Trigger install prompt
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setStatus((prev) => ({ ...prev, isInstallable: false }));
      return true;
    }

    return false;
  }, [deferredPrompt]);

  // PWA-3: Proper update flow — post SKIP_WAITING to the waiting SW,
  // then reload after it takes control (handled in main.tsx controllerchange listener).
  const applyUpdate = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          // Tell the waiting SW to activate immediately
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          // Reload after the new SW takes control
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => window.location.reload(),
            { once: true }
          );
          return;
        }
      } catch (err) {
        logger.error('SW update error:', err);
      }
    }
    // Fallback
    window.location.reload();
  }, []);

  return {
    ...status,
    promptInstall,
    applyUpdate,
  };
}
