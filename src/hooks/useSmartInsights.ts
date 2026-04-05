import { useMemo } from 'react';
import { useFinancialIntelligence } from './useFinancialIntelligence';

export function useSmartInsights() {
  const {
    insights,
    history,
    gamification,
    subscriptions,
    locations,
    timeAnalysis,
    settlements,
    goals,
    isLoading,
  } = useFinancialIntelligence();

  const mappedGamification = useMemo(
    () => ({
      health: {
        score: gamification.score,
        label: gamification.label,
        reasons: gamification.reasons,
      },
      streaks: {
        trackingDays: gamification.streaks.dailyLogging,
        budgetControlWeeks: gamification.streaks.budgetControlWeeks,
      },
      achievements: gamification.achievements.map((achievement) => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.unlocked ? 'A' : 'P',
        unlocked: achievement.unlocked,
        progress: achievement.progress,
      })),
    }),
    [gamification]
  );

  return {
    insights,
    history,
    gamification: mappedGamification,
    subscriptions,
    locations,
    timeAnalysis,
    settlements,
    goals,
    isLoading,
    isEmpty: insights.length === 0,
  };
}
