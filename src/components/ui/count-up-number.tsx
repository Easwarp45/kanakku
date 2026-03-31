import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountUpNumberProps {
  value: number;
  durationMs?: number;
  decimals?: number;
  className?: string;
  formatter?: (value: number) => string;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function CountUpNumber({
  value,
  durationMs = 900,
  decimals = 0,
  className,
  formatter,
}: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const liveValueRef = useRef(0);

  useEffect(() => {
    const endValue = Number.isFinite(value) ? value : 0;
    const startValue = liveValueRef.current;

    if (Math.abs(endValue - startValue) < 0.00001) {
      setDisplayValue(endValue);
      liveValueRef.current = endValue;
      return;
    }

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || durationMs <= 0) {
      setDisplayValue(endValue);
      liveValueRef.current = endValue;
      return;
    }

    let frame = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = easeOutCubic(progress);
      const next = startValue + (endValue - startValue) * eased;
      liveValueRef.current = next;
      setDisplayValue(next);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        liveValueRef.current = endValue;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, value]);

  const rounded = Number(displayValue.toFixed(decimals));
  const content = formatter
    ? formatter(rounded)
    : rounded.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

  return <span className={cn('tabular-nums', className)}>{content}</span>;
}
