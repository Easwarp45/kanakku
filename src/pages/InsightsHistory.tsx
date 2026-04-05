import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InsightCard, InsightWhyDrawer } from '@/components/insights';
import { useSmartInsights } from '@/hooks/useSmartInsights';
import type { Insight, InsightFilterType, InsightHistoryEntry } from '@/types/insights';
import BottomNav from '@/components/layout/BottomNav';

const FILTERS: InsightFilterType[] = ['all', 'info', 'warning', 'suggestion'];

export default function InsightsHistory() {
  const navigate = useNavigate();
  const { history, insights, isLoading } = useSmartInsights();

  const [selectedFilter, setSelectedFilter] = useState<InsightFilterType>('all');
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  const fallbackHistory = useMemo<InsightHistoryEntry[]>(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    return insights.map((insight) => ({
      ...insight,
      recordedDate: todayKey,
      recordedAt: insight.createdAt,
    }));
  }, [insights]);

  const historyItems = history.length > 0 ? history : fallbackHistory;

  const filtered = useMemo(() => {
    const source = historyItems;
    if (selectedFilter === 'all') {
      return source;
    }
    return source.filter((item) => item.type === selectedFilter);
  }, [historyItems, selectedFilter]);

  const groupedByDate = useMemo(() => {
    return filtered.reduce((acc, item) => {
      if (!acc[item.recordedDate]) {
        acc[item.recordedDate] = [];
      }
      acc[item.recordedDate].push(item);
      return acc;
    }, {} as Record<string, InsightHistoryEntry[]>);
  }, [filtered]);

  const sortedDates = useMemo(
    () => Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a)),
    [groupedByDate]
  );

  const openWhy = (insight: Insight) => {
    setSelectedInsight(insight);
    setWhyOpen(true);
  };

  const handleTakeAction = (insight: Insight) => {
    navigate(insight.actionRoute || '/analytics');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between gap-2 p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Insights History</h1>
              <p className="text-xs text-muted-foreground">Timeline of your financial signals</p>
            </div>
          </div>

          <Badge variant="outline" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            {filtered.length}
          </Badge>
        </div>

        <div className="overflow-x-auto px-4 pb-3">
          <div className="flex min-w-max gap-2">
            {FILTERS.map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={selectedFilter === filter ? 'default' : 'outline'}
                className="capitalize"
                onClick={() => setSelectedFilter(filter)}
              >
                <Filter className="h-3.5 w-3.5" />
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="space-y-4 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="h-28 animate-pulse rounded-[16px] bg-muted" />
            ))}
          </div>
        ) : sortedDates.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Insight timeline is getting ready</CardTitle>
              <CardDescription>Your first snapshots appear automatically after more activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <InsightCard
                compact
                insight={{
                  id: 'history-preview',
                  type: 'info',
                  priority: 3,
                  icon: 'i',
                  title: 'Track a few expenses to populate timeline',
                  message: 'History cards appear with daily grouping, filters, and explanations.',
                  actionRoute: '/add-expense',
                  actionLabel: 'Add Expense',
                  why: {
                    previous: 0,
                    current: 0,
                    change: 'awaiting activity',
                    reason: 'Timeline entries are written when rule-based insights are generated.',
                    valueKind: 'count',
                  },
                  createdAt: Date.now(),
                }}
                onWhy={openWhy}
                onTakeAction={handleTakeAction}
              />
            </CardContent>
          </Card>
        ) : (
          sortedDates.map((dateKey) => (
            <section key={dateKey} className="space-y-3">
              <div className="sticky top-[112px] z-10 rounded-lg bg-background/90 py-1 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {format(parseISO(dateKey), 'MMMM d')}
                </p>
              </div>

              <div className="relative space-y-3 pl-5">
                <div className="absolute left-2 top-0 h-full w-px bg-border" />
                {groupedByDate[dateKey]
                  .sort((a, b) => a.priority - b.priority)
                  .map((insight) => (
                    <div key={`${insight.id}-${insight.recordedAt}`} className="relative">
                      <span className="absolute -left-[17px] top-3 h-2.5 w-2.5 rounded-full bg-primary" />
                      <InsightCard
                        insight={insight}
                        compact
                        onWhy={openWhy}
                        onTakeAction={handleTakeAction}
                      />
                    </div>
                  ))}
              </div>
            </section>
          ))
        )}
      </main>

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

      <BottomNav />
    </div>
  );
}
