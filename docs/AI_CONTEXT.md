# 🤖 AI Context — Kanakku (Read This First)

> **Quick-load context for AI assistants (Gemini, Claude, GPT, etc.) working on this repo.**  
> Keep this file up to date whenever significant changes are made.

---

## What Is This Project?

**Kanakku** is a **native mobile expense tracker app** for the Indian market.
- Built as React + TypeScript + Vite, wrapped in **Capacitor 8** for Android and iOS.
- Backend: **Supabase** (PostgreSQL + Auth + Realtime). No custom API server.
- **Target:** Android APK/AAB + iOS IPA. Not a browser app.
- **Primary user base:** Indian mobile users, INR currency.

---

## Stack At a Glance

```
React 18 + TypeScript + Vite 5
Tailwind CSS v3 + shadcn/ui
Framer Motion (animations)
TanStack Query v5 (all data fetching/caching)
Supabase JS v2 (DB + auth + realtime)
Capacitor 8 (Android + iOS native bridge)
React Router DOM v6
React Hook Form + Zod (forms)
Recharts (charts)
Vitest (tests)
```

---

## Key Rules of This Codebase

1. **All data logic → hooks** (`src/hooks/`). Pages only call hooks and render.
2. **No custom API server** — use `supabase.from()`, `supabase.rpc()`, `supabase.auth.*` directly.
3. **RLS is the security layer** — never bypass it from the client. Trust Postgres policies.
4. **TanStack Query** wraps every Supabase call. Use `useQuery` / `useMutation`. Invalidate by query key on mutations.
5. **Path alias `@/`** resolves to `src/` — use it everywhere.
6. **All amounts stored in INR** in the database. `useCurrency()` handles display conversion.
7. **TypeScript types** for DB tables are in `src/integrations/supabase/types.ts` (auto-generated).
8. **Dark theme always** — `defaultTheme="dark"` in ThemeProvider. Background is `#0A0A0F`.

---

## Folder Map (Quick)

```
src/
  App.tsx              ← providers + all routes
  hooks/               ← ALL data logic here
  pages/               ← 25 pages, thin — just render + navigation
  components/
    ui/                ← shadcn + custom (SplashScreen, KanakkuLogo, CountUpNumber)
    layout/            ← BottomNav
    auth/              ← AuthLayout, ProtectedRoute
    native/            ← NativeAppBridge (Capacitor back button)
    realtime/          ← RealtimeSync (Supabase channels)
  lib/
    offlineStorage.ts  ← localStorage queue for offline expenses
    utils.ts           ← cn() = clsx + tailwind-merge
  integrations/supabase/ ← client.ts + types.ts
  types/               ← expense.ts, income.ts, group.ts, etc.

android/               ← Android Studio project (Capacitor generated)
ios/                   ← Xcode project (Capacitor generated)
supabase/migrations/   ← 14 SQL files, run in order
public/                ← logo.png, manifest.webmanifest, icons/
docs/                  ← ARCHITECTURE.md, MOBILE_BUILD_GUIDE.md, this file
```

---

## Auth Pattern

```typescript
const { user, session, loading, signIn, signUp, signOut } = useAuth();
// user is null if not logged in
// All queries should have `enabled: !!user`
// All inserts should include `user_id: user!.id`
```

---

## Common Query Patterns

```typescript
// Read
const { data: expenses = [], isLoading } = useExpenses();

// Mutate
const addExpense = useAddExpense();
addExpense.mutate({ amount: 100, category: 'food', ... });

// Invalidate after mutation
queryClient.invalidateQueries({ queryKey: ['expenses'] });
queryClient.invalidateQueries({ queryKey: ['analytics'] });
```

---

## Database Tables (Summary)

| Table | Owner Column | Notes |
|---|---|---|
| `profiles` | `id` (= auth.uid) | One per user |
| `expenses` | `user_id` | Personal expenses |
| `income` | `user_id` | Income records |
| `budgets` | `user_id` | Category budgets |
| `groups` | `created_by` | Shared groups |
| `group_members` | `user_id` | Many-to-many: users ↔ groups |
| `group_expenses` | `paid_by` | Logged inside a group |
| `expense_splits` | `user_id` | Per-member split amounts |
| `settlements` | `paid_by` / `paid_to` | Recorded debt payments |
| `group_chats` | `user_id` | Real-time chat messages |
| `member_removal_notifications` | `removed_user_id` | Trigger-populated removal alerts |

---

## Known Issues (Do Not Overlook)

| Issue | File | Priority |
|---|---|---|
| `.env` not in `.gitignore` — keys exposed | `.gitignore` | 🔴 Critical |
| No `<ErrorBoundary>` at root | `App.tsx` | 🔴 Critical |
| Goals not saved to DB — `useState` only | `FinancialIntelligence.tsx` (lines ~305-310) | 🔴 Critical |
| Goal currency hardcoded to `₹` | `FinancialIntelligence.tsx` (lines ~785, ~795) | 🟡 Medium |
| UPI feature is UI-only (no payment gateway) | `src/pages/UPIIntegration.tsx` | 🟡 Medium |
| Only 1 test file (6 tests) | `src/hooks/useGroups.test.ts` | 🟠 High |
| No Privacy Policy / ToS page | — | 🟠 High |

---

## Build Commands (Correct Versions)

```sh
# Web
npm run build              # → dist/

# Android
npx cap sync android       # copy dist/ to Android project
npm run android:release:apk   # signed APK (tester distribution)
npm run android:release:aab   # signed AAB (Play Store upload)

# iOS (Mac only)
npm run ios:sync
npm run ios:open           # then Archive in Xcode
```

---

## Capacitor Native Info

```typescript
// Check if running natively
import { Capacitor } from '@capacitor/core';
Capacitor.isNativePlatform() // true on Android/iOS, false on web

// App ID
'com.kanakku.personal'

// Splash screen: native plugin handles it on Android/iOS
// React <SplashScreen> only shown on web (!isNativePlatform)
```

---

## Environment Variables

```env
# .env (never commit this file)
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Accessed in code via:
```typescript
import.meta.env.VITE_SUPABASE_URL
import.meta.env.VITE_SUPABASE_ANON_KEY
```

---

## Design Tokens (Important)

```css
/* Primary palette */
--background: #0A0A0F;
--primary: #A855F7;        /* Electric violet */
--accent-cyan: #22D3EE;
--accent-green: #00E87A;

/* Card */
background: rgba(255,255,255,0.04);
border: rgba(255,255,255,0.08);

/* Fonts */
font-family: 'Space Grotesk'  /* .font-display — headings */
font-family: 'Inter'           /* default — body text */
```

Key class: `.bento-card` — the main card used everywhere.

---

## Last Updated

**April 2026** — Version 1.0.0 | Android release APK/AAB built and signed ✅
