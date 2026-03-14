import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshProps {
  threshold?: number;
  onRefresh: () => Promise<void>;
}

export function usePullToRefresh({ threshold = 60, onRefresh }: UsePullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0 && container.scrollTop === 0) {
        e.preventDefault();
        setTranslateY(Math.min(diff, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (translateY >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setTranslateY(0);
      startYRef.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [threshold, onRefresh, translateY]);

  return { containerRef, isRefreshing, translateY };
}
