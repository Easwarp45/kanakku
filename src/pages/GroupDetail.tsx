import { useState } from 'react';
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
  MessageSquare
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
  useSendGroupChat
} from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORY_CONFIG } from '@/types/expense';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/layout/BottomNav';
import { toast } from 'sonner';

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

  const [copied, setCopied] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);

  const isAdmin = group && user && group.created_by === user.id;

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
      // Error is already handled by toast in mutation
      console.error('Failed to remove member:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!id || !chatMessage.trim()) return;
    await sendGroupChat.mutateAsync({
      groupId: id,
      message: chatMessage,
    });
    setChatMessage('');
  };

  if (loadingGroup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading group...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Group not found</p>
        <Button onClick={() => navigate('/groups')}>Go back</Button>
      </div>
    );
  }


  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const myBalance = balances.find(b => b.user_id === user?.id)?.balance || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/groups')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{group.name}</h1>
              <p className="text-xs text-muted-foreground">{members.length} members</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={copyInviteCode}>
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-destructive">
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
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-bold flex items-center">
              <IndianRupee className="h-5 w-5" />
              {totalExpenses.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(
          myBalance >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
        )}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Your Balance</p>
            <p className={cn(
              'text-xl font-bold flex items-center',
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
          className="w-full gap-2" 
          onClick={() => navigate(`/groups/${id}/add-expense`)}
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="mt-4">
        <TabsList className="grid w-full grid-cols-3 mx-4" style={{ width: 'calc(100% - 2rem)' }}>
          <TabsTrigger value="expenses" className="gap-1">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="balances" className="gap-1">
            <ArrowRightLeft className="h-4 w-4" />
            Balances
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="p-4 space-y-3">
          {expenses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No expenses yet. Add your first expense!
              </CardContent>
            </Card>
          ) : (
            expenses.map((expense) => {
              const config = CATEGORY_CONFIG[expense.category];
              const payer = members.find(m => m.user_id === expense.paid_by);
              const payerName = payer?.nickname || payer?.profile?.display_name || 'Unknown';

              return (
                <Card key={expense.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0',
                        config.color
                      )}>
                        {config.label.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Paid by {payerName} • {format(new Date(expense.expense_date), 'MMM d')}
                        </p>
                      </div>
                      <p className="font-semibold flex items-center">
                        <IndianRupee className="h-4 w-4" />
                        {expense.amount.toLocaleString('en-IN')}
                      </p>
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
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                All settled up! 🎉
              </CardContent>
            </Card>
          ) : (
            <>
              <h3 className="font-semibold">Who Owes Whom</h3>
              {simplifiedDebts.map((debt, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{debt.from_name}</span>
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{debt.to_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold flex items-center text-red-600">
                        <IndianRupee className="h-4 w-4" />
                        {debt.amount.toLocaleString('en-IN')}
                      </span>
                      {debt.from_user_id === user?.id && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/groups/${id}/settle?to=${debt.to_user_id}&amount=${debt.amount}`)}
                        >
                          Settle
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          <h3 className="font-semibold mt-6">Member Balances</h3>
          {balances.map((balance) => (
            <Card key={balance.user_id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{balance.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{balance.display_name}</span>
                  {balance.user_id === user?.id && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                </div>
                <span className={cn(
                  'font-semibold flex items-center',
                  balance.balance >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {balance.balance >= 0 ? '+' : '-'}
                  <IndianRupee className="h-4 w-4" />
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Invite Code</CardTitle>
              <CardDescription>Share this code to add members to the group</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full font-mono text-2xl tracking-widest font-bold gap-2 py-6 bg-background hover:bg-primary/10"
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
                <p className="text-center text-sm text-green-600 font-medium animate-pulse">✓ Code copied!</p>
              )}
            </CardContent>
          </Card>

          {/* Members List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm px-2">Members ({members.length})</h3>
            {loadingMembers ? (
              <p className="text-sm text-muted-foreground px-2 py-4">Loading members...</p>
            ) : (
              members.map((member) => (
                <Card key={member.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {(member.nickname || member.profile?.display_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {member.nickname || member.profile?.display_name || `User ${member.user_id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {member.created_at ? format(new Date(member.created_at), 'MMM d, yyyy') : 'Recently'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.user_id === user?.id && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                      {member.user_id === group?.created_by && (
                        <Badge className="text-xs">Admin</Badge>
                      )}
                      {isAdmin && member.user_id !== user?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setMemberToRemove({ 
                                id: member.id, 
                                name: member.nickname || member.profile?.display_name || `User ${member.user_id.slice(0, 8)}`
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
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  );
}
