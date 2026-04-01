import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const userChannel = supabase
      .channel(`realtime-user-data-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          queryClient.invalidateQueries({ queryKey: ['expense'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          queryClient.invalidateQueries({ queryKey: ['budgets-with-spent'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'income', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['income'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['budgets'] });
          queryClient.invalidateQueries({ queryKey: ['budgets-with-spent'] });
        }
      )
      .subscribe();

    const groupChannel = supabase
      .channel(`realtime-group-data-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'groups' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['groups'] });
          queryClient.invalidateQueries({ queryKey: ['group'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['groups'] });
          queryClient.invalidateQueries({ queryKey: ['group-members'] });
          queryClient.invalidateQueries({ queryKey: ['group'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_expenses' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['group-expenses'] });
          queryClient.invalidateQueries({ queryKey: ['group-expense'] });
          queryClient.invalidateQueries({ queryKey: ['expense-splits'] });
          queryClient.invalidateQueries({ queryKey: ['settlements'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expense_splits' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expense-splits'] });
          queryClient.invalidateQueries({ queryKey: ['group-expenses'] });
          queryClient.invalidateQueries({ queryKey: ['group-expense'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settlements' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['settlements'] });
          queryClient.invalidateQueries({ queryKey: ['group-expenses'] });
          queryClient.invalidateQueries({ queryKey: ['expense-splits'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_chats' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['group-chats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(groupChannel);
    };
  }, [queryClient, user?.id]);
}
