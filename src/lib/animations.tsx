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

// Slide in from bottom
export const slideInBottomVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

// Scale and fade
export const scaleInVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
};

// Rotate in
export const rotateInVariants = {
  initial: { opacity: 0, rotate: -10 },
  animate: { opacity: 1, rotate: 0 },
};

// Stagger container for children
export const staggerContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Item for stagger container
export const staggerItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Flip card animation
export const flipVariants = {
  initial: { rotateY: 0 },
  hover: { rotateY: 180 },
};

// Shake animation
export const shakeVariants = {
  initial: { x: 0 },
  animate: {
    x: [-5, 5, -5, 5, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
};

// Pulse animation
export const pulseVariants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Gradient shift animation for backgrounds
export const gradientShiftVariants = {
  animate: {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Accordion variant
export const accordionVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2 },
    },
  },
};

// Slide up variant
export const slideUpVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// Popover/dropdown variants
export const popoverVariants = {
  initial: { opacity: 0, scale: 0.95, y: -10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
};

// Tab switch animation
export const tabVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// Swipe left animation
export const swipeLeftVariants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

// Swipe right animation
export const swipeRightVariants = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};

// Value counter animation
export const counterVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

// Animated wrapper components

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedListItem({ children, className, delay = 0 }: AnimatedListItemProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={listItemVariants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface PulseProps {
  children: ReactNode;
  className?: string;
}

export function Pulse({ children, className }: PulseProps) {
  return (
    <motion.div
      animate="animate"
      variants={pulseVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AccordionItemProps {
  isExpanded: boolean;
  children: ReactNode;
  className?: string;
}

export function AccordionItem({ isExpanded, children, className }: AccordionItemProps) {
  return (
    <motion.div
      initial={false}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      variants={accordionVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SwipeTabsProps {
  children: ReactNode;
  className?: string;
  direction?: 'left' | 'right';
}

export function SwipeTab({ children, className, direction = 'left' }: SwipeTabsProps) {
  const variants = direction === 'left' ? swipeLeftVariants : swipeRightVariants;
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
