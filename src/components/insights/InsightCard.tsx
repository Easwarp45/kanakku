import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Insight } from '@/types/insights';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const typeConfig = {
    warning: {
      bgColor: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
      badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      badgeLabel: 'Alert',
    },
    insight: {
      bgColor: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      badgeLabel: 'Insight',
    },
    suggestion: {
      bgColor: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      badgeLabel: 'Suggestion',
    },
    positive: {
      bgColor: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      badgeLabel: 'Great!',
    },
  };

  const config = typeConfig[insight.type];

  return (
    <Card className={cn('border-2', config.bgColor)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{insight.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm">{insight.title}</h3>
              <Badge className={cn('text-xs', config.badgeColor)}>
                {config.badgeLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insight.message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
