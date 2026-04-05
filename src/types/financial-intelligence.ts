import type { Insight } from '@/types/insights';
import type { ExpenseCategory } from '@/types/expense';

export interface FinancialExpenseInput {
  amount: number;
  category: ExpenseCategory | string;
  merchant: string;
  date: string; // ISO string
  lat?: number;
  lng?: number;
}

export interface FinancialGoalsInput {
  targetAmount: number;
  currentSaved: number;
  deadline: string; // ISO date
}

export interface GroupBalancesInput {
  [userId: string]: number;
}

export interface LastMonthDataInput {
  total: number;
  categoryTotals: Record<string, number>;
}

export interface FinancialIntelligenceInput {
  expenses: FinancialExpenseInput[];
  budget: number;
  goals: FinancialGoalsInput;
  groupBalances: GroupBalancesInput;
  lastMonthData: LastMonthDataInput;
  now?: Date;
}

export interface SubscriptionDetection {
  merchant: string;
  amount: number;
  occurrences: number;
  averageIntervalDays: number;
  monthlyCostEstimate: number;
  lastChargedAt: string;
  nextExpectedAt: string;
  status: 'active' | 'possible-unused' | 'low-value' | 'low-value-possible-unused';
  reason: string;
}

export interface LocationClusterSpend {
  key: string;
  lat: number;
  lng: number;
  totalSpent: number;
  transactionCount: number;
}

export interface LocationSpendingAnalysis {
  topLocations: LocationClusterSpend[];
  clusters: LocationClusterSpend[];
  heatmap: Array<{ lat: number; lng: number; intensity: number; totalSpent: number }>;
}

export type TimeBlock = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeSpendingBucket {
  block: TimeBlock;
  totalSpent: number;
  transactionCount: number;
}

export interface TimeSpendingAnalysis {
  buckets: TimeSpendingBucket[];
  dominantPattern: TimeBlock;
}

export interface SimplifiedSettlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface GoalSavingAnalysis {
  remainingAmount: number;
  daysLeft: number;
  dailySavingRequired: number;
  progressPercent: number;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed' | 'expired';
  message: string;
}

export interface GamificationOutput {
  score: number;
  label: 'Excellent' | 'Good' | 'Needs Improvement';
  reasons: string[];
  streaks: {
    dailyLogging: number;
    budgetControlWeeks: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    progress: number;
  }>;
}

export interface FinancialIntelligenceOutput {
  insights: Insight[];
  subscriptions: SubscriptionDetection[];
  locations: LocationSpendingAnalysis;
  timeAnalysis: TimeSpendingAnalysis;
  settlements: SimplifiedSettlement[];
  goals: GoalSavingAnalysis;
  gamification: GamificationOutput;
}

export interface FinancialInsightHistoryItem {
  timestamp: number;
  type: Insight['type'];
  message: string;
  title: string;
}
