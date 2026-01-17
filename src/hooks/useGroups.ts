import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { 
  Group, 
  GroupMember, 
  GroupExpense, 
  Settlement,
  CreateGroupInput,
  CreateGroupExpenseInput,
  MemberBalance,
  SimplifiedDebt
} from '@/types/group';
import type { ExpenseCategory } from '@/types/expense';
import { toast } from 'sonner';

// Fetch all groups user is member of
export function useGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Group[];
    },
    enabled: !!user,
  });
}

// Fetch single group
export function useGroup(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      if (!id || !user) return null;

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Group | null;
    },
    enabled: !!id && !!user,
  });
}

// Fetch group members with profiles
export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      // First get members
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      if (!members?.length) return [];

      // Then get profiles for each member
      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      // Map profiles to members
      return members.map(member => ({
        ...member,
        profile: profiles?.find(p => p.user_id === member.user_id) || null,
      })) as GroupMember[];
    },
    enabled: !!groupId,
  });
}

// Fetch group expenses
export function useGroupExpenses(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-expenses', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from('group_expenses')
        .select('*')
        .eq('group_id', groupId)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(exp => ({
        ...exp,
        amount: Number(exp.amount),
        category: exp.category as ExpenseCategory,
        split_type: exp.split_type as 'equal' | 'custom',
      })) as GroupExpense[];
    },
    enabled: !!groupId,
  });
}

// Fetch expense splits for a group
export function useExpenseSplits(groupId: string | undefined) {
  return useQuery({
    queryKey: ['expense-splits', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data: expenses } = await supabase
        .from('group_expenses')
        .select('id')
        .eq('group_id', groupId);

      if (!expenses?.length) return [];

      const expenseIds = expenses.map(e => e.id);

      const { data, error } = await supabase
        .from('expense_splits')
        .select('*')
        .in('group_expense_id', expenseIds);

      if (error) throw error;

      return (data || []).map(split => ({
        ...split,
        amount: Number(split.amount),
      }));
    },
    enabled: !!groupId,
  });
}

// Fetch settlements
export function useSettlements(groupId: string | undefined) {
  return useQuery({
    queryKey: ['settlements', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('group_id', groupId)
        .order('settled_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(s => ({
        ...s,
        amount: Number(s.amount),
      })) as Settlement[];
    },
    enabled: !!groupId,
  });
}

// Calculate member balances
export function useGroupBalances(groupId: string | undefined) {
  const { data: members = [] } = useGroupMembers(groupId);
  const { data: expenses = [] } = useGroupExpenses(groupId);
  const { data: splits = [] } = useExpenseSplits(groupId);
  const { data: settlements = [] } = useSettlements(groupId);

  const balances: MemberBalance[] = members.map(member => {
    let balance = 0;

    // Add amounts they paid
    expenses.forEach(exp => {
      if (exp.paid_by === member.user_id) {
        balance += exp.amount;
      }
    });

    // Subtract amounts they owe
    splits.forEach(split => {
      if (split.user_id === member.user_id) {
        balance -= split.amount;
      }
    });

    // Add settlements received
    settlements.forEach(s => {
      if (s.paid_to === member.user_id) {
        balance -= s.amount;
      }
      if (s.paid_by === member.user_id) {
        balance += s.amount;
      }
    });

    return {
      user_id: member.user_id,
      display_name: member.nickname || member.profile?.display_name || 'Unknown',
      balance: Math.round(balance * 100) / 100,
    };
  });

  // Calculate simplified debts
  const simplifiedDebts: SimplifiedDebt[] = [];
  const debtors = balances.filter(b => b.balance < 0).map(b => ({ ...b, balance: Math.abs(b.balance) }));
  const creditors = balances.filter(b => b.balance > 0);

  debtors.forEach(debtor => {
    let remaining = debtor.balance;
    creditors.forEach(creditor => {
      if (remaining <= 0 || creditor.balance <= 0) return;
      const amount = Math.min(remaining, creditor.balance);
      if (amount > 0.01) {
        simplifiedDebts.push({
          from_user_id: debtor.user_id,
          from_name: debtor.display_name,
          to_user_id: creditor.user_id,
          to_name: creditor.display_name,
          amount: Math.round(amount * 100) / 100,
        });
        remaining -= amount;
        creditor.balance -= amount;
      }
    });
  });

  return { balances, simplifiedDebts };
}

// Create group
export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      if (!user) throw new Error('Not authenticated');

      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: input.name,
          description: input.description || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      return group as Group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group created!');
    },
    onError: (error) => {
      toast.error('Failed to create group: ' + error.message);
    },
  });
}

// Join group by invite code
export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) throw new Error('Not authenticated');

      // Find group
      const { data: group, error: findError } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', inviteCode.toLowerCase().trim())
        .maybeSingle();

      if (findError) throw findError;
      if (!group) throw new Error('Invalid invite code');

      // Join group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
        });

      if (joinError) {
        if (joinError.code === '23505') {
          throw new Error('You are already a member of this group');
        }
        throw joinError;
      }

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Joined group!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Add group expense
export function useAddGroupExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateGroupExpenseInput) => {
      if (!user) throw new Error('Not authenticated');

      // Create expense
      const { data: expense, error: expenseError } = await supabase
        .from('group_expenses')
        .insert({
          group_id: input.group_id,
          paid_by: user.id,
          amount: input.amount,
          description: input.description,
          category: input.category,
          expense_date: input.expense_date,
          split_type: input.split_type,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Create splits
      const splits = input.splits.map(s => ({
        group_expense_id: expense.id,
        user_id: s.user_id,
        amount: s.amount,
      }));

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(splits);

      if (splitsError) throw splitsError;

      return expense;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-expenses', variables.group_id] });
      queryClient.invalidateQueries({ queryKey: ['expense-splits', variables.group_id] });
      toast.success('Expense added!');
    },
    onError: (error) => {
      toast.error('Failed to add expense: ' + error.message);
    },
  });
}

// Record settlement
export function useRecordSettlement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { group_id: string; paid_to: string; amount: number; note?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('settlements')
        .insert({
          group_id: input.group_id,
          paid_by: user.id,
          paid_to: input.paid_to,
          amount: input.amount,
          note: input.note || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settlements', variables.group_id] });
      toast.success('Settlement recorded!');
    },
    onError: (error) => {
      toast.error('Failed to record settlement: ' + error.message);
    },
  });
}

// Leave group
export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Left group');
    },
    onError: (error) => {
      toast.error('Failed to leave group: ' + error.message);
    },
  });
}
