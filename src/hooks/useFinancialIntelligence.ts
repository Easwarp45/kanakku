import { useEffect, useMemo, useState } from 'react';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { useAuth } from './useAuth';
import { useBudgets } from './useBudgets';
import { useCurrency } from './useCurrency';
import { useExpenses } from './useExpenses';
import {
  appendInsightHistory,
  getInsightHistory,
} from '@/lib/insightHistory';
import {
  buildLastMonthSnapshot,
  defaultGoalInput,
  runFinancialIntelligenceEngine,
} from '@/lib/financialIntelligenceEngine';
import type { InsightHistoryEntry } from '@/types/insights';
import type { FinancialGoalsInput, GroupBalancesInput } from '@/types/financial-intelligence';

interface UseFinancialIntelligenceOptions {
  goals?: FinancialGoalsInput;
  groupBalances?: GroupBalancesInput;
}

function extractMerchant(description: string | null): string {
  if (!description) return 'Unknown Merchant';

  const [firstPart] = description.split('|');
  const [merchantPart] = firstPart.split('-');
  const merchant = merchantPart.trim();
  return merchant.length > 0 ? merchant : 'Unknown Merchant';
}

export function useFinancialIntelligence(options: UseFinancialIntelligenceOptions = {}) {
  const { user } = useAuth();
  const { convertFromBase } = useCurrency();

  const dayKey = format(new Date(), 'yyyy-MM-dd');
  const now = useMemo(() => new Date(`${dayKey}T12:00:00`), [dayKey]);

  const startWindow = format(startOfMonth(subMonths(now, 4)), 'yyyy-MM-dd');
  const endWindow = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses({
    startDate: startWindow,
    endDate: endWindow,
  });
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();

  const [history, setHistory] = useState<InsightHistoryEntry[]>([]);

  const intelligence = useMemo(() => {
    const normalizedExpenses = expenses.map((expense) => ({
      amount: convertFromBase(expense.amount),
      category: expense.category,
      merchant: extractMerchant(expense.description),
      date: `${expense.expense_date}T12:00:00`,
    }));

    const budget = budgets.reduce((sum, item) => sum + convertFromBase(item.amount), 0);
    const goals = options.goals || defaultGoalInput(budget, now);
    const lastMonthData = buildLastMonthSnapshot(normalizedExpenses, now);

    return runFinancialIntelligenceEngine({
      expenses: normalizedExpenses,
      budget,
      goals,
      groupBalances: options.groupBalances || {},
      lastMonthData,
      now,
    });
  }, [expenses, budgets, convertFromBase, options.goals, options.groupBalances, now]);

  const isLoading = loadingExpenses || loadingBudgets;

  useEffect(() => {
    if (!user?.id) {
      setHistory([]);
      return;
    }

    setHistory(getInsightHistory(user.id));
  }, [user?.id]);

  const insightSignature = useMemo(
    () => intelligence.insights.map((insight) => insight.id).join('|'),
    [intelligence.insights]
  );

  useEffect(() => {
    if (!user?.id || isLoading || intelligence.insights.length === 0) {
      return;
    }

    const updated = appendInsightHistory(user.id, intelligence.insights, now);
    setHistory(updated);
  }, [user?.id, isLoading, insightSignature, now]);

  return {
    ...intelligence,
    history,
    isLoading,
  };
}
