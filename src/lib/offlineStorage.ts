// Offline storage for expenses using IndexedDB via localStorage fallback
// This enables offline expense entry with sync when online

import type { CreateExpenseInput } from '@/types/expense';

const OFFLINE_EXPENSES_KEY = 'kanakku_offline_expenses';

export interface OfflineExpense extends CreateExpenseInput {
  id: string;
  created_at: string;
  synced: boolean;
}

// Generate a temporary ID for offline expenses
function generateTempId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get all offline expenses
export function getOfflineExpenses(): OfflineExpense[] {
  try {
    const stored = localStorage.getItem(OFFLINE_EXPENSES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save an expense offline
export function saveOfflineExpense(expense: CreateExpenseInput): OfflineExpense {
  const offlineExpense: OfflineExpense = {
    ...expense,
    id: generateTempId(),
    created_at: new Date().toISOString(),
    synced: false,
  };

  const expenses = getOfflineExpenses();
  expenses.push(offlineExpense);
  localStorage.setItem(OFFLINE_EXPENSES_KEY, JSON.stringify(expenses));

  return offlineExpense;
}

// Mark an offline expense as synced
export function markExpenseSynced(id: string): void {
  const expenses = getOfflineExpenses();
  const updated = expenses.filter(exp => exp.id !== id);
  localStorage.setItem(OFFLINE_EXPENSES_KEY, JSON.stringify(updated));
}

// Get unsynced expenses
export function getUnsyncedExpenses(): OfflineExpense[] {
  return getOfflineExpenses().filter(exp => !exp.synced);
}

// Clear all synced expenses
export function clearSyncedExpenses(): void {
  const unsynced = getUnsyncedExpenses();
  localStorage.setItem(OFFLINE_EXPENSES_KEY, JSON.stringify(unsynced));
}

// Check if we're online - improved with actual network check
let lastOnlineStatus = navigator.onLine;
let checkInProgress = false;

async function verifyOnlineStatus(): Promise<boolean> {
  // Skip if already checking
  if (checkInProgress) return lastOnlineStatus;
  
  // First check: navigator.onLine (fast, unreliable)
  if (!navigator.onLine) {
    return false;
  }

  // Second check: Try actual network request to verify connectivity
  try {
    checkInProgress = true;
    // Use a simple HEAD request to Supabase healthcheck (doesn't require auth)
    const response = await fetch(
      'https://www.google.com/favicon.ico',
      { 
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors'
      }
    );
    lastOnlineStatus = true;
    return true;
  } catch {
    lastOnlineStatus = false;
    return false;
  } finally {
    checkInProgress = false;
  }
}

export function isOnline(): boolean {
  // Return cached status (will be updated by event listeners and periodic checks)
  return lastOnlineStatus;
}

// Listen for online/offline events with improved detection
export function setupOnlineListener(onOnline: () => void, onOffline: () => void): () => void {
  const handleOnline = async () => {
    const isReallyOnline = await verifyOnlineStatus();
    if (isReallyOnline && lastOnlineStatus) {
      onOnline();
    }
  };

  const handleOffline = () => {
    lastOnlineStatus = false;
    onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Periodic check every 10 seconds to catch changes missed by events
  const intervalId = setInterval(async () => {
    const wasOnline = lastOnlineStatus;
    const isNowOnline = await verifyOnlineStatus();
    
    if (!wasOnline && isNowOnline) {
      onOnline();
    } else if (wasOnline && !isNowOnline) {
      onOffline();
    }
  }, 10000);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    clearInterval(intervalId);
  };
}
