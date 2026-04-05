import {
  endOfMonth,
  endOfWeek,
  format,
  isWeekend,
  parseISO,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns';
import type { ExpenseCategory } from '@/types/expense';
import type {
  Insight,
  InsightAchievement,
  InsightGamification,
  InsightGenerationInput,
  InsightsAnalytics,
} from '@/types/insights';
import { formatMoney, type SupportedCurrency } from '@/lib/currency';

const ALL_CATEGORIES: ExpenseCategory[] = [
  'food',
  'transport',
  'entertainment',
  'shopping',
  'bills',
  'health',
  'education',
  'travel',
  'other',
];

const DISCRETIONARY_CATEGORIES: ExpenseCategory[] = ['food', 'shopping', 'entertainment'];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createEmptyCategoryMap(): Record<ExpenseCategory, number> {
  return {
    food: 0,
    transport: 0,
    entertainment: 0,
    shopping: 0,
    bills: 0,
    health: 0,
    education: 0,
    travel: 0,
    other: 0,
  };
}

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

function formatPercentChange(previous: number, current: number): string {
  if (previous <= 0) {
    return current > 0 ? '+100%' : '0%';
  }

  const change = ((current - previous) / previous) * 100;
  const signed = change > 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
  return signed;
}

function buildInsightId(seed: string, dayKey: string): string {
  return `${dayKey}-${seed}`;
}

/**
 * Calculate comprehensive analytics from expenses
 */
export function calculateAnalytics(input: InsightGenerationInput): InsightsAnalytics {
  const categoryTotals = createEmptyCategoryMap();
  const previousCategoryTotals = createEmptyCategoryMap();
  let topCategory: ExpenseCategory | null = null;
  let topCategoryAmount = 0;

  const monthlyTotal = input.currentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const previousMonthTotal = input.previousExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyGrowth = previousMonthTotal > 0 ? ((monthlyTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;

  const daysInMonth = endOfMonth(input.now).getDate();
  const daysElapsedInMonth = Math.max(1, input.now.getDate());
  const dailyAverage = monthlyTotal / daysElapsedInMonth;
  const projectedMonthTotal = dailyAverage * daysInMonth;

  for (const exp of input.currentExpenses) {
    categoryTotals[exp.category] += exp.amount;

    if (categoryTotals[exp.category] > topCategoryAmount) {
      topCategoryAmount = categoryTotals[exp.category];
      topCategory = exp.category;
    }
  }

  for (const exp of input.previousExpenses) {
    previousCategoryTotals[exp.category] += exp.amount;
  }

  let weekendSpending = 0;
  let weekdaySpending = 0;
  for (const exp of input.currentExpenses) {
    if (isWeekend(parseISO(exp.expense_date))) {
      weekendSpending += exp.amount;
    } else {
      weekdaySpending += exp.amount;
    }
  }

  const budgetStatus = input.budget > 0 ? (monthlyTotal / input.budget) * 100 : 0;

  const unnecessarySpendAmount = DISCRETIONARY_CATEGORIES.reduce(
    (sum, category) => sum + categoryTotals[category],
    0
  );
  const unnecessarySpendShare = monthlyTotal > 0 ? (unnecessarySpendAmount / monthlyTotal) * 100 : 0;

  const activeDaysCurrentMonth = new Set(input.currentExpenses.map((item) => item.expense_date)).size;

  return {
    monthlyTotal,
    previousMonthTotal,
    monthlyGrowth,
    projectedMonthTotal,
    dailyAverage,
    daysElapsedInMonth,
    daysInMonth,

    categoryTotals,
    previousCategoryTotals,
    weekendSpending,
    weekdaySpending,

    budget: input.budget,
    budgetStatus,

    unnecessarySpendAmount,
    unnecessarySpendShare,

    topCategory,
    topCategoryAmount,

    transactionCount: input.currentExpenses.length,
    activeDaysCurrentMonth,
  };
}

/**
 * Generate advanced rule-based insights with explainability payload.
 */
export function generateInsights(
  analytics: InsightsAnalytics,
  input: InsightGenerationInput,
  currency: SupportedCurrency = 'INR'
): Insight[] {
  const insights: Insight[] = [];
  const dayKey = format(input.now, 'yyyy-MM-dd');
  const createdAt = input.now.getTime();

  if (analytics.budget > 0 && analytics.budgetStatus > 100) {
    const overBy = analytics.monthlyTotal - analytics.budget;
    insights.push({
      id: buildInsightId('budget-exceeded', dayKey),
      type: 'warning',
      priority: 1,
      icon: '⚠️',
      title: 'Budget Exceeded',
      message: `You crossed this month budget by ${formatMoney(overBy, currency, { maximumFractionDigits: 0 })}.`,
      actionRoute: '/budget',
      actionLabel: 'Fix Budget',
      why: {
        previous: analytics.budget,
        current: analytics.monthlyTotal,
        change: formatPercentChange(analytics.budget, analytics.monthlyTotal),
        reason: 'Current month spend is higher than your configured monthly budget.',
        valueKind: 'currency',
      },
      createdAt,
    });
  }

  if (analytics.budget > 0 && analytics.budgetStatus <= 100 && analytics.projectedMonthTotal > analytics.budget * 1.05) {
    const remaining = Math.max(0, analytics.budget - analytics.monthlyTotal);
    const daysToExceed = analytics.dailyAverage > 0
      ? Math.max(1, Math.ceil(remaining / analytics.dailyAverage))
      : analytics.daysInMonth - analytics.daysElapsedInMonth;

    insights.push({
      id: buildInsightId('budget-risk', dayKey),
      type: 'warning',
      priority: 1,
      icon: '🚨',
      title: 'Budget Risk',
      message: `At this pace, budget can be exceeded in about ${daysToExceed} days.`,
      actionRoute: '/budget',
      actionLabel: 'Adjust Budget',
      why: {
        previous: analytics.budget,
        current: analytics.projectedMonthTotal,
        change: formatPercentChange(analytics.budget, analytics.projectedMonthTotal),
        reason: 'Daily spending trend projects a month-end total above your budget.',
        valueKind: 'currency',
      },
      createdAt,
    });
  }

  let highestCategoryGrowth: { category: ExpenseCategory; growth: number; previous: number; current: number } | null = null;
  for (const category of ALL_CATEGORIES) {
    const previous = analytics.previousCategoryTotals[category];
    const current = analytics.categoryTotals[category];
    if (previous <= 0) {
      continue;
    }

    const growth = ((current - previous) / previous) * 100;
    if (growth > 30 && (!highestCategoryGrowth || growth > highestCategoryGrowth.growth)) {
      highestCategoryGrowth = { category, growth, previous, current };
    }
  }

  if (highestCategoryGrowth) {
    insights.push({
      id: buildInsightId('category-growth', dayKey),
      type: 'warning',
      priority: 1,
      icon: getCategoryEmoji(highestCategoryGrowth.category),
      title: `${highestCategoryGrowth.category} spend is surging`,
      message: `${highestCategoryGrowth.category} spending is up ${highestCategoryGrowth.growth.toFixed(0)}% vs last month.`,
      actionRoute: '/expenses',
      actionLabel: 'Review Expenses',
      relatedCategory: highestCategoryGrowth.category,
      why: {
        previous: highestCategoryGrowth.previous,
        current: highestCategoryGrowth.current,
        change: formatPercentChange(highestCategoryGrowth.previous, highestCategoryGrowth.current),
        reason: 'This category increased more than the 30% risk threshold.',
        valueKind: 'currency',
      },
      createdAt,
    });
  }

  if (analytics.weekendSpending > analytics.weekdaySpending * 1.25 && analytics.weekendSpending > 0) {
    insights.push({
      id: buildInsightId('weekend-pattern', dayKey),
      type: 'suggestion',
      priority: 2,
      icon: '🗓️',
      title: 'Weekend Spike Detected',
      message: 'Weekend spending is significantly higher than weekdays.',
      actionRoute: '/expenses',
      actionLabel: 'Plan Weekends',
      why: {
        previous: analytics.weekdaySpending,
        current: analytics.weekendSpending,
        change: formatPercentChange(analytics.weekdaySpending, analytics.weekendSpending),
        reason: 'Your weekend spend is above the healthy weekday balance trend.',
        valueKind: 'currency',
      },
      createdAt,
    });
  }

  if (analytics.unnecessarySpendShare >= 40) {
    insights.push({
      id: buildInsightId('discretionary-share', dayKey),
      type: 'suggestion',
      priority: 2,
      icon: '💡',
      title: 'High Non-Essential Spend',
      message: `${analytics.unnecessarySpendShare.toFixed(0)}% is from food, shopping, and entertainment.`,
      actionRoute: '/expenses',
      actionLabel: 'Trim Non-Essentials',
      why: {
        previous: analytics.monthlyTotal,
        current: analytics.unnecessarySpendAmount,
        change: `${analytics.unnecessarySpendShare.toFixed(0)}% share`,
        reason: 'Discretionary categories are consuming a large part of your monthly spend.',
        valueKind: 'currency',
      },
      createdAt,
    });
  }

  if (analytics.topCategory) {
    const potentialSavings = analytics.topCategoryAmount * 0.15;
    insights.push({
      id: buildInsightId('top-category-savings', dayKey),
      type: 'suggestion',
      priority: 2,
      icon: '🎯',
      title: `Optimize ${analytics.topCategory} spending`,
      message: `Reducing ${analytics.topCategory} by 15% can save ${formatMoney(potentialSavings, currency, { maximumFractionDigits: 0 })}.`,
      actionRoute: '/expenses',
      actionLabel: 'Set Spending Cap',
      relatedCategory: analytics.topCategory,
      why: {
        previous: analytics.topCategoryAmount,
        current: potentialSavings,
        change: '15% optimization',
        reason: 'Your top category is the fastest path to meaningful monthly savings.',
        valueKind: 'currency',
      },
      createdAt,
    });
  }

  insights.push({
    id: buildInsightId('monthly-forecast', dayKey),
    type: 'info',
    priority: 3,
    icon: '📊',
    title: 'Month-end Forecast',
    message: `Projected spend is ${formatMoney(analytics.projectedMonthTotal, currency, { maximumFractionDigits: 0 })} at current pace.`,
    actionRoute: '/analytics',
    actionLabel: 'View Trends',
    why: {
      previous: analytics.monthlyTotal,
      current: analytics.projectedMonthTotal,
      change: formatPercentChange(analytics.monthlyTotal, analytics.projectedMonthTotal),
      reason: 'Projection uses current month daily average multiplied by total days in month.',
      valueKind: 'currency',
    },
    createdAt,
  });

  if (analytics.topCategory) {
    insights.push({
      id: buildInsightId('top-category-info', dayKey),
      type: 'info',
      priority: 3,
      icon: getCategoryEmoji(analytics.topCategory),
      title: `Top category: ${analytics.topCategory}`,
      message: `${formatMoney(analytics.topCategoryAmount, currency, { maximumFractionDigits: 0 })} spent in your top category this month.`,
      actionRoute: '/expenses',
      actionLabel: 'See Category',
      relatedCategory: analytics.topCategory,
      why: {
        previous: analytics.previousCategoryTotals[analytics.topCategory],
        current: analytics.categoryTotals[analytics.topCategory],
        change: formatPercentChange(
          analytics.previousCategoryTotals[analytics.topCategory],
          analytics.categoryTotals[analytics.topCategory]
        ),
        reason: 'Category totals are ranked by current month spend to highlight your biggest spend area.',
        valueKind: 'currency',
      },
      createdAt,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority).slice(0, 8);
}

function calculateTrackingStreak(input: InsightGenerationInput): number {
  const dateSet = new Set(input.rollingExpenses.map((item) => item.expense_date));
  let cursor = input.now;

  const todayKey = format(cursor, 'yyyy-MM-dd');
  if (!dateSet.has(todayKey) && cursor.getHours() < 20) {
    cursor = subDays(cursor, 1);
  }

  let streak = 0;
  while (dateSet.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return streak;
}

function calculateBudgetControlStreak(analytics: InsightsAnalytics, input: InsightGenerationInput): number {
  if (analytics.budget <= 0) {
    return 0;
  }

  const weeklyBudget = (analytics.budget * 12) / 52;
  const currentWeekStart = startOfWeek(input.now, { weekStartsOn: 1 });
  let streak = 0;

  for (let i = 1; i <= 12; i += 1) {
    const weekStart = subWeeks(currentWeekStart, i);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekStartKey = format(weekStart, 'yyyy-MM-dd');
    const weekEndKey = format(weekEnd, 'yyyy-MM-dd');

    const weeklySpend = input.rollingExpenses
      .filter((expense) => expense.expense_date >= weekStartKey && expense.expense_date <= weekEndKey)
      .reduce((sum, expense) => sum + expense.amount, 0);

    if (weeklySpend <= weeklyBudget * 1.02) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function buildAchievements(
  analytics: InsightsAnalytics,
  input: InsightGenerationInput,
  streaks: { trackingDays: number; budgetControlWeeks: number }
): InsightAchievement[] {
  const last7Start = format(subDays(input.now, 6), 'yyyy-MM-dd');
  const nowKey = format(input.now, 'yyyy-MM-dd');
  const last7Spend = input.rollingExpenses
    .filter((expense) => expense.expense_date >= last7Start && expense.expense_date <= nowKey)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const weeklyBudget = analytics.budget > 0 ? (analytics.budget * 7) / analytics.daysInMonth : 0;
  const noOverspendingUnlocked = weeklyBudget > 0 ? last7Spend <= weeklyBudget : false;
  const noOverspendingProgress = weeklyBudget > 0
    ? clamp(100 - (Math.max(0, last7Spend - weeklyBudget) / weeklyBudget) * 100, 0, 100)
    : 0;

  const budgetMasterUnlocked = analytics.budget > 0 && analytics.budgetStatus <= 90;
  const budgetMasterProgress = analytics.budget > 0
    ? clamp(((110 - analytics.budgetStatus) / 20) * 100, 0, 100)
    : 0;

  const trackerUnlocked = streaks.trackingDays >= 7;
  const trackerProgress = clamp((streaks.trackingDays / 7) * 100, 0, 100);

  return [
    {
      id: 'no-overspending-week',
      title: 'No Overspending Week',
      description: 'Keep weekly spend within budget guidance.',
      icon: '🛡️',
      unlocked: noOverspendingUnlocked,
      progress: noOverspendingProgress,
    },
    {
      id: 'budget-master',
      title: 'Budget Master',
      description: 'Stay at or below 90% of monthly budget.',
      icon: '🏆',
      unlocked: budgetMasterUnlocked,
      progress: budgetMasterProgress,
    },
    {
      id: 'consistent-tracker',
      title: 'Consistent Tracker',
      description: 'Log expenses for 7 days in a row.',
      icon: '🔥',
      unlocked: trackerUnlocked,
      progress: trackerProgress,
    },
  ];
}

/**
 * Gamification module: financial health, streaks, and achievements.
 */
export function calculateGamification(
  analytics: InsightsAnalytics,
  input: InsightGenerationInput
): InsightGamification {
  let score = 70;
  const reasons: string[] = [];

  if (analytics.budget > 0) {
    if (analytics.budgetStatus <= 85) {
      score += 15;
      reasons.push('Excellent budget control this month.');
    } else if (analytics.budgetStatus <= 100) {
      score += 8;
      reasons.push('You are within budget limits.');
    } else {
      const penalty = Math.min(30, (analytics.budgetStatus - 100) * 0.8);
      score -= penalty;
      reasons.push('Overspending is reducing your financial health score.');
    }
  }

  const trackingConsistency = analytics.daysElapsedInMonth > 0
    ? analytics.activeDaysCurrentMonth / analytics.daysElapsedInMonth
    : 0;

  if (trackingConsistency >= 0.85) {
    score += 15;
    reasons.push('Strong daily tracking consistency improved your score.');
  } else if (trackingConsistency >= 0.6) {
    score += 8;
    reasons.push('Tracking habit is decent but can be stronger.');
  } else {
    score -= 8;
    reasons.push('Inconsistent logging lowered your tracking reliability score.');
  }

  if (analytics.unnecessarySpendShare > 45) {
    score -= 12;
    reasons.push('High discretionary spending is dragging score down.');
  } else if (analytics.unnecessarySpendShare > 35) {
    score -= 7;
    reasons.push('Moderate discretionary spend is impacting score.');
  }

  if (analytics.monthlyGrowth > 25) {
    score -= 8;
    reasons.push('Rapid month-over-month spend increase impacted score.');
  } else if (analytics.monthlyGrowth < 0) {
    score += 5;
    reasons.push('Lower spend vs last month improved score.');
  }

  const normalizedScore = Math.round(clamp(score, 0, 100));
  const label = normalizedScore >= 80
    ? 'Excellent'
    : normalizedScore >= 60
      ? 'Good'
      : 'Needs Improvement';

  const streaks = {
    trackingDays: calculateTrackingStreak(input),
    budgetControlWeeks: calculateBudgetControlStreak(analytics, input),
  };

  const achievements = buildAchievements(analytics, input, streaks);

  return {
    health: {
      score: normalizedScore,
      label,
      reasons: reasons.slice(0, 3),
    },
    streaks,
    achievements,
  };
}
