import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeft, Search, Filter, Trash2, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { CATEGORY_CONFIG, type ExpenseCategory } from '@/types/expense';
import { cn } from '@/lib/utils';

export default function Expenses() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data: expenses = [], isLoading } = useExpenses({
    startDate,
    endDate,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
  });

  const deleteExpense = useDeleteExpense();

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
    <div className="min-h-screen bg-background pb-20">
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
      </div>

      {/* Summary */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total this month</span>
          <div className="flex items-center text-xl font-bold">
            <IndianRupee className="h-5 w-5" />
            {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No expenses found
          </div>
        ) : (
          filteredExpenses.map((expense) => {
            const config = CATEGORY_CONFIG[expense.category];
            return (
              <div
                key={expense.id}
                className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer"
                onClick={() => navigate(`/expenses/${expense.id}`)}
              >
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white', config.color)}>
                  {config.label.charAt(0)}
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
  );
}
