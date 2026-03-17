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
import { generateInviteCode, formatInviteCode } from '@/lib/invite-code';
import { toast } from 'sonner';

// Fetch all groups user is member of
export function useGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First, get user's group IDs from group_members
      const { data: userGroupIds, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching user group memberships:', memberError);
        throw memberError;
      }

      if (!userGroupIds || userGroupIds.length === 0) return [];

      const groupIds = userGroupIds.map(item => item.group_id);

      // Then fetch only those groups
      const { data, error } = await supabase
        .from('groups')
        .select('id,name,description,created_by,invite_code,updated_at')
        .in('id', groupIds)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Group[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minutes
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
        .select('id,name,description,created_by,invite_code,created_at,updated_at')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Group | null;
    },
    enabled: !!id && !!user,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// Fetch group members with profiles
export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      // Fetch members - simpler query without nested profile relation
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('id,group_id,user_id,is_admin,nickname,created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (membersError) {
        console.error('Error fetching group members:', membersError);
        throw membersError;
      }

      if (!members || members.length === 0) return [];

      // Fetch profiles separately
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id,display_name,avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Continue without profiles rather than failing
      }

      // Map profiles by user_id for easy lookup
      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, any>);

      // Combine members with their profiles
      return members.map(member => ({
        ...member,
        profile: profileMap[member.user_id] || null,
      })) as GroupMember[];
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
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
        .select('id,group_id,paid_by,amount,category,description,expense_date,split_type,created_at,updated_at')
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
    staleTime: 1000 * 60 * 5, // 5 minutes
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

      // Generate invite code on frontend
      const inviteCode = generateInviteCode();

      // Create group with generated invite code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: input.name,
          description: input.description || null,
          created_by: user.id,
          invite_code: inviteCode,
        })
        .select('id,name,description,image_url,created_by,invite_code,created_at,updated_at')
        .single();

      if (groupError) {
        console.error('Create group error:', groupError);
        throw new Error(`Failed to create group: ${groupError.message}`);
      }

      if (!group) throw new Error('Failed to create group: No response from server');

      // Add creator as member with admin role
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          is_admin: true,
        });

      if (memberError) {
        console.error('Add member error:', memberError);
        throw new Error(`Failed to add you as member: ${memberError.message}`);
      }

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

      const cleanCode = formatInviteCode(inviteCode);

      if (!cleanCode) throw new Error('Please enter an invite code');

      // Find group by invite code using RPC function
      // This bypasses RLS restrictions that prevent non-members from viewing groups
      const { data: groups, error: findError } = await supabase
        .rpc('get_group_by_invite_code', { code: cleanCode });

      if (findError) {
        console.error('Find group error:', findError);
        throw new Error(`Failed to find group: ${findError.message}`);
      }

      const group = groups && groups.length > 0 ? groups[0] : null;

      if (!group) {
        throw new Error('Invalid invite code. Please check and try again.');
      }

      // Join group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          is_admin: false,
        });

      if (joinError) {
        console.error('Join group error:', joinError);
        if (joinError.code === '23505') {
          throw new Error('You are already a member of this group');
        }
        throw new Error(`Failed to join group: ${joinError.message}`);
      }

      return group;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success(`Joined group: ${data.name}!`);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join group';
      toast.error(errorMessage);
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

// Remove member from group (admin only)
export function useRemoveGroupMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { groupId: string; memberId: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if current user is admin
      const { data: adminCheck, error: adminError } = await supabase
        .from('group_members')
        .select('is_admin')
        .eq('group_id', input.groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminError) throw adminError;
      if (!adminCheck?.is_admin) throw new Error('Only group admins can remove members');

      // Delete the member
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', input.groupId)
        .eq('id', input.memberId);

      if (deleteError) throw deleteError;
    },
    onSuccess: (_data, variables) => {
      // Invalidate the specific group's members list
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
      // Also invalidate group balances since they depend on members
      queryClient.invalidateQueries({ queryKey: ['group-balances', variables.groupId] });
      toast.success('Member removed from group');
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to remove member';
      toast.error(msg);
    },
  });
}

// Fetch group chat messages
export function useGroupChats(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-chats', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from('group_chats')
        .select(`
          id,
          group_id,
          user_id,
          message,
          created_at,
          updated_at,
          profiles!group_chats_user_id_fkey(user_id,display_name,avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!groupId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 30000, // Poll every 30 seconds for new messages (reduced from 2s)
  });
}

// Send group chat message
export function useSendGroupChat() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { groupId: string; message: string }) => {
      if (!user) throw new Error('Not authenticated');
      if (!input.message.trim()) throw new Error('Message cannot be empty');

      // Check if user is group member
      const { data: member, error: memberError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', input.groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!member) throw new Error('You are not a member of this group');

      // Insert message
      const { data, error } = await supabase
        .from('group_chats')
        .insert({
          group_id: input.groupId,
          user_id: user.id,
          message: input.message.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-chats', variables.groupId] });
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to send message';
      console.error('Chat error:', msg);
    },
  });
}
