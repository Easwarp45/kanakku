import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-25%', opacity: 0 },
};

const transition = {
  type: 'tween',
  ease: [0.25, 0.46, 0.45, 0.94],
  duration: 0.28,
};

interface Props {
  children: React.ReactNode;
}

export default function PageTransition({ children }: Props) {
  const location = useLocation();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition}
        className="native-scroll"
        style={{
          position: 'absolute',
          inset: 0,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
