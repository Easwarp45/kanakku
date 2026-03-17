import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Insight } from '@/types/insights';

interface InsightCardProps {
  insight: Insight;
}

const typeColorMap = {
  warning: 'bg-red-500/10 border-red-500/30 text-red-700',
  insight: 'bg-blue-500/10 border-blue-500/30 text-blue-700',
  suggestion: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700',
  positive: 'bg-green-500/10 border-green-500/30 text-green-700',
};

const typeLabelMap = {
  warning: 'Warning',
  insight: 'Insight',
  suggestion: 'Suggestion',
  positive: 'Positive',
};

const badgeVariantMap = {
  warning: 'destructive' as const,
  insight: 'default' as const,
  suggestion: 'secondary' as const,
  positive: 'default' as const,
};

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <div className={cn(
      'border rounded-lg p-4 space-y-2',
      typeColorMap[insight.type]
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-xl mt-0.5" role="img" aria-label={insight.icon}>
            {insight.icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{insight.title}</h3>
            <p className="text-sm opacity-90 mt-1">{insight.message}</p>
          </div>
        </div>
        {insight.actionable && (
          <Badge variant={badgeVariantMap[insight.type]} className="text-xs shrink-0">
            Action
          </Badge>
        )}
      </div>
      <Badge variant="outline" className="text-xs">
        {typeLabelMap[insight.type]}
      </Badge>
    </div>
  );
}
