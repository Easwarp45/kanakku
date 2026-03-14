import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUnsyncedExpenses, 
  markExpenseSynced, 
  isOnline,
  setupOnlineListener 
} from '@/lib/offlineStorage';
import { toast } from 'sonner';

export function useOfflineSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const syncExpenses = useCallback(async () => {
    if (!user || !isOnline()) return;

    const unsynced = getUnsyncedExpenses();
    if (unsynced.length === 0) return;

    let syncedCount = 0;

    for (const expense of unsynced) {
      try {
        const { error } = await supabase.from('expenses').insert({
          user_id: user.id,
          amount: expense.amount,
          category: expense.category,
          description: expense.description || null,
          payment_method: expense.payment_method,
          expense_date: expense.expense_date,
          receipt_url: expense.receipt_url || null,
        });

        if (!error) {
          markExpenseSynced(expense.id);
          syncedCount++;
        }
      } catch (err) {
        console.error('Failed to sync expense:', err);
      }
    }

    if (syncedCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(`Synced ${syncedCount} offline expense${syncedCount > 1 ? 's' : ''}`);
    }
  }, [user, queryClient]);

  // Sync when coming online
  useEffect(() => {
    const cleanup = setupOnlineListener(
      () => {
        toast.info('Back online! Syncing data...');
        syncExpenses();
      },
      () => {
        toast.warning('You are offline. Expenses will be saved locally.');
      }
    );

    // Initial sync on mount
    if (isOnline()) {
      syncExpenses();
    }

    return cleanup;
  }, [syncExpenses]);

  return { syncExpenses };
}
