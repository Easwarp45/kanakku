import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useGroupMembers, useGroupExpense, useUpdateGroupExpense } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { CATEGORY_CONFIG, type ExpenseCategory } from '@/types/expense';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function EditGroupExpense() {
  const navigate = useNavigate();
  const { id: groupId, expenseId } = useParams();
  const { user } = useAuth();
  const { symbol, formatLocalCurrency, convertToBase, convertFromBase } = useCurrency();
  const { data: members = [] } = useGroupMembers(groupId);
  const { data: expense, isLoading } = useGroupExpense(expenseId);
  const updateExpense = useUpdateGroupExpense();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [date, setDate] = useState<Date>(new Date());
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (expense) {
      const localAmount = convertFromBase(expense.amount);
      setAmount(localAmount.toString());
      setDescription(expense.description || '');
      setCategory(expense.category);
      setDate(new Date(expense.expense_date));
      setIsCustomSplit(expense.split_type === 'custom');

      const memberIds = Array.from(new Set((expense.splits || []).filter(s => Number(s.amount) > 0).map(s => s.user_id)));
      setSelectedMembers(memberIds);

      if (expense.split_type === 'custom' && expense.splits) {
        const next: Record<string, string> = {};
        expense.splits
          .filter(s => Number(s.amount) > 0)
          .forEach(s => {
            next[s.user_id] = convertFromBase(s.amount).toString();
        });
        setCustomAmounts(next);
      }
    }
  }, [expense, convertFromBase]);

  // Initialize selected members with all members if none and expense not loaded yet
  useEffect(() => {
    if (!expense && members.length > 0 && selectedMembers.length === 0) {
      setSelectedMembers(members.map(m => m.user_id));
    }
  }, [expense, members, selectedMembers.length]);

  const parsedAmount = parseFloat(amount) || 0;
  const selectedCount = selectedMembers.length;
  const equalShare = useMemo(() => (selectedCount > 0 ? parsedAmount / selectedCount : 0), [parsedAmount, selectedCount]);

  const customTotal = useMemo(() => Object.values(customAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0), [customAmounts]);

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleCustomAmountChange = (userId: string, value: string) => {
    setCustomAmounts(prev => ({ ...prev, [userId]: value }));
  };

  const handleEqualAutofill = () => {
    if (!isCustomSplit || !selectedCount || !parsedAmount) return;
    const equal = (parsedAmount / selectedCount).toFixed(2);
    const next: Record<string, string> = {};
    selectedMembers.forEach(id => { next[id] = equal; });
    setCustomAmounts(next);
  };

  const handleSubmit = async () => {
    if (!groupId || !expenseId || !parsedAmount || !description.trim() || selectedCount === 0) return;

    const totalAmountInBaseCurrency = convertToBase(parsedAmount);
    const equalShareInBaseCurrency = selectedCount > 0 ? totalAmountInBaseCurrency / selectedCount : 0;

    const splits = selectedMembers.map(userId => ({
      user_id: userId,
      amount: isCustomSplit ? convertToBase(parseFloat(customAmounts[userId] || '0')) : equalShareInBaseCurrency,
    }));

    await updateExpense.mutateAsync({
      expense_id: expenseId,
      group_id: groupId,
      amount: totalAmountInBaseCurrency,
      description: description.trim(),
      category,
      expense_date: format(date, 'yyyy-MM-dd'),
      split_type: isCustomSplit ? 'custom' : 'equal',
      splits,
    });

    navigate(`/groups/${groupId}`);
  };

  if (isLoading || !expense) {
    return (
      <div className="page-content min-h-full bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading expense...</p>
      </div>
    );
  }

  const isPayer = expense.paid_by === user?.id;

  if (!isPayer) {
    toast.error('Only the payer can edit this expense');
    navigate(`/groups/${groupId}`);
    return null;
  }

  return (
    <div className="page-content min-h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Edit Group Expense</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{symbol}</span>
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

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What was this expense for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 gap-2">
            {(Object.entries(CATEGORY_CONFIG) as [ExpenseCategory, typeof CATEGORY_CONFIG[ExpenseCategory]][]).map(
              ([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors',
                    category === key
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-sm', config.color)}>
                    {config.label.charAt(0)}
                  </div>
                  <span className="text-xs text-center">{config.label}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {format(date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Split Options */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <Label>Split Between</Label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="custom-split" className="text-sm">Custom amounts</Label>
              <Switch
                id="custom-split"
                checked={isCustomSplit}
                onCheckedChange={setIsCustomSplit}
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0 divide-y">
              {members.map((member) => {
                const isSelected = selectedMembers.includes(member.user_id);
                const displayName = member.nickname || member.profile?.display_name || 'Member';
                const isCurrentUser = member.user_id === user?.id;

                return (
                  <div key={member.id} className="flex items-center gap-3 p-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleMemberToggle(member.user_id)}
                    />
                    <div className="flex-1">
                      <span className="font-medium">{displayName}</span>
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground ml-2">(You)</span>
                      )}
                    </div>
                    {isSelected && (
                      isCustomSplit ? (
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">{symbol}</span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={customAmounts[member.user_id] || ''}
                            onChange={(e) => handleCustomAmountChange(member.user_id, e.target.value)}
                            className="h-8 pl-6 text-sm"
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">{formatLocalCurrency(equalShare, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      )
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {isCustomSplit && parsedAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <p className={cn(
                Math.abs(customTotal - parsedAmount) < 0.01 ? 'text-green-600' : 'text-red-600'
              )}>
                {Math.abs(customTotal - parsedAmount) < 0.01 
                  ? '✓ Amounts match total'
                  : `${formatLocalCurrency(parsedAmount - customTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining`
                }
              </p>
              <Button variant="ghost" size="sm" onClick={handleEqualAutofill}>
                Fill equally
              </Button>
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          className="w-full h-12 text-lg"
          disabled={
            !parsedAmount || 
            !description.trim() || 
            selectedCount === 0 ||
            (isCustomSplit && Math.abs(customTotal - parsedAmount) > 0.01) ||
            updateExpense.isPending
          }
        >
          {updateExpense.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
