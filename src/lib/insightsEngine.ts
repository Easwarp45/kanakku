import type { Insight, InsightsAnalytics, InsightGenerationInput } from '@/types/insights';
import type { ExpenseCategory } from '@/types/expense';
import { parseISO, isWeekend, getDay, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Calculates analytics from expense data
 */
export function calculateAnalytics(input: InsightGenerationInput): InsightsAnalytics {
  const {
    currentExpenses,
    previousMonthTotal = 0,
    budget = 0,
    daysInMonth = 30,
  } = input;

  // Basic calculations
  const monthlyTotal = currentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const transactionCount = currentExpenses.length;
  const dailyAverage = transactionCount > 0 ? monthlyTotal / daysInMonth : 0;
  const predictedMonthlyTotal = dailyAverage * 30;

  // Category-wise breakdown
  const categoryTotals: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
  const transactionCounts: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
  let topCategory: ExpenseCategory | null = null;
  let topCategoryAmount = 0;

  currentExpenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    transactionCounts[exp.category] = (transactionCounts[exp.category] || 0) + 1;

    if (categoryTotals[exp.category] > topCategoryAmount) {
      topCategoryAmount = categoryTotals[exp.category];
      topCategory = exp.category;
    }
  });

  // Weekend vs weekday analysis
  let weekendSpending = 0;
  let weekendDays = 0;
  let weekdaySpending = 0;
  let weekdayDays = 0;

  currentExpenses.forEach(exp => {
    const date = parseISO(exp.date);
    if (isWeekend(date)) {
      weekendSpending += exp.amount;
      weekendDays++;
    } else {
      weekdaySpending += exp.amount;
      weekdayDays++;
    }
  });

  const weekendAvgPerDay = weekendDays > 0 ? weekendSpending / weekendDays : 0;
  const weekdayAvgPerDay = weekdayDays > 0 ? weekdaySpending / weekdayDays : 0;

  // Payment method analysis
  const paymentMethods: Record<string, number> = {};
  currentExpenses.forEach(exp => {
    paymentMethods[exp.paymentMethod] = (paymentMethods[exp.paymentMethod] || 0) + 1;
  });
  const mostFrequentPaymentMethod = Object.entries(paymentMethods).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] || 'upi';

  // Budget status
  const budgetPercentage = budget > 0 ? (monthlyTotal / budget) * 100 : 0;
  const isOverBudget = monthlyTotal > budget && budget > 0;
  const remaining = Math.max(0, budget - monthlyTotal);
  const overByAmount = Math.max(0, monthlyTotal - budget);

  // Growth calculation
  const monthlyGrowth = previousMonthTotal > 0
    ? ((monthlyTotal - previousMonthTotal) / previousMonthTotal) * 100
    : 0;

  return {
    monthlyTotal,
    dailyAverage,
    predictedMonthlyTotal,
    categoryTotals,
    weekendSpending,
    weekdaySpending,
    weekendAvgPerDay,
    weekdayAvgPerDay,
    topCategory,
    topCategoryAmount,
    transactionCounts,
    budgetStatus: {
      isOverBudget,
      percentage: budgetPercentage,
      remaining,
      overByAmount,
    },
    previousMonthTotal,
    monthlyGrowth,
    mostFrequentPaymentMethod,
  };
}

/**
 * Generates insights based on analytics
 */
