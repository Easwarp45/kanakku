import { useMemo } from 'react';
import { useExpenses } from './useExpenses';
import { useBudgets } from './useBudgets';
import { useAuth } from './useAuth';
import { useCurrency } from './useCurrency';
import { calculateAnalytics, generateInsights } from '@/lib/insightsEngine';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import type { Insight } from '@/types/insights';

export function useSmartInsights() {
  const { user } = useAuth();
  const { currency, convertFromBase } = useCurrency();
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));

  const { data: currentExpenses = [], isLoading: loadingCurrent } = useExpenses({
    startDate: format(monthStart, 'yyyy-MM-dd'),
    endDate: format(monthEnd, 'yyyy-MM-dd'),
  });

  const { data: previousExpenses = [] } = useExpenses({
    startDate: format(lastMonthStart, 'yyyy-MM-dd'),
    endDate: format(lastMonthEnd, 'yyyy-MM-dd'),
  });

  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();

  const { insights, isLoading, isEmpty } = useMemo(() => {
    if (loadingCurrent || loadingBudgets) {
      return { insights: [], isLoading: true, isEmpty: false };
    }

    try {
      // Get total budget
      const totalBudget = budgets.reduce((sum, budget) => sum + convertFromBase(budget.amount), 0) || 0;

      // Create category budgets map
      const categoryBudgets: Record<string, number> = {};
      budgets.forEach(budget => {
        categoryBudgets[budget.category] = convertFromBase(budget.amount);
      });

      // Calculate previous month total
      const previousMonthTotal = previousExpenses.reduce((sum, exp) => sum + convertFromBase(exp.amount), 0);

      // Convert current expenses from INR base to selected display currency
      const convertedCurrentExpenses = currentExpenses.map(expense => ({
        ...expense,
        amount: convertFromBase(expense.amount),
      }));

      // Calculate days in current month
      const daysInMonth = monthEnd.getDate();

      // Generate insights
      const generatedInsights = generateInsights(
        calculateAnalytics({
          currentExpenses: convertedCurrentExpenses,
          previousMonthTotal,
          budget: totalBudget,
          categoryBudgets,
          daysInMonth,
        }),
        {
          currentExpenses: convertedCurrentExpenses,
          previousMonthTotal,
          budget: totalBudget,
          categoryBudgets,
          daysInMonth,
        },
        currency
      );

      return {
        insights: generatedInsights,
        isLoading: false,
        isEmpty: generatedInsights.length === 0,
      };
    } catch (error) {
      console.error('Error generating insights:', error);
      return { insights: [], isLoading: false, isEmpty: true };
    }
  }, [currentExpenses, previousExpenses, budgets, loadingCurrent, loadingBudgets, currency, convertFromBase]);

  return { insights, isLoading, isEmpty };
}
