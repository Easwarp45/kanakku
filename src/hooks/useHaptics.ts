import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = () =>
  typeof window !== 'undefined' &&
  (window as any)?.Capacitor?.isNativePlatform?.();

export function useHaptics() {
  const light = () => {
    if (!isNative()) return;
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  };

  const medium = () => {
    if (!isNative()) return;
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
  };

  const heavy = () => {
    if (!isNative()) return;
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
  };

  const success = () => {
    if (!isNative()) return;
    Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  };

  const error = () => {
    if (!isNative()) return;
    Haptics.notification({ type: NotificationType.Error }).catch(() => {});
  };

  const warning = () => {
    if (!isNative()) return;
    Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
  };

  return { light, medium, heavy, success, error, warning };
}
