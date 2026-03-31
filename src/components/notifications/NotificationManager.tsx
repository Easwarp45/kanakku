import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useBudgetsWithSpent } from '@/hooks/useBudgets';
import { useGroups } from '@/hooks/useGroups';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_CONFIG } from '@/types/expense';

export function NotificationManager() {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { permission, prefs, sendNotification, shouldNotify, markNotified } = useNotifications();
  const { data: budgets } = useBudgetsWithSpent();
  const { data: groups } = useGroups();

  // Budget alerts
  useEffect(() => {
    if (permission !== 'granted' || !prefs.budgetAlerts || !budgets?.length) return;

    budgets.forEach(budget => {
      const categoryLabel = CATEGORY_CONFIG[budget.category as keyof typeof CATEGORY_CONFIG]?.label || budget.category;

      if (budget.isOverBudget && shouldNotify(`budget_over_${budget.id}`)) {
        sendNotification('⚠️ Budget Exceeded!', {
          body: `You've spent ${formatCurrency(budget.spent, { maximumFractionDigits: 0 })} on ${categoryLabel}, exceeding your ${formatCurrency(budget.amount, { maximumFractionDigits: 0 })} budget.`,
          tag: `budget_over_${budget.id}`,
        });
        markNotified(`budget_over_${budget.id}`);
      } else if (budget.isNearLimit && shouldNotify(`budget_near_${budget.id}`)) {
        sendNotification('📊 Budget Alert', {
          body: `You've used ${Math.round(budget.percentage)}% of your ${categoryLabel} budget (${formatCurrency(budget.spent, { maximumFractionDigits: 0 })} / ${formatCurrency(budget.amount, { maximumFractionDigits: 0 })}).`,
          tag: `budget_near_${budget.id}`,
        });
        markNotified(`budget_near_${budget.id}`);
      }
    });
  }, [budgets, permission, prefs.budgetAlerts, sendNotification, shouldNotify, markNotified, formatCurrency]);

  // Settlement reminders
  useEffect(() => {
    if (permission !== 'granted' || !prefs.settlementReminders || !user || !groups?.length) return;

    const checkSettlements = async () => {
      if (!shouldNotify('settlement_reminder')) return;

      // Check for unsettled splits across all groups
      const { data: unsettledSplits } = await supabase
        .from('expense_splits')
        .select('id, amount, group_expense_id')
        .eq('user_id', user.id)
        .eq('is_settled', false);

      if (unsettledSplits && unsettledSplits.length > 0) {
        const totalOwed = unsettledSplits.reduce((sum, s) => sum + Number(s.amount), 0);
        if (totalOwed > 0) {
          sendNotification('💰 Settlement Reminder', {
            body: `You have ${formatCurrency(totalOwed, { maximumFractionDigits: 0 })} in unsettled expenses across ${unsettledSplits.length} split(s). Settle up to keep things clear!`,
            tag: 'settlement_reminder',
          });
          markNotified('settlement_reminder');
        }
      }
    };

    checkSettlements();
  }, [groups, permission, prefs.settlementReminders, user, sendNotification, shouldNotify, markNotified, formatCurrency]);

  // Expense logging reminder (check if user hasn't logged today)
  useEffect(() => {
    if (permission !== 'granted' || !prefs.expenseReminders || !user) return;
    if (!shouldNotify('expense_reminder')) return;

    const checkExpenseReminder = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayExpenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('user_id', user.id)
        .eq('expense_date', today)
        .limit(1);

      // If no expenses today and it's after the reminder time
      const now = new Date();
      const [reminderHour, reminderMinute] = prefs.reminderTime.split(':').map(Number);
      const reminderTimeToday = new Date();
      reminderTimeToday.setHours(reminderHour, reminderMinute, 0, 0);

      if ((!todayExpenses || todayExpenses.length === 0) && now >= reminderTimeToday) {
        sendNotification('📝 Log Your Expenses', {
          body: "You haven't logged any expenses today. Tap to add your daily spending!",
          tag: 'expense_reminder',
        });
        markNotified('expense_reminder');
      }
    };

    checkExpenseReminder();
  }, [permission, prefs.expenseReminders, prefs.reminderTime, user, sendNotification, shouldNotify, markNotified]);

  return null;
}
