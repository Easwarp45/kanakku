import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Contact,
  Share2, 
  Receipt,
  ArrowRightLeft,
  Copy,
  Check,
  Pencil,
  LogOut,
  X,
  Send,
  MessageSquare,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  useGroup,
  useGroupMembers,
  useGroupExpenses,
  useGroupBalances,
  useSettlements,
  useLeaveGroup,
  useRemoveGroupMember,
  useFindContactUsers,
  useAddGroupMemberByAdmin,
  useGroupChats,
  useSendGroupChat,
  useCheckMyMembership,
  useMemberRemovalListener
} from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { CATEGORY_CONFIG } from '@/types/expense';
import { cn } from '@/lib/utils';
import { useContacts } from '@/hooks/useContacts';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Generate a deterministic color from a string (for avatars)
function getAvatarColor(str: string): string {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
    'bg-amber-500', 'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

export default function GroupDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();

  const { data: group, isLoading: loadingGroup } = useGroup(id);
  const { data: members = [], isLoading: loadingMembers } = useGroupMembers(id);
  const { data: expenses = [] } = useGroupExpenses(id);
  const { balances, simplifiedDebts } = useGroupBalances(id);
  const { data: settlements = [] } = useSettlements(id);
  const { data: chats = [] } = useGroupChats(id);
  const leaveGroup = useLeaveGroup();
  const removeGroupMember = useRemoveGroupMember();
  const findContactUsers = useFindContactUsers();
  const addGroupMemberByAdmin = useAddGroupMemberByAdmin();
  const sendGroupChat = useSendGroupChat();
  const { isSupported: contactsSupported, isFetching: contactsFetching, fetchContacts } = useContacts();

  // useRef for the removal guard so concurrent effects don't create stale closures
  // that read an outdated `removed` value and fire duplicate toasts/navigations.
  const removedRef = useRef(false);
  const [removed, setRemoved] = useState(false);

  const [copied, setCopied] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const lastMessageSentAtRef = useRef(0);
  const [contactMatches, setContactMatches] = useState<Array<{
    user_id: string;
    display_name: string | null;
    phone_number: string | null;
    contact_name: string;
    is_member: boolean;
  }>>([]);

  // WebSocket-based real-time member removal detection
  // When removed, the DB trigger creates a notification that we receive instantly
  const handleRemoval = () => {
    if (!removedRef.current) {
      removedRef.current = true;
      setRemoved(true);
      logger.log('🚫 Real-time removal notification received');
      toast.error('You were removed from this group');
      setTimeout(() => navigate('/groups'), 2000);
    }
  };

  useMemberRemovalListener(id, handleRemoval);

  // Check membership on mount (fallback/initial check, not polling)
  const { data: isMember } = useCheckMyMembership(id);

  const isAdmin = group && user && group.created_by === user.id;

  // Initial membership check (fires once on mount)
  // If isMember is false from the start, user shouldn't be here
  useEffect(() => {
    if (isMember === false && !removedRef.current) {
      removedRef.current = true;
      setRemoved(true);
      logger.log('🚫 Initial membership check failed - user not a member');
      toast.error('You are not a member of this group');
      setTimeout(() => navigate('/groups'), 2000);
    }
  }, [isMember, navigate]);

  // SECONDARY kick detection: fires when the members list changes
  // (e.g. real-time event does fire, or members refetch catches the removal).
  // Runs even when members is empty — after the cache is cleared on removal,
  // the array becomes [] before the route changes, so we must not skip the check.
  useEffect(() => {
    if (!loadingMembers && user && !removedRef.current) {
      const isCurrentUserMember = members.some(m => m.user_id === user.id);

      // Only redirect if loading finished AND we have some evidence the list was fetched
      // (i.e. the query ran at least once). An empty list after a fetch = kicked out.
      if (!isCurrentUserMember && members !== undefined) {
        // Extra guard: if no members at all AND group is still loading, skip
        if (members.length === 0 && loadingGroup) return;

        removedRef.current = true;
        setRemoved(true);
        logger.log('User is not a member of this group - removing access');
        toast.error('You were removed from this group');

        setTimeout(() => {
          navigate('/groups');
        }, 2000);
      }
    }
  }, [members, user, loadingMembers, loadingGroup, navigate]);

  const copyInviteCode = () => {
    if (!group?.invite_code) return;

    const code = group.invite_code;

    // navigator.clipboard requires a secure context (HTTPS).
    // Fall back to the legacy execCommand approach for HTTP / localhost.
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        toast.success('Invite code copied!');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        toast.error('Failed to copy. Please copy manually.');
      });
    } else {
      // Legacy fallback
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (ok) {
        setCopied(true);
        toast.success('Invite code copied!');
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error('Failed to copy. Please copy manually.');
      }
    }
  };

  const handleLeave = async () => {
    if (id) {
      await leaveGroup.mutateAsync(id);
      navigate('/groups');
    }
  };

  const handleRemoveMember = async () => {
    if (!id || !memberToRemove) return;
    try {
      await removeGroupMember.mutateAsync({
        groupId: id,
        memberId: memberToRemove.id,
      });
      setMemberToRemove(null);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!id || !chatMessage.trim()) return;
    if (sendGroupChat.isPending) return;

    const now = Date.now();
    if (now - lastMessageSentAtRef.current < 600) return;
    lastMessageSentAtRef.current = now;
    
    // Verify user is still a member before sending message
    const isCurrentUserMember = members.some(m => m.user_id === user?.id);
    if (!isCurrentUserMember) {
      toast.error('You are no longer a member of this group');
      navigate('/groups');
      return;
    }
    
    await sendGroupChat.mutateAsync({
      groupId: id,
      message: chatMessage,
    });
    setChatMessage('');
  };

  const handleImportContactUsers = async () => {
    if (!id) return;

    if (!isAdmin) {
      toast.error('Only group admins can add members');
      return;
    }

    const pickedContacts = await fetchContacts();
    if (!pickedContacts.length) {
      toast.error(contactsSupported ? 'No contacts selected' : 'Contact picker not supported on this device');
      return;
    }

    const contactPhonePairs = pickedContacts.flatMap((contact) =>
      (contact.phones || []).map((phone) => ({
        phone,
        contactName: contact.name || 'Contact',
      }))
    );

    if (!contactPhonePairs.length) {
      toast.error('Selected contacts do not have phone numbers');
      return;
    }

    const uniquePhones = Array.from(new Set(contactPhonePairs.map((item) => item.phone)));
    const users = await findContactUsers.mutateAsync(uniquePhones);

    if (!users.length) {
      setContactMatches([]);
      toast.info('No Kanakku users found in selected contacts');
      return;
    }

    const nameByNormalizedPhone = new Map<string, string>();
    contactPhonePairs.forEach(({ phone, contactName }) => {
      const normalized = normalizePhoneNumber(phone);
      if (normalized && !nameByNormalizedPhone.has(normalized)) {
        nameByNormalizedPhone.set(normalized, contactName);
      }
    });

    const memberIds = new Set(members.map((member) => member.user_id));

    const mappedUsers = users.map((contactUser) => {
      const normalized = normalizePhoneNumber(contactUser.phone_number || '');
      return {
        ...contactUser,
        contact_name: nameByNormalizedPhone.get(normalized) || contactUser.display_name || 'Contact',
        is_member: memberIds.has(contactUser.user_id),
      };
    });

    const dedupedUsers = Array.from(
      new Map(mappedUsers.map((item) => [item.user_id, item])).values()
    );

    setContactMatches(dedupedUsers);

    const addableCount = dedupedUsers.filter((user) => !user.is_member).length;
    if (addableCount === 0) {
      toast.info('All matched contacts are already in this group');
      return;
    }

    toast.success(`Found ${addableCount} contact${addableCount > 1 ? 's' : ''} you can add`);
  };

  const handleAddContactMember = async (targetUserId: string) => {
    if (!id) return;

    const result = await addGroupMemberByAdmin.mutateAsync({
      groupId: id,
      userId: targetUserId,
    });

    if (!result.added) {
      if (result.reason === 'already_member') {
        toast.info('This user is already in the group');
      }
      return;
    }

    setContactMatches((prev) =>
      prev.map((item) =>
        item.user_id === targetUserId ? { ...item, is_member: true } : item
      )
    );
  };

  if (loadingGroup) {
    return (
      <div className="page-content min-h-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading group...</p>
        </div>
      </div>
    );
  }

  if (removed) {
    return (
      <div className="page-content min-h-full bg-background flex flex-col items-center justify-center gap-4 px-4">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <LogOut className="h-8 w-8 text-red-600" />
        </div>
        <p className="text-lg font-semibold text-center">You were removed from this group</p>
        <p className="text-sm text-muted-foreground text-center">The admin has removed you from the group. You can no longer access it.</p>
        <Button onClick={() => navigate('/groups')} className="mt-4">Back to Groups</Button>
      </div>
    );
  }

  if (!loadingGroup && !group) {
    // group is null after loading = user lost access (RLS denied the row)
    return (
      <div className="page-content min-h-full bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Group not found or access denied</p>
        <Button onClick={() => navigate('/groups')}>Go back</Button>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const myBalance = balances.find(b => b.user_id === user?.id)?.balance || 0;

  // Helper to get member display name
  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    if (!member) return 'Unknown';
    return member.nickname || member.profile?.display_name || `Member`;
  };

  return (
    <div className="page-content min-h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/groups')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{group.name}</h1>
              <p className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={copyInviteCode} title="Copy invite code">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-destructive" title="Leave group">
                  <LogOut className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Group</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave this group? You'll need an invite code to rejoin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeave} className="bg-destructive text-destructive-foreground">
                    Leave
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-xl font-bold">{formatCurrency(totalExpenses, { maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
        <Card className={cn(
          myBalance >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
        )}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Your Balance</p>
            <p className={cn(
              'text-xl font-bold flex items-center gap-0.5',
              myBalance >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {myBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(myBalance), { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Button */}
      <div className="px-4">
        <Button 
          className="w-full gap-2 rounded-xl" 
          onClick={() => navigate(`/groups/${id}/add-expense`)}
        >
          <Plus className="h-4 w-4" />
          Add Group Expense
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="mt-4">
        <TabsList className="grid w-full grid-cols-4 mx-4" style={{ width: 'calc(100% - 2rem)' }}>
          <TabsTrigger value="expenses" className="gap-1 text-xs">
            <Receipt className="h-3.5 w-3.5 shrink-0" />
            <span>Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="balances" className="gap-1 text-xs">
            <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
            <span>Balances</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1 text-xs">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>Members</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1 text-xs font-semibold" title="Group Chat">
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            <span>Chat</span>
          </TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="p-4 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Total Expenses: <span className="text-primary">{formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0), { maximumFractionDigits: 0 })}</span>
            </h3>
          </div>
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">No expenses yet</p>
              <p className="text-sm text-muted-foreground">Add your first group expense to get started!</p>
            </div>
          ) : (
            expenses.map((expense) => {
              const config = CATEGORY_CONFIG[expense.category];
              const payerName = getMemberName(expense.paid_by);
              const isPayer = expense.paid_by === user?.id;
              const canEdit = isPayer || isAdmin;

              return (
                <Card key={expense.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 text-sm font-bold',
                        config.color
                      )}>
                        {config.label.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{expense.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Paid by{' '}
                          <span className={cn('font-semibold', isPayer && 'text-primary')}>
                            {isPayer ? 'You' : payerName}
                          </span>
                          {' '}on {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <p className="font-bold text-primary text-sm">{formatCurrency(expense.amount, { maximumFractionDigits: 0 })}</p>
                        <p className="text-xs text-muted-foreground">{expense.category}</p>
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(`/groups/${id}/expenses/${expense.id}/edit`)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Balances Tab */}
        <TabsContent value="balances" className="p-4 space-y-4">
          {simplifiedDebts.length === 0 ? (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="py-10 text-center">
                <p className="text-4xl mb-2">✨</p>
                <p className="font-bold text-green-400">All Settled Up!</p>
                <p className="text-sm text-green-400/70 mt-1">Everyone has paid their share perfectly</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                <h3 className="font-bold text-lg">💰 Pending Settlements</h3>
                <p className="text-xs text-muted-foreground">Below are people who need to pay or receive money</p>
              </div>
              {simplifiedDebts.map((debt, idx) => {
                const isYourDebt = debt.from_user_id === user?.id;
                return (
                  <Card key={idx} className={cn(
                    'border-2 transition-all',
                    isYourDebt ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'
                  )}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold', getAvatarColor(debt.from_user_id))}>
                            {debt.from_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm">
                              {isYourDebt ? '📤 You owe' : `${debt.from_name} owes`}
                            </p>
                          </div>
                          <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold', getAvatarColor(debt.to_user_id))}>
                            {debt.to_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm">
                              {debt.to_user_id === user?.id ? '📥 You' : debt.to_name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Amount to settle</p>
                            <p className={cn('font-bold text-lg', isYourDebt ? 'text-red-600' : 'text-green-600')}>
                              {formatCurrency(debt.amount, { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                          {isYourDebt && (
                            <Button 
                              size="sm" 
                              className="ml-2"
                              onClick={() => {
                                navigate(`/groups/${id}/settle?to=${debt.to_user_id}&amount=${debt.amount}`);
                              }}
                            >
                              Mark Settled
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-4">
                  <p className="text-xs text-blue-400 font-medium">💡 Tip:</p>
                  <p className="text-xs text-blue-400/70 mt-1">Use UPI, bank transfer, or Paytm to settle payments. Mark as settled once paid.</p>
                </CardContent>
              </Card>
            </>
          )}

          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-4">Member Balances</h3>
          {balances.map((balance) => (
            <Card key={balance.user_id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm', getAvatarColor(balance.user_id))}>
                    {balance.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {balance.user_id === user?.id ? 'You' : balance.display_name}
                    </p>
                    {balance.user_id === user?.id && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">You</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'text-[10px] font-medium',
                    balance.balance >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {balance.balance >= 0 ? 'Gets back' : 'Owes'}
                  </p>
                  <span className={cn(
                    'font-semibold flex items-center text-sm',
                    balance.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(Math.abs(balance.balance), { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

            {settlements.length > 0 && (
              <>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-4">Recent Settlements</h3>
                {settlements.slice(0, 6).map((s) => {
                  const payer = members.find(m => m.user_id === s.paid_by);
                  const receiver = members.find(m => m.user_id === s.paid_to);
                  const payerName = payer?.nickname || payer?.profile?.display_name || 'Unknown';
                  const receiverName = receiver?.nickname || receiver?.profile?.display_name || 'Unknown';

                  return (
                    <Card key={s.id}>
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">{payerName} → {receiverName}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(s.settled_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(s.amount, { maximumFractionDigits: 0 })}
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="p-4 space-y-3">
          {/* Invite Code Section */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                Group Invite Code
              </CardTitle>
              <CardDescription className="text-xs">Share to add new members</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <Button 
                variant="outline" 
                className="w-full font-mono text-2xl tracking-widest font-bold gap-2 py-6 bg-background hover:bg-primary/10 rounded-xl"
                onClick={copyInviteCode}
              >
                {group?.invite_code}
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
              {copied && (
                <p className="text-center text-xs text-green-600 font-medium">✓ Copied to clipboard!</p>
              )}

              {isAdmin && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={handleImportContactUsers}
                  disabled={contactsFetching || findContactUsers.isPending || addGroupMemberByAdmin.isPending}
                >
                  <Contact className="h-4 w-4" />
                  {contactsFetching || findContactUsers.isPending ? 'Reading contacts...' : 'Add Members From Contacts'}
                </Button>
              )}

              {isAdmin && !contactsSupported && (
                <p className="text-xs text-muted-foreground text-center">
                  Contact picker is not supported on this device. Share the invite code instead.
                </p>
              )}
            </CardContent>
          </Card>

          {isAdmin && contactMatches.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Contacts On Kanakku</CardTitle>
                <CardDescription className="text-xs">Add matched contacts directly to this group</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {contactMatches.map((contactUser) => (
                  <div key={contactUser.user_id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{contactUser.contact_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {contactUser.display_name || 'Kanakku user'}
                        {contactUser.phone_number ? ` • ${contactUser.phone_number}` : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={contactUser.is_member ? 'secondary' : 'default'}
                      disabled={contactUser.is_member || addGroupMemberByAdmin.isPending}
                      onClick={() => handleAddContactMember(contactUser.user_id)}
                    >
                      {contactUser.is_member ? 'Added' : 'Add'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide px-1">
              Members ({members.length})
            </h3>
            {loadingMembers ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-4">No members in group</p>
            ) : (
              members.map((member) => {
                const displayName = member.nickname || member.profile?.display_name || null;
                const avatarInitial = (displayName || 'M').charAt(0).toUpperCase();
                const avatarColor = getAvatarColor(member.user_id);
                const isCurrentUser = member.user_id === user?.id;
                const isMemberAdmin = member.user_id === group?.created_by;
                
                return (
                  <Card key={member.id} className={cn('hover:bg-muted/50 transition-colors', isCurrentUser && 'border-primary/30 bg-primary/5')}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shrink-0', avatarColor)}>
                        {avatarInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">
                            {displayName || 'Member'}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">You</Badge>
                          )}
                          {isMemberAdmin && (
                            <Badge className="text-[10px] h-4 px-1.5 bg-amber-500/20 text-amber-700 border-amber-500/30 gap-1">
                              <Crown className="h-2.5 w-2.5" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Joined {member.created_at ? format(new Date(member.created_at), 'MMM d, yyyy') : 'Recently'}
                        </p>
                      </div>
                      {isAdmin && !isCurrentUser && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 p-0 rounded-full"
                              onClick={() => setMemberToRemove({ 
                                id: member.id, 
                                name: displayName || 'Member'
                              })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {memberToRemove?.name} from the group?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleRemoveMember}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex flex-col min-h-0 flex-1">
          {/* Messages */}
          <div className="flex-1 min-h-0 p-4 space-y-3">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">No messages yet</p>
                <p className="text-sm text-muted-foreground">Start the conversation!</p>
              </div>
            ) : (
              chats.map((chat: any) => {
                const isMe = chat.user_id === user?.id;
                const senderName = isMe 
                  ? 'You' 
                  : (chat.profiles?.display_name || getMemberName(chat.user_id));
                const avatarColor = getAvatarColor(chat.user_id);
                const avatarInitial = senderName.charAt(0).toUpperCase();

                return (
                  <div key={chat.id} className={cn('flex gap-2', isMe && 'flex-row-reverse')}>
                    <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', avatarColor)}>
                      {avatarInitial}
                    </div>
                    <div className={cn('max-w-[75%]', isMe && 'items-end flex flex-col')}>
                      {!isMe && (
                        <p className="text-xs text-muted-foreground font-medium mb-1">{senderName}</p>
                      )}
                      <div className={cn(
                        'px-3 py-2 rounded-2xl text-sm',
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-muted rounded-tl-sm'
                      )}>
                        {chat.message}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(chat.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input - hidden for non-members */}
          {members.some(m => m.user_id === user?.id) ? (
            <div className="p-4 border-t bg-background flex gap-2">
              <Input
                placeholder="Type a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button 
                size="icon" 
                onClick={handleSendMessage}
                disabled={!chatMessage.trim() || sendGroupChat.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="p-4 border-t bg-background text-center text-sm text-muted-foreground">
              You are no longer a member of this group.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
