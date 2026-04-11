import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FinancialGoalRecord {
  id: string;
  user_id: string;
  target_amount: number;
  current_saved: number;
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface UpsertFinancialGoalInput {
  targetAmount: number;
  currentSaved: number;
  deadline: string;
}

export function useFinancialGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financial-goals', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as FinancialGoalRecord | null;
    },
    enabled: !!user?.id,
  });
}

export function useUpsertFinancialGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertFinancialGoalInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('financial_goals')
        .upsert(
          {
            user_id: user.id,
            target_amount: input.targetAmount,
            current_saved: input.currentSaved,
            deadline: input.deadline,
          },
          { onConflict: 'user_id' }
        )
        .select('*')
        .single();

      if (error) throw error;
      return data as FinancialGoalRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
    },
  });
}
