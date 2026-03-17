import { useNavigate } from 'react-router-dom';
import { InsightCard } from './InsightCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight } from 'lucide-react';
import type { Insight } from '@/types/insights';

interface InsightsWidgetProps {
  insights: Insight[];
  limit?: number;
  isLoading?: boolean;
}

export function InsightsWidget({ insights, limit = 2, isLoading }: InsightsWidgetProps) {
  const navigate = useNavigate();
  const displayedInsights = insights.slice(0, limit);

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
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Insights
          </CardTitle>
          <CardDescription>Personalized financial insights</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add some expenses to get personalized insights about your spending
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Smart Insights
        </CardTitle>
        <CardDescription>
          {displayedInsights.length} of {insights.length} insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedInsights.map(insight => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
        
        {insights.length > limit && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => navigate('/analytics')}
          >
            View All Insights
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
