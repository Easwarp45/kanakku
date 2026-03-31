import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeft, Search, Filter, Trash2, IndianRupee, Calendar, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
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
import { PageTransition, listContainerVariants, listItemVariants } from '@/lib/animations';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { RefreshIndicator } from '@/components/ui/refresh-indicator';
import { SkeletonListLoader } from '@/components/ui/skeleton-loader';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

export default function Expenses() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const { containerRef, isRefreshing, translateY } = usePullToRefresh({
    threshold: 60,
    onRefresh: handleRefresh,
  });

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

  return (
    <PageTransition>
      <div ref={containerRef} className="min-h-screen bg-background pb-20 overflow-y-auto" style={{ transform: `translateY(${translateY * 0.5}px)` }}>
      {/* Refresh Indicator */}
      <RefreshIndicator translateY={translateY} isRefreshing={isRefreshing} threshold={60} />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Expenses</h1>
        </div>
      </header>

      {/* Filters */}
      <div className="p-4 space-y-3 border-b">
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

      {/* Summary */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {dateRange?.from ? 'Total for selected range' : 'Total (all time)'}
          </span>
          <div className="flex items-center text-xl font-bold">
            <IndianRupee className="h-5 w-5" />
            {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Expense List */}
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
                  <span className="font-semibold flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    {expense.amount.toLocaleString('en-IN')}
                  </span>
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

      {/* Delete Confirmation */}
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
      </div>
    </PageTransition>
  );
}
