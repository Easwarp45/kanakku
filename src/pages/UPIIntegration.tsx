import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  ArrowLeft, 
  Smartphone, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  QrCode,
  Copy,
  ExternalLink,
  AlertCircle,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateExpense, useRecentUPIExpenses } from '@/hooks/useExpenses';
import { CATEGORY_CONFIG, type ExpenseCategory } from '@/types/expense';
import {
  buildUpiIntentUrl,
  buildUpiQrCodeUrl,
  generateUpiReference,
  isLikelyMobileDevice,
  isValidUpiId,
} from '@/lib/upi';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

interface PendingUPIPayment {
  payeeName: string;
  upiId: string;
  amountInBase: number;
  note: string;
  category: ExpenseCategory;
  expenseDate: string;
  referenceId: string;
  intentUrl: string;
}

export default function UPIIntegration() {
  const navigate = useNavigate();
  const { symbol, currency, formatCurrency, convertToBase } = useCurrency();
  const createExpense = useCreateExpense();
  const { data: recentUpiExpenses = [], isLoading: loadingRecentUpi } = useRecentUPIExpenses(8);

  const [payeeName, setPayeeName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [referenceId, setReferenceId] = useState(generateUpiReference());

  const [pendingPayment, setPendingPayment] = useState<PendingUPIPayment | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [utr, setUtr] = useState('');

  const isMobileDevice = isLikelyMobileDevice();
  const parsedAmount = Number.parseFloat(amount);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const parsedAmountInBase = validAmount ? convertToBase(parsedAmount) : 0;
  const validUpiId = isValidUpiId(upiId);
  const canBuildIntent = payeeName.trim().length > 1 && validUpiId && validAmount;

  const previewIntentUrl = useMemo(() => {
    if (!canBuildIntent) return '';
    return buildUpiIntentUrl({
      payeeVpa: upiId,
      payeeName,
      amount: parsedAmountInBase,
      note,
      referenceId,
    });
  }, [canBuildIntent, parsedAmountInBase, payeeName, note, referenceId, upiId]);

  const qrSourceUrl = pendingPayment?.intentUrl || previewIntentUrl;

  const handleLaunchUPI = () => {
    if (!payeeName.trim()) {
      toast.error('Enter payee name');
      return;
    }
    if (!validUpiId) {
      toast.error('Enter a valid UPI ID (example: name@bank)');
      return;
    }
    if (!validAmount) {
      toast.error('Enter a valid amount');
      return;
    }

    const intentUrl = buildUpiIntentUrl({
      payeeVpa: upiId,
      payeeName,
      amount: parsedAmountInBase,
      note,
      referenceId,
    });

    setPendingPayment({
      payeeName: payeeName.trim(),
      upiId: upiId.trim(),
      amountInBase: parsedAmountInBase,
      note: note.trim(),
      category,
      expenseDate,
      referenceId,
      intentUrl,
    });

    setUtr('');

    if (isMobileDevice) {
      window.location.href = intentUrl;
      toast.info('Complete payment in your UPI app, then return and confirm below.');
      return;
    }

    setShowQr(true);
    toast.info('Scan this QR from any UPI app on your phone.');
  };

  const handleCopyIntent = async () => {
    if (!previewIntentUrl) {
      toast.error('Fill payment details first');
      return;
    }

    try {
      await navigator.clipboard.writeText(previewIntentUrl);
      toast.success('UPI payment link copied');
    } catch {
      toast.error('Failed to copy UPI link');
    }
  };

  const handleConfirmPaid = async () => {
    if (!pendingPayment) return;

    const descriptionParts = [
      pendingPayment.note || `UPI payment to ${pendingPayment.payeeName}`,
      `Ref:${pendingPayment.referenceId}`,
    ];

    if (utr.trim()) {
      descriptionParts.push(`UTR:${utr.trim()}`);
    }

    await createExpense.mutateAsync({
      amount: pendingPayment.amountInBase,
      category: pendingPayment.category,
      description: descriptionParts.join(' | '),
      payment_method: 'upi',
      expense_date: pendingPayment.expenseDate,
    });

    setPendingPayment(null);
    setAmount('');
    setNote('');
    setUtr('');
    setShowQr(false);
    setReferenceId(generateUpiReference());
  };

  return (
    <div className="page-content min-h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">UPI Payments</h1>
            <p className="text-xs text-muted-foreground">Pay via UPI app and log expenses</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Real flow notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Real UPI intent flow:</strong> This opens your installed UPI app for payment. After payment, confirm here to save the expense.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Kanakku does not directly verify bank settlement status. Expenses are saved only when you tap <em>Confirm as Paid</em>. Always verify success in your UPI app using UTR/reference details.
          </AlertDescription>
        </Alert>

        {/* Create UPI Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create UPI Payment</CardTitle>
            <CardDescription>Enter payee details and launch your UPI app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payee-name">Payee Name</Label>
              <Input
                id="payee-name"
                placeholder="Merchant or person name"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payee-upi">UPI ID</Label>
              <Input
                id="payee-upi"
                placeholder="example@bank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className={cn(!validUpiId && upiId ? 'border-destructive' : '')}
              />
              {!validUpiId && upiId && (
                <p className="text-xs text-destructive">Invalid UPI ID format</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="upi-amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{symbol}</span>
                  <Input
                    id="upi-amount"
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7"
                  />
                </div>
                {currency !== 'INR' && validAmount && (
                  <p className="text-xs text-muted-foreground">
                    UPI will be charged in INR: {formatCurrency(parsedAmountInBase, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_CONFIG) as [ExpenseCategory, { label: string }][]).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upi-note">Payment Note (optional)</Label>
              <Textarea
                id="upi-note"
                rows={2}
                placeholder="What is this payment for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground">Reference ID</p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="font-mono text-sm truncate">{referenceId}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setReferenceId(generateUpiReference())}
                  className="shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-[420px]:flex-row">
              <Button onClick={handleLaunchUPI} className="flex-1 gap-2" disabled={!canBuildIntent}>
                <Smartphone className="h-4 w-4" />
                Open UPI App
              </Button>
              <Button type="button" variant="outline" onClick={handleCopyIntent} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={!canBuildIntent}
                onClick={() => setShowQr((prev) => !prev)}
              >
                <QrCode className="h-4 w-4" />
                {showQr ? 'Hide QR' : 'Show QR'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {showQr && qrSourceUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">UPI QR Code</CardTitle>
              <CardDescription>Scan this from any UPI app to pay</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <img
                src={buildUpiQrCodeUrl(qrSourceUrl, 320)}
                alt="UPI payment QR code"
                className="w-full max-w-[260px] rounded-lg border bg-white p-2"
              />
              {!isMobileDevice && (
                <p className="text-xs text-muted-foreground text-center">
                  Open this page on mobile for one-tap UPI launch.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {pendingPayment && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Pending Confirmation</CardTitle>
              <CardDescription>
                Complete payment in UPI app, then confirm here to save it as expense.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-background p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{pendingPayment.payeeName}</p>
                  <p className="font-semibold">{formatCurrency(pendingPayment.amountInBase, { maximumFractionDigits: 2 })}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{pendingPayment.upiId}</p>
                <p className="text-xs text-muted-foreground mt-1">Ref: {pendingPayment.referenceId}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="utr">UTR / Transaction ID (optional)</Label>
                <Input
                  id="utr"
                  placeholder="Enter UTR for records"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
                <Button
                  onClick={handleConfirmPaid}
                  disabled={createExpense.isPending}
                  className="gap-2"
                >
                  {createExpense.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Confirm Paid
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.location.href = pendingPayment.intentUrl}
                >
                  <ExternalLink className="h-4 w-4" />
                  Re-open UPI
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setPendingPayment(null);
                    setShowQr(false);
                    setUtr('');
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent UPI Expenses
            </CardTitle>
            <CardDescription>Captured from your actual expense data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingRecentUpi ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : recentUpiExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No UPI expenses yet.</p>
            ) : (
              recentUpiExpenses.map((expense) => {
                const config = CATEGORY_CONFIG[expense.category];

                return (
                  <div key={expense.id} className="rounded-lg border p-3 flex items-start gap-3">
                    <div className={cn('h-8 w-8 rounded-full text-white flex items-center justify-center text-xs', config.color)}>
                      {config.label.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{expense.description || config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(expense.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-sm font-semibold shrink-0">
                      {formatCurrency(expense.amount, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
