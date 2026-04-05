import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Full-screen animated splash screen — shows the Kanakku logo
 * with a glow entrance animation on first app load.
 * Fades out after `duration` ms.
 */
interface SplashScreenProps {
  /** How long to show the splash in milliseconds (default 1800) */
  duration?: number;
  onDone?: () => void;
}

export function SplashScreen({ duration = 1800, onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          {/* ambient glow blobs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-cyan-500/15 blur-[100px]" />
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-primary/15 blur-[100px]" />
          </div>

          {/* logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
            className="relative flex flex-col items-center gap-5"
          >
            {/* outer glow ring */}
            <div className="relative">
              <div
                className="absolute inset-0 -m-6 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(0,207,255,0.22) 0%, rgba(0,232,122,0.12) 45%, transparent 75%)',
                  filter: 'blur(16px)',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              <div
                className="absolute inset-0 -m-3 rounded-full border border-white/8"
                style={{ boxShadow: '0 0 32px rgba(0,207,255,0.25)' }}
              />
              <img
                src="/logo.png"
                alt="Kanakku"
                width={110}
                height={110}
                className="relative object-contain"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(0,207,255,0.5)) drop-shadow(0 0 40px rgba(0,232,122,0.3))',
                }}
              />
            </div>

            {/* wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="text-center"
            >
              <p
                className="font-display text-3xl font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg,#00CFFF 0%,#00E87A 50%,#CCFF00 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Kanakku
              </p>
              <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">
                your money · your vibe
              </p>
            </motion.div>
          </motion.div>

          {/* shimmer loading bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-16 w-24 h-0.5 rounded-full bg-white/10 overflow-hidden"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 0.9, ease: 'easeInOut', delay: 0.5 }}
              className="h-full w-1/2 rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,207,255,0.7), transparent)' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
