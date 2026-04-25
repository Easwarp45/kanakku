import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeft, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useIncome, useDeleteIncome } from '@/hooks/useIncome';
import { INCOME_SOURCE_CONFIG, type IncomeSource } from '@/types/income';
import { motion } from 'framer-motion';
import { SkeletonListLoader } from '@/components/ui/skeleton-loader';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

export default function Income() {
  const navigate = useNavigate();
  const { symbol, formatCurrency } = useCurrency();
  const [sourceFilter, setSourceFilter] = useState<IncomeSource | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data: incomeRecords = [], isLoading, refetch } = useIncome({
    startDate,
    endDate,
    source: sourceFilter === 'all' ? undefined : sourceFilter,
  });

  const deleteIncome = useDeleteIncome();

  // ── Pull-to-refresh (attached to real scroll parent .app-main) ────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const startYRef = useRef(0);
  const THRESHOLD = 64;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  useEffect(() => {
    const scrollEl = document.querySelector<HTMLElement>('.app-main');
    if (!scrollEl) return;

    const onTouchStart = (e: TouchEvent) => {
      startYRef.current = scrollEl.scrollTop === 0 ? e.touches[0].clientY : 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!startYRef.current) return;
      const diff = e.touches[0].clientY - startYRef.current;
      if (diff > 0 && scrollEl.scrollTop === 0) {
        setPullProgress(Math.min(diff / THRESHOLD, 1));
      } else {
        setPullProgress(0);
      }
    };

    const onTouchEnd = () => {
      if (pullProgress >= 1 && !isRefreshing) void handleRefresh();
      setPullProgress(0);
      startYRef.current = 0;
    };

    scrollEl.addEventListener('touchstart', onTouchStart, { passive: true });
    scrollEl.addEventListener('touchmove', onTouchMove, { passive: true });
    scrollEl.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      scrollEl.removeEventListener('touchstart', onTouchStart);
      scrollEl.removeEventListener('touchmove', onTouchMove);
      scrollEl.removeEventListener('touchend', onTouchEnd);
    };
  }, [pullProgress, isRefreshing, handleRefresh]);

  const totalIncome = incomeRecords.reduce((sum, item) => sum + item.amount, 0);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteIncome.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const showPullIndicator = pullProgress > 0 || isRefreshing;

  return (
    // Opacity-only fade — no y-transform which would break position:sticky
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="page-content min-h-full bg-background"
    >
      {/* Pull-to-refresh indicator — lives in normal flow but only shows when active */}
      {showPullIndicator && (
        <div
          aria-hidden="true"
          className="flex items-center justify-center py-3 transition-opacity duration-200"
          style={{ opacity: isRefreshing ? 1 : pullProgress }}
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : pullProgress * 180 }}
            transition={isRefreshing
              ? { repeat: Infinity, duration: 0.8, ease: 'linear' }
              : { duration: 0.2, ease: 'easeOut' }
            }
          >
            <RefreshCw className="h-5 w-5 text-primary" />
          </motion.div>
        </div>
      )}

      {/* Sticky header — z-20, no transform ancestor, so sticky works correctly */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Income</h1>
          </div>
          <Button size="sm" onClick={() => navigate('/add-income')} className="gap-1 bg-secondary hover:bg-secondary/90">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </header>

      {/* Filter */}
      <div className="p-4 border-b">
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as IncomeSource | 'all')}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {(Object.entries(INCOME_SOURCE_CONFIG) as [IncomeSource, typeof INCOME_SOURCE_CONFIG[IncomeSource]][]).map(
              ([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="p-4 border-b bg-secondary/5">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total this month</span>
          <div className="text-xl font-bold text-secondary">{formatCurrency(totalIncome, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Income List */}
      <div className="divide-y">
        {isLoading ? (
          <div className="p-4">
            <SkeletonListLoader count={5} />
          </div>
        ) : incomeRecords.length === 0 ? (
          <Card className="m-4">
            <CardContent className="flex flex-col items-center justify-start py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <span className="text-lg font-semibold text-muted-foreground">{symbol}</span>
              </div>
              <p className="text-muted-foreground">No income recorded this month</p>
              <p className="text-sm text-muted-foreground mb-4">Add your income to track savings</p>
              <Button onClick={() => navigate('/add-income')} className="bg-secondary hover:bg-secondary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </CardContent>
          </Card>
        ) : (
          incomeRecords.map((item) => {
            const config = INCOME_SOURCE_CONFIG[item.source];
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => navigate(`/income/${item.id}`)}
              >
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white', config.color)}>
                  {config.label.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.description || config.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{format(new Date(item.income_date), 'MMM d')}</p>
                    {item.is_recurring && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <RefreshCw className="h-2.5 w-2.5" />
                        Recurring
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-secondary">{formatCurrency(item.amount, { maximumFractionDigits: 0 })}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteId(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
