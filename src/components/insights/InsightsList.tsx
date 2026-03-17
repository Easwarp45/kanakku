import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InsightCard } from './InsightCard';
import type { Insight } from '@/types/insights';
import { Lightbulb } from 'lucide-react';

interface InsightsListProps {
  insights: Insight[];
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function InsightsList({
  insights,
  isLoading = false,
  title = 'Smart Insights',
  description = "AI-powered analysis of your spending patterns",
}: InsightsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 h-20 bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="p-8 text-center">
          <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground mb-1">No insights yet</p>
          <p className="text-xs text-muted-foreground">
            Add more expenses to get personalized spending insights
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group insights by priority
  const highPriority = insights.filter(i => i.priority === 'high');
  const mediumPriority = insights.filter(i => i.priority === 'medium');
  const lowPriority = insights.filter(i => i.priority === 'low');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* High Priority Insights */}
      {highPriority.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
            ⚠️ Needs Attention
          </h3>
          {highPriority.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {/* Medium Priority Insights */}
      {mediumPriority.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            💡 Key Insights
          </h3>
          {mediumPriority.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {/* Low Priority Insights */}
      {lowPriority.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            ℹ️ Additional Info
          </h3>
          {lowPriority.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
