import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, X } from 'lucide-react';

interface OnboardingSlide {
  title: string;
  description: string;
  icon: string; // emoji or icon name
  color: string; // bg color class
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    title: 'Track Your Expenses',
    description: 'Log all your spending across different categories. Get insights into where your money goes.',
    icon: '💰',
    color: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    title: 'Manage Income',
    description: 'Record all sources of income and track recurring payments for better financial planning.',
    icon: '💵',
    color: 'bg-green-50 dark:bg-green-950',
  },
  {
    title: 'Split with Groups',
    description: 'Create groups and split expenses with friends. Auto-calculate who owes whom.',
    icon: '👥',
    color: 'bg-purple-50 dark:bg-purple-950',
  },
  {
    title: 'Analyze Spending',
    description: 'View detailed analytics and charts to understand your spending patterns over time.',
    icon: '📊',
    color: 'bg-orange-50 dark:bg-orange-950',
  },
  {
    title: 'Set Budgets',
    description: 'Create budgets for different categories and get alerts when you\'re approaching limits.',
    icon: '🎯',
    color: 'bg-red-50 dark:bg-red-950',
  },
  {
    title: 'Work Offline',
    description: 'Your data is synced even when offline. Keep tracking expenses anywhere, anytime.',
    icon: '🌐',
    color: 'bg-indigo-50 dark:bg-indigo-950',
  },
];

export function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('kanakku-onboarding-seen');
    const isFirstVisit = localStorage.getItem('kanakku-first-visit') === null;
    
    if (isFirstVisit || !hasSeenOnboarding) {
      setIsVisible(true);
      localStorage.setItem('kanakku-first-visit', 'true');
    }
  }, []);

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('kanakku-onboarding-seen', 'true');
    setIsVisible(false);
  };

  const slide = ONBOARDING_SLIDES[currentSlide];
  const progress = ((currentSlide + 1) / ONBOARDING_SLIDES.length) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-full max-w-md"
          >
            <Card className={`border-0 ${slide.color} shadow-2xl`}>
              <CardContent className="p-8 text-center">
                {/* Close button */}
                <button
                  onClick={completeOnboarding}
                  className="absolute top-4 right-4 p-2 hover:bg-black/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Icon */}
                <motion.div
                  key={currentSlide}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-6xl mb-6 inline-block"
                >
                  {slide.icon}
                </motion.div>

                {/* Content */}
                <motion.div
                  key={`content-${currentSlide}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold mb-3">{slide.title}</h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {slide.description}
                  </p>
                </motion.div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-1 mb-6 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Slide indicator */}
                <div className="flex justify-center gap-2 mb-6">
                  {ONBOARDING_SLIDES.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentSlide ? 'bg-primary w-6' : 'bg-muted w-2'
                      }`}
                      whileHover={{ scale: 1.2 }}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={completeOnboarding}
                    className="flex-1"
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1 gap-2"
                  >
                    {currentSlide === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Text indicator */}
                <p className="text-xs text-muted-foreground mt-4">
                  {currentSlide + 1} of {ONBOARDING_SLIDES.length}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const useHasSeenOnboarding = () => {
  const [hasSeen, setHasSeen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('kanakku-onboarding-seen') === 'true';
    setHasSeen(seen);
  }, []);

  return hasSeen;
};
