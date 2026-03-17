import { ExpenseCategory } from './expense';

export type InsightType = 'warning' | 'insight' | 'suggestion' | 'positive';
export type InsightPriority = 'high' | 'medium' | 'low';

export interface Insight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  icon: string;
  actionable: boolean;
  relatedCategory?: ExpenseCategory;
  data?: Record<string, any>;
  timestamp: number;
}

export interface InsightsAnalytics {
  monthlyTotal: number;
  dailyAverage: number;
  categoryTotals: Record<ExpenseCategory, number>;
  weekendSpending: number;
  weekdaySpending: number;
  budgetStatus: number; // percentage
  previousMonthTotal: number;
  monthlyGrowth: number; // percentage
  topCategory: ExpenseCategory | null;
  topCategoryAmount: number;
  transactionCount: number;
  daysInMonth: number;
}

export interface InsightGenerationInput {
  currentExpenses: Array<{
    id: string;
    amount: number;
    category: ExpenseCategory;
    expense_date: string;
  }>;
  previousMonthTotal: number;
  budget: number;
  categoryBudgets: Record<ExpenseCategory, number>;
  daysInMonth: number;
}
