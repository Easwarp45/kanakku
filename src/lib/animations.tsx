import { ReactNode } from 'react';
import { motion } from 'framer-motion';

// Page transition animation
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const pageTransition = {
  duration: 0.3,
  ease: 'easeOut',
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// List item animation
export const listItemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const listContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={listContainerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Card fade in animation
export const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
};

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({ children, className, delay = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={cardVariants}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Button press animation
export const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

// Bounce animation for attention
export const bounceVariants = {
  initial: { y: 0 },
  animate: {
    y: [-3, 3, -3],
    transition: {
      duration: 0.6,
      repeat: 3,
      ease: 'easeInOut',
    },
  },
};

// Slide in from left
export const slideInLeftVariants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
};

// Slide in from right
export const slideInRightVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
};

// Fade in
export const fadeInVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};
