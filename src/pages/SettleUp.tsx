import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, IndianRupee, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useGroupMembers, useRecordSettlement, useSettlements } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SettleUp() {
  const navigate = useNavigate();
  const { id: groupId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const { data: members = [] } = useGroupMembers(groupId);
  const { data: settlements = [] } = useSettlements(groupId);
  const recordSettlement = useRecordSettlement();

  const preselectedTo = searchParams.get('to');
  const preselectedAmount = searchParams.get('amount');

  const [selectedMember, setSelectedMember] = useState<string>(preselectedTo || '');
  const [amount, setAmount] = useState(preselectedAmount || '');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (preselectedTo) setSelectedMember(preselectedTo);
    if (preselectedAmount) setAmount(preselectedAmount);
  }, [preselectedTo, preselectedAmount]);

  const otherMembers = members.filter(m => m.user_id !== user?.id);
  const selectedMemberData = members.find(m => m.user_id === selectedMember);

  const handleSubmit = async () => {
    if (!groupId || !selectedMember || !parseFloat(amount)) return;

    await recordSettlement.mutateAsync({
      group_id: groupId,
      paid_to: selectedMember,
      amount: parseFloat(amount),
      note: note.trim() || undefined,
    });

    navigate(`/groups/${groupId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Record Settlement</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Select Member */}
        <div className="space-y-2">
          <Label>Pay To</Label>
          <div className="grid grid-cols-2 gap-2">
            {otherMembers.map((member) => {
              const displayName = member.nickname || member.profile?.display_name || 'Unknown';
              const isSelected = selectedMember === member.user_id;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMember(member.user_id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border-2 transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm truncate">{displayName}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10 text-2xl font-semibold h-14"
              min="0.01"
              step="0.01"
            />
          </div>
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            placeholder="e.g., Paid via UPI"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </div>

        {/* Preview */}
        {selectedMember && parseFloat(amount) > 0 && (
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">You are recording a payment of</p>
              <p className="text-2xl font-bold flex items-center justify-center text-green-600 my-2">
                <IndianRupee className="h-6 w-6" />
                {parseFloat(amount).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-muted-foreground">
                to {selectedMemberData?.nickname || selectedMemberData?.profile?.display_name || 'Unknown'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          className="w-full h-12 text-lg"
          disabled={!selectedMember || !parseFloat(amount) || recordSettlement.isPending}
        >
          {recordSettlement.isPending ? 'Recording...' : 'Record Payment'}
        </Button>

        {/* Recent Settlements */}
        {settlements.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold">Recent Settlements</h2>
            {settlements.slice(0, 5).map((settlement) => {
              const payer = members.find(m => m.user_id === settlement.paid_by);
              const receiver = members.find(m => m.user_id === settlement.paid_to);
              const payerName = payer?.nickname || payer?.profile?.display_name || 'Unknown';
              const receiverName = receiver?.nickname || receiver?.profile?.display_name || 'Unknown';

              return (
                <Card key={settlement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {payerName} → {receiverName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(settlement.settled_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className="font-semibold flex items-center text-green-600">
                        <IndianRupee className="h-4 w-4" />
                        {settlement.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
