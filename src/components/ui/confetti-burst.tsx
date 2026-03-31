import { useEffect, useMemo, useState } from 'react';

interface ConfettiBurstProps {
  burstKey: number;
  originXPercent?: number;
  originYPercent?: number;
  particleCount?: number;
  durationMs?: number;
}

interface ConfettiParticle {
  id: number;
  dx: number;
  dy: number;
  rotation: number;
  size: number;
  delay: number;
  color: string;
  isCircle: boolean;
}

const COLORS = ['#a855f7', '#22d3ee', '#f472b6', '#facc15', '#fb7185', '#4ade80', '#38bdf8'];

const random = (min: number, max: number) => Math.random() * (max - min) + min;

export function ConfettiBurst({
  burstKey,
  originXPercent = 50,
  originYPercent = 72,
  particleCount = 42,
  durationMs = 950,
}: ConfettiBurstProps) {
  const [isVisible, setIsVisible] = useState(false);

  const particles = useMemo<ConfettiParticle[]>(() => {
    if (!burstKey) return [];

    return Array.from({ length: particleCount }, (_, index) => ({
      id: index,
      dx: random(-180, 180),
      dy: random(-260, 140),
      rotation: random(-360, 360),
      size: random(6, 11),
      delay: random(0, 140),
      color: COLORS[index % COLORS.length],
      isCircle: Math.random() > 0.65,
    }));
  }, [burstKey, particleCount]);

  useEffect(() => {
    if (!burstKey) return;

    setIsVisible(true);
    const timeout = window.setTimeout(() => setIsVisible(false), durationMs + 220);
    return () => window.clearTimeout(timeout);
  }, [burstKey, durationMs]);

  if (!isVisible || particles.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={`${burstKey}-${particle.id}`}
          className="confetti-particle"
          style={{
            left: `${originXPercent}%`,
            top: `${originYPercent}%`,
            width: `${particle.size}px`,
            height: `${particle.isCircle ? particle.size : particle.size * 1.6}px`,
            borderRadius: particle.isCircle ? '999px' : '2px',
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${durationMs}ms`,
            ['--dx' as string]: `${particle.dx}px`,
            ['--dy' as string]: `${particle.dy}px`,
            ['--rot' as string]: `${particle.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
}
