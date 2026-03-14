import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { swipeLeftVariants, swipeRightVariants } from '@/lib/animations';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabbedNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
  showIndicator?: boolean;
}

export function TabbedNavigation({
  tabs,
  activeTab,
  onTabChange,
  children,
  showIndicator = true,
}: TabbedNavigationProps) {
  const activeTabIndex = tabs.findIndex((t) => t.id === activeTab);
  const isMovingRight = activeTabIndex > tabs.findIndex((t) => t.id === activeTab);

  return (
    <div className="flex flex-col h-full">
      {/* Tab buttons */}
      <div className="flex gap-0 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
            }`}
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
            whileTap={{ scale: 0.97 }}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Content with animation */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={isMovingRight ? 'initial' : 'initial'}
            animate="animate"
            exit="exit"
            variants={isMovingRight ? swipeRightVariants : swipeLeftVariants}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress indicator (optional) */}
      {showIndicator && (
        <div className="flex gap-1 px-4 py-3 bg-muted/30">
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              layoutId="indicator"
              className={`h-1 rounded-full transition-all ${
                activeTab === tab.id ? 'bg-primary' : 'bg-muted'
              }`}
              style={{
                width: activeTab === tab.id ? '24px' : '8px',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SwipeableTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
}

export function SwipeableTabs({
  tabs,
  activeTab,
  onTabChange,
  children,
}: SwipeableTabsProps) {
  const currentIndex = tabs.findIndex((t) => t.id === activeTab);

  const handleSwipeLeft = () => {
    if (currentIndex < tabs.length - 1) {
      onTabChange(tabs[currentIndex + 1].id);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex > 0) {
      onTabChange(tabs[currentIndex - 1].id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab buttons */}
      <div className="flex gap-0 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors flex-1 ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
            }`}
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
            whileTap={{ scale: 0.97 }}
          >
            {tab.icon && <span className="mr-1">{tab.icon}</span>}
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Swipeable content area */}
      <div className="flex-1 relative overflow-hidden" onTouchStart={() => {}}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{
              opacity: 0,
              x: currentIndex > tabs.findIndex((t) => t.id === activeTab) ? -100 : 100,
            }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              opacity: 0,
              x: currentIndex > tabs.findIndex((t) => t.id === activeTab) ? 100 : -100,
            }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
