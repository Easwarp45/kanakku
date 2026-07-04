# 💰 Kanakku — Smart Expense Tracker (Native Mobile App)

> **Kanakku** (கணக்கு) means *"accounts / calculation"* in Tamil.  
> A full-stack **native Android & iOS** personal finance app built for the Indian market.  
> Track expenses, split group bills, analyze spending, and hit savings goals.

---

## 🎯 Project Intent

This is a **native mobile application** (Android APK / iOS IPA) built with **Capacitor 8** wrapping a React + Vite web frontend. It is **not intended as a PWA for browser use** — the primary targets are:

- 📱 **Android** — distributed via Google Play Store (AAB) or direct APK
- 🍎 **iOS** — distributed via Apple App Store / TestFlight (IPA)

The PWA service worker is present in the codebase but is **secondary** to native delivery.

---

## 🆕 Current Build Status

| Artifact | Version | Status |
|---|---|---|
| **`app-release.apk`** | 1.0.0 (versionCode 1) | ✅ Built & signed |
| **`app-release.aab`** | 1.0.0 (versionCode 1) | ✅ Built & signed |
| `app-debug.apk` | 1.0.0 | ✅ Available for testing |

**Release APK output path:**
```
android/app/build/outputs/apk/release/app-release.apk      (~5.5 MB)
android/app/build/outputs/bundle/release/app-release.aab   (~5.1 MB)
```

**Signing keystore:** `android/app/kanakku-upload-key.jks`  
**Keystore config:** `android/keystore.properties`  *(git-ignored, do not commit)*

---

## 📸 Features

| Feature | Description |
|---|---|
| **Dashboard** | Bento-grid with animated balance cards, quick-action pills, live transaction feed |
| **Expenses** | Log, categorize, filter, delete personal expenses with receipt tracking |
| **Income** | Track multiple income sources (salary, freelance, investments, etc.) |
| **Budget** | Set monthly category budgets with live overspend alerts |
| **Analytics** | Area, pie, and bar charts across week / month / year |
| **Groups** | Create groups, split expenses (equal or custom), real-time group chat |
| **Settle Up** | One-tap debt settlement with minimum-transfer algorithm |
| **Financial Intelligence** | Subscription tracker, spending heatmap, time-pattern analysis, settlement simulation, goal trajectory with pace meter |
| **Monthly Wrap** | Spotify-Wrapped-style monthly spending story |
| **UPI Integration** | UPI payment flow (preview — UI-only, not connected to payment gateway) |
| **Insights History** | Persistent log of AI-generated financial insights |
| **Profile** | Display name, phone, currency preference, theme toggle |
| **Offline Queue** | Expenses saved locally when offline, auto-synced on reconnect |
| **Notifications** | Push permission request + notification manager |

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + TypeScript 5 |
| **Build Tool** | Vite 5 |
| **Native Bridge** | Capacitor 8 (Android + iOS) |
| **Routing** | React Router DOM v6 |
| **State / Data** | TanStack Query v5 (React Query) |
| **Backend / DB** | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| **Styling** | Tailwind CSS v3 + shadcn/ui |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide React |
| **Toasts** | Sonner |
| **Date utils** | date-fns |
| **Testing** | Vitest + Testing Library |
| **PWA (secondary)** | vite-plugin-pwa + Workbox |

---

## 📁 Project Structure

