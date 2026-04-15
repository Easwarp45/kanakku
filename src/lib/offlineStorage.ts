// Offline storage for expenses using IndexedDB (via idb-keyval).
// IndexedDB is async, eviction-safe, and supports up to ~1 GB,
// making it far superior to localStorage for PWA offline queues.

import { get, update } from 'idb-keyval';
import type { CreateExpenseInput } from '@/types/expense';

const OFFLINE_EXPENSES_KEY = 'kanakku_offline_expenses';

export interface OfflineExpense extends CreateExpenseInput {
  id: string;
  created_at: string;
  synced: boolean;
}

// Generate a temporary ID for offline expenses
function generateTempId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── IndexedDB helpers ────────────────────────────────────────────────────────

/** Get all offline expenses from IndexedDB */
export async function getOfflineExpenses(): Promise<OfflineExpense[]> {
  try {
    return (await get<OfflineExpense[]>(OFFLINE_EXPENSES_KEY)) ?? [];
  } catch {
    return [];
  }
}

/** Save an expense offline to IndexedDB */
export async function saveOfflineExpense(expense: CreateExpenseInput): Promise<OfflineExpense> {
  const offlineExpense: OfflineExpense = {
    ...expense,
    id: generateTempId(),
    created_at: new Date().toISOString(),
    synced: false,
  };

  await update<OfflineExpense[]>(OFFLINE_EXPENSES_KEY, (arr = []) => [...arr, offlineExpense]);
  return offlineExpense;
}

/** Remove a synced expense from IndexedDB by its temp id */
export async function markExpenseSynced(id: string): Promise<void> {
  await update<OfflineExpense[]>(OFFLINE_EXPENSES_KEY, (arr = []) =>
    arr.filter((e) => e.id !== id)
  );
}

/** Return only expenses that haven't been synced yet */
export async function getUnsyncedExpenses(): Promise<OfflineExpense[]> {
  const all = await getOfflineExpenses();
  return all.filter((e) => !e.synced);
}

/** Purge all synced expenses, keeping only pending ones */
export async function clearSyncedExpenses(): Promise<void> {
  const unsynced = await getUnsyncedExpenses();
  await update<OfflineExpense[]>(OFFLINE_EXPENSES_KEY, () => unsynced);
}

// ── Network detection ────────────────────────────────────────────────────────

let lastOnlineStatus = navigator.onLine;
let checkInProgress = false;

async function verifyOnlineStatus(): Promise<boolean> {
  if (checkInProgress) return lastOnlineStatus;
  if (!navigator.onLine) {
    lastOnlineStatus = false;
    return false;
  }

  // Ping our own Supabase project — always reachable if the app is usable,
  // avoids geo-specific blockage issues with third-party domains (e.g. google.com).
  try {
    checkInProgress = true;
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/health`, {
      method: 'HEAD',
      cache: 'no-store',
      mode: 'no-cors',
      signal: AbortSignal.timeout(3000),
    });
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
  return lastOnlineStatus;
}

/** Set up online/offline listeners. Returns a cleanup function. */
export function setupOnlineListener(onOnline: () => void, onOffline: () => void): () => void {
  const handleOnline = async () => {
    const reallyOnline = await verifyOnlineStatus();
    if (reallyOnline) onOnline();
  };

  const handleOffline = () => {
    lastOnlineStatus = false;
    onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Periodic check every 30 seconds (was 10 s) to reduce network noise
  const intervalId = setInterval(async () => {
    const wasOnline = lastOnlineStatus;
    const isNowOnline = await verifyOnlineStatus();
    if (!wasOnline && isNowOnline) onOnline();
    else if (wasOnline && !isNowOnline) onOffline();
  }, 30_000);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    clearInterval(intervalId);
  };
}
