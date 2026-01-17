import { useState, useCallback } from 'react';
import { UPITransaction, generateSampleTransactions } from '@/lib/upi-demo';

export function useUPIDemo() {
  const [transactions, setTransactions] = useState<UPITransaction[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const startScan = useCallback(() => {
    setIsScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      const sampleTxs = generateSampleTransactions();
      setTransactions(sampleTxs);
      setIsScanning(false);
    }, 2000);
  }, []);

  const markAsProcessed = useCallback((id: string) => {
    setTransactions(prev => 
      prev.map(tx => tx.id === id ? { ...tx, isProcessed: true } : tx)
    );
  }, []);

  const dismissTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setTransactions([]);
  }, []);

  const pendingTransactions = transactions.filter(tx => !tx.isProcessed);
  const processedTransactions = transactions.filter(tx => tx.isProcessed);

  return {
    transactions,
    pendingTransactions,
    processedTransactions,
    isScanning,
    startScan,
    markAsProcessed,
    dismissTransaction,
    clearAll,
  };
}