```
kanakku/
├── android/                        ← Android native project (Capacitor)
│   ├── app/
│   │   ├── build.gradle            ← versionCode=1, versionName="1.0.0"
│   │   ├── kanakku-upload-key.jks  ← Release signing keystore (git-ignored)
│   │   └── src/main/
│   │       ├── AndroidManifest.xml ← Permissions: INTERNET, NETWORK_STATE, VIBRATE
│   │       └── assets/public/      ← Web bundle (copied by `cap sync`)
│   ├── keystore.properties         ← Keystore credentials (git-ignored)
│   └── variables.gradle            ← minSdk=24, compileSdk=36, targetSdk=36
│
├── ios/                            ← iOS native project (Capacitor/Xcode)
│   └── App/App.xcodeproj           ← Open with Xcode on Mac
│
├── src/
│   ├── App.tsx                     ← All routes + providers + SplashScreen
│   ├── components/
│   │   ├── auth/                   ← AuthLayout, ProtectedRoute
│   │   ├── insights/               ← FinancialHealthPanel, InsightsWidget
│   │   ├── layout/                 ← BottomNav (glassmorphism pill nav)
│   │   ├── native/                 ← NativeAppBridge (back button, status bar)
│   │   ├── notifications/          ← NotificationManager
│   │   ├── onboarding/             ← Onboarding flow
│   │   ├── pwa/                    ← OfflineIndicator
│   │   ├── realtime/               ← RealtimeSync (Supabase channels)
│   │   └── ui/
│   │       ├── SplashScreen.tsx    ← Animated logo splash (web only; native uses capacitor plugin)
│   │       └── KanakkuLogo.tsx     ← SVG logo component
│   │
│   ├── hooks/                      ← ALL data logic (no logic in pages)
│   │   ├── useAuth.tsx             ← Supabase auth context + signIn/signUp/signOut
│   │   ├── useExpenses.ts          ← CRUD + recent + today/monthly totals
│   │   ├── useIncome.ts            ← Income CRUD
│   │   ├── useBudgets.ts           ← Budget CRUD + overspend calculation
│   │   ├── useGroups.ts            ← Groups, members, expenses, balances, settlements, chat
│   │   ├── useAnalytics.ts         ← Aggregated chart data
│   │   ├── useSmartInsights.ts     ← AI-style financial insights
│   │   ├── useFinancialIntelligence.ts ← Subscription detection, goals, gamification
│   │   ├── useCurrency.ts          ← Multi-currency formatting
│   │   ├── useProfile.ts           ← Profile read/update
│   │   ├── useOfflineSync.ts       ← Queue + sync expenses offline→online
│   │   ├── useNotifications.ts     ← Push notification permission
│   │   ├── usePWA.ts               ← Install prompt handling
│   │   ├── useRealtimeSync.ts      ← Supabase realtime channel subscriptions
│   │   └── useGroups.test.ts       ← Vitest unit tests for groups hook
│   │
│   ├── pages/                      ← 25 pages (all routed in App.tsx)
│   ├── lib/
│   │   ├── offlineStorage.ts       ← localStorage queue for offline expenses
│   │   ├── category-icons.ts       ← Icon map for expense categories
│   │   ├── currency.ts             ← Currency conversion utilities
│   │   └── utils.ts                ← cn() helper (clsx + tailwind-merge)
│   ├── types/                      ← TypeScript interfaces (expense, income, group, etc.)
│   └── integrations/supabase/      ← Generated Supabase client + database types
│
├── supabase/migrations/            ← 14 SQL migrations (Jan–Apr 2026)
├── public/
│   ├── logo.png                    ← App logo (also used as favicon + apple-touch-icon)
│   ├── manifest.webmanifest        ← PWA manifest
│   └── icons/                     ← PWA icon set (72→512px)
│
├── docs/
│   ├── MOBILE_BUILD_GUIDE.md       ← Detailed Android + iOS build walkthrough
│   ├── PERFORMANCE_AUDIT.md
│   └── UPI_SPLIT_PAYMENTS.md
│
├── capacitor.config.ts             ← appId: com.kanakku.personal
├── vite.config.ts                  ← Vite + PWA plugin config
├── tailwind.config.ts
└── package.json                    ← name: "kanakku", version: "1.0.0"
```

---

## 🚀 Getting Started (Local Dev)

