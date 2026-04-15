# 🧠 Kanakku — Architecture & Developer Context

> This document is written for developers and AI assistants picking up this codebase.
> It explains **why things are the way they are**, not just what they are.

---

## 1. Overall Architecture

```
User ↔ React App (Capacitor WebView) ↔ Supabase (PostgreSQL + Auth + Realtime)
```

- The entire UI is a **React 18 SPA** built with Vite.
- Capacitor wraps it in a **native WebView** for Android and iOS.
- **Supabase** is the sole backend — PostgreSQL database, Auth (JWT), and Realtime channels.
- There is **no custom API server** — all DB access is direct from the client using `@supabase/supabase-js` with RLS enforced at the Postgres level.

---

## 2. Data Layer Pattern

**All data logic lives in hooks, not pages.**

```
pages/*.tsx          → render UI, call hooks, handle navigation
hooks/use*.ts        → fetch/mutate data via Supabase, return typed data
integrations/supabase/ → Supabase client + auto-generated DB types
```

### Hook pattern (standard)

```typescript
// Query hook (read)
export function useExpenses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Mutation hook (write)
export function useAddExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (expense: NewExpense) => {
      const { error } = await supabase.from('expenses').insert({ user_id: user!.id, ...expense });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
}
```

### Query key conventions

```
['expenses', userId]
['income', userId]
['budgets', userId]
['groups', userId]
['group_members', groupId]
['group_expenses', groupId]
['group_balances', groupId]
['settlements', groupId]
['analytics', userId, period]
['profile', userId]
```

---

## 3. Authentication

- **Provider:** Supabase Auth (email + password)
- **Context:** `useAuth.tsx` wraps the whole app via `<AuthProvider>` in `App.tsx`
- **Session:** `supabase.auth.onAuthStateChange` listener + `getSession()` on mount
- **Route guard:** `<ProtectedRoute>` component wraps all authenticated routes

```typescript
// How ProtectedRoute works:
if (loading) return <LoadingSpinner />;
if (!user) return <Navigate to="/login" replace />;
return children;
```

- **Sign Up:** `supabase.auth.signUp()` — sends email confirmation by default
- **Sign In:** `supabase.auth.signInWithPassword()`
- **Sign Out:** `supabase.auth.signOut()`

---

## 4. Real-time Features

The app uses **Supabase Realtime** (Postgres changes via WebSocket) for:

1. **Group data sync** — when other members add expenses, the data refreshes automatically.
2. **Group chat** — live message delivery in `GroupDetail.tsx`.
3. **Member removal detection** — special indirect mechanism (see below).

### Member Removal Pattern (important quirk)

Supabase Realtime can't deliver `DELETE` events to a user who was just removed from an RLS policy. So the approach is:

1. When admin removes a member → a Postgres trigger inserts into `member_removal_notifications`.
2. The removed user subscribes to that table with `INSERT` events filtered by `removed_user_id=eq.<their-id>`.
3. On receiving the event → the app calls `onRemoved()` → clears cache → redirects to `/groups`.

This is tested in `useGroups.test.ts`.

---

## 5. Offline Support

```
User adds expense while offline
  → offlineStorage.ts: saveExpenseOffline() → localStorage[]
  
User comes online
  → useOfflineSync.ts: syncExpenses()
    → for each offline expense:
      → dedup check: does this expense already exist in DB?
      → if not: supabase.from('expenses').insert(...)
      → markExpenseSynced(id) → remove from localStorage
    → queryClient.invalidateQueries(['expenses'])
    → toast.success("Synced N expenses")
```

**Key file:** `src/lib/offlineStorage.ts` — pure localStorage read/write, no Supabase.

---

## 6. Groups & Debt Settlement

Groups are the most complex feature. Here's the flow:

```
Group created → invite code generated (Postgres function)
Other user joins → enters invite code → RPC validates → added as group_member

Expense logged in group:
  → group_expenses table: amount, paid_by, split_type
  → expense_splits table: one row per member × their share

Balance calculation (useGroupBalances):
  → sum(paid) - sum(owed) per user = net balance
  → simplifiedDebts: minimum transfer algorithm to clear all debts
    (greedy: sort by balance, match largest creditor with largest debtor)

Settlement recorded:
  → settlements table insert
  → expense_splits updated
  → balances recalculate
```

---

## 7. Financial Intelligence Engine

`src/lib/financialIntelligenceEngine.ts` is a **pure computation module** — no API calls, no side effects.

Input: array of expenses (from `useExpenses`)
Output:
- `subscriptions` — detect recurring charges (same merchant, ~monthly interval, ≥3 occurrences)
- `goals` — given target/saved/deadline, compute: daysLeft, dailySavingRequired, status (on-track/at-risk/behind/completed)
- `gamification` — streak, level, points from spending consistency

