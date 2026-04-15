const AUTH_LOCKOUT_KEY = 'kanakku-auth-lockout-v1';
const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

interface AuthAttemptRecord {
  failedAttempts: number;
  firstFailedAt: number;
  lockoutUntil: number;
}

type AuthAttemptStore = Record<string, AuthAttemptRecord>;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readStore(): AuthAttemptStore {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(AUTH_LOCKOUT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AuthAttemptStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: AuthAttemptStore): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(AUTH_LOCKOUT_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage write failures.
  }
}

function getRecord(store: AuthAttemptStore, email: string): AuthAttemptRecord | null {
  const key = normalizeEmail(email);
  return store[key] || null;
}

export function getRemainingLockoutMs(email: string, now: number = Date.now()): number {
  const record = getRecord(readStore(), email);
  if (!record || record.lockoutUntil <= now) {
    return 0;
  }

  return record.lockoutUntil - now;
}

export function isAuthLockedOut(email: string, now: number = Date.now()): boolean {
  return getRemainingLockoutMs(email, now) > 0;
}

export function registerAuthFailure(email: string, now: number = Date.now()): void {
  const store = readStore();
  const key = normalizeEmail(email);
  const current = store[key];

  if (!current || now - current.firstFailedAt > WINDOW_MS) {
    store[key] = {
      failedAttempts: 1,
      firstFailedAt: now,
      lockoutUntil: 0,
    };
    writeStore(store);
    return;
  }

  const nextFailedAttempts = current.failedAttempts + 1;
  const lockoutUntil = nextFailedAttempts >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_MS : 0;

  store[key] = {
    failedAttempts: nextFailedAttempts,
    firstFailedAt: current.firstFailedAt,
    lockoutUntil,
  };

  writeStore(store);
}

export function clearAuthFailures(email: string): void {
  const store = readStore();
  const key = normalizeEmail(email);

  if (!store[key]) return;

  delete store[key];
  writeStore(store);
}
