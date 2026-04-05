import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORY_CONFIG, PAYMENT_METHOD_CONFIG, type ExpenseCategory, type PaymentMethod } from '@/types/expense';
import { cn } from '@/lib/utils';
import { uploadReceipt } from '@/lib/receiptStorage';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';

export default function ExpenseDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { symbol, formatCurrency, convertFromBase, convertToBase } = useCurrency();
  const { data: expense, isLoading } = useExpense(id);
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [date, setDate] = useState<Date>(new Date());
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);

  useEffect(() => {
    if (expense) {
      const displayAmount = convertFromBase(expense.amount);
      const roundedAmount = Math.round(displayAmount * 100) / 100;
      setAmount(roundedAmount.toString());
      setCategory(expense.category);
      setDescription(expense.description || '');
      setPaymentMethod(expense.payment_method);
      setDate(new Date(expense.expense_date));
      setReceiptFile(null);
      setRemoveReceipt(false);
    }
  }, [expense, convertFromBase]);

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
    setRemoveReceipt(false);
  };

  const handleUpdate = async () => {
    if (!id) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const amountInBaseCurrency = convertToBase(parsedAmount);

    if (receiptFile && !navigator.onLine) {
      toast.error('Receipt upload requires an internet connection.');
      return;
    }

    let receiptUrl: string | null | undefined;
    if (receiptFile) {
      if (!user) {
        toast.error('You must be signed in to upload a receipt.');
        return;
      }

      try {
        receiptUrl = await uploadReceipt({ file: receiptFile, userId: user.id, expenseId: id });
      } catch (error) {
        toast.error('Failed to upload receipt. Please try again.');
        return;
      }
    } else if (removeReceipt) {
      receiptUrl = null;
    }

    await updateExpense.mutateAsync({
      id,
      amount: amountInBaseCurrency,
      category,
      description: description.trim() || undefined,
      payment_method: paymentMethod,
      expense_date: format(date, 'yyyy-MM-dd'),
      receipt_url: receiptUrl,
    });

    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteExpense.mutateAsync(id);
    navigate('/expenses');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Expense not found</p>
        <Button onClick={() => navigate('/expenses')}>Go back</Button>
      </div>
    );
  }

  const config = CATEGORY_CONFIG[expense.category];
  const isPdfReceipt = expense.receipt_url?.toLowerCase().includes('.pdf');

  if (!isEditing) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/expenses')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Expense Details</h1>
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
                    <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this expense? This action cannot be undone.
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
            <div className="text-4xl font-bold">{formatCurrency(expense.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-muted-foreground mt-2">{format(new Date(expense.expense_date), 'EEEE, MMMM d, yyyy')}</p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white text-lg', config.color)}>
                {config.label.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{config.label}</p>
              </div>
            </div>

            {expense.description && (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{expense.description}</p>
              </div>
            )}

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium">{PAYMENT_METHOD_CONFIG[expense.payment_method].label}</p>
            </div>

            {expense.receipt_url && !isPdfReceipt && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm text-muted-foreground">Receipt</p>
                <img
                  src={expense.receipt_url}
                  alt="Receipt"
                  className="w-full max-h-80 object-cover rounded-md"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(expense.receipt_url || '', '_blank', 'noreferrer')}
                >
                  View Full Size
                </Button>
              </div>
            )}

            {expense.receipt_url && isPdfReceipt && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm text-muted-foreground">Receipt</p>
                <a
                  href={expense.receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline"
                >
                  Open PDF
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Edit Expense</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Amount Input */}
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

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 gap-2">
            {(Object.entries(CATEGORY_CONFIG) as [ExpenseCategory, typeof CATEGORY_CONFIG[ExpenseCategory]][]).map(
              ([key, cfg]) => (
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

        {/* Payment Method */}
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(PAYMENT_METHOD_CONFIG) as [PaymentMethod, typeof PAYMENT_METHOD_CONFIG[PaymentMethod]][]).map(
                ([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
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

        {/* Receipt */}
        <div className="space-y-2">
          <Label htmlFor="receipt">Receipt (optional)</Label>
          <Input
            id="receipt"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleReceiptChange}
          />
          {expense.receipt_url && !removeReceipt && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">Current receipt</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemoveReceipt(true)}
                >
                  Remove
                </Button>
              </div>
              {expense.receipt_url.toLowerCase().includes('.pdf') ? (
                <a
                  href={expense.receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline"
                >
                  Open PDF
                </a>
              ) : (
                <img
                  src={expense.receipt_url}
                  alt="Receipt"
                  className="w-full max-h-56 object-cover rounded-md"
                />
              )}
            </div>
          )}
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
          {removeReceipt && (
            <p className="text-sm text-muted-foreground">Receipt will be removed on save.</p>
          )}
        </div>

        {/* Save */}
        <Button
          onClick={handleUpdate}
          className="w-full h-12 text-lg"
          disabled={!amount || updateExpense.isPending}
        >
          {updateExpense.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
