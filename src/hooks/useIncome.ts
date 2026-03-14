import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Income, CreateIncomeInput, IncomeSource } from '@/types/income';
import { toast } from 'sonner';

export function useIncome(filters?: { startDate?: string; endDate?: string; source?: IncomeSource }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['income', user?.id, filters],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .order('income_date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('income_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('income_date', filters.endDate);
      }
      if (filters?.source) {
        query = query.eq('source', filters.source);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        amount: Number(item.amount),
        source: item.source as IncomeSource,
      })) as Income[];
    },
    enabled: !!user,
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateIncomeInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('income')
        .insert({
          user_id: user.id,
          amount: input.amount,
          source: input.source,
          description: input.description || null,
          income_date: input.income_date,
          is_recurring: input.is_recurring || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast.success('Income added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add income: ' + error.message);
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('income')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast.success('Income deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete income: ' + error.message);
    },
  });
}

export function useMonthlyIncome() {
  const { user } = useAuth();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  return useQuery({
    queryKey: ['income', 'monthly-total', user?.id, startOfMonth],
    queryFn: async () => {
      if (!user) return 0;

      const { data, error } = await supabase
        .from('income')
        .select('amount')
        .eq('user_id', user.id)
        .gte('income_date', startOfMonth)
        .lte('income_date', endOfMonth);

      if (error) throw error;
      return (data || []).reduce((sum, item) => sum + Number(item.amount), 0);
    },
    enabled: !!user,
  });
}
