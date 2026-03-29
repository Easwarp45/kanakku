import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
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
    staleTime: 1000 * 30, // 30 seconds – ensures removal is reflected quickly
  });
}

// ██████████████████████████████████████████████████████████████
// Real-time member removal detection via WebSocket notifications
// Instead of polling, we subscribe to member_removal_notifications table.
// When a member is removed, a trigger inserts a notification that the
// removed user CAN see (via RLS), and we get an instant real-time event.
// ██████████████████████████████████████████████████████████████
export function useMemberRemovalListener(
  groupId: string | undefined,
  onRemoved: () => void
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hasSubscribed = useRef(false);

  useEffect(() => {
    if (!groupId || !user || hasSubscribed.current) return;

    console.log(`🔌 Setting up member removal listener for group ${groupId}`);
    hasSubscribed.current = true;

    const channel = supabase.channel(`removal-notifications-${groupId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'member_removal_notifications',
          filter: `removed_user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('🚫 Member removal notification received:', payload);

          // Only act if the notification is for this group
          if (payload.new.group_id === groupId) {
            console.log(`⚠️ User ${user.id} was removed from group ${groupId}`);

            // Clear all group-related caches
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.removeQueries({ queryKey: ['group', groupId] });
            queryClient.removeQueries({ queryKey: ['group-members', groupId] });
            queryClient.removeQueries({ queryKey: ['group-chats', groupId] });
            queryClient.removeQueries({ queryKey: ['group-expenses', groupId] });

            // Trigger the removal callback
            onRemoved();
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`🔌 Cleaning up member removal listener for group ${groupId}`);
      hasSubscribed.current = false;
      supabase.removeChannel(channel);
    };
  }, [groupId, user, queryClient, onRemoved]);
}

// Fallback: Check membership via RPC (used on mount, not for polling)
// This is lighter weight than the old polling approach - only called once
export function useCheckMyMembership(groupId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-membership', groupId, user?.id],
    queryFn: async () => {
      if (!groupId || !user) return true;

      const { data, error } = await supabase
        .rpc('check_my_group_membership', { group_uuid: groupId });

      if (error) {
        console.warn('check_my_group_membership RPC error, falling back:', error.message);
        const { data: fallback } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .maybeSingle();
        return fallback !== null;
      }

      return data as boolean;
    },
    enabled: !!groupId && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes - only used for initial check, not polling
    refetchInterval: false,   // NO POLLING - real-time handles it
  });
}

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
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

