import { useState, useEffect, useCallback } from 'react';

type NotificationPermissionState = 'default' | 'granted' | 'denied';

const NOTIFICATION_PREFS_KEY = 'kanakku_notification_prefs';
const LAST_NOTIFICATION_KEY = 'kanakku_last_notifications';

export interface NotificationPrefs {
  budgetAlerts: boolean;
  settlementReminders: boolean;
  expenseReminders: boolean;
  reminderTime: string; // HH:mm format
}

const DEFAULT_PREFS: NotificationPrefs = {
  budgetAlerts: true,
  settlementReminders: true,
  expenseReminders: true,
  reminderTime: '20:00',
};

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission as NotificationPermissionState);
    }
    const saved = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (saved) {
      try { setPrefs(JSON.parse(saved)); } catch {}
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied' as const;
    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermissionState);
    return result;
  }, []);

  const updatePrefs = useCallback((newPrefs: Partial<NotificationPrefs>) => {
    setPrefs(prev => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        icon: '/icons/icon-512x512.png',
        badge: '/favicon.svg',
        ...options,
      });
    } catch {
      // Fallback for environments where Notification constructor fails
    }
  }, []);

  const shouldNotify = useCallback((type: string): boolean => {
    const lastNotifications = JSON.parse(localStorage.getItem(LAST_NOTIFICATION_KEY) || '{}');
    const lastTime = lastNotifications[type];
    if (!lastTime) return true;
    // Don't send same type more than once per hour
    return Date.now() - lastTime > 60 * 60 * 1000;
  }, []);

  const markNotified = useCallback((type: string) => {
    const lastNotifications = JSON.parse(localStorage.getItem(LAST_NOTIFICATION_KEY) || '{}');
    lastNotifications[type] = Date.now();
    localStorage.setItem(LAST_NOTIFICATION_KEY, JSON.stringify(lastNotifications));
  }, []);

  return {
    permission,
    prefs,
    isSupported: 'Notification' in window,
    requestPermission,
    updatePrefs,
    sendNotification,
    shouldNotify,
    markNotified,
  };
}
