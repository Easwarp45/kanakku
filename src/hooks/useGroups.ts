import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHaptics } from '@/hooks/useHaptics';
import { logger } from '@/lib/logger';
import type { 
  Group, 
  GroupMember, 
  GroupExpense, 
  Settlement,
  CreateGroupInput,
  CreateGroupExpenseInput,
  UpdateGroupExpenseInput,
  MemberBalance,
  SimplifiedDebt
} from '@/types/group';
import type { ExpenseCategory } from '@/types/expense';
import { generateInviteCode, formatInviteCode } from '@/lib/invite-code';
import { toast } from 'sonner';

export interface ContactUserMatch {
  user_id: string;
  display_name: string | null;
  phone_number: string | null;
}

function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

/**
 * Fetches all groups that the current user is a member of.
 *
 * This hook performs a two-step query:
 * 1. Fetches user's group memberships from group_members table
 * 2. Fetches the full group details for those memberships
 *
 * @returns {UseQueryResult<Group[]>} React Query result with array of groups
 *
 * @example
 * ```tsx
 * const { data: groups, isLoading } = useGroups();
 * if (isLoading) return <Spinner />;
 * return <GroupList groups={groups} />;
 * ```
 */
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

/**
 * Real-time WebSocket listener for member removal notifications.
 *
 * Sets up a Supabase Realtime subscription to detect when the current user
 * is removed from a group. Uses the member_removal_notifications table which
 * is populated by a database trigger on group_members DELETE.
 *
 * **Why this approach?**
 * Supabase Realtime does NOT deliver DELETE events to users who have lost
 * RLS SELECT access. The notification table has RLS that allows removed users
 * to see their own removal notifications, enabling instant real-time detection.
 *
 * @param {string | undefined} groupId - The group ID to monitor (undefined = no subscription)
 * @param {() => void} onRemoved - Callback invoked when user is removed from the group
 *
 * @example
 * ```tsx
 * const handleRemoval = () => {
 *   toast.error('You were removed from this group');
 *   navigate('/groups');
 * };
 * useMemberRemovalListener(groupId, handleRemoval);
 * ```
 *
 * @see {@link https://supabase.com/docs/guides/realtime | Supabase Realtime}
 */
export function useMemberRemovalListener(
  groupId: string | undefined,
  onRemoved: () => void
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!groupId || !user) return;

    logger.log(`🔌 Setting up member removal listener for group ${groupId}`);

    const ch = supabase.channel(`removal-notifications-${groupId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'member_removal_notifications',
          filter: `removed_user_id=eq.${user.id}`,
        },
        (payload: any) => {
          logger.log('🚫 Member removal notification received:', payload);

          // Only act if the notification is for this group
          if (payload.new.group_id === groupId) {
            logger.log(`⚠️ User ${user.id} was removed from group ${groupId}`);

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
      );

    // Store the channel before calling subscribe so cleanup can reference it correctly
    channelRef.current = ch;
    ch.subscribe();

    return () => {
      logger.log(`🔌 Cleaning up member removal listener for group ${groupId}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [groupId, user, queryClient, onRemoved]);
}

/**
 * Checks if the current user is a member of a specific group.
 *
 * Uses a SECURITY DEFINER RPC function that bypasses RLS to check membership.
 * This is safe because the RPC only returns information about the calling user.
 *
 * **Note:** This hook does NOT poll - it performs a single check on mount and
 * caches the result for 5 minutes. Real-time changes are handled by
 * `useMemberRemovalListener`.
 *
 * @param {string | undefined} groupId - The group ID to check membership for
 * @returns {UseQueryResult<boolean>} React Query result with membership status
 *
 * @example
 * ```tsx
 * const { data: isMember } = useCheckMyMembership(groupId);
 *
 * if (isMember === false) {
 *   navigate('/groups'); // User is not a member
 * }
 * ```
 */
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
    initialData: !groupId ? true : undefined, // default to true when no groupId (disabled)
    staleTime: 1000 * 60 * 5, // 5 minutes - only used for initial check, not polling
    refetchInterval: false,   // NO POLLING - real-time handles it
  });
}

/**
 * Fetches details for a single group by ID.
 *
 * @param {string | undefined} id - The group ID to fetch
 * @returns {UseQueryResult<Group | null>} React Query result with group details or null
 *
 * @example
 * ```tsx
 * const { data: group, isLoading } = useGroup(groupId);
 * if (!group) return <NotFound />;
 * return <GroupHeader group={group} />;
 * ```
 */
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

