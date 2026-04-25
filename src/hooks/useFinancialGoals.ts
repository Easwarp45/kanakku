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

      if (error) {
        // 42P01 = PostgreSQL "undefined_table" — migration not yet applied
        // PGRST116 = PostgREST "relation does not exist"
        const code = (error as any).code as string | undefined;
        if (code === '42P01' || code === 'PGRST116' || error.message?.includes('does not exist')) {
          // Return null silently — UI will show "no goal set" empty state
          console.warn('[financial_goals] Table not found. Run supabase/MANUAL_RUN_financial_goals.sql in your Supabase dashboard.');
          return null;
        }
        throw error;
      }
      return data as FinancialGoalRecord | null;
    },
    enabled: !!user?.id,
    refetchOnMount: 'always',
    staleTime: 0,
    // Don't retry on table-missing errors — pointless until migration is applied
    retry: (failureCount, error) => {
      const code = (error as any)?.code as string | undefined;
      if (code === '42P01' || code === 'PGRST116') return false;
      return failureCount < 2;
    },
  });
}


export function useUpsertFinancialGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertFinancialGoalInput) => {
      if (!user?.id) throw new Error('Not authenticated. Please sign in again.');

      // Validate before hitting Supabase to give instant, clear errors
      if (!Number.isFinite(input.targetAmount) || input.targetAmount < 1) {
        throw new Error('Target must be a positive number.');
      }
      if (!Number.isFinite(input.currentSaved) || input.currentSaved < 0) {
        throw new Error('Saved amount must be 0 or more.');
      }
      if (!input.deadline) {
        throw new Error('Please set a deadline date.');
      }

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

      if (error) {
        const code = (error as any).code as string | undefined;
        if (code === '42P01' || code === 'PGRST116' || error.message?.includes('does not exist')) {
          throw new Error(
            'Table missing. Run MANUAL_RUN_financial_goals.sql in Supabase Dashboard → SQL Editor.'
          );
        }
        // Surface the most useful Supabase error detail
        const msg = (error as any).details || (error as any).hint || error.message || 'Database error';
        throw new Error(msg);
      }
      return data as FinancialGoalRecord;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
    },
  });
}
