import { motion } from 'framer-motion';

interface AnimatedSkeletonProps {
  className?: string;
}

export function AnimatedSkeleton({ className = '' }: AnimatedSkeletonProps) {
  return (
    <motion.div
      className={`bg-muted rounded-md ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}

interface SkeletonListLoaderProps {
  count?: number;
}

export function SkeletonListLoader({ count = 3 }: SkeletonListLoaderProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3 p-4"
        >
          {/* Avatar skeleton */}
          <AnimatedSkeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            {/* Title skeleton */}
            <AnimatedSkeleton className="h-4 w-3/4 rounded" />
            {/* Subtitle skeleton */}
            <AnimatedSkeleton className="h-3 w-1/2 rounded" />
          </div>
          {/* Amount skeleton */}
          <AnimatedSkeleton className="h-5 w-16 rounded" />
        </motion.div>
      ))}
    </div>
  );
}

interface SkeletonCardLoaderProps {
  count?: number;
}

export function SkeletonCardLoader({ count = 2 }: SkeletonCardLoaderProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.15 }}
          className="p-4 border rounded-lg space-y-3"
        >
          <AnimatedSkeleton className="h-6 w-2/3 rounded" />
          <AnimatedSkeleton className="h-4 w-full rounded" />
          <AnimatedSkeleton className="h-4 w-5/6 rounded" />
        </motion.div>
      ))}
    </div>
  );
}