export function generateInsights(
  analytics: InsightsAnalytics,
  input: InsightGenerationInput
): Insight[] {
  const insights: Insight[] = [];
  let id = 1;

  // Rule 1: Budget Overspend Warning
  if (analytics.budgetStatus.isOverBudget && input.budget && input.budget > 0) {
    insights.push({
      id: `insight-${id++}`,
      type: 'warning',
      priority: 'high',
      title: 'Budget Alert',
      message: `⚠️ You're spending ₹${analytics.budgetStatus.overByAmount.toLocaleString('en-IN')} over your ₹${input.budget?.toLocaleString('en-IN')} budget. Slow down! 🛑`,
      icon: '⚠️',
      actionable: true,
      data: {
        overspentAmount: analytics.budgetStatus.overByAmount,
        budget: input.budget,
      },
    });
  }

  // Rule 2: Budget Usage High (80%+)
  if (
    analytics.budgetStatus.percentage >= 80 &&
    analytics.budgetStatus.percentage < 100 &&
    input.budget &&
    input.budget > 0
  ) {
    insights.push({
      id: `insight-${id++}`,
      type: 'warning',
      priority: 'high',
      title: 'High Spending',
      message: `🔔 You've used ${Math.floor(analytics.budgetStatus.percentage)}% of your monthly budget. Budget wisely for the rest of the month!`,
      icon: '🔔',
      actionable: true,
      data: {
        percentageUsed: analytics.budgetStatus.percentage,
        remaining: analytics.budgetStatus.remaining,
      },
    });
  }

  // Rule 3: Category Spike Detection
  const categorySpikes = detectCategorySpikes(analytics, input);
  categorySpikes.forEach(spike => {
    insights.push({
      id: `insight-${id++}`,
      type: 'insight',
      priority: 'medium',
      title: 'Spending Spike',
      message: spike.message,
      icon: spike.icon,
      relatedCategory: spike.category,
      data: spike.data,
    });
  });

  // Rule 4: Top Category Insight
  if (analytics.topCategory) {
    const percentage = (analytics.topCategoryAmount / analytics.monthlyTotal) * 100;
    const categoryEmoji = getCategoryEmoji(analytics.topCategory);

    insights.push({
      id: `insight-${id++}`,
      type: 'insight',
      priority: 'medium',
      title: 'Top Spending Category',
      message: `${categoryEmoji} ${analytics.topCategory} is your biggest expense — ₹${analytics.topCategoryAmount.toLocaleString('en-IN')} (${percentage.toFixed(0)}% of spending)`,
      icon: categoryEmoji,
      relatedCategory: analytics.topCategory,
      data: {
        category: analytics.topCategory,
        amount: analytics.topCategoryAmount,
        percentage,
      },
    });
  }

  // Rule 5: Weekend vs Weekday Spending Pattern
  const weekendComparison = getWeekendInsight(analytics);
  if (weekendComparison) {
    insights.push({
      id: `insight-${id++}`,
      type: 'insight',
      priority: 'low',
      title: 'Spending Pattern',
      message: weekendComparison.message,
      icon: weekendComparison.icon,
      data: {
        weekendAvg: analytics.weekendAvgPerDay,
        weekdayAvg: analytics.weekdayAvgPerDay,
      },
    });
  }

  // Rule 6: Future Prediction
  if (analytics.transactionCounts['food'] && analytics.transactionCounts['food'] > 5) {
    const forecastMessage = getForecastInsight(analytics);
    insights.push({
      id: `insight-${id++}`,
      type: 'insight',
      priority: 'medium',
      title: 'Monthly Forecast',
      message: forecastMessage.message,
      icon: '📊',
      data: {
        predictedTotal: analytics.predictedMonthlyTotal,
        currentTotal: analytics.monthlyTotal,
      },
    });
  }

  // Rule 7: Frequent Spending Detection
  const frequentSpending = detectFrequentSpending(input.currentExpenses);
  if (frequentSpending) {
    insights.push({
      id: `insight-${id++}`,
      type: 'suggestion',
      priority: 'medium',
      title: 'Recurring Expense Detected',
      message: frequentSpending.message,
      icon: frequentSpending.icon,
      data: frequentSpending.data,
    });
  }

  // Rule 8: Positive Feedback
  const positiveInsight = getPositiveInsight(analytics);
  if (positiveInsight) {
    insights.push({
      id: `insight-${id++}`,
      type: 'positive',
      priority: 'low',
      title: positiveInsight.title,
      message: positiveInsight.message,
      icon: positiveInsight.icon,
    });
  }

  // Rule 9: Savings Opportunity
  const savingsSuggestion = getSavingsSuggestion(analytics, input);
  if (savingsSuggestion) {
    insights.push({
      id: `insight-${id++}`,
      type: 'suggestion',
      priority: 'medium',
      title: 'Savings Opportunity',
      message: savingsSuggestion.message,
      icon: savingsSuggestion.icon,
      relatedCategory: savingsSuggestion.category,
      data: savingsSuggestion.data,
    });
  }

  // Rule 10: Month-over-Month Growth
  if (analytics.previousMonthTotal > 0 && analytics.monthlyGrowth > 15) {
    insights.push({
      id: `insight-${id++}`,
      type: 'warning',
      priority: 'high',
      title: 'Spending Increase',
      message: `📈 Your spending increased by ${Math.floor(analytics.monthlyGrowth)}% compared to last month. That's ₹${(analytics.monthlyTotal - analytics.previousMonthTotal).toLocaleString('en-IN')} more!`,
      icon: '📈',
      data: {
        growth: analytics.monthlyGrowth,
        currentMonth: analytics.monthlyTotal,
        previousMonth: analytics.previousMonthTotal,
        difference: analytics.monthlyTotal - analytics.previousMonthTotal,
      },
    });
  }

  // Sort by priority
  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Helper: Detect category spending spikes
 */
function detectCategorySpikes(
  analytics: InsightsAnalytics,
  input: InsightGenerationInput
): Array<{ message: string; icon: string; category: ExpenseCategory; data: any }> {
  const spikes = [];

  // Check if category budgets are provided
  if (!input.categoryBudgets) return spikes;

  Object.entries(analytics.categoryTotals).forEach(([category, amount]) => {
    const categoryBudget = input.categoryBudgets?.[category as ExpenseCategory];
    if (!categoryBudget) return;

    const percentage = (amount / categoryBudget) * 100;

    if (percentage > 100) {
      // Over budget
      spikes.push({
        message: `🚨 Your ${category} spending exceeded the budget by ₹${(amount - categoryBudget).toLocaleString('en-IN')}`,
        icon: '🚨',
        category,
        data: {
          category,
          spent: amount,
          budget: categoryBudget,
          percentage,
        },
      });
    } else if (percentage > 80) {
      // Near budget limit
      spikes.push({
        message: `⚡ ${category.charAt(0).toUpperCase() + category.slice(1)} budget is ${Math.floor(percentage)}% used`,
        icon: '⚡',
        category,
        data: {
          category,
          spent: amount,
          budget: categoryBudget,
          percentage,
        },
      });
    }
  });

  return spikes;
}

/**
 * Helper: Weekend vs Weekday comparison
 */
function getWeekendInsight(analytics: InsightsAnalytics): {
  message: string;
  icon: string;
} | null {
  const ratio = analytics.weekendAvgPerDay / analytics.weekdayAvgPerDay;

  if (ratio > 1.5) {
    return {
      message: `🎉 You spend ${Math.floor(ratio)}x more on weekends. Maybe plan some budget-friendly activities?`,
      icon: '🎉',
    };
  } else if (ratio < 0.8) {
    return {
      message: `💰 Smart! You spend less on weekends. Keep it up!`,
      icon: '💰',
    };
  }

  return null;
}

/**
 * Helper: Forecast insight
 */
function getForecastInsight(analytics: InsightsAnalytics): {
  message: string;
} {
  const predicted = analytics.predictedMonthlyTotal;
  const daily = analytics.dailyAverage;

  if (predicted > 50000) {
    return {
      message: `📊 At your current pace, you'll spend ₹${predicted.toLocaleString('en-IN')} this month (₹${daily.toLocaleString('en-IN')}/day). That's quite a bit! 💸`,
    };
  } else if (predicted > 25000) {
    return {
      message: `📊 On track to spend ₹${predicted.toLocaleString('en-IN')} this month (₹${daily.toLocaleString('en-IN')}/day)`,
    };
  }

  return {
    message: `📊 Good pace! Projected monthly spending: ₹${predicted.toLocaleString('en-IN')}`,
  };
}

/**
 * Helper: Detect frequent/repetitive spending
 */
function detectFrequentSpending(expenses: Array<{ amount: number; category: string; date: string }>): {
  message: string;
  icon: string;
  data: any;
} | null {
  // Look for food/dining expenses (common recurring)
  const foodExpenses = expenses.filter(exp => exp.category === 'food');

  if (foodExpenses.length > 8) {
    const avgAmount = foodExpenses.reduce((sum, exp) => sum + exp.amount, 0) / foodExpenses.length;
    return {
      message: `🍔 You've spent on food ${foodExpenses.length} times this month (avg ₹${avgAmount.toLocaleString('en-IN')}). Consider meal planning to reduce this?`,
      icon: '🍔',
      data: {
        category: 'food',
        frequency: foodExpenses.length,
        average: avgAmount,
      },
    };
  }

  // Check for transport
  const transportExpenses = expenses.filter(exp => exp.category === 'transport');
  if (transportExpenses.length > 10) {
    const avgAmount = transportExpenses.reduce((sum, exp) => sum + exp.amount, 0) / transportExpenses.length;
    return {
      message: `🚗 You've taken ${transportExpenses.length} trips this month. Consider carpooling or public transport for savings?`,
      icon: '🚗',
      data: {
        category: 'transport',
        frequency: transportExpenses.length,
        average: avgAmount,
      },
    };
  }

  return null;
}

/**
 * Helper: Positive reinforcement
 */
function getPositiveInsight(analytics: InsightsAnalytics): {
  title: string;
  message: string;
  icon: string;
} | null {
  if (!analytics.budgetStatus.isOverBudget && analytics.budgetStatus.percentage <= 60) {
    return {
      title: 'Great Job!',
      message: `✨ You're spending responsibly! Only ${Math.floor(analytics.budgetStatus.percentage)}% of your budget used.`,
      icon: '✨',
    };
  }

  if (analytics.monthlyGrowth < 0) {
    return {
      title: 'Improvement!',
      message: `📉 Excellent! You've reduced spending by ${Math.floor(Math.abs(analytics.monthlyGrowth))}% compared to last month.`,
      icon: '📉',
    };
  }

  return null;
}

/**
 * Helper: Savings suggestions
 */
function getSavingsSuggestion(
  analytics: InsightsAnalytics,
  input: InsightGenerationInput
): {
  message: string;
  icon: string;
  category: ExpenseCategory;
  data: any;
} | null {
  // Find the top 2 spending categories
  const sortedCategories = Object.entries(analytics.categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  if (sortedCategories.length === 0) return null;

  const [topCategory, topAmount] = sortedCategories[0];
  const category = topCategory as ExpenseCategory;
  const savePercentage = Math.floor((topAmount * 0.15) / topAmount) * 100; // 15% reduction suggestion

  const suggestions: Record<string, { message: string; icon: string }> = {
    food: {
      message: `🍱 Cut food spending by 15% (save ~₹${(topAmount * 0.15).toLocaleString('en-IN')}) — Order less, cook more!`,
      icon: '🍱',
    },
    transport: {
      message: `🚌 Switch to public transport or carpool — Could save ~₹${(topAmount * 0.15).toLocaleString('en-IN')}/month`,
      icon: '🚌',
    },
    entertainment: {
      message: `🎬 Plan free activities with friends. Could save ~₹${(topAmount * 0.15).toLocaleString('en-IN')}/month`,
      icon: '🎬',
    },
    shopping: {
      message: `🛍️ Make a shopping list & stick to essentials — Potential savings: ~₹${(topAmount * 0.15).toLocaleString('en-IN')}`,
      icon: '🛍️',
    },
    bills: {
      message: `📱 Review subscriptions & plans. Could save ~₹${(topAmount * 0.15).toLocaleString('en-IN')}/month`,
      icon: '📱',
    },
  };

  const suggestion = suggestions[category] || {
    message: `💡 Reduce ${category} spending by 15% to save ~₹${(topAmount * 0.15).toLocaleString('en-IN')}/month`,
    icon: '💡',
  };

  return {
    message: suggestion.message,
    icon: suggestion.icon,
    category,
    data: {
      category,
      potential_savings: topAmount * 0.15,
      current_spending: topAmount,
    },
  };
}

/**
 * Helper: Get emoji for category
 */
function getCategoryEmoji(category: ExpenseCategory): string {
  const emojis: Record<ExpenseCategory, string> = {
    food: '🍔',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    bills: '📱',
    health: '🏥',
    education: '📚',
    travel: '✈️',
    other: '📌',
  };
  return emojis[category] || '📌';
}
