import { useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';

const isProblematicDevice = () => {
  const ua = navigator.userAgent.toLowerCase();

  return (
    ua.includes('oppo') ||
    ua.includes('vivo') ||
    ua.includes('realme') ||
    ua.includes('android 9') ||
    ua.includes('android 10')
  );
};

export function useKeyboardFix() {
  useEffect(() => {
    const main = document.querySelector('.app-main') as HTMLElement | null;

    const getViewportHeight = () => {
      return window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
    };

    const applyHeight = () => {
      if (!main) return;
      const vh = getViewportHeight();
      main.style.height = `${vh}px`;
    };

    const show = Keyboard.addListener('keyboardDidShow', (info) => {
      if (!main) return;

      main.style.paddingBottom = `${info.keyboardHeight}px`;

      // Apply fallback only for problematic Android WebViews.
      if (isProblematicDevice()) {
        const extraOffset = Math.max(40, Math.min(60, window.innerHeight * 0.05));
        main.style.transform = `translateY(-${info.keyboardHeight + extraOffset}px)`;
      }

      applyHeight();
    });

    const hide = Keyboard.addListener('keyboardDidHide', () => {
      if (!main) return;

      main.style.paddingBottom = '0px';
      main.style.transform = 'translateY(0px)';
      main.style.height = '100%';
    });

    const viewportResize = () => {
      applyHeight();
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', viewportResize);
    }

    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        window.setTimeout(() => {
          el.scrollIntoView({ block: 'center' });
        }, 300);
      }
    };

    document.addEventListener('focusin', onFocusIn);

    return () => {
      void show.remove();
      void hide.remove();

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', viewportResize);
      }

      document.removeEventListener('focusin', onFocusIn);
    };
  }, []);
}
