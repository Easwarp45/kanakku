import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useCreateIncome } from '@/hooks/useIncome';
import { useCurrency } from '@/hooks/useCurrency';
import { INCOME_SOURCE_CONFIG, type IncomeSource } from '@/types/income';
import { cn } from '@/lib/utils';

export default function AddIncome() {
  const navigate = useNavigate();
  const createIncome = useCreateIncome();
  const { symbol, convertToBase } = useCurrency();

  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<IncomeSource>('salary');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const amountInBaseCurrency = convertToBase(parsedAmount);

    await createIncome.mutateAsync({
      amount: amountInBaseCurrency,
      source,
      description: description.trim() || undefined,
      income_date: format(date, 'yyyy-MM-dd'),
      is_recurring: isRecurring,
    });

    navigate('/dashboard');
  };

  return (
    <div className="page-content min-h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Add Income</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
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
              required
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
              ([key, config]) => (
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
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-sm', config.color)}>
                    {config.label.charAt(0)}
                  </div>
                  <span className="text-xs text-center">{config.label}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            placeholder="What is this income from?"
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
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
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

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 text-lg bg-secondary hover:bg-secondary/90"
          disabled={!amount || createIncome.isPending}
        >
          {createIncome.isPending ? 'Saving...' : 'Save Income'}
        </Button>
      </form>
    </div>
  );
}
