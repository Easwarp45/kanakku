import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InsightCard } from './InsightCard';
import { InsightWhyDrawer } from './InsightWhyDrawer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight, History } from 'lucide-react';
import type { Insight } from '@/types/insights';

interface InsightsWidgetProps {
  insights: Insight[];
  limit?: number;
  isLoading?: boolean;
}

export function InsightsWidget({ insights, limit = 2, isLoading }: InsightsWidgetProps) {
  const navigate = useNavigate();
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  const fallbackInsight: Insight = useMemo(
    () => ({
      id: 'widget-placeholder',
      type: 'info',
      priority: 3,
      icon: '📘',
      title: 'Your smart assistant is warming up',
      message: 'Add a few expenses to unlock full trend insights and alerts.',
      actionRoute: '/add-expense',
      actionLabel: 'Add Expense',
      why: {
        previous: 0,
        current: 0,
        change: 'awaiting activity',
        reason: 'Insight cards become more accurate as your expense history grows.',
        valueKind: 'count',
      },
      createdAt: Date.now(),
    }),
    []
  );

  const displayedInsights = (insights.length > 0 ? insights : [fallbackInsight]).slice(0, limit);

  const openWhyDrawer = (insight: Insight) => {
    setSelectedInsight(insight);
    setWhyOpen(true);
  };

  const handleTakeAction = (insight: Insight) => {
    navigate(insight.actionRoute || '/analytics');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-muted rounded-[16px] animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/15 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Smart Insights
              </CardTitle>
              <CardDescription>
                {displayedInsights.length} of {Math.max(insights.length, displayedInsights.length)} active insights
              </CardDescription>
            </div>

            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/insights/history')}>
              <History className="h-3.5 w-3.5" />
              History
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayedInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onWhy={openWhyDrawer}
              onTakeAction={handleTakeAction}
              compact
            />
          ))}

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => navigate('/analytics')}
          >
            View All Insights
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

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
