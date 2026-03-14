import { useEffect, useRef, useState } from 'react';

interface UseSwipeNavigationProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: UseSwipeNavigationProps) {
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [translateX, setTranslateX] = useState(0);

  const handleTouchStart = (e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;

    // Only allow horizontal drag (prevent vertical scrolling)
    const verticalDiff = Math.abs(e.touches[0].clientY - startYRef.current);
    if (Math.abs(diff) > verticalDiff) {
      e.preventDefault();
      setTranslateX(diff * 0.5); // Reduce translation for better UX
    }
  };

  const handleTouchEnd = () => {
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0) {
        // Swiped right
        onSwipeRight?.();
      } else {
        // Swiped left
        onSwipeLeft?.();
      }
    }
    setTranslateX(0);
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [translateX, threshold, onSwipeLeft, onSwipeRight]);

  return { isDragging, translateX };
}