/**
 * Fetches group members with their profile information and sets up real-time synchronization.
 *
 * This hook:
 * 1. Fetches all members of a group from group_members table
 * 2. Joins with profiles table to get display names and avatars
 * 3. Sets up a Supabase Realtime subscription for live updates
 * 4. Automatically handles member additions, removals, and profile changes
 * 5. Clears cache and redirects if current user is removed
 *
 * @param {string | undefined} groupId - The group ID to fetch members for
 * @returns {UseQueryResult<GroupMember[]>} React Query result with array of members and their profiles
 *
 * @example
 * ```tsx
 * const { data: members = [] } = useGroupMembers(groupId);
 * return members.map(member => (
 *   <MemberCard
 *     key={member.id}
 *     name={member.profile?.display_name || member.nickname}
 *     isAdmin={member.is_admin}
 *   />
 * ));
 * ```
 */
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
          logger.error('Error fetching profiles, some members may show without full display name:', profilesError);
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
        logger.error('Error in useGroupMembers:', error);
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
          logger.log('📢 Real-time member change detected:', payload);

          if (payload.eventType === 'DELETE') {
            // old_record.user_id may be null due to Supabase RLS on DELETE — handled below
            const removedUserId = payload.old_record?.user_id;
            logger.log(`Member deleted: ${removedUserId ?? '(hidden by RLS)'}, Current user: ${user?.id}`);

            if (removedUserId && removedUserId === user?.id) {
              // We know for sure the current user was removed
              logger.log('⚠️ Current user was removed from group (from payload)');
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
            logger.log('New member added');
            queryClient.invalidateQueries({ queryKey: ['group-members', groupId], exact: true });
          } else if (payload.eventType === 'UPDATE') {
            logger.log('Member details updated');
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
                logger.log('⚠️ Current user is no longer a member (confirmed by DB check)');
                queryClient.invalidateQueries({ queryKey: ['groups'] });
                queryClient.invalidateQueries({ queryKey: ['group', groupId] });
                queryClient.removeQueries({ queryKey: ['group-members', groupId] });
                queryClient.removeQueries({ queryKey: ['group-chats', groupId] });
                return;
              }
            } catch (err) {
              logger.error('Error during membership re-check:', err);
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
        logger.log(`📡 Subscription status for group ${groupId}:`, status);
        if (status === 'SUBSCRIBED') {
          logger.log(`✅ Real-time listener active for group ${groupId}`);
        }
      });

    subscriptionRef.current = subscription;

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        logger.log(`❌ Unsubscribed from group ${groupId}`);
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

// Fetch single group expense with splits
export function useGroupExpense(expenseId: string | undefined) {
  return useQuery({
    queryKey: ['group-expense', expenseId],
    queryFn: async () => {
      if (!expenseId) return null;

      const { data: expense, error } = await supabase
        .from('group_expenses')
        .select('id,group_id,paid_by,amount,category,description,expense_date,split_type')
        .eq('id', expenseId)
        .maybeSingle();

      if (error) throw error;
      if (!expense) return null;

      const { data: splits, error: splitsError } = await supabase
        .from('expense_splits')
        .select('id,user_id,amount')
        .eq('group_expense_id', expenseId);

      if (splitsError) throw splitsError;

      return {
        ...expense,
        amount: Number(expense.amount),
        category: expense.category as ExpenseCategory,
        split_type: expense.split_type as 'equal' | 'custom',
        splits: (splits || []).map(s => ({ ...s, amount: Number(s.amount) })),
      } as GroupExpense & { splits: { id: string; user_id: string; amount: number }[] };
    },
    enabled: !!expenseId,
    staleTime: 1000 * 60 * 3,
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

// P-6: useMemo wraps the balance calculation to prevent O(n²) loops on every re-render
export function useGroupBalances(groupId: string | undefined) {
  const { data: members = [] } = useGroupMembers(groupId);
  const { data: expenses = [] } = useGroupExpenses(groupId);
  const { data: splits = [] } = useExpenseSplits(groupId);
  const { data: settlements = [] } = useSettlements(groupId);

  return useMemo(() => {
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

      // Apply settlements
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
        balance,
      };
    });

    // Calculate simplified debts
    const simplifiedDebts: SimplifiedDebt[] = [];
    const debtors = balances.filter(b => b.balance < 0).map(b => ({ ...b, balance: Math.abs(b.balance) }));
    const creditors = balances.filter(b => b.balance > 0).map(b => ({ ...b }));

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
            amount,
          });
          remaining -= amount;
          creditor.balance -= amount;
        }
      });
    });

    return { balances, simplifiedDebts };
  }, [members, expenses, splits, settlements]);
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