`FinancialIntelligence.tsx` also computes client-side:
- **Spending heatmap** — 14-week calendar using `buildCalendarHeatmap(expenses, 14)`
- **Time-pattern distribution** — groups expenses by hour into morning/afternoon/evening/night buckets
- **Day-of-week distribution** — spending totals per weekday

> ⚠️ **Known issue:** Goals are stored in component `useState` only — not persisted to Supabase. Refreshing loses goal data.

---

## 8. Currency System

- **Storage:** All amounts in the database are stored in **INR (Base currency)** as plain numbers.
- **Display:** `useCurrency.ts` reads the user's preferred currency from their profile and applies a conversion rate.
- **Format:** `formatCurrency(n)` → locale-formatted string with symbol.
- **Note:** Financial Intelligence goal inputs still hardcode the ₹ symbol — this is a known bug.

---

## 9. App.tsx Provider Order

```tsx
<QueryClientProvider client={queryClient}>
  <SplashScreen />          {/* web-only animated splash, hides after 1800ms */}
  <ThemeProvider>           {/* next-themes, defaultTheme="dark" */}
    <AuthProvider>          {/* Supabase session context */}
      <TooltipProvider>
        <OfflineIndicator /> {/* web-only offline banner */}
        <NotificationManager />
        <Onboarding />
        <RealtimeSync />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NativeAppBridge />  {/* back button handler for Android */}
          <Routes>
            {/* ... */}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
```

**SplashScreen is web-only.** On native (`Capacitor.isNativePlatform() === true`), the native Capacitor splash plugin fires instead — the React splash is conditionally skipped.

---

## 10. React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,      // 2 minutes — data is "fresh" for 2 min
      gcTime: 1000 * 60 * 60,         // 1 hour — keep in cache even when unused
      retry: (failureCount, error) => {
        if (!navigator.onLine) return false;        // never retry offline
        if (status === 401 || status === 403) return false; // never retry auth errors
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,    // don't refetch on tab switch (saves bandwidth)
      refetchOnReconnect: true,       // do refetch when coming back online
    },
  },
});
```

---

## 11. Vite Build & Chunking

The app currently bundles into a **single large chunk** (~1.6 MB uncompressed, 456 KB gzipped). This is acceptable for a Capacitor app (assets are bundled locally, not fetched over network), but would be a problem for a web deployment.

If code-splitting is needed later:
```typescript
// vite.config.ts — add manualChunks:
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        supabase: ['@supabase/supabase-js'],
        charts: ['recharts'],
        motion: ['framer-motion'],
      }
    }
  }
}
```

---

## 12. Testing Setup

```
src/test/
├── setup.ts         → jest-dom matchers + localStorage mock
├── mocks.ts         → createMockUser(), createMockExpense(), Supabase client mock
└── test-utils.tsx   → renderHook wrapper with QueryClientProvider + BrowserRouter
```

Only `useGroups.test.ts` has tests (6 tests). All other hooks are untested.

Test runner: **Vitest** (`vitest.config.ts` — uses `jsdom` environment).

---

## 13. Capacitor Native Bridge

`NativeAppBridge.tsx` handles:
- **Android back button** → `App.addListener('backButton', ...)` — navigates back or exits if at root
- Fires inside `<BrowserRouter>` so `useNavigate()` works

`capacitor.config.ts`:
- `server.androidScheme = 'https'` — required for Supabase cookies to work correctly in WebView
- `server.iosScheme = 'https'` — same reason

---

## 14. Important Files Quick Reference

| File | Purpose |
|---|---|
| `src/App.tsx` | All routes, all providers, splash screen logic |
| `src/hooks/useAuth.tsx` | Auth context — user, session, signIn, signUp, signOut |
| `src/hooks/useGroups.ts` | Largest hook (39 KB) — all group-related logic |
| `src/hooks/useOfflineSync.ts` | Offline → online sync for expenses |
| `src/lib/offlineStorage.ts` | localStorage queue for offline expenses |
| `src/pages/FinancialIntelligence.tsx` | Largest page (51 KB) — AI insights, heatmap, goals |
| `src/pages/GroupDetail.tsx` | Second largest (39 KB) — group tabs, chat, settlement |
| `android/app/build.gradle` | Android version, signing config |
| `android/keystore.properties` | Keystore credentials (git-ignored) |
| `capacitor.config.ts` | Native app config — ID, plugins, splash, status bar |
| `supabase/migrations/` | 14 SQL files — run in order to set up DB |
| `src/integrations/supabase/` | Supabase client + generated TypeScript types |
