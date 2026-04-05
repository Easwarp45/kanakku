import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InsightCard } from './InsightCard';
import { InsightWhyDrawer } from './InsightWhyDrawer';
import type { Insight } from '@/types/insights';

interface InsightsListProps {
  insights: Insight[];
  isLoading?: boolean;
}

const PLACEHOLDER_INSIGHTS: Insight[] = [
  {
    id: 'placeholder-warning',
    type: 'warning',
    priority: 1,
    icon: '!',
    title: 'Budget Risk Preview',
    message: 'Keep tracking daily to unlock early budget-risk alerts.',
    actionRoute: '/add-expense',
    actionLabel: 'Log Expense',
    why: {
      previous: 0,
      current: 0,
      change: 'awaiting activity',
      reason: 'Insights start adapting once more transaction patterns are available.',
      valueKind: 'count',
    },
    createdAt: Date.now(),
  },
  {
    id: 'placeholder-info',
    type: 'info',
    priority: 3,
    icon: 'i',
    title: 'Trend Preview',
    message: 'Your spending trend forecast will appear after more activity.',
    actionRoute: '/expenses',
    actionLabel: 'View Expenses',
    why: {
      previous: 0,
      current: 0,
      change: 'awaiting activity',
      reason: 'Monthly trend rules compare current and previous periods.',
      valueKind: 'count',
    },
    createdAt: Date.now(),
  },
];

export function InsightsList({ insights, isLoading }: InsightsListProps) {
  const navigate = useNavigate();
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  const displayedInsights = useMemo(
    () => (insights.length > 0 ? insights : PLACEHOLDER_INSIGHTS).sort((a, b) => a.priority - b.priority),
    [insights]
  );

  const openWhyDrawer = (insight: Insight) => {
    setSelectedInsight(insight);
    setWhyOpen(true);
  };

  const handleTakeAction = (insight: Insight) => {
    navigate(insight.actionRoute || '/analytics');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-[16px] bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {displayedInsights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onWhy={openWhyDrawer}
            onTakeAction={handleTakeAction}
          />
        ))}
      </div>

      <InsightWhyDrawer
        insight={selectedInsight}
        open={whyOpen}
        onOpenChange={(next) => {
          setWhyOpen(next);
          if (!next) {
            setSelectedInsight(null);
          }
        }}
      />
    </>
  );
}