// Find Kanakku users from phone contacts
export function useFindContactUsers() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (phoneNumbers: string[]) => {
      if (!user) throw new Error('Not authenticated');

      const normalizedNumbers = Array.from(
        new Set(phoneNumbers.map(normalizePhoneNumber).filter(Boolean))
      );

      if (!normalizedNumbers.length) return [] as ContactUserMatch[];

      const { data, error } = await supabase.rpc('find_contacts_on_kanakku', {
        phone_numbers: normalizedNumbers,
      });

      if (error) throw error;
      return (data || []) as ContactUserMatch[];
    },
  });
}

// Add a user to a group (admin/creator only)
export function useAddGroupMemberByAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { groupId: string; userId: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('add_group_member_by_admin', {
          group_uuid: input.groupId,
          new_user_uuid: input.userId,
        })
        .single();

      if (error) throw error;
      return data as { added: boolean; reason: string | null };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });

      if (result.added) {
        toast.success('Member added to group');
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to add member';
      toast.error(message);
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

// Update group expense and its splits
export function useUpdateGroupExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateGroupExpenseInput) => {
      if (!user) throw new Error('Not authenticated');

      const { expense_id, group_id, ...rest } = input;

      // Guard against duplicate member entries in splits.
      // Last value wins when the same user appears multiple times.
      const splitMap = new Map<string, number>();
      rest.splits.forEach((split) => {
        splitMap.set(split.user_id, Number(split.amount) || 0);
      });

      const normalizedSplits = Array.from(splitMap.entries()).map(([user_id, amount]) => ({
        user_id,
        amount,
      }));

      if (normalizedSplits.length === 0) {
        throw new Error('At least one member split is required');
      }

      const { data: expense, error: expenseError } = await supabase
        .from('group_expenses')
        .update({
          amount: rest.amount,
          description: rest.description,
          category: rest.category,
          expense_date: rest.expense_date,
          split_type: rest.split_type,
        })
        .eq('id', expense_id)
        .eq('group_id', group_id)
        .select('id')
        .single();

      if (expenseError) throw expenseError;

      // Try full replace first. If RLS blocks delete, we fall back to zeroing existing rows
      // and then upserting the new set so updates still work.
      const { error: deleteError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('group_expense_id', expense_id);

      if (deleteError) {
        const { error: zeroError } = await supabase
          .from('expense_splits')
          .update({
            amount: 0,
            is_settled: false,
            settled_at: null,
          })
          .eq('group_expense_id', expense_id);

        if (zeroError) throw zeroError;
      }

      const newSplits = normalizedSplits.map(s => ({
        group_expense_id: expense_id,
        user_id: s.user_id,
        amount: s.amount,
        is_settled: false,
        settled_at: null,
      }));

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .upsert(newSplits, { onConflict: 'group_expense_id,user_id' });

      if (splitsError) throw splitsError;

      return expense;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-expenses', variables.group_id] });
      queryClient.invalidateQueries({ queryKey: ['expense-splits', variables.group_id] });
      queryClient.invalidateQueries({ queryKey: ['group-expense', variables.expense_id] });
      toast.success('Expense updated');
    },
    onError: (error) => {
      toast.error('Failed to update expense: ' + error.message);
    },
  });
}

