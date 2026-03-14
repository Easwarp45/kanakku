import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface RefreshIndicatorProps {
  translateY: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function RefreshIndicator({
  translateY,
  isRefreshing,
  threshold = 60,
}: RefreshIndicatorProps) {
  const progress = Math.min(translateY / threshold, 1);
  const rotation = isRefreshing ? 360 : progress * 180;

  return (
    <motion.div
      className="flex justify-center items-center py-4"
      style={{ opacity: isRefreshing ? 1 : Math.max(0, progress) }}
    >
      <motion.div
        animate={{ rotate: rotation }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <RefreshCw className="h-5 w-5 text-primary" />
      </motion.div>
    </motion.div>
  );
}
