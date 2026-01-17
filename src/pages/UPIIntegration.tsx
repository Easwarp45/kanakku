import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  ArrowLeft, 
  Smartphone, 
  RefreshCw, 
  Check, 
  X, 
  IndianRupee,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUPIDemo } from '@/hooks/useUPIDemo';
import { useCreateExpense } from '@/hooks/useExpenses';
import { CATEGORY_CONFIG } from '@/types/expense';
import { UPITransaction } from '@/lib/upi-demo';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/layout/BottomNav';

export default function UPIIntegration() {
  const navigate = useNavigate();
  const createExpense = useCreateExpense();
  const {
    pendingTransactions,
    processedTransactions,
    isScanning,
    startScan,
    markAsProcessed,
    dismissTransaction,
  } = useUPIDemo();

  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAddExpense = async (tx: UPITransaction) => {
    setAddingId(tx.id);
    
    await createExpense.mutateAsync({
      amount: tx.amount,
      category: tx.category,
      description: `${tx.merchant} - ${tx.transactionId}`,
      payment_method: tx.paymentMethod,
      expense_date: format(tx.timestamp, 'yyyy-MM-dd'),
    });

    markAsProcessed(tx.id);
    setAddingId(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">UPI Transactions</h1>
            <p className="text-xs text-muted-foreground">Auto-detect expenses</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Demo Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Mode:</strong> This simulates UPI transaction detection. In a real app, this would parse SMS messages.
          </AlertDescription>
        </Alert>

        {/* Scan Button */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Scan for UPI Transactions</p>
                  <p className="text-sm text-muted-foreground">
                    Detect recent payments
                  </p>
                </div>
              </div>
              <Button 
                onClick={startScan} 
                disabled={isScanning}
                className="gap-2"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Scan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Transactions */}
        {pendingTransactions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Detected Transactions</h2>
              <Badge variant="secondary">{pendingTransactions.length} new</Badge>
            </div>

            {pendingTransactions.map((tx) => {
              const config = CATEGORY_CONFIG[tx.category];
              const isAdding = addingId === tx.id;

              return (
                <Card key={tx.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0',
                        config.color
                      )}>
                        {config.label.charAt(0)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{tx.merchant}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {tx.upiId}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold flex items-center">
                              <IndianRupee className="h-4 w-4" />
                              {tx.amount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {tx.transactionId}
                          </span>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => handleAddExpense(tx)}
                            disabled={isAdding}
                          >
                            {isAdding ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Add Expense
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dismissTransaction(tx.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Processed Transactions */}
        {processedTransactions.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-muted-foreground">Added to Expenses</h2>

            {processedTransactions.map((tx) => {
              const config = CATEGORY_CONFIG[tx.category];

              return (
                <Card key={tx.id} className="opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm',
                        config.color
                      )}>
                        <Check className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{tx.merchant}</p>
                      </div>

                      <p className="font-medium text-sm flex items-center">
                        <IndianRupee className="h-3 w-3" />
                        {tx.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {pendingTransactions.length === 0 && processedTransactions.length === 0 && !isScanning && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Smartphone className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="mb-2">No Transactions Detected</CardTitle>
              <CardDescription>
                Tap "Scan" to simulate detecting UPI transactions from your phone
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