// Record settlement
export function useRecordSettlement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error: errorHaptic } = useHaptics();

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
      success();
      toast.success('Settlement recorded!');
    },
    onError: (error) => {
      errorHaptic();
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

      // Delete the member and RETURN the deleted row.
      // With RLS, delete can otherwise fail silently (0 rows) without throwing.
      const { data: deletedRows, error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('id', input.memberId)
        .eq('group_id', input.groupId)
        .neq('user_id', user.id)
        .select('id,user_id,group_id');

      if (deleteError) throw deleteError;

      if (!deletedRows || deletedRows.length === 0) {
        throw new Error('Member was not removed. Please try again.');
      }

      return deletedRows[0] as { id: string; user_id: string; group_id: string };
    },
    onSuccess: async (deletedMember, variables) => {
      // Immediately remove from cache so UI updates instantly.
      queryClient.setQueryData(['group-members', variables.groupId], (oldData: any) => {
        if (Array.isArray(oldData)) {
          const filtered = oldData.filter((member: any) => member.id !== deletedMember.id);
          return filtered;
        }
        return oldData;
      });

      // Keep server and all tabs in sync.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['group-balances', variables.groupId], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['groups'] }),
        queryClient.refetchQueries({ queryKey: ['group-members', variables.groupId], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['group-balances', variables.groupId], type: 'active' }),
      ]);

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
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['group-chats', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      try {
        const { data: messages, error: messagesError } = await supabase
          .from('group_chats')
          .select('id,group_id,user_id,message,created_at,updated_at')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (messagesError) throw messagesError;
        if (!messages || messages.length === 0) return [];

        const userIds = [...new Set(messages.map(m => m.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id,display_name,avatar_url')
          .in('user_id', userIds);

        if (profilesError) {
          logger.error('Error fetching profiles for chat:', profilesError);
        }

        const profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, any>);

        return messages.map(message => ({
          ...message,
          profiles: profileMap[message.user_id] || { user_id: message.user_id, display_name: null, avatar_url: null },
        })).reverse();
      } catch (error) {
        logger.error('Error fetching group chats:', error);
        throw error;
      }
    },
    enabled: !!groupId,
    staleTime: 0,              // always re-check when window refocuses
    refetchOnMount: 'always',  // always fresh on tab switch
  });

  // Per-group realtime subscription: injects new messages directly into the
  // cache via setQueryData — no network round-trip, appears in <100 ms.
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chats',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMsg = payload.new as {
            id: string; group_id: string; user_id: string;
            message: string; created_at: string; updated_at: string;
          };

          // Look up the sender's profile (cheap, single-row, cached by browser)
          let profile: { user_id: string; display_name: string | null; avatar_url: string | null } | null = null;
          try {
            const { data } = await supabase
              .from('profiles')
              .select('user_id,display_name,avatar_url')
              .eq('user_id', newMsg.user_id)
              .maybeSingle();
            profile = data;
          } catch { /* profile stays null, we show initials */ }

          const msgWithProfile = {
            ...newMsg,
            profiles: profile ?? { user_id: newMsg.user_id, display_name: null, avatar_url: null },
          };

          queryClient.setQueryData(['group-chats', groupId], (old: any[] | undefined) => {
            const current = old ?? [];
            // Deduplicate: if this message id is already in cache (e.g. from optimistic update), replace it
            const without = current.filter(m => m.id !== newMsg.id);
            return [...without, msgWithProfile];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId, queryClient]);

  return query;
}

// Send group chat message
export function useSendGroupChat() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { groupId: string; message: string }) => {
      if (!user) throw new Error('Not authenticated');
      if (!input.message.trim()) throw new Error('Message cannot be empty');

      // No membership pre-check — RLS enforces it on insert (saves 200-400ms per message)
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

    // Optimistic update: inject message into cache BEFORE the DB insert completes
    onMutate: async (input) => {
      // Cancel any in-flight refetches so they don't overwrite the optimistic entry
      await queryClient.cancelQueries({ queryKey: ['group-chats', input.groupId] });

      const previousChats = queryClient.getQueryData<any[]>(['group-chats', input.groupId]);

      const optimisticMessage = {
        id: `optimistic-${Date.now()}`,
        group_id: input.groupId,
        user_id: user!.id,
        message: input.message.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: { user_id: user!.id, display_name: null, avatar_url: null },
        _optimistic: true,
      };

      queryClient.setQueryData(['group-chats', input.groupId], (old: any[] | undefined) => [
        ...(old ?? []),
        optimisticMessage,
      ]);

      return { previousChats };
    },

    onSuccess: (savedMsg, input) => {
      // Replace the optimistic entry with the real DB row (has the real id)
      queryClient.setQueryData(['group-chats', input.groupId], (old: any[] | undefined) => {
        const current = old ?? [];
        // Remove our optimistic placeholder(s) and append the confirmed message
        const without = current.filter(m => !m._optimistic);
        return [
          ...without,
          {
            ...savedMsg,
            profiles: { user_id: user!.id, display_name: null, avatar_url: null },
          },
        ];
      });
      // The realtime INSERT event will arrive shortly and deduplicate via the
      // setQueryData in useGroupChats, adding the correct profile.
    },

    onError: (_err, input, context) => {
      // Roll back to pre-send state if the DB insert failed
      if (context?.previousChats !== undefined) {
        queryClient.setQueryData(['group-chats', input.groupId], context.previousChats);
      }
      const msg = _err instanceof Error ? _err.message : 'Failed to send message';
      logger.error('Chat error:', msg);
      throw _err;
    },
  });
}
