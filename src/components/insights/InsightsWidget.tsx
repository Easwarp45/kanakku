import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InsightCard } from './InsightCard';
import type { Insight } from '@/types/insights';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InsightsWidgetProps {
  insights: Insight[];
  maxItems?: number;
  isLoading?: boolean;
}

export function InsightsWidget({
  insights,
  maxItems = 3,
  isLoading = false,
}: InsightsWidgetProps) {
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get top insights prioritizing warnings
  const topInsights = [
    ...insights.filter(i => i.priority === 'high'),
    ...insights.filter(i => i.priority === 'medium'),
    ...insights.filter(i => i.priority === 'low'),
  ].slice(0, maxItems);

  if (topInsights.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Smart Insights
          </CardTitle>
          <CardDescription>Personalized spending analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Add more expenses to see insights
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Smart Insights
            </CardTitle>
            <CardDescription>Personalized spending analysis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {topInsights.map(insight => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
        {insights.length > maxItems && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => navigate('/analytics')}
          >
            View All Insights
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
