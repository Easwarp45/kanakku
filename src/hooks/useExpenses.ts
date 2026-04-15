import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Expense, CreateExpenseInput, UpdateExpenseInput, ExpenseCategory, PaymentMethod } from '@/types/expense';
import { toast } from 'sonner';

export function useExpenses(filters?: { startDate?: string; endDate?: string; category?: ExpenseCategory }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expenses', user?.id, filters],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('expenses')
        .select('id,amount,category,description,payment_method,expense_date,updated_at')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('expense_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('expense_date', filters.endDate);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(expense => ({
        ...expense,
        amount: Number(expense.amount),
        category: expense.category as ExpenseCategory,
        payment_method: expense.payment_method as PaymentMethod,
      })) as Expense[];
    },
    enabled: !!user,
  });
}

export function useExpense(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      if (!id || !user) return null;

      const { data, error } = await supabase
        .from('expenses')
        .select('id,user_id,amount,category,description,payment_method,expense_date,receipt_url,created_at,updated_at')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        amount: Number(data.amount),
        category: data.category as ExpenseCategory,
        payment_method: data.payment_method as PaymentMethod,
      } as Expense;
    },
    enabled: !!id && !!user,
    staleTime: 1000 * 60 * 15, // 15 minutes – single item changes less frequently
  });
}

export function useRecentExpenses(limit: number = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expenses', 'recent', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select('id,amount,category,description,payment_method,expense_date')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(expense => ({
        ...expense,
        amount: Number(expense.amount),
        category: expense.category as ExpenseCategory,
        payment_method: expense.payment_method as PaymentMethod,
      })) as Expense[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      if (!user) throw new Error('Not authenticated');

      // Check if offline
      if (!navigator.onLine) {
        // Import dynamically to avoid circular dependencies
        const { saveOfflineExpense } = await import('@/lib/offlineStorage');
        const offlineExpense = await saveOfflineExpense(input);
        return { ...offlineExpense, offline: true };
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          amount: input.amount,
          category: input.category,
          description: input.description || null,
          payment_method: input.payment_method,
          expense_date: input.expense_date,
          receipt_url: input.receipt_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      if ((data as any).offline) {
        toast.info('Expense saved offline. Will sync when online.');
      } else {
        toast.success('Expense added successfully');
      }
    },
    onError: (error) => {
      toast.error('Failed to add expense: ' + error.message);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateExpenseInput) => {
      if (!user) throw new Error('Not authenticated');

      const updates: Record<string, unknown> = {};

      if (input.amount !== undefined) updates.amount = input.amount;
      if (input.category !== undefined) updates.category = input.category;
      if (input.description !== undefined) updates.description = input.description;
      if (input.payment_method !== undefined) updates.payment_method = input.payment_method;
      if (input.expense_date !== undefined) updates.expense_date = input.expense_date;
      if (input.receipt_url !== undefined) updates.receipt_url = input.receipt_url;

      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', data.id] });
      toast.success('Expense updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update expense: ' + error.message);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // ← ownership guard

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete expense: ' + error.message);
    },
  });
}

export function useTodayTotal() {
  const { user } = useAuth();
  // Use local date to avoid UTC offset issues (e.g. IST users seeing yesterday's date)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return useQuery({
    queryKey: ['expenses', 'today-total', user?.id, today],
    queryFn: async () => {
      if (!user) return 0;

      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .eq('expense_date', today);

      if (error) throw error;

      return (data || []).reduce((sum, exp) => sum + Number(exp.amount), 0);
    },
    enabled: !!user,
  });
}

export function useMonthlyTotal() {
  const { user } = useAuth();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  return useQuery({
    queryKey: ['expenses', 'monthly-total', user?.id, startOfMonth],
    queryFn: async () => {
      if (!user) return 0;

      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('expense_date', startOfMonth)
        .lte('expense_date', endOfMonth);

      if (error) throw error;

      return (data || []).reduce((sum, exp) => sum + Number(exp.amount), 0);
    },
    enabled: !!user,
  });
}

export function useRecentUPIExpenses(limit: number = 8) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expenses', 'recent-upi', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select('id,amount,category,description,payment_method,expense_date,created_at')
        .eq('user_id', user.id)
        .eq('payment_method', 'upi')
        .order('expense_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((expense) => ({
        ...expense,
        amount: Number(expense.amount),
        category: expense.category as ExpenseCategory,
        payment_method: expense.payment_method as PaymentMethod,
      })) as Expense[];
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  });
}
