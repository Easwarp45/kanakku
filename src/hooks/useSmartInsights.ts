import { useMemo } from 'react';
import { useExpenses } from './useExpenses';
import { useBudgets } from './useBudgets';
import { useAuth } from './useAuth';
import { calculateAnalytics, generateInsights } from '@/lib/insightsEngine';
import type { Insight, InsightGenerationInput } from '@/types/insights';
import type { ExpenseCategory } from '@/types/expense';
import { startOfMonth, endOfMonth, format, differenceInDays } from 'date-fns';

export function useSmartInsights() {
  const { user } = useAuth();
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const prevMonthStart = format(startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)), 'yyyy-MM-dd');
  const prevMonthEnd = format(endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)), 'yyyy-MM-dd');

  // Fetch current month expenses
  const { data: currentExpenses = [] } = useExpenses({
    startDate: monthStart,
    endDate: monthEnd,
  });

  // Fetch previous month expenses
  const { data: previousExpenses = [] } = useExpenses({
    startDate: prevMonthStart,
    endDate: prevMonthEnd,
  });

  // Fetch budgets
  const { data: budgets = [] } = useBudgets();

  // Calculate insights
  const insights: Insight[] = useMemo(() => {
    if (!user || currentExpenses.length === 0) return [];

    // Build category budgets
    const categoryBudgets: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
    budgets.forEach(budget => {
      categoryBudgets[budget.category as ExpenseCategory] = budget.amount;
    });

    // Calculate total budget
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

    // Calculate previous month total
    const previousMonthTotal = previousExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Days remaining in month
    const daysInMonth = differenceInDays(endOfMonth(now), startOfMonth(now)) + 1;

    const input: InsightGenerationInput = {
      currentExpenses: currentExpenses.map(exp => ({
        amount: exp.amount,
        category: exp.category,
        date: exp.expense_date,
        paymentMethod: exp.payment_method,
      })),
      previousMonthTotal,
      budget: totalBudget,
      categoryBudgets,
      daysInMonth,
    };

    const analytics = calculateAnalytics(input);
    return generateInsights(analytics, input);
  }, [currentExpenses, previousExpenses, budgets, user]);

  return {
    insights,
    isLoading: false,
    isEmpty: insights.length === 0,
  };
}
