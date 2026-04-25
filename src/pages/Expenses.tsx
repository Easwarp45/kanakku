import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeft, Search, Filter, Trash2, Calendar, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { CATEGORY_CONFIG, type ExpenseCategory } from '@/types/expense';
import { getCategoryIcon } from '@/lib/category-icons';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { motion } from 'framer-motion';
import { SkeletonListLoader } from '@/components/ui/skeleton-loader';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import type { DateRange } from 'react-day-picker';

export default function Expenses() {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Pull-to-refresh state ────────────────────────────────────────────────
  // Attached to .app-main (real scroll container), NOT the page div.
  // This is critical: the old code used containerRef on a non-scrolling div,
  // which made scrollTop always 0 and caused e.preventDefault() to fire on
  // every drag, fighting the real scroller and causing jitter.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0); // 0.0 – 1.0
  const startYRef = useRef(0);
  const THRESHOLD = 64;

  const now = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(now),
    to: endOfMonth(now),
  });

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange?.to
    ? format(dateRange.to, 'yyyy-MM-dd')
    : dateRange?.from
      ? format(dateRange.from, 'yyyy-MM-dd')
      : undefined;

  const { data: expenses = [], isLoading, refetch } = useExpenses({
    startDate,
    endDate,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
  });

  const deleteExpense = useDeleteExpense();

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

  const dateRangeLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`
      : format(dateRange.from, 'MMM d, yyyy')
    : 'All time';

  const resetToCurrentMonth = () => {
    const current = new Date();
    setDateRange({ from: startOfMonth(current), to: endOfMonth(current) });
  };

  const filteredExpenses = expenses.filter((expense) => {
    if (!searchQuery) return true;
    return expense.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteExpense.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const showPullIndicator = pullProgress > 0 || isRefreshing;

  return (
    // ── NO PageTransition / motion.div with y-transform here ────────────────
    // Framer Motion's `y` animation sets transform:translateY() on the wrapper,
    // which creates a new CSS stacking context. Any `position:sticky` element
    // INSIDE an ancestor with an active transform stops being sticky — it falls
    // back to `position:relative`. This was causing the header to scroll away.
    // We use opacity-only fade to avoid that entirely.
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="page-content min-h-full bg-background"
    >
      {/* ── Pull-to-refresh indicator ────────────────────────────────────────
          Uses max-height:0 → 48px transition so it NEVER displaces the sticky
          header. The indicator lives in normal flow but collapses to zero height
          when not active, meaning the header stays at exactly the same offset. */}
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

      {/* ── Sticky header ────────────────────────────────────────────────────
          z-20 keeps it above all page content.
          bg-background/95 + backdrop-blur ensures blurred scroll-through.
          No transform on any ancestor → sticky works correctly.             */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Expenses</h1>
        </div>
      </header>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-3 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ExpenseCategory | 'all')}>
            <SelectTrigger className="flex-1">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(Object.entries(CATEGORY_CONFIG) as [ExpenseCategory, typeof CATEGORY_CONFIG[ExpenseCategory]][]).map(
                ([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start text-left font-normal min-w-0">
                <Calendar className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{dateRangeLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={() => setDateRange(undefined)}>
            All time
          </Button>
          <Button variant="outline" onClick={resetToCurrentMonth}>
            This month
          </Button>
        </div>
      </div>

      {/* ── Summary ──────────────────────────────────────────────────────── */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {dateRange?.from ? 'Total for selected range' : 'Total (all time)'}
          </span>
          <div className="text-xl font-bold">
            {formatCurrency(totalAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* ── Expense List ─────────────────────────────────────────────────── */}
      <div className="divide-y">
        {isLoading ? (
          <div className="p-4">
            <SkeletonListLoader count={5} />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Plus}
              title="No expenses found"
              description="Start tracking your spending by adding your first expense."
              action={{
                label: 'Add Expense',
                onClick: () => navigate('/add-expense'),
              }}
            />
          </div>
        ) : (
          filteredExpenses.map((expense) => {
            const config = CATEGORY_CONFIG[expense.category];
            const IconComponent = getCategoryIcon(expense.category);
            return (
              <div
                key={expense.id}
                className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => navigate(`/expenses/${expense.id}`)}
              >
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0', config.color)}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{expense.description || config.label}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(expense.expense_date), 'MMM d')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatCurrency(expense.amount, { maximumFractionDigits: 0 })}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(expense.id);
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

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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
