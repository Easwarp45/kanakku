import { Award, Flame, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { InsightGamification } from '@/types/insights';

interface FinancialHealthPanelProps {
  gamification: InsightGamification;
  isLoading?: boolean;
}

const labelColorMap: Record<string, string> = {
  Excellent: 'text-emerald-400',
  Good: 'text-amber-400',
  'Needs Improvement': 'text-red-400',
};

export function FinancialHealthPanel({ gamification, isLoading }: FinancialHealthPanelProps) {
  if (isLoading) {
    return <div className="h-48 rounded-[16px] bg-muted animate-pulse" />;
  }

  return (
    <Card className="rounded-[16px] border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          Financial Health Score
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[clamp(1.8rem,8vw,2.6rem)] font-bold leading-none">{gamification.health.score}</p>
            <p className={`mt-1 text-sm font-medium ${labelColorMap[gamification.health.label] || 'text-muted-foreground'}`}>
              {gamification.health.label}
            </p>
          </div>

          <div className="text-right text-xs text-muted-foreground">
            {gamification.health.reasons.slice(0, 2).map((reason) => (
              <p key={reason} className="leading-relaxed">{reason}</p>
            ))}
          </div>
        </div>

        <Progress value={gamification.health.score} className="h-2" />

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border bg-card/70 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Flame className="h-3.5 w-3.5" />
              Tracking Streak
            </div>
            <p className="mt-1 text-sm font-semibold">{gamification.streaks.trackingDays} day{gamification.streaks.trackingDays === 1 ? '' : 's'}</p>
          </div>

          <div className="rounded-xl border bg-card/70 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Budget Control
            </div>
            <p className="mt-1 text-sm font-semibold">{gamification.streaks.budgetControlWeeks} week{gamification.streaks.budgetControlWeeks === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Achievements</p>
          <div className="flex flex-wrap gap-2">
            {gamification.achievements.length > 0 ? (
              gamification.achievements.map((achievement) => (
                <Badge
                  key={achievement.id}
                  variant="outline"
                  className="h-auto rounded-lg px-2.5 py-1.5 text-[11px] leading-snug"
                >
                  <span className="mr-1">{achievement.icon}</span>
                  <span>{achievement.title}</span>
                  {!achievement.unlocked && (
                    <span className="ml-1 text-muted-foreground">{Math.round(achievement.progress)}%</span>
                  )}
                  {achievement.unlocked && <Award className="ml-1 h-3 w-3" />}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="rounded-lg">Achievements will unlock soon</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
