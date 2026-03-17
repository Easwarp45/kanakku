import type { ExpenseCategory } from './expense';

export type InsightType = 'warning' | 'insight' | 'suggestion' | 'positive';
export type InsightPriority = 'high' | 'medium' | 'low';

export interface Insight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  icon: string;
  actionable?: boolean;
  relatedCategory?: ExpenseCategory;
  data?: Record<string, any>;
}

export interface InsightsAnalytics {
  monthlyTotal: number;
  dailyAverage: number;
  predictedMonthlyTotal: number;
  categoryTotals: Record<ExpenseCategory, number>;
  weekendSpending: number;
  weekdaySpending: number;
  weekendAvgPerDay: number;
  weekdayAvgPerDay: number;
  topCategory: ExpenseCategory | null;
  topCategoryAmount: number;
  transactionCounts: Record<ExpenseCategory, number>;
  budgetStatus: {
    isOverBudget: boolean;
    percentage: number;
    remaining: number;
    overByAmount: number;
  };
  previousMonthTotal: number;
  monthlyGrowth: number;
  mostFrequentPaymentMethod: string;
}

export interface InsightGenerationInput {
  currentExpenses: Array<{
    amount: number;
    category: ExpenseCategory;
    date: string;
    paymentMethod: string;
  }>;
  previousMonthTotal?: number;
  budget?: number;
  categoryBudgets?: Record<ExpenseCategory, number>;
  daysInMonth?: number;
}
