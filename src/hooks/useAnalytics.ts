import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ExpenseCategory, CATEGORY_CONFIG } from '@/types/expense';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subWeeks, format, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';

export type TimePeriod = 'week' | 'month' | 'year';

interface CategoryBreakdown {
  category: ExpenseCategory;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

interface TrendData {
  date: string;
  amount: number;
  label: string;
}

interface AnalyticsData {
  totalSpent: number;
  previousPeriodTotal: number;
  percentageChange: number;
  categoryBreakdown: CategoryBreakdown[];
  trendData: TrendData[];
  topCategories: CategoryBreakdown[];
  averagePerDay: number;
  transactionCount: number;
}

export function useAnalytics(period: TimePeriod = 'month') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics', period, user?.id],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user?.id) throw new Error('User not authenticated');

      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      let previousStartDate: Date;
      let previousEndDate: Date;

      switch (period) {
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          previousStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
          previousEndDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          previousStartDate = startOfMonth(subMonths(now, 1));
          previousEndDate = endOfMonth(subMonths(now, 1));
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
          previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          previousStartDate = startOfMonth(subMonths(now, 1));
          previousEndDate = endOfMonth(subMonths(now, 1));
      }

      // Fetch current period expenses
      const { data: currentExpenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('expense_date', format(startDate, 'yyyy-MM-dd'))
        .lte('expense_date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      // Fetch previous period expenses
      const { data: previousExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('expense_date', format(previousStartDate, 'yyyy-MM-dd'))
        .lte('expense_date', format(previousEndDate, 'yyyy-MM-dd'));

      // Calculate totals
      const totalSpent = currentExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const previousPeriodTotal = previousExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const percentageChange = previousPeriodTotal > 0 
        ? ((totalSpent - previousPeriodTotal) / previousPeriodTotal) * 100 
        : 0;

      // Calculate category breakdown
      const categoryTotals: Record<ExpenseCategory, number> = {
        food: 0, transport: 0, entertainment: 0, shopping: 0,
        bills: 0, health: 0, education: 0, travel: 0, other: 0,
      };

      currentExpenses?.forEach(expense => {
        categoryTotals[expense.category as ExpenseCategory] += Number(expense.amount);
      });

      const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryTotals)
        .filter(([_, amount]) => amount > 0)
        .map(([category, amount]) => ({
          category: category as ExpenseCategory,
          label: CATEGORY_CONFIG[category as ExpenseCategory].label,
          amount,
          percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
          color: CATEGORY_CONFIG[category as ExpenseCategory].color,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Calculate trend data
      let trendData: TrendData[] = [];

      if (period === 'week') {
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        trendData = days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTotal = currentExpenses
            ?.filter(e => e.expense_date === dayStr)
            .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
          return {
            date: dayStr,
            amount: dayTotal,
            label: format(day, 'EEE'),
          };
        });
      } else if (period === 'month') {
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        trendData = days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTotal = currentExpenses
            ?.filter(e => e.expense_date === dayStr)
            .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
          return {
            date: dayStr,
            amount: dayTotal,
            label: format(day, 'd'),
          };
        });
      } else if (period === 'year') {
        // Group by month for year view
        const months: Record<string, number> = {};
        for (let i = 0; i < 12; i++) {
          months[format(new Date(now.getFullYear(), i, 1), 'MMM')] = 0;
        }
        currentExpenses?.forEach(expense => {
          const monthLabel = format(new Date(expense.expense_date), 'MMM');
          months[monthLabel] = (months[monthLabel] || 0) + Number(expense.amount);
        });
        trendData = Object.entries(months).map(([label, amount]) => ({
          date: label,
          amount,
          label,
        }));
      }

      // Top 5 categories
      const topCategories = categoryBreakdown.slice(0, 5);

      // Calculate average per day
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const averagePerDay = totalSpent / daysDiff;

      return {
        totalSpent,
        previousPeriodTotal,
        percentageChange,
        categoryBreakdown,
        trendData,
        topCategories,
        averagePerDay,
        transactionCount: currentExpenses?.length || 0,
      };
    },
    enabled: !!user?.id,
  });
}
