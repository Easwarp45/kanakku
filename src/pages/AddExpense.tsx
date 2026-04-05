import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateExpense } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORY_CONFIG, PAYMENT_METHOD_CONFIG, type ExpenseCategory, type PaymentMethod } from '@/types/expense';
import { getCategoryIcon } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import { uploadReceipt } from '@/lib/receiptStorage';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';

export default function AddExpense() {
  const navigate = useNavigate();
  const createExpense = useCreateExpense();
  const { user } = useAuth();
  const { symbol, convertToBase } = useCurrency();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [date, setDate] = useState<Date>(new Date());
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptFile) {
      setReceiptPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(receiptFile);
    setReceiptPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [receiptFile]);

  const handleReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setReceiptFile(null);
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Only images or PDF receipts are supported.');
      event.target.value = '';
      return;
    }

    setReceiptFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const amountInBaseCurrency = convertToBase(parsedAmount);

    if (receiptFile && !navigator.onLine) {
      toast.error('Receipt upload requires an internet connection.');
      return;
    }

    let receiptUrl: string | undefined;
    if (receiptFile) {
      if (!user) {
        toast.error('You must be signed in to upload a receipt.');
        return;
      }

      try {
        toast.loading('Uploading receipt...');
        receiptUrl = await uploadReceipt({ file: receiptFile, userId: user.id });
        toast.success('Receipt uploaded successfully!');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload receipt';
        console.error('Receipt upload error:', error);
        toast.error(errorMessage);
        return;
      }
    }

    await createExpense.mutateAsync({
      amount: amountInBaseCurrency,
      category,
      description: description.trim() || undefined,
      payment_method: paymentMethod,
      expense_date: format(date, 'yyyy-MM-dd'),
      receipt_url: receiptUrl,
    });

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Add Expense</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Amount Input */}
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

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 gap-2">
            {(Object.entries(CATEGORY_CONFIG) as [ExpenseCategory, typeof CATEGORY_CONFIG[ExpenseCategory]][]).map(
              ([key, config]) => {
                const IconComponent = getCategoryIcon(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                      category === key
                        ? 'border-primary bg-primary/10 scale-105'
                        : 'border-border hover:border-muted-foreground/30'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white', config.color)}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-center font-medium">{config.label}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            placeholder="What was this expense for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Receipt */}
        <div className="space-y-2">
          <Label htmlFor="receipt">Receipt (optional)</Label>
          <Input
            id="receipt"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleReceiptChange}
          />
          {receiptFile && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{receiptFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReceiptFile(null)}
                >
                  Remove
                </Button>
              </div>
              {receiptPreview && receiptFile.type.startsWith('image/') && (
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="w-full max-h-56 object-cover rounded-md"
                />
              )}
              {receiptPreview && receiptFile.type === 'application/pdf' && (
                <a
                  href={receiptPreview}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline"
                >
                  Preview PDF
                </a>
              )}
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(PAYMENT_METHOD_CONFIG) as [PaymentMethod, typeof PAYMENT_METHOD_CONFIG[PaymentMethod]][]).map(
                ([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
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

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 text-lg"
          disabled={!amount || createExpense.isPending}
        >
          {createExpense.isPending ? 'Saving...' : 'Save Expense'}
        </Button>
      </form>
    </div>
  );
}
