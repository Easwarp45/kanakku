import { parseISO, isWeekend, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import type { ExpenseCategory } from '@/types/expense';
import type { Insight, InsightsAnalytics, InsightGenerationInput } from '@/types/insights';
import { formatMoney, type SupportedCurrency } from '@/lib/currency';

/**
 * Calculate comprehensive analytics from expenses
 */
export function calculateAnalytics(input: InsightGenerationInput): InsightsAnalytics {
  const expenses = input.currentExpenses;
  const monthlyTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const dailyAverage = input.daysInMonth > 0 ? monthlyTotal / input.daysInMonth : 0;

  // Calculate category totals
  const categoryTotals: Record<string, number> = {};
  let topCategory: ExpenseCategory | null = null;
  let topCategoryAmount = 0;

  expenses.forEach(exp => {
    if (!categoryTotals[exp.category]) {
      categoryTotals[exp.category] = 0;
    }
    categoryTotals[exp.category] += exp.amount;
    if (categoryTotals[exp.category] > topCategoryAmount) {
      topCategoryAmount = categoryTotals[exp.category];
      topCategory = exp.category;
    }
  });

  // Calculate weekend vs weekday spending
  let weekendSpending = 0;
  let weekdaySpending = 0;

  expenses.forEach(exp => {
    const date = parseISO(exp.expense_date);
    if (isWeekend(date)) {
      weekendSpending += exp.amount;
    } else {
      weekdaySpending += exp.amount;
    }
  });

  // Calculate budget status (percentage of budget used)
  const budgetStatus = input.budget > 0 ? (monthlyTotal / input.budget) * 100 : 0;

  // Calculate monthly growth
  const monthlyGrowth = input.previousMonthTotal > 0 
    ? ((monthlyTotal - input.previousMonthTotal) / input.previousMonthTotal) * 100 
    : 0;

  return {
    monthlyTotal,
    dailyAverage,
    categoryTotals: categoryTotals as Record<ExpenseCategory, number>,
    weekendSpending,
    weekdaySpending,
    budgetStatus,
    previousMonthTotal: input.previousMonthTotal,
    monthlyGrowth,
    topCategory,
    topCategoryAmount,
    transactionCount: expenses.length,
    daysInMonth: input.daysInMonth,
  };
}

/**
 * Helper: Detect categories with spike spending
 */
function detectCategorySpikes(
  categoryTotals: Record<ExpenseCategory, number>,
  categoryBudgets: Record<ExpenseCategory, number>
): ExpenseCategory[] {
  return Object.entries(categoryTotals)
    .filter(([category, amount]) => {
      const budget = categoryBudgets[category as ExpenseCategory] || 0;
      return budget > 0 && (amount / budget) >= 0.8;
    })
    .map(([category]) => category as ExpenseCategory);
}

/**
 * Helper: Get weekend spending insight
 */
function getWeekendInsight(weekend: number, weekday: number): string {
  if (weekday === 0) return 'Most spending is on weekends';
  const ratio = weekend / weekday;
  if (ratio > 1.5) {
    return `You spend ${(ratio * 100 - 100).toFixed(0)}% more on weekends`;
  }
  if (ratio > 1) {
    return 'Weekend spending is higher than weekdays';
  }
  return 'Weekday spending is higher than weekends';
}

/**
 * Helper: Get spending forecast
 */
function getForecastInsight(dailyAvg: number, currency: SupportedCurrency): string {
  const forecast = dailyAvg * 30;
  return `At this rate, you'll spend ${formatMoney(forecast, currency, { maximumFractionDigits: 0 })} this month`;
}

/**
 * Helper: Detect frequent small spending
 */
function detectFrequentSpending(
  expenses: InsightGenerationInput['currentExpenses'],
  category: ExpenseCategory
): boolean {
  const categoryExpenses = expenses.filter(e => e.category === category);
  return categoryExpenses.length >= 8;
}

/**
 * Helper: Get positive spending message
 */
function getPositiveInsight(usage: number): string {
  if (usage < 30) return 'Great job! Very controlled spending this month';
  if (usage < 50) return 'Good control! Your spending is well within budget';
  if (usage < 60) return 'On track! You\'re maintaining good spending habits';
  return 'You\'re being mindful of your budget';
}

/**
 * Helper: Get savings opportunity message
 */
function getSavingsSuggestion(category: string, amount: number, currency: SupportedCurrency): string {
  return `Reducing ${category} by 15% could save you ${formatMoney(Math.round(amount * 0.15), currency, { maximumFractionDigits: 0 })} this month`;
}

/**
 * Helper: Get category emoji/icon name
 */
function getCategoryEmoji(category: ExpenseCategory): string {
  const emojiMap: Record<ExpenseCategory, string> = {
    food: '🍔',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    bills: '📄',
    health: '⚕️',
    education: '📚',
    travel: '✈️',
    other: '📦',
  };
  return emojiMap[category] || '📦';
}

/**
 * Generate insights based on analytics and rules
 */
export function generateInsights(
  analytics: InsightsAnalytics,
  input: InsightGenerationInput,
  currency: SupportedCurrency = 'INR'
): Insight[] {
  const insights: Insight[] = [];
  const now = Date.now();

  // Rule 1: Budget Overspend Warning
  if (analytics.budgetStatus > 100) {
    const overspendAmount = analytics.monthlyTotal - input.budget;
    insights.push({
      id: `budget-overspend-${now}-1`,
      type: 'warning',
      priority: 'high',
      title: 'Budget Exceeded',
      message: `You've exceeded your budget by ${formatMoney(overspendAmount, currency, { maximumFractionDigits: 0 })}`,
      icon: '⚠️',
      actionable: true,
      timestamp: now,
    });
  }

  // Rule 2: High Budget Usage Alert
  if (analytics.budgetStatus >= 80 && analytics.budgetStatus <= 100) {
    const remaining = input.budget - analytics.monthlyTotal;
    insights.push({
      id: `budget-high-${now}-2`,
      type: 'warning',
      priority: 'medium',
      title: 'Nearing Budget Limit',
      message: `You've used ${analytics.budgetStatus.toFixed(0)}% of your budget. Only ${formatMoney(remaining, currency, { maximumFractionDigits: 0 })} remaining`,
      icon: '📈',
      actionable: true,
      timestamp: now,
    });
  }

  // Rule 3: Category Spike Detection
  const spikedCategories = detectCategorySpikes(analytics.categoryTotals, input.categoryBudgets);
  spikedCategories.slice(0, 1).forEach(category => {
    const amount = analytics.categoryTotals[category];
    insights.push({
      id: `category-spike-${category}-${now}-3`,
      type: 'warning',
      priority: 'medium',
      title: `High ${category} Spending`,
      message: `${category} spending is at ${formatMoney(amount, currency, { maximumFractionDigits: 0 })}, approaching or exceeding budget`,
      icon: getCategoryEmoji(category),
      actionable: true,
      relatedCategory: category,
      timestamp: now,
    });
  });

  // Rule 4: Top Category Insight (Always show)
  if (analytics.topCategory) {
    insights.push({
      id: `top-category-${analytics.topCategory}-${now}-4`,
      type: 'insight',
      priority: 'low',
      title: `Your Top Spending Category`,
      message: `${analytics.topCategory} is your highest spending category at ${formatMoney(analytics.topCategoryAmount, currency, { maximumFractionDigits: 0 })}`,
      icon: getCategoryEmoji(analytics.topCategory),
      actionable: false,
      relatedCategory: analytics.topCategory,
      timestamp: now,
    });
  }

  // Rule 5: Weekend Pattern Insight
  if (analytics.weekendSpending + analytics.weekdaySpending > 0) {
    insights.push({
      id: `weekend-pattern-${now}-5`,
      type: 'insight',
      priority: 'low',
      title: 'Weekend Spending Pattern',
      message: getWeekendInsight(analytics.weekendSpending, analytics.weekdaySpending),
      icon: '📅',
      actionable: false,
      timestamp: now,
    });
  }

  // Rule 6: Spending Forecast
  insights.push({
    id: `forecast-${now}-6`,
    type: 'insight',
    priority: 'medium',
    title: 'Monthly Forecast',
    message: getForecastInsight(analytics.dailyAverage, currency),
    icon: '📊',
    actionable: false,
    timestamp: now,
  });

  // Rule 7: Frequent Spending Detection
  Object.keys(analytics.categoryTotals).forEach(category => {
    if (detectFrequentSpending(input.currentExpenses, category as ExpenseCategory)) {
      insights.push({
        id: `frequent-${category}-${now}-7`,
        type: 'insight',
        priority: 'low',
        title: `Frequent ${category} Purchases`,
        message: `You made ${input.currentExpenses.filter(e => e.category === category).length} ${category} transactions this month`,
        icon: getCategoryEmoji(category as ExpenseCategory),
        actionable: false,
        relatedCategory: category as ExpenseCategory,
        timestamp: now,
      });
    }
  });

  // Rule 8: Positive Feedback
  if (analytics.budgetStatus <= 100) {
    insights.push({
      id: `positive-${now}-8`,
      type: 'positive',
      priority: 'low',
      title: 'Good Spending Control',
      message: getPositiveInsight(analytics.budgetStatus),
      icon: '✨',
      actionable: false,
      timestamp: now,
    });
  }

  // Rule 9: Savings Opportunity
  if (analytics.topCategory && analytics.topCategoryAmount > 0) {
    insights.push({
      id: `savings-${analytics.topCategory}-${now}-9`,
      type: 'suggestion',
      priority: 'medium',
      title: 'Reduce Spending on ' + analytics.topCategory,
      message: getSavingsSuggestion(analytics.topCategory, analytics.topCategoryAmount, currency),
      icon: '💡',
      actionable: true,
      relatedCategory: analytics.topCategory,
      timestamp: now,
    });
  }

  // Rule 10: Growth Alert
  if (analytics.monthlyGrowth > 15) {
    insights.push({
      id: `growth-alert-${now}-10`,
      type: 'warning',
      priority: 'high',
      title: 'Spending Growth Alert',
      message: `Your spending increased by ${analytics.monthlyGrowth.toFixed(0)}% compared to last month`,
      icon: '📈',
      actionable: true,
      timestamp: now,
    });
  }

  // Sort by priority: high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
