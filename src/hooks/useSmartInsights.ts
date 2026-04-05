import { useEffect, useMemo, useState } from 'react';
import { useExpenses } from './useExpenses';
import { useBudgets } from './useBudgets';
import { useCurrency } from './useCurrency';
import { useAuth } from './useAuth';
import { appendInsightHistory, getInsightHistory } from '@/lib/insightHistory';
import { calculateAnalytics, calculateGamification, generateInsights } from '@/lib/insightsEngine';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import type { ExpenseCategory } from '@/types/expense';
import type { Insight, InsightHistoryEntry } from '@/types/insights';

export function useSmartInsights() {
  const { user } = useAuth();
  const { currency, convertFromBase } = useCurrency();

  const currentDateKey = format(new Date(), 'yyyy-MM-dd');
  const analyticsNow = useMemo(() => new Date(`${currentDateKey}T12:00:00`), [currentDateKey]);
  const monthStart = startOfMonth(analyticsNow);
  const monthEnd = endOfMonth(analyticsNow);
  const lastMonthStart = startOfMonth(subMonths(analyticsNow, 1));
  const lastMonthEnd = endOfMonth(subMonths(analyticsNow, 1));
  const rollingStart = startOfMonth(subMonths(analyticsNow, 4));

  const currentStartStr = format(monthStart, 'yyyy-MM-dd');
  const currentEndStr = format(monthEnd, 'yyyy-MM-dd');
  const previousStartStr = format(lastMonthStart, 'yyyy-MM-dd');
  const previousEndStr = format(lastMonthEnd, 'yyyy-MM-dd');
  const rollingStartStr = format(rollingStart, 'yyyy-MM-dd');

  const { data: rollingExpensesRaw = [], isLoading: loadingExpenses } = useExpenses({
    startDate: rollingStartStr,
    endDate: currentEndStr,
  });

  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();
  const [history, setHistory] = useState<InsightHistoryEntry[]>([]);

  const { insights, gamification, isLoading, isEmpty } = useMemo(() => {
    if (loadingExpenses || loadingBudgets) {
      return {
        insights: [],
        gamification: {
          health: { score: 0, label: 'Needs Improvement' as const, reasons: [] },
          streaks: { trackingDays: 0, budgetControlWeeks: 0 },
          achievements: [],
        },
        isLoading: true,
        isEmpty: false,
      };
    }

    try {
      const currentExpensesRaw = rollingExpensesRaw.filter(
        (exp) => exp.expense_date >= currentStartStr && exp.expense_date <= currentEndStr
      );
      const previousExpensesRaw = rollingExpensesRaw.filter(
        (exp) => exp.expense_date >= previousStartStr && exp.expense_date <= previousEndStr
      );
      const rollingExpenses = rollingExpensesRaw.map((expense) => ({
        id: expense.id,
        category: expense.category,
        expense_date: expense.expense_date,
        amount: convertFromBase(expense.amount),
      }));

      const currentExpenses = currentExpensesRaw.map((expense) => ({
        id: expense.id,
        category: expense.category,
        expense_date: expense.expense_date,
        amount: convertFromBase(expense.amount),
      }));

      const previousExpenses = previousExpensesRaw.map((expense) => ({
        id: expense.id,
        category: expense.category,
        expense_date: expense.expense_date,
        amount: convertFromBase(expense.amount),
      }));

      const totalBudget = budgets.reduce((sum, budget) => sum + convertFromBase(budget.amount), 0) || 0;

      const categoryBudgets = {
        food: 0,
        transport: 0,
        entertainment: 0,
        shopping: 0,
        bills: 0,
        health: 0,
        education: 0,
        travel: 0,
        other: 0,
      } as Record<ExpenseCategory, number>;

      budgets.forEach((budget) => {
        categoryBudgets[budget.category as ExpenseCategory] = convertFromBase(budget.amount);
      });

      const input = {
        currentExpenses,
        previousExpenses,
        rollingExpenses,
        budget: totalBudget,
        categoryBudgets,
        now: analyticsNow,
      };

      const analytics = calculateAnalytics(input);
      const generatedInsights = generateInsights(analytics, input, currency);
      const generatedGamification = calculateGamification(analytics, input);

      const fallbackInsight: Insight = {
        id: 'placeholder-insight',
        type: 'info' as const,
        priority: 3,
        title: 'More data unlocks sharper insights',
        message: 'Keep logging expenses daily to unlock forecast and behavior insights.',
        icon: '📘',
        actionRoute: '/add-expense',
        actionLabel: 'Log Expense',
        why: {
          previous: 0,
          current: currentExpenses.length,
          change: `${currentExpenses.length} records`,
          reason: 'Rule-based patterns need enough recent transactions to detect trends.',
          valueKind: 'count',
        },
        createdAt: analyticsNow.getTime(),
      };

      const finalInsights = generatedInsights.length > 0 ? generatedInsights : [fallbackInsight];

      return {
        insights: finalInsights,
        gamification: generatedGamification,
        isLoading: false,
        isEmpty: finalInsights.length === 0,
      };
    } catch (error) {
      console.error('Error generating insights:', error);
      return {
        insights: [],
        gamification: {
          health: { score: 0, label: 'Needs Improvement' as const, reasons: [] },
          streaks: { trackingDays: 0, budgetControlWeeks: 0 },
          achievements: [],
        },
        isLoading: false,
        isEmpty: true,
      };
    }
  }, [
    rollingExpensesRaw,
    budgets,
    loadingExpenses,
    loadingBudgets,
    currency,
    convertFromBase,
    monthStart,
    monthEnd,
    lastMonthStart,
    lastMonthEnd,
    analyticsNow,
    currentStartStr,
    currentEndStr,
    previousStartStr,
    previousEndStr,
  ]);

  useEffect(() => {
    if (!user?.id) {
      setHistory([]);
      return;
    }
    setHistory(getInsightHistory(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || insights.length === 0 || isLoading) {
      return;
    }

    const updated = appendInsightHistory(user.id, insights);
    setHistory(updated);
  }, [user?.id, insights, isLoading]);

  return { insights, history, gamification, isLoading, isEmpty };
}
