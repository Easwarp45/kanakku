import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHaptics } from '@/hooks/useHaptics';
import type { Income, CreateIncomeInput, UpdateIncomeInput, IncomeSource } from '@/types/income';
import { toast } from 'sonner';

export function useIncome(filters?: { startDate?: string; endDate?: string; source?: IncomeSource }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['income', user?.id, filters],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('income')
        .select('id,amount,source,description,income_date,is_recurring,updated_at')
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
    staleTime: 1000 * 60 * 2, // align with app-wide cache freshness
  });
}

export function useIncomeRecord(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['income-record', id],
    queryFn: async () => {
      if (!id || !user) return null;

      const { data, error } = await supabase
        .from('income')
        .select('id,user_id,amount,source,description,income_date,is_recurring,created_at,updated_at')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        amount: Number(data.amount),
        source: data.source as IncomeSource,
      } as Income;
    },
    enabled: !!id && !!user,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error: errorHaptic } = useHaptics();

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
      success();
      toast.success('Income added successfully');
    },
    onError: (error) => {
      errorHaptic();
      toast.error('Failed to add income: ' + error.message);
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  const { success, error: errorHaptic } = useHaptics();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateIncomeInput) => {
      const updates: Record<string, unknown> = {};

      if (input.amount !== undefined) updates.amount = input.amount;
      if (input.source !== undefined) updates.source = input.source;
      if (input.description !== undefined) updates.description = input.description;
      if (input.income_date !== undefined) updates.income_date = input.income_date;
      if (input.is_recurring !== undefined) updates.is_recurring = input.is_recurring;

      const { data, error } = await supabase
        .from('income')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['income-record', data.id] });
      success();
      toast.success('Income updated successfully');
    },
    onError: (error) => {
      errorHaptic();
      toast.error('Failed to update income: ' + error.message);
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  const { success, error: errorHaptic } = useHaptics();

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
      success();
      toast.success('Income deleted');
    },
    onError: (error) => {
      errorHaptic();
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
