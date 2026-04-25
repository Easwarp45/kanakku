import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isWeekend,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import type { Insight } from '@/types/insights';
import type { ExpenseCategory } from '@/types/expense';
import type {
  FinancialExpenseInput,
  FinancialGoalsInput,
  FinancialIntelligenceInput,
  FinancialIntelligenceOutput,
  GamificationOutput,
  GroupBalancesInput,
  LastMonthDataInput,
  LocationClusterSpend,
  LocationSpendingAnalysis,
  SubscriptionDetection,
  TimeBlock,
  TimeSpendingAnalysis,
} from '@/types/financial-intelligence';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeMerchant(value: string): string {
  const cleaned = value.trim().replace(/\s+/g, ' ');
  return cleaned.length > 0 ? cleaned : 'Unknown Merchant';
}

function pctChange(previous: number, current: number): string {
  if (previous <= 0) {
    return current > 0 ? '+100%' : '0%';
  }

  const value = ((current - previous) / previous) * 100;
  const rounded = Math.round(value);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

function buildWhy(previous: number, current: number, reason: string, valueKind: 'currency' | 'count' | 'ratio' = 'currency') {
  return {
    previous: roundCurrency(previous),
    current: roundCurrency(current),
    change: pctChange(previous, current),
    reason,
    valueKind,
  } as const;
}

interface FinancialFacts {
  now: Date;
  monthStartKey: string;
  monthEndKey: string;
  currentMonthExpenses: FinancialExpenseInput[];
  totalSpent: number;
  daysElapsed: number;
  daysInMonth: number;
  dailyAverage: number;
  projectedMonthSpend: number;
  categoryTotals: Record<string, number>;
  weekendSpent: number;
  weekdaySpent: number;
  transactionCount: number;
  activeLoggingDays: number;
  frequentSpending: boolean;
}

export function buildFinancialFacts(input: FinancialIntelligenceInput): FinancialFacts {
  const now = input.now || new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthStartKey = format(monthStart, 'yyyy-MM-dd');
  const monthEndKey = format(monthEnd, 'yyyy-MM-dd');

  const currentMonthExpenses = input.expenses.filter((expense) => {
    const dayKey = format(parseISO(expense.date), 'yyyy-MM-dd');
    return dayKey >= monthStartKey && dayKey <= monthEndKey;
  });

  const totalSpent = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const daysElapsed = Math.max(1, now.getDate());
  const daysInMonth = monthEnd.getDate();
  const dailyAverage = totalSpent / daysElapsed;
  const projectedMonthSpend = dailyAverage * daysInMonth;

  const categoryTotals = currentMonthExpenses.reduce((acc, expense) => {
    const category = expense.category;
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  let weekendSpent = 0;
  let weekdaySpent = 0;

  for (const expense of currentMonthExpenses) {
    const date = parseISO(expense.date);
    if (isWeekend(date)) {
      weekendSpent += expense.amount;
    } else {
      weekdaySpent += expense.amount;
    }
  }

  const activeLoggingDays = new Set(
    currentMonthExpenses.map((expense) => format(parseISO(expense.date), 'yyyy-MM-dd'))
  ).size;

  const transactionCount = currentMonthExpenses.length;
  const frequentSpending = transactionCount >= 35;

  return {
    now,
    monthStartKey,
    monthEndKey,
    currentMonthExpenses,
    totalSpent,
    daysElapsed,
    daysInMonth,
    dailyAverage,
    projectedMonthSpend,
    categoryTotals,
    weekendSpent,
    weekdaySpent,
    transactionCount,
    activeLoggingDays,
    frequentSpending,
  };
}

export function detectSubscriptions(
  expenses: FinancialExpenseInput[],
  budget: number,
  monthlySpend: number,
  now: Date
): SubscriptionDetection[] {
  const grouped = new Map<string, FinancialExpenseInput[]>();

  for (const expense of expenses) {
    const normalizedMerchant = normalizeMerchant(expense.merchant);
    const amountKey = expense.amount.toFixed(2);
    const key = `${normalizedMerchant.toLowerCase()}|${amountKey}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push({ ...expense, merchant: normalizedMerchant });
  }

  const subscriptions: SubscriptionDetection[] = [];

  grouped.forEach((entries) => {
    const sorted = [...entries].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    if (sorted.length < 3) {
      return;
    }

    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      const gap = Math.abs(parseISO(sorted[i].date).getTime() - parseISO(sorted[i - 1].date).getTime()) / ONE_DAY_MS;
      intervals.push(gap);
    }

    const avgInterval = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    if (Math.abs(avgInterval - 30) > 7) {
      return;
    }

    const amount = sorted[0].amount;
    const monthlyCostEstimate = amount * (30 / avgInterval);
    const lastChargedAt = sorted[sorted.length - 1].date;
    const nextExpectedAt = addDays(parseISO(lastChargedAt), Math.round(avgInterval));

    const daysSinceLast = Math.max(0, differenceInCalendarDays(now, parseISO(lastChargedAt)));
    const possibleUnused = daysSinceLast > avgInterval + 10;

    const lowValueThreshold = Math.max(budget * 0.05, monthlySpend * 0.03, 300);
    const lowValue = monthlyCostEstimate >= lowValueThreshold;

    let status: SubscriptionDetection['status'] = 'active';
    if (lowValue && possibleUnused) {
      status = 'low-value-possible-unused';
    } else if (lowValue) {
      status = 'low-value';
    } else if (possibleUnused) {
      status = 'possible-unused';
    }

    let reason = 'Recurring pattern detected around monthly interval.';
    if (status === 'possible-unused') {
      reason = 'Charge pattern looks recurring, but no recent occurrence was found.';
    } else if (status === 'low-value') {
      reason = 'Subscription cost is relatively high compared to current budget/spend.';
    } else if (status === 'low-value-possible-unused') {
      reason = 'High recurring cost with potential inactivity; review this subscription.';
    }

    subscriptions.push({
      merchant: sorted[0].merchant,
      amount: roundCurrency(amount),
      occurrences: sorted.length,
      averageIntervalDays: roundCurrency(avgInterval),
      monthlyCostEstimate: roundCurrency(monthlyCostEstimate),
      lastChargedAt,
      nextExpectedAt: nextExpectedAt.toISOString(),
      status,
      reason,
    });
  });

  return subscriptions.sort((a, b) => b.monthlyCostEstimate - a.monthlyCostEstimate);
}

export function analyzeLocationSpending(expenses: FinancialExpenseInput[]): LocationSpendingAnalysis {
  const clusters = new Map<string, LocationClusterSpend>();

  for (const expense of expenses) {
    if (typeof expense.lat !== 'number' || typeof expense.lng !== 'number') {
      continue;
    }

    const roundedLat = Number(expense.lat.toFixed(2));
    const roundedLng = Number(expense.lng.toFixed(2));
    const key = `${roundedLat},${roundedLng}`;

    const existing = clusters.get(key);
    if (!existing) {
      clusters.set(key, {
        key,
        lat: roundedLat,
        lng: roundedLng,
        totalSpent: expense.amount,
        transactionCount: 1,
      });
      continue;
    }

    existing.totalSpent += expense.amount;
    existing.transactionCount += 1;
  }

  const list = [...clusters.values()]
    .map((cluster) => ({
      ...cluster,
      totalSpent: roundCurrency(cluster.totalSpent),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);

  const peak = list[0]?.totalSpent || 1;
  const heatmap = list.map((item) => ({
    lat: item.lat,
    lng: item.lng,
    intensity: roundCurrency(item.totalSpent / peak),
    totalSpent: item.totalSpent,
  }));

  return {
    topLocations: list.slice(0, 5),
    clusters: list,
    heatmap,
  };
}

function getTimeBlock(isoDate: string): TimeBlock {
  const hour = parseISO(isoDate).getHours();

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function analyzeTimeSpending(expenses: FinancialExpenseInput[]): TimeSpendingAnalysis {
  const buckets: Record<TimeBlock, { totalSpent: number; transactionCount: number }> = {
    morning: { totalSpent: 0, transactionCount: 0 },
    afternoon: { totalSpent: 0, transactionCount: 0 },
    evening: { totalSpent: 0, transactionCount: 0 },
    night: { totalSpent: 0, transactionCount: 0 },
  };

  for (const expense of expenses) {
    const block = getTimeBlock(expense.date);
    buckets[block].totalSpent += expense.amount;
    buckets[block].transactionCount += 1;
  }

  const ordered = (Object.keys(buckets) as TimeBlock[]).map((block) => ({
    block,
    totalSpent: roundCurrency(buckets[block].totalSpent),
    transactionCount: buckets[block].transactionCount,
  }));

  const dominant = ordered.reduce((best, current) => {
    if (!best || current.totalSpent > best.totalSpent) {
      return current;
    }
    return best;
  }, null as (typeof ordered)[number] | null);

  return {
    buckets: ordered,
    dominantPattern: dominant?.block || 'morning',
  };
}

export function simplifyGroupDebts(groupBalances: GroupBalancesInput) {
  const debtors = Object.entries(groupBalances)
    .filter(([, balance]) => balance < 0)
    .map(([userId, balance]) => ({ userId, amount: Math.abs(balance) }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = Object.entries(groupBalances)
    .filter(([, balance]) => balance > 0)
    .map(([userId, balance]) => ({ userId, amount: balance }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Array<{ fromUserId: string; toUserId: string; amount: number }> = [];

  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const transfer = Math.min(debtor.amount, creditor.amount);

    if (transfer > 0.01) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: roundCurrency(transfer),
      });
    }

    debtor.amount -= transfer;
    creditor.amount -= transfer;

    if (debtor.amount <= 0.01) d += 1;
    if (creditor.amount <= 0.01) c += 1;
  }

  return settlements;
}

export function analyzeGoalSavings(goals: FinancialGoalsInput, now: Date) {
  const targetAmount    = Math.max(1, goals.targetAmount);
  const currentSaved    = Math.max(0, goals.currentSaved);
  const remainingAmount = Math.max(0, targetAmount - currentSaved);
  const deadline        = parseISO(goals.deadline);
  const daysLeft        = differenceInCalendarDays(deadline, now);

  const progressPercent = clamp((currentSaved / targetAmount) * 100, 0, 100);

  /* ── Completed ── */
  if (remainingAmount <= 0) {
    return {
      remainingAmount: 0,
      daysLeft: Math.max(daysLeft, 0),
      dailySavingRequired: 0,
      progressPercent: roundCurrency(progressPercent),
      expectedProgressPercent: 100,
      status: 'completed' as const,
      message: 'Goal completed! Great work staying consistent. 🎉',
    };
  }

  /* ── Expired (past deadline) ── */
  if (daysLeft <= 0) {
    return {
      remainingAmount: roundCurrency(remainingAmount),
      daysLeft: 0,
      dailySavingRequired: roundCurrency(remainingAmount),
      progressPercent: roundCurrency(progressPercent),
      expectedProgressPercent: 100,
      status: 'expired' as const,
      message: 'Goal deadline has passed. Extend the timeline or increase your savings pace.',
    };
  }

  const dailySavingRequired = remainingAmount / daysLeft;

  /* ── Expected progress (% of goal you should have saved by today) ──
     We infer total goal duration from created_at/deadline. If we can't know
     the start date, we derive it: total_days = daysLeft + daysElapsed.
     We approximate daysElapsed as the days since deadline - 90 (a default 90d goal),
     but we can't know the real start from this function, so we use the fraction
     (remainingAmount / targetAmount) * 100 as the "still needed" proxy.
     
     A simpler, accurate approach: compare dailySavingRequired as a % of target.
     - If you need > 1.5% of target PER DAY → behind (at that rate, goal takes < 67 days)
     - If you need 0.5%–1.5% of target per day → at-risk
     - < 0.5% per day → on-track
  ── */
  const dailyPctOfTarget = (dailySavingRequired / targetAmount) * 100;

  let status: 'on-track' | 'at-risk' | 'behind' = 'on-track';
  if (dailyPctOfTarget > 1.5) {
    status = 'behind';
  } else if (dailyPctOfTarget > 0.5) {
    status = 'at-risk';
  }

  /* Expected progress: if goal ran for N total days, how far should we be today?
     We can't know the true start date here, but we can use the ratio:
       expected% = (1 - daysLeft / totalDays) * 100
     We estimate totalDays as the original deadline span. Since we only have
     daysLeft and currentSaved, we compute totalDays = daysLeft + daysAlreadySaved,
     where daysAlreadySaved ≈ currentSaved / (targetAmount / totalDays).
     Simpler: use the linear expectation based on saved progress.
  */
  // Use: if you saved `currentSaved` and have `daysLeft` left at `dailySavingRequired`,
  // then original duration = currentSaved/dailySavingRequired + daysLeft
  const daysAlreadyElapsed = dailySavingRequired > 0
    ? Math.round(currentSaved / dailySavingRequired)
    : 0;
  const totalDays = daysAlreadyElapsed + daysLeft;
  const expectedProgressPercent = totalDays > 0
    ? clamp((daysAlreadyElapsed / totalDays) * 100, 0, 100)
    : 0;

  const message = status === 'on-track'
    ? 'You are on track. Keep this pace to hit your goal. 🚀'
    : status === 'at-risk'
      ? 'Slightly behind schedule. Consider cutting discretionary spend this week.'
      : 'You need to significantly increase your savings pace to meet this deadline.';

  return {
    remainingAmount: roundCurrency(remainingAmount),
    daysLeft,
    dailySavingRequired: roundCurrency(dailySavingRequired),
    progressPercent: roundCurrency(progressPercent),
    expectedProgressPercent: roundCurrency(expectedProgressPercent),
    status,
    message,
  };
}


function runInsightRules(
  facts: FinancialFacts,
  input: FinancialIntelligenceInput,
  goalAnalysis: ReturnType<typeof analyzeGoalSavings>
): Insight[] {
  const insights: Insight[] = [];
  const nowTs = facts.now.getTime();
  const budget = input.budget;

  if (budget > 0 && facts.totalSpent > budget) {
    insights.push({
      id: `${facts.monthStartKey}-budget-exceeded`,
      type: 'warning',
      priority: 1,
      title: 'Budget exceeded',
      message: 'You have crossed your monthly budget. Time to trim non-essential spend.',
      icon: '!',
      actionRoute: '/budget',
      actionLabel: 'Review Budget',
      why: buildWhy(budget, facts.totalSpent, 'Current month spend is above your configured budget.'),
      createdAt: nowTs,
    });
  }

  let topSpikeCategory = '';
  let topSpikeGrowth = 0;
  let topSpikeCurrent = 0;
  let topSpikePrevious = 0;

  Object.entries(facts.categoryTotals).forEach(([category, current]) => {
    const previous = input.lastMonthData.categoryTotals[category] || 0;
    if (previous <= 0) {
      return;
    }

    const growth = ((current - previous) / previous) * 100;
    if (growth > 30 && growth > topSpikeGrowth) {
      topSpikeGrowth = growth;
      topSpikeCategory = category;
      topSpikeCurrent = current;
      topSpikePrevious = previous;
    }
  });

  if (topSpikeCategory) {
    insights.push({
      id: `${facts.monthStartKey}-category-spike`,
      type: 'warning',
      priority: 1,
      title: `${topSpikeCategory} spending spike`,
      message: `${topSpikeCategory} spending is up ${Math.round(topSpikeGrowth)}% vs last month.`,
      icon: '^',
      actionRoute: '/expenses',
      actionLabel: 'Inspect Category',
      relatedCategory: topSpikeCategory as ExpenseCategory,
      why: buildWhy(topSpikePrevious, topSpikeCurrent, 'Category growth crossed the 30% threshold.'),
      createdAt: nowTs,
    });
  }

  insights.push({
    id: `${facts.monthStartKey}-projection`,
    type: budget > 0 && facts.projectedMonthSpend > budget ? 'warning' : 'info',
    priority: budget > 0 && facts.projectedMonthSpend > budget ? 1 : 2,
    title: 'Month-end projection',
    message: `At this pace, projected monthly spend is ${Math.round(facts.projectedMonthSpend)}.`,
    icon: 'P',
    actionRoute: '/analytics',
    actionLabel: 'View Trend',
    why: buildWhy(facts.totalSpent, facts.projectedMonthSpend, 'Projection uses daily average multiplied by days in month.'),
    createdAt: nowTs,
  });

  insights.push({
    id: `${facts.monthStartKey}-weekend-vs-weekday`,
    type: facts.weekendSpent > facts.weekdaySpent ? 'suggestion' : 'info',
    priority: 2,
    title: 'Weekend vs weekday spending',
    message: facts.weekendSpent > facts.weekdaySpent
      ? 'Weekend spending dominates. Consider a weekend cap to reduce drift.'
      : 'Weekday spending is currently higher than weekends.',
    icon: 'W',
    actionRoute: '/expenses',
    actionLabel: 'Analyze Days',
    why: buildWhy(facts.weekdaySpent, facts.weekendSpent, 'Comparison is based on current month weekday and weekend totals.'),
    createdAt: nowTs,
  });

  if (facts.frequentSpending) {
    insights.push({
      id: `${facts.monthStartKey}-frequent-transactions`,
      type: 'suggestion',
      priority: 2,
      title: 'Frequent transactions detected',
      message: `You logged ${facts.transactionCount} transactions this month. Bundle small purchases where possible.`,
      icon: 'F',
      actionRoute: '/expenses',
      actionLabel: 'Review Transactions',
      why: buildWhy(30, facts.transactionCount, 'Transaction count is above high-frequency threshold.', 'count'),
      createdAt: nowTs,
    });
  }

  const topCategory = Object.entries(facts.categoryTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    const [category, amount] = topCategory;
    insights.push({
      id: `${facts.monthStartKey}-top-category`,
      type: 'info',
      priority: 3,
      title: `Top category: ${category}`,
      message: `${category} is your highest spend category this month.`,
      icon: 'T',
      actionRoute: '/expenses',
      actionLabel: 'See Category',
      relatedCategory: category as ExpenseCategory,
      why: buildWhy(input.lastMonthData.categoryTotals[category] || 0, amount, 'Top category is selected by highest spend amount.'),
      createdAt: nowTs,
    });
  }

  if (goalAnalysis.status === 'behind' || goalAnalysis.status === 'at-risk') {
    insights.push({
      id: `${facts.monthStartKey}-goal-risk`,
      type: 'suggestion',
      priority: 2,
      title: 'Savings goal needs attention',
      message: `Save ${Math.round(goalAnalysis.dailySavingRequired)} per day to stay on track for your goal.`,
      icon: 'G',
      actionRoute: '/budget',
      actionLabel: 'Optimize Spending',
      why: buildWhy(goalAnalysis.remainingAmount, goalAnalysis.dailySavingRequired, 'Daily requirement is computed from remaining amount and days left.'),
      createdAt: nowTs,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

function calculateDailyLoggingStreak(expenses: FinancialExpenseInput[], now: Date): number {
  const keys = new Set(expenses.map((expense) => format(parseISO(expense.date), 'yyyy-MM-dd')));

  let cursor = now;
  const todayKey = format(cursor, 'yyyy-MM-dd');
  if (!keys.has(todayKey) && cursor.getHours() < 20) {
    cursor = subDays(cursor, 1);
  }

  let streak = 0;
  while (keys.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return streak;
}

function calculateBudgetControlStreak(expenses: FinancialExpenseInput[], now: Date, budget: number): number {
  if (budget <= 0) {
    return 0;
  }

  const weeklyBudget = (budget * 12) / 52;
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  let streak = 0;

  for (let i = 1; i <= 12; i += 1) {
    const weekStart = subWeeks(currentWeekStart, i);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    const weekStartKey = format(weekStart, 'yyyy-MM-dd');
    const weekEndKey = format(weekEnd, 'yyyy-MM-dd');

    const weekSpend = expenses
      .filter((expense) => {
        const key = format(parseISO(expense.date), 'yyyy-MM-dd');
        return key >= weekStartKey && key <= weekEndKey;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    if (weekSpend <= weeklyBudget * 1.02) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function buildGamification(
  facts: FinancialFacts,
  input: FinancialIntelligenceInput,
  dailyLoggingStreak: number,
  budgetControlStreak: number
): GamificationOutput {
  let score = 50;
  const reasons: string[] = [];

  if (input.budget > 0 && facts.totalSpent > input.budget) {
    score -= 20;
    reasons.push('Overspending reduced score by 20.');
  } else if (input.budget > 0) {
    score += 15;
    reasons.push('Staying under budget added 15 points.');
  }

  if (facts.frequentSpending) {
    score -= 10;
    reasons.push('Frequent spending reduced score by 10.');
  }

  const consistencyRatio = facts.daysElapsed > 0 ? facts.activeLoggingDays / facts.daysElapsed : 0;
  if (consistencyRatio >= 0.7) {
    score += 10;
    reasons.push('Consistent tracking added 10 points.');
  }

  score = clamp(score, 0, 100);

  const label: GamificationOutput['label'] =
    score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement';

  const weeklyBudget = input.budget > 0 ? (input.budget * 7) / facts.daysInMonth : 0;
  const nowKey = format(facts.now, 'yyyy-MM-dd');
  const last7Start = format(subDays(facts.now, 6), 'yyyy-MM-dd');
  const last7Spent = input.expenses
    .filter((expense) => {
      const key = format(parseISO(expense.date), 'yyyy-MM-dd');
      return key >= last7Start && key <= nowKey;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const noOverspendingWeek = weeklyBudget > 0 ? last7Spent <= weeklyBudget : false;

  const achievements: GamificationOutput['achievements'] = [
    {
      id: 'no-overspending-week',
      title: 'No Overspending Week',
      description: 'Keep weekly spend within your weekly budget guidance.',
      unlocked: noOverspendingWeek,
      progress: weeklyBudget > 0 ? clamp((1 - Math.max(0, last7Spent - weeklyBudget) / weeklyBudget) * 100, 0, 100) : 0,
    },
    {
      id: 'consistent-tracker',
      title: 'Consistent Tracker',
      description: 'Log expenses for 7 days in a row.',
      unlocked: dailyLoggingStreak >= 7,
      progress: clamp((dailyLoggingStreak / 7) * 100, 0, 100),
    },
  ];

  return {
    score,
    label,
    reasons,
    streaks: {
      dailyLogging: dailyLoggingStreak,
      budgetControlWeeks: budgetControlStreak,
    },
    achievements,
  };
}

export function runFinancialIntelligenceEngine(input: FinancialIntelligenceInput): FinancialIntelligenceOutput {
  const now = input.now || new Date();
  const facts = buildFinancialFacts({ ...input, now });

  const goalAnalysis = analyzeGoalSavings(input.goals, now);
  const insights = runInsightRules(facts, { ...input, now }, goalAnalysis);

  const subscriptions = detectSubscriptions(input.expenses, input.budget, facts.totalSpent, now);
  const locations = analyzeLocationSpending(input.expenses);
  const timeAnalysis = analyzeTimeSpending(input.expenses);
  const settlements = simplifyGroupDebts(input.groupBalances);

  const dailyLoggingStreak = calculateDailyLoggingStreak(input.expenses, now);
  const budgetControlStreak = calculateBudgetControlStreak(input.expenses, now, input.budget);
  const gamification = buildGamification(facts, input, dailyLoggingStreak, budgetControlStreak);

  return {
    insights,
    subscriptions,
    locations,
    timeAnalysis,
    settlements,
    goals: goalAnalysis,
    gamification,
  };
}

export function buildLastMonthSnapshot(expenses: FinancialExpenseInput[], now: Date = new Date()): LastMonthDataInput {
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const startKey = format(lastMonthStart, 'yyyy-MM-dd');
  const endKey = format(lastMonthEnd, 'yyyy-MM-dd');

  const monthExpenses = expenses.filter((expense) => {
    const key = format(parseISO(expense.date), 'yyyy-MM-dd');
    return key >= startKey && key <= endKey;
  });

  const categoryTotals = monthExpenses.reduce((acc, expense) => {
    const category = expense.category;
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: roundCurrency(monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)),
    categoryTotals,
  };
}

export function defaultGoalInput(budget: number, now: Date = new Date()): FinancialGoalsInput {
  const targetAmount = Math.max(30000, budget * 3);
  const currentSaved = Math.max(0, budget * 0.2);
  const deadline = addDays(now, 90);

  return {
    targetAmount: roundCurrency(targetAmount),
    currentSaved: roundCurrency(currentSaved),
    deadline: deadline.toISOString(),
  };
}

export function formatFinancialIntelligenceOutput(output: FinancialIntelligenceOutput) {
  return {
    insights: output.insights.map((insight) => ({
      type: insight.type,
      title: insight.title,
      message: insight.message,
      why: insight.why,
      priority: insight.priority,
    })),
    subscriptions: output.subscriptions,
    locations: output.locations,
    timeAnalysis: output.timeAnalysis,
    settlements: output.settlements,
    goals: output.goals,
    gamification: {
      score: output.gamification.score,
      streaks: [
        { key: 'dailyLogging', value: output.gamification.streaks.dailyLogging },
        { key: 'budgetControlWeeks', value: output.gamification.streaks.budgetControlWeeks },
      ],
      achievements: output.gamification.achievements,
    },
  };
}
