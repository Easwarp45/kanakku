import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useIncomeRecord, useUpdateIncome, useDeleteIncome } from '@/hooks/useIncome';
import { INCOME_SOURCE_CONFIG, type IncomeSource } from '@/types/income';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

export default function IncomeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { symbol, formatCurrency, convertFromBase, convertToBase } = useCurrency();
  const { data: income, isLoading } = useIncomeRecord(id);
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();

  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<IncomeSource>('salary');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (income) {
      const displayAmount = convertFromBase(income.amount);
      const roundedAmount = Math.round(displayAmount * 100) / 100;
      setAmount(roundedAmount.toString());
      setSource(income.source);
      setDescription(income.description || '');
      setDate(new Date(income.income_date));
      setIsRecurring(income.is_recurring);
    }
  }, [income, convertFromBase]);

  const handleUpdate = async () => {
    if (!id) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const amountInBaseCurrency = convertToBase(parsedAmount);

    await updateIncome.mutateAsync({
      id,
      amount: amountInBaseCurrency,
      source,
      description: description.trim() || undefined,
      income_date: format(date, 'yyyy-MM-dd'),
      is_recurring: isRecurring,
    });

    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteIncome.mutateAsync(id);
    navigate('/income');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!income) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Income record not found</p>
        <Button onClick={() => navigate('/income')}>Go back</Button>
      </div>
    );
  }

  const config = INCOME_SOURCE_CONFIG[income.source];

  if (!isEditing) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/income')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Income Details</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Income</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this income record? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-6">
          {/* Amount */}
          <div className="text-center py-6">
            <div className="text-4xl font-bold text-secondary">
              {formatCurrency(income.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-muted-foreground mt-2">
              {format(new Date(income.income_date), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white text-lg', config.color)}>
                {config.label.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="font-medium">{config.label}</p>
              </div>
            </div>

            {income.description && (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{income.description}</p>
              </div>
            )}

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Recurring</p>
              <p className="font-medium flex items-center gap-2">
                {income.is_recurring ? 'Monthly recurring' : 'One-time income'}
                {income.is_recurring && <RefreshCw className="h-4 w-4 text-muted-foreground" />}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Edit Income</h1>
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10 text-2xl font-semibold h-14"
              min="0.01"
              step="0.01"
            />
          </div>
        </div>

        {/* Source */}
        <div className="space-y-2">
          <Label>Source</Label>
          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 gap-2">
            {(Object.entries(INCOME_SOURCE_CONFIG) as [IncomeSource, typeof INCOME_SOURCE_CONFIG[IncomeSource]][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSource(key)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors',
                    source === key
                      ? 'border-secondary bg-secondary/10'
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-sm', cfg.color)}>
                    {cfg.label.charAt(0)}
                  </div>
                  <span className="text-xs text-center">{cfg.label}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
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

        {/* Recurring */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <p className="font-medium text-sm">Recurring Income</p>
            <p className="text-xs text-muted-foreground">This income repeats monthly</p>
          </div>
          <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
        </div>

        {/* Save */}
        <Button
          onClick={handleUpdate}
          className="w-full h-12 text-lg bg-secondary hover:bg-secondary/90"
          disabled={!amount || updateIncome.isPending}
        >
          {updateIncome.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
