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

// Check if we're online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Listen for online/offline events
export function setupOnlineListener(onOnline: () => void, onOffline: () => void): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
