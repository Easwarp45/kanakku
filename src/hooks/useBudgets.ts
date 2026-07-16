import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ExpenseCategory, CATEGORY_CONFIG } from '@/types/expense';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithSpent extends Budget {
  spent: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

export function useBudgets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('category');

      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user?.id,
  });
}

export function useBudgetsWithSpent() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budgets-with-spent', user?.id],
    queryFn: async (): Promise<BudgetWithSpent[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get budgets
      const { data: budgets, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (budgetError) throw budgetError;

      // Get current month expenses
      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('user_id', user.id)
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd);

      if (expenseError) throw expenseError;

      // Calculate spent per category
      const spentByCategory: Record<string, number> = {};
      expenses?.forEach(expense => {
        spentByCategory[expense.category] = (spentByCategory[expense.category] || 0) + Number(expense.amount);
      });

      // Combine budgets with spent data
      return (budgets || []).map(budget => {
        const spent = spentByCategory[budget.category] || 0;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const remaining = budget.amount - spent;
        
        return {
          ...budget,
          spent,
          percentage,
          remaining,
          isOverBudget: spent > budget.amount,
          isNearLimit: percentage >= 80 && percentage < 100,
        };
      });
    },
    enabled: !!user?.id,
  });
}

export function useCreateBudget() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { category: string; amount: number }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          category: data.category,
          amount: data.amount,
          period: 'monthly',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-with-spent'] });
      toast({
        title: 'Budget created',
        description: 'Your budget has been set successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create budget',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { id: string; amount: number }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('budgets')
        .update({ amount: data.amount })
        .eq('id', data.id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-with-spent'] });
      toast({
        title: 'Budget updated',
        description: 'Your budget has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update budget',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-with-spent'] });
      toast({
        title: 'Budget deleted',
        description: 'Your budget has been removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete budget',
        variant: 'destructive',
      });
    },
  });
}