### Prerequisites
- Node.js ≥ 18 | npm ≥ 9
- A [Supabase](https://supabase.com) project (free tier)
- Android Studio (for Android builds)
- Xcode on Mac (for iOS builds)
- Java JDK 17 or 21

### 1 · Clone & install

```sh
git clone https://github.com/Easwarp45/kanakku.git
cd kanakku
npm install
```

### 2 · Environment variables

Create a `.env` file in the project root (never commit this):

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> Find these in Supabase dashboard → **Project Settings → API**. Use the **anon/public** key only — never the service role key.

### 3 · Run database migrations

```sh
# Using Supabase CLI
supabase db push

# Or run each file in supabase/migrations/ via Supabase SQL editor, in chronological order
```

### 4 · Start dev server

```sh
npm run dev        # runs at http://localhost:8080
```

---

## 📦 Build & Deploy Commands

### Web Bundle

```sh
npm run build          # production bundle → dist/
npm run build:dev      # un-minified dev bundle
npm run preview        # serve dist/ locally
```

### Android Native

```sh
npm run android:sync           # build + copy web assets to Android project
npm run android:apk            # debug APK
npm run android:release:apk    # signed release APK (for beta testing)
npm run android:release:aab    # signed release AAB (for Play Store)
npm run android:release:all    # both APK + AAB
npm run android:open           # open Android Studio
```

### iOS Native (Mac only)

```sh
npm run ios:sync               # build + copy web assets to iOS project
npm run ios:open               # open Xcode
```

### Testing

```sh
npm run test           # Vitest watch mode
npm run test:run       # single run (CI)
npm run test:coverage  # coverage report
npm run test:ui        # Vitest browser UI
npm run lint           # ESLint
```

---

## 🗃 Database Schema

| Table | Key Columns | Purpose |
|---|---|---|
| `profiles` | `id`, `display_name`, `phone`, `currency`, `avatar_url` | User profiles |
| `expenses` | `user_id`, `amount`, `category`, `expense_date`, `payment_method`, `description` | Personal expenses |
| `income` | `user_id`, `amount`, `source`, `income_date`, `is_recurring` | Income records |
| `budgets` | `user_id`, `category`, `monthly_limit` | Category budgets |
| `groups` | `id`, `name`, `invite_code`, `created_by` | Shared groups |
| `group_members` | `group_id`, `user_id`, `is_admin`, `nickname` | Group membership |
| `group_expenses` | `group_id`, `paid_by`, `amount`, `description`, `split_type` | Group expenses |
| `expense_splits` | `group_expense_id`, `user_id`, `amount` | Per-member split amounts |
| `settlements` | `group_id`, `paid_by`, `paid_to`, `amount` | Debt settlements |
| `group_chats` | `group_id`, `user_id`, `message`, `created_at` | Real-time group chat |
| `member_removal_notifications` | `group_id`, `removed_user_id`, `removed_by` | Trigger-populated removal alerts |

All tables use **Row Level Security (RLS)** — enforced at PostgreSQL level.

---

## 🛡 Security Architecture

- **RLS on every table** — users can only query/mutate their own data.
- **Group member removal** — hardened via `20260329143000_harden_group_member_removal.sql`. Admins-only policy enforced at DB level.
- **Realtime removal detection** — `member_removal_notifications` table + Postgres trigger. Used because Supabase Realtime can't deliver `DELETE` events to the deleted row's user.
- **Invite-only groups** — join by invite code only, validated via Postgres RPC function that bypasses RLS safely using `SECURITY DEFINER`.
- **Expense ownership guards** — all `DELETE`/`UPDATE` mutations include `.eq('user_id', user.id)` as a secondary check.
- **Anon key only** — the Supabase service role key is never exposed to the client.

---

## 🗺 Route Map

| Path | Page | Auth Required |
|---|---|---|
| `/` | Redirect → `/dashboard` | — |
| `/login` | Login | Public |
| `/signup` | Sign Up | Public |
| `/forgot-password` | Forgot Password | Public |
| `/install` | Install Guide | Public |
| `/dashboard` | Dashboard | ✅ |
| `/expenses` | Expense List | ✅ |
| `/expenses/:id` | Expense Detail | ✅ |
| `/add-expense` | Add Expense | ✅ |
| `/income` | Income List | ✅ |
| `/income/:id` | Income Detail | ✅ |
| `/add-income` | Add Income | ✅ |
| `/budget` | Budget Manager | ✅ |
| `/analytics` | Analytics Charts | ✅ |
| `/groups` | Groups List | ✅ |
| `/groups/:id` | Group Detail (tabs: Expenses, Balances, Members, Chat) | ✅ |
| `/groups/:id/add-expense` | Add Group Expense | ✅ |
| `/groups/:id/expenses/:expenseId/edit` | Edit Group Expense | ✅ |
| `/groups/:id/settle` | Settle Up | ✅ |
| `/intelligence` | Financial Intelligence | ✅ |
| `/insights/history` | Insights History | ✅ |
| `/wrap` | Monthly Wrap | ✅ |
| `/upi` | UPI Integration | ✅ |
| `/profile` | Profile & Settings | ✅ |
| `*` | 404 Not Found | — |

---

## 🔄 Offline Support

- **Workbox service worker** (via `vite-plugin-pwa`) caches JS/CSS/HTML/fonts.
- Expenses added offline → saved in `localStorage` via `offlineStorage.ts`.
- `useOfflineSync.ts` auto-syncs queued expenses when connectivity returns.
- Duplicate-guard: before inserting, checks if the same expense already exists (dedup by amount + category + date + description).
- `navigator.onLine` + `online`/`offline` event listeners in `setupOnlineListener()`.

---

## 🎨 Design System

Dark glassmorphism theme defined in `src/index.css`:

| Token | Value |
|---|---|
| Background | `#0A0A0F` (near-black) |
| Primary | Electric Violet `#A855F7` |
| Accent Cyan | `#22D3EE` |
| Accent Green | `#00E87A` |
| Card glass | `rgba(255,255,255,0.04)` |
| Border | `rgba(255,255,255,0.08)` |
| Font (headings) | `Space Grotesk` (via `font-display`) |
| Font (body) | `Inter` |

**Key CSS utility classes:**
- `.bento-card` — glass card with border and blur
- `.glass-card` — stronger blur glass variant
- `.btn-glow` — glowing primary button
- `.shimmer` — loading skeleton animation
- `.scrollbar-hide` — hidden scrollbar for overflow lists
- `.amount-neutral`, `.amount-positive`, `.amount-negative` — semantic amount colors

---

## 📱 Native App Details (Capacitor)

| Property | Value |
|---|---|
| App Name | Kanakku |
| Bundle / Package ID | `com.kanakku.personal` |
| Version Name | `1.0.0` |
| Version Code (Android) | `1` |
| Min Android SDK | API 24 (Android 7.0 Nougat) |
| Target/Compile SDK | API 36 (Android 16) |
| Capacitor Version | `8.3.0` |
| Android Scheme | `https` |
| iOS Scheme | `https` |
| Theme color (status bar) | `#0b0b11` |

**Capacitor Plugins installed:**
- `@capacitor/app` — app lifecycle (back button, `appStateChange`)
- `@capacitor/haptics` — vibration feedback on nav taps
- `@capacitor/keyboard` — keyboard appearance + `adjustResize`
- `@capacitor/splash-screen` — native full-screen launch splash (1200ms, dark bg)
- `@capacitor/status-bar` — dark status bar, overlays WebView = false

**Android Permissions (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
```

---

## 🗂 Supabase Migrations Log

| File | Description |
|---|---|
| `20260113160436` | Initial schema: profiles, expenses, budgets |
| `20260114132446` | Groups, group_members, group_expenses, expense_splits |
| `20260117100032` | Settlements, group_chats, RLS policies |
| `20260118101024` | Invite code generation RPC |
| `20260314120000` | Income table + RLS |
| `20260314150000` | Fix invite code generation edge case |
| `20260314150000` | Performance indexes on hot query columns |
| `20260314160000` | Admin flag + group_chats extended fields |
| `20260315100000` | Fix invite code RLS (allow unauthenticated join-by-code) |
| `20260321070000` | Fix profiles visibility for group members |
| `20260325170000` | Fix group member removal RLS |
| `20260329120000` | member_removal_notifications table + trigger |
| `20260329143000` | Harden group member removal — admin-only DB policy |
| `20260401103000` | Add contact_member_invites table |

---



## 📋 Changelog

| Date | Change |
|---|---|
| Apr 2026 | **Release build working**: `app-release.apk` (5.5 MB) + `app-release.aab` (5.1 MB) signed with `kanakku-upload-key.jks` |
| Apr 2026 | Fixed `keystore.properties` path bug (`app/app/` double-path) |
| Apr 2026 | Added Android permissions: `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE`, `VIBRATE` |
| Apr 2026 | Bumped `version` to `1.0.0`, `versionName` to `"1.0.0"` |
| Apr 2026 | Financial Intelligence page — real heatmap, time patterns, settlement simulation, goal pace meter |
| Apr 2026 | `useDeleteExpense` + `useUpdateExpense` ownership guards added |
| Mar 2026 | RLS hardening for group member removal |
| Mar 2026 | Real-time member removal detection via `member_removal_notifications` |
| Mar 2026 | Monthly Wrap, UPI integration, Insights History added |
| Mar 2026 | Income tracking feature complete |
| Jan–Feb 2026 | Core expense tracker, groups, analytics, budget |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `git commit -m "feat: description"`
4. Push and open a Pull Request

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<div align="center">
  Built for Indian users · <strong>Kanakku</strong> · Track smarter, spend better.
</div>
