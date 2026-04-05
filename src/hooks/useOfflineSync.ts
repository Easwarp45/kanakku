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
        const normalizedDescription = expense.description?.trim() || null;

        // Dedup guard: if this expense already exists in DB, only mark local copy as synced.
        let duplicateCheck = supabase
          .from('expenses')
          .select('id')
          .eq('user_id', user.id)
          .eq('amount', expense.amount)
          .eq('category', expense.category)
          .eq('payment_method', expense.payment_method)
          .eq('expense_date', expense.expense_date)
          .limit(1);

        duplicateCheck = normalizedDescription
          ? duplicateCheck.eq('description', normalizedDescription)
          : duplicateCheck.is('description', null);

        const { data: existingExpense, error: duplicateError } = await duplicateCheck.maybeSingle();

        if (duplicateError) {
          throw duplicateError;
        }

        if (existingExpense) {
          try {
            markExpenseSynced(expense.id);
            syncedCount++;
          } catch (markError) {
            console.error('Failed to mark duplicated offline expense as synced:', markError);
          }
          continue;
        }

        const { error } = await supabase.from('expenses').insert({
          user_id: user.id,
          amount: expense.amount,
          category: expense.category,
          description: normalizedDescription,
          payment_method: expense.payment_method,
          expense_date: expense.expense_date,
          receipt_url: expense.receipt_url || null,
        });

        if (error) {
          throw error;
        }

        try {
          markExpenseSynced(expense.id);
          syncedCount++;
        } catch (markError) {
          // If marking fails, duplicate guard above prevents reinserting next sync.
          console.error('Expense uploaded but failed to mark as synced locally:', markError);
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
