import { useMemo } from 'react';
import { InsightCard } from './InsightCard';
import { Card, CardContent } from '@/components/ui/card';
import type { Insight } from '@/types/insights';

interface InsightsListProps {
  insights: Insight[];
  isLoading?: boolean;
}

export function InsightsList({ insights, isLoading }: InsightsListProps) {
  const groupedInsights = useMemo(() => {
    return {
      high: insights.filter(i => i.priority === 'high'),
      medium: insights.filter(i => i.priority === 'medium'),
      low: insights.filter(i => i.priority === 'low'),
    };
  }, [insights]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No insights available yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add some expenses to get personalized financial insights
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groupedInsights.high.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-red-600">High Priority</h3>
          <div className="space-y-3">
            {groupedInsights.high.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {groupedInsights.medium.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-yellow-600">Medium Priority</h3>
          <div className="space-y-3">
            {groupedInsights.medium.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {groupedInsights.low.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-blue-600">Low Priority</h3>
          <div className="space-y-3">
            {groupedInsights.low.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
