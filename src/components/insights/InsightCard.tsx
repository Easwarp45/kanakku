import { AlertTriangle, Info, Lightbulb, MoveRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Insight } from '@/types/insights';

interface InsightCardProps {
  insight: Insight;
  onWhy?: (insight: Insight) => void;
  onTakeAction?: (insight: Insight) => void;
  compact?: boolean;
}

const typeStyleMap = {
  info: {
    strip: 'bg-blue-500',
    container: 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-card to-cyan-500/5',
    title: 'text-blue-100',
    Icon: Info,
  },
  warning: {
    strip: 'bg-red-500',
    container: 'border-red-500/20 bg-gradient-to-br from-red-500/10 via-card to-orange-500/5',
    title: 'text-red-100',
    Icon: AlertTriangle,
  },
  suggestion: {
    strip: 'bg-emerald-500',
    container: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-teal-500/5',
    title: 'text-emerald-100',
    Icon: Lightbulb,
  },
};

const typeLabelMap = {
  info: 'Info',
  warning: 'Warning',
  suggestion: 'Suggestion',
};

export function InsightCard({ insight, onWhy, onTakeAction, compact = false }: InsightCardProps) {
  const style = typeStyleMap[insight.type];
  const TypeIcon = style.Icon;

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-[16px] border shadow-sm transition-all hover:shadow-md',
        compact ? 'p-3' : 'p-4',
        style.container
      )}
    >
      <div className={cn('absolute left-0 top-0 h-full w-1.5', style.strip)} />

      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background/70 border border-border/60">
            <TypeIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className={cn('truncate text-sm font-semibold', style.title)}>{insight.title}</h3>
              <span className="text-sm" role="img" aria-label="insight icon">{insight.icon}</span>
            </div>

            <p
              className="text-xs text-muted-foreground leading-relaxed overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {insight.message}
            </p>

            <div className="flex items-center justify-between gap-2 pt-1">
              <Badge variant="outline" className="text-[10px] bg-background/50">
                {typeLabelMap[insight.type]}
              </Badge>

              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => onWhy?.(insight)}>
                  Why?
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  variant={insight.type === 'warning' ? 'destructive' : 'default'}
                  onClick={() => onTakeAction?.(insight)}
                  disabled={!insight.actionRoute}
                >
                  {insight.actionLabel || 'Take Action'}
                  <MoveRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
