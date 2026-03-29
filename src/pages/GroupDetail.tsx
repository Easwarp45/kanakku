import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Share2, 
  IndianRupee,
  Receipt,
  ArrowRightLeft,
  Copy,
  Check,
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
  useLeaveGroup,
  useRemoveGroupMember,
  useGroupChats,
  useSendGroupChat,
  useCheckMyMembership
} from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORY_CONFIG } from '@/types/expense';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/layout/BottomNav';
import { toast } from 'sonner';

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

export default function GroupDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  
  const { data: group, isLoading: loadingGroup } = useGroup(id);
  const { data: members = [], isLoading: loadingMembers } = useGroupMembers(id);
  const { data: expenses = [] } = useGroupExpenses(id);
  const { balances, simplifiedDebts } = useGroupBalances(id);
  const { data: chats = [] } = useGroupChats(id);
  const leaveGroup = useLeaveGroup();
  const removeGroupMember = useRemoveGroupMember();
  const sendGroupChat = useSendGroupChat();

  // Poll membership every 5 seconds — the definitive kick detection.
  // Supabase Realtime does NOT deliver DELETE events to users who have lost
  // their RLS access, so we cannot rely on real-time. This SECURITY DEFINER
  // RPC call bypasses RLS and always reflects current DB truth.
  const { data: isMember } = useCheckMyMembership(id);

  const [copied, setCopied] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [removed, setRemoved] = useState(false);

  const isAdmin = group && user && group.created_by === user.id;

  // PRIMARY kick detection: fires when the polling hook detects removal.
  // isMember starts as undefined (loading), then becomes true/false.
  // We only act when it explicitly becomes false (not undefined).
  useEffect(() => {
    if (isMember === false && !removed) {
      console.log('🚫 Membership polling detected removal from group');
      setRemoved(true);
      toast.error('You were removed from this group');
      setTimeout(() => navigate('/groups'), 2000);
    }
  }, [isMember, removed, navigate]);

  // SECONDARY kick detection: fires when the members list changes
  // (e.g. real-time event does fire, or members refetch catches the removal).
  // Runs even when members is empty — after the cache is cleared on removal,
  // the array becomes [] before the route changes, so we must not skip the check.
  useEffect(() => {
    if (!loadingMembers && user && !removed) {
      const isCurrentUserMember = members.some(m => m.user_id === user.id);

      // Only redirect if loading finished AND we have some evidence the list was fetched
      // (i.e. the query ran at least once). An empty list after a fetch = kicked out.
      if (!isCurrentUserMember && members !== undefined) {
        // Extra guard: if no members at all AND group is still loading, skip
        if (members.length === 0 && loadingGroup) return;

        console.log('User is not a member of this group - removing access');
        setRemoved(true);
        toast.error('You were removed from this group');

        setTimeout(() => {
          navigate('/groups');
        }, 2000);
      }
    }
  }, [members, user, loadingMembers, loadingGroup, navigate, removed]);

  const copyInviteCode = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
      toast.success('Invite code copied!');
      setTimeout(() => setCopied(false), 2000);
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

  if (loadingGroup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading group...</p>
        </div>
      </div>
    );
  }

  if (removed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
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
    <div className="min-h-screen bg-background pb-20">
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
            <p className="text-xl font-bold flex items-center gap-0.5">
              <IndianRupee className="h-5 w-5" />
              {totalExpenses.toLocaleString('en-IN')}
            </p>
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
              {myBalance >= 0 ? '+' : '-'}
              <IndianRupee className="h-5 w-5" />
              {Math.abs(myBalance).toLocaleString('en-IN')}
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
          <TabsTrigger value="expenses" className="gap-1 text-xs sm:text-sm">
            <Receipt className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="balances" className="gap-1 text-xs sm:text-sm">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Balances</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1 text-xs sm:text-sm font-semibold" title="Group Chat">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="p-4 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Total Expenses: <span className="text-primary">₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}</span>
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
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary flex items-center justify-end gap-1 text-sm">
                          <IndianRupee className="h-3.5 w-3.5" />
                          {expense.amount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{expense.category}</p>
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
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-10 text-center">
                <p className="text-4xl mb-2">✨</p>
                <p className="font-bold text-green-900">All Settled Up!</p>
                <p className="text-sm text-green-700 mt-1">Everyone has paid their share perfectly</p>
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
                            <p className={cn(
                              'font-bold text-lg flex items-center gap-1',
                              isYourDebt ? 'text-red-600' : 'text-green-600'
                            )}>
                              <IndianRupee className="h-4 w-4" />
                              {debt.amount.toLocaleString('en-IN')}
                            </p>
                          </div>
                          {isYourDebt && (
                            <Button 
                              size="sm" 
                              className="ml-2"
                              onClick={() => {
                                toast.info('Feature coming soon: Settle payments directly from app');
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
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <p className="text-xs text-blue-900 font-medium">💡 Tip:</p>
                  <p className="text-xs text-blue-800 mt-1">Use UPI, bank transfer, or Paytm to settle payments. Mark as settled once paid.</p>
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
                <span className={cn(
                  'font-semibold flex items-center text-sm',
                  balance.balance >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {balance.balance >= 0 ? '+' : '-'}
                  <IndianRupee className="h-3.5 w-3.5" />
                  {Math.abs(balance.balance).toLocaleString('en-IN')}
                </span>
              </CardContent>
            </Card>
          ))}
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
            </CardContent>
          </Card>

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
        <TabsContent value="chat" className="flex flex-col" style={{ height: 'calc(100vh - 340px)' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

      <BottomNav />
    </div>
  );
}