// Fetch group members with profiles + real-time updates
export function useGroupMembers(groupId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  const query = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      try {
        // Fetch members
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
          console.error('Error fetching profiles, some members may show without full display name:', profilesError);
        }

        // Map profiles by user_id
        const profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, any>);

        // Combine members with profiles
        const result = members.map(member => {
          const profile = profileMap[member.user_id];
          return {
            ...member,
            profile: profile || { user_id: member.user_id, display_name: null, avatar_url: null },
          };
        }) as GroupMember[];

        return result;
      } catch (error) {
        console.error('Error in useGroupMembers:', error);
        throw error;
      }
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 3,
    retry: 2,
  });

  // Set up real-time subscription for member changes
  useEffect(() => {
    if (!groupId) return;

    // Subscribe to group_members table changes for this group
    const subscription = supabase
      .channel(`group-members-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload: any) => {
          console.log('📢 Real-time member change detected:', payload);

          if (payload.eventType === 'DELETE') {
            // old_record.user_id may be null due to Supabase RLS on DELETE — handled below
            const removedUserId = payload.old_record?.user_id;
            console.log(`Member deleted: ${removedUserId ?? '(hidden by RLS)'}, Current user: ${user?.id}`);

            if (removedUserId && removedUserId === user?.id) {
              // We know for sure the current user was removed
              console.log('⚠️ Current user was removed from group (from payload)');
              queryClient.invalidateQueries({ queryKey: ['groups'] });
              queryClient.invalidateQueries({ queryKey: ['group', groupId] });
              queryClient.removeQueries({ queryKey: ['group-members', groupId] });
              queryClient.removeQueries({ queryKey: ['group-chats', groupId] });
              return; // No need to refetch member list — user has been kicked
            } else {
              // Someone else was removed, or RLS hid the user_id
              queryClient.invalidateQueries({ queryKey: ['group-members', groupId], exact: true });
            }
          } else if (payload.eventType === 'INSERT') {
            console.log('New member added');
            queryClient.invalidateQueries({ queryKey: ['group-members', groupId], exact: true });
          } else if (payload.eventType === 'UPDATE') {
            console.log('Member details updated');
            queryClient.invalidateQueries({ queryKey: ['group-members', groupId], exact: true });
          }

          // --- Fallback: DB-level membership re-check ---
          // Runs after every event in case RLS hid old_record.user_id on DELETE.
          // This is a lightweight query (single row lookup) so it won't hurt performance.
          if (user?.id) {
            try {
              const { data: selfMembership } = await supabase
                .from('group_members')
                .select('id')
                .eq('group_id', groupId)
                .eq('user_id', user.id)
                .maybeSingle();

              if (!selfMembership) {
                // Current user is no longer a member — clear all group-related caches
                console.log('⚠️ Current user is no longer a member (confirmed by DB check)');
                queryClient.invalidateQueries({ queryKey: ['groups'] });
                queryClient.invalidateQueries({ queryKey: ['group', groupId] });
                queryClient.removeQueries({ queryKey: ['group-members', groupId] });
                queryClient.removeQueries({ queryKey: ['group-chats', groupId] });
                return;
              }
            } catch (err) {
              console.error('Error during membership re-check:', err);
            }
          }

          // Force a refetch to ensure the UI updates immediately
          queryClient.refetchQueries({
            queryKey: ['group-members', groupId],
            type: 'active',
          });
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status for group ${groupId}:`, status);
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Real-time listener active for group ${groupId}`);
        }
      });

    subscriptionRef.current = subscription;

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        console.log(`❌ Unsubscribed from group ${groupId}`);
      }
    };
  }, [groupId, user?.id, queryClient]);

  return query;
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
      display_name: member.nickname || member.profile?.display_name || 'Member',
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

      // Delete the member - using member ID (group_members.id)
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('id', input.memberId);

      if (deleteError) throw deleteError;

      return input.memberId;
    },
    onSuccess: async (deletedMemberId, variables) => {
      // Step 1: Immediately update cache to remove the member from UI
      const previousData = queryClient.getQueryData(['group-members', variables.groupId]);
      
      queryClient.setQueryData(['group-members', variables.groupId], (oldData: any) => {
        if (Array.isArray(oldData)) {
          // Filter out the deleted member by ID - this removes it from UI instantly
          const filtered = oldData.filter((member: any) => member.id !== deletedMemberId);
          console.log(`Removed member ${deletedMemberId}. Count: ${oldData.length} -> ${filtered.length}`);
          return filtered;
        }
        return oldData;
      });

      // Step 2: Mark balances as stale so they recalculate from fresh member list
      queryClient.invalidateQueries({ 
        queryKey: ['group-balances', variables.groupId], 
        exact: true 
      });

      // Step 3: Wait longer for database replication, then soft-refetch
      // This prevents the member from reappearing due to a race condition
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        // Refetch only if there are active subscribers to avoid unnecessary requests
        // This will verify the deletion was successful on the server
        const balanceQueryPromise = queryClient.refetchQueries({ 
          queryKey: ['group-balances', variables.groupId], 
          type: 'active' 
        });

        await balanceQueryPromise;
      } catch (error) {
        console.error('Error refetching after member removal:', error);
        // Don't throw - we've already removed from UI, this is just verification
      }
      
      toast.success('Member removed successfully');
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

      try {
        // Fetch messages first
        const { data: messages, error: messagesError } = await supabase
          .from('group_chats')
          .select('id,group_id,user_id,message,created_at,updated_at')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        if (!messages || messages.length === 0) return [];

        // Fetch user profiles separately
        const userIds = [...new Set(messages.map(m => m.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id,display_name,avatar_url')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles for chat:', profilesError);
          // Continue without profiles rather than failing
        }

        // Map profiles by user_id
        const profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, any>);

        // Combine messages with profiles
        return messages.map(message => ({
          ...message,
          profiles: profileMap[message.user_id] || { user_id: message.user_id, display_name: null, avatar_url: null },
        }));
      } catch (error) {
        console.error('Error fetching group chats:', error);
        throw error;
      }
    },
    enabled: !!groupId,
    staleTime: 1000 * 5, // 5 seconds - reduced for better real-time feel
    refetchInterval: 5000, // Poll every 5 seconds for new messages
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
      // Invalidate chat cache and immediately refetch to show new message
      queryClient.invalidateQueries({ queryKey: ['group-chats', variables.groupId] });
      // Refetch immediately for real-time feedback
      queryClient.refetchQueries({ queryKey: ['group-chats', variables.groupId] });
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Failed to send message';
      console.error('Chat error:', msg);
      throw error;
    },
  });
}
