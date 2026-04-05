import { ExpenseCategory } from './expense';

export type InsightType = 'info' | 'warning' | 'suggestion';
export type InsightFilterType = InsightType | 'all';

export interface InsightWhy {
  previous: number;
  current: number;
  change: string;
  reason: string;
  valueKind?: 'currency' | 'count' | 'ratio';
}

export interface Insight {
  id: string;
  type: InsightType;
  priority: number; // 1 = highest, 3 = lowest
  title: string;
  message: string;
  icon: string;
  why: InsightWhy;
  actionRoute?: string;
  actionLabel?: string;
  relatedCategory?: ExpenseCategory;
  createdAt: number;
}

export interface InsightsAnalytics {
  monthlyTotal: number;
  previousMonthTotal: number;
  monthlyGrowth: number;
  projectedMonthTotal: number;
  dailyAverage: number;
  daysElapsedInMonth: number;
  daysInMonth: number;

  categoryTotals: Record<ExpenseCategory, number>;
  previousCategoryTotals: Record<ExpenseCategory, number>;
  weekendSpending: number;
  weekdaySpending: number;

  budget: number;
  budgetStatus: number; // percentage used

  unnecessarySpendAmount: number;
  unnecessarySpendShare: number;

  topCategory: ExpenseCategory | null;
  topCategoryAmount: number;

  transactionCount: number;
  activeDaysCurrentMonth: number;
}

export interface InsightExpensePoint {
  id: string;
  amount: number;
  category: ExpenseCategory;
  expense_date: string;
}

export interface InsightGenerationInput {
  currentExpenses: InsightExpensePoint[];
  previousExpenses: InsightExpensePoint[];
  rollingExpenses: InsightExpensePoint[];

  budget: number;
  categoryBudgets: Record<ExpenseCategory, number>;
  now: Date;
}

export interface FinancialHealthScore {
  score: number;
  label: 'Excellent' | 'Good' | 'Needs Improvement';
  reasons: string[];
}

export interface InsightStreaks {
  trackingDays: number;
  budgetControlWeeks: number;
}

export interface InsightAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
}

export interface InsightGamification {
  health: FinancialHealthScore;
  streaks: InsightStreaks;
  achievements: InsightAchievement[];
}

export interface InsightHistoryEntry extends Insight {
  recordedDate: string; // yyyy-MM-dd
  recordedAt: number;
}
