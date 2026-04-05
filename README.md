# 💰 Kanakku — Smart Expense Tracker

> **Kanakku** (கணக்கு) means *"accounts / calculation"* in Tamil.  
> A full-stack, PWA-ready personal finance app built for the Indian market — track expenses, split group bills, analyze spending patterns, and hit your savings goals.

---

## 📸 What It Does

| Feature | Description |
|---|---|
| **Dashboard** | Bento-grid overview with animated balance cards, quick-action pills, and a live transaction feed |
| **Expenses** | Log, categorize, filter, and delete personal expenses with receipt tracking |
| **Income** | Track multiple income sources (salary, freelance, investments, etc.) |
| **Budget** | Set monthly category budgets with live overspend alerts |
| **Analytics** | Area charts, pie charts, and bar charts across week / month / year periods |
| **Groups** | Create groups, split expenses equally or by custom amounts, real-time chat |
| **Settle Up** | One-tap debt settlement inside any group |
| **Financial Intelligence** | AI-powered page: subscription tracker, spending heatmap, time-pattern analysis, live settlement simulation, goal trajectory tracker with pace meter |
| **Monthly Wrap** | Spotify-Wrapped-style monthly spending story |
| **UPI Integration** | (Preview) UPI payment flow integration |
| **Insights History** | Persistent log of all AI-generated financial insights |
| **Profile** | Display name, phone, currency preference, dark/light theme toggle |

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + TypeScript |
| **Build tool** | Vite 5 |
| **Routing** | React Router DOM v6 |
| **State / Data** | TanStack Query v5 (React Query) |
| **Backend / DB** | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| **Styling** | Tailwind CSS v3 + shadcn/ui component library |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **PWA** | vite-plugin-pwa (offline support, installable) |
| **Icons** | Lucide React |
| **Toasts** | Sonner |
| **Date utils** | date-fns |
| **Testing** | Vitest + Testing Library |

---

## 📁 Project Structure

```
kanakku/
├── src/
│   ├── components/
│   │   ├── layout/          # BottomNav (floating glassmorphism pill)
│   │   ├── insights/        # Smart insight cards
│   │   └── ui/              # shadcn/ui primitives + skeleton loaders
│   ├── hooks/               # All data logic lives here
│   │   ├── useAuth.tsx
│   │   ├── useExpenses.ts
│   │   ├── useIncome.ts
│   │   ├── useBudgets.ts
│   │   ├── useGroups.ts     # Groups, members, expenses, settlements, chat
│   │   ├── useAnalytics.ts
│   │   ├── useSmartInsights.ts
│   │   ├── useFinancialIntelligence.ts
│   │   ├── useCurrency.ts
│   │   ├── useProfile.ts
│   │   └── useOfflineSync.ts
│   ├── lib/
│   │   ├── financialIntelligenceEngine.ts  # Pure computation engine
│   │   ├── insightsEngine.ts
│   │   ├── animations.tsx
│   │   ├── currency.ts
│   │   └── offlineStorage.ts
│   ├── pages/               # 25 routed pages
│   ├── types/               # Shared TypeScript interfaces
│   │   ├── expense.ts
│   │   ├── income.ts
│   │   ├── group.ts
│   │   ├── insights.ts
│   │   └── financial-intelligence.ts
│   ├── integrations/
│   │   └── supabase/        # Auto-generated Supabase client + types
│   ├── App.tsx              # All routes + providers
│   └── index.css            # Global design system (dark glassmorphism)
├── supabase/
│   └── migrations/          # 14 versioned SQL migrations
├── public/
└── vite.config.ts
```

---

## 🚀 Getting Started (Local Dev)

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- A [Supabase](https://supabase.com) project (free tier is fine)

### 1 · Clone & install

```sh
git clone https://github.com/Easwarp45/kanakku.git
cd kanakku
npm install
```

### 2 · Environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> Find these in your Supabase dashboard → **Project Settings → API**.

### 3 · Run database migrations

Run all files in `supabase/migrations/` **in chronological order** against your Supabase project using the SQL editor or Supabase CLI:

```sh
# Using Supabase CLI
supabase db push
```

### 4 · Start the dev server

```sh
npm run dev
```

App runs at `http://localhost:8080`

---

## 🗃 Database Schema (Key Tables)

| Table | Purpose |
|---|---|
| `profiles` | User display name, phone, currency, avatar |
| `expenses` | Personal expense records (amount, category, date, payment method) |
| `income` | Income records (amount, source, recurring flag) |
| `budgets` | Category-level monthly budgets |
| `groups` | Shared expense groups |
| `group_members` | Group membership with admin flag |
| `group_expenses` | Expenses logged inside a group |
| `expense_splits` | Per-member split amounts for each group expense |
| `settlements` | Recorded debt settlements inside groups |
| `group_chats` | Real-time group chat messages |
| `member_removal_notifications` | Trigger-populated table for real-time removal detection |

All tables are protected by **Row Level Security (RLS)** — users can only access their own data.

---

## 🛡 Security Architecture

- **RLS on every table** — enforced at the Postgres level, not just the frontend
- **Group member removal** hardened via `20260329143000_harden_group_member_removal.sql` — admins only, enforced by DB policy
- **Realtime removal detection** via `member_removal_notifications` table + trigger (Supabase can't deliver `DELETE` events to removed users directly)
- **Expense ownership guard** — all delete/update mutations include `.eq('user_id', user.id)` as a double-check
- **Invite-only groups** — join by invite code only, validated via RPC function that bypasses RLS safely

---

## 🧪 Testing

```sh
npm run test          # watch mode
npm run test:run      # single run
npm run test:coverage # coverage report
npm run test:ui       # Vitest UI browser
```

Tests live in `src/__tests__/`. The test harness wraps hooks in `AllTheProviders` (QueryClientProvider + BrowserRouter) so TanStack Query works correctly.

---

## 📦 Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server (port 8080) |
| `npm run build` | Production bundle → `dist/` |
| `npm run build:dev` | Development bundle (un-minified) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint check |
| `npm run test` | Vitest in watch mode |

---

## 🎨 Design System

The entire UI runs on a **dark glassmorphism** theme defined in `src/index.css`:

| Token | Value |
|---|---|
| Background | `#0A0A0F` (near-black) |
| Primary | Electric Violet `#A855F7` |
| Secondary | Cyan `#22D3EE` |
| Card | `rgba(255,255,255,0.04)` glass |
| Font (headings) | `Space Grotesk` |
| Font (body) | `Inter` |

Key utility classes: `bento-card`, `glass-card`, `btn-glow`, `nav-pill`, `text-gradient`.

---

## 🗺 Route Map

| Path | Page | Auth |
|---|---|---|
| `/` | Index (redirect) | — |
| `/login` | Login | Public |
| `/signup` | Sign Up | Public |
| `/forgot-password` | Forgot Password | Public |
| `/dashboard` | Dashboard | ✅ |
| `/expenses` | Expense List | ✅ |
| `/expenses/add` | Add Expense | ✅ |
| `/expenses/:id` | Expense Detail | ✅ |
| `/income` | Income List | ✅ |
| `/income/add` | Add Income | ✅ |
| `/income/:id` | Income Detail | ✅ |
| `/budget` | Budget Manager | ✅ |
| `/analytics` | Analytics Charts | ✅ |
| `/groups` | Groups List | ✅ |
| `/groups/:id` | Group Detail (chat, expenses, balances) | ✅ |
| `/groups/:id/add-expense` | Add Group Expense | ✅ |
| `/groups/:id/settle` | Settle Up | ✅ |
| `/intelligence` | Financial Intelligence | ✅ |
| `/insights-history` | Insights History | ✅ |
| `/wrap` | Monthly Wrap | ✅ |
| `/upi` | UPI Integration | ✅ |
| `/profile` | Profile & Settings | ✅ |
| `/install` | PWA Install Guide | ✅ |

---

## 🔄 Offline Support

The app registers a **Workbox service worker** (via vite-plugin-pwa). Expenses added while offline are queued in `localStorage` and synced automatically when connectivity returns (`useOfflineSync.ts`).

---

## 🌐 Deployment

The app is a static SPA — deploy the `dist/` folder to any static host:

- **Netlify** — drag-and-drop `dist/` or connect GitHub repo
- **Vercel** — `vercel --prod`
- **GitHub Pages** — push `dist/` to `gh-pages` branch

Set the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables on your hosting platform.

> Make sure your Supabase project's **Auth → URL Configuration** includes your production domain in the allowed redirect URLs.

---

## 📋 Changelog (Recent)

| Date | Change |
|---|---|
| Apr 2026 | Financial Intelligence page — real heatmap, real time patterns, live settlement simulation, goal pace meter |
| Apr 2026 | Security: `useDeleteExpense` + `useUpdateExpense` ownership guards added |
| Apr 2026 | Analytics charts updated to match dark glassmorphism palette |
| Apr 2026 | `ThemeProvider` default changed to `"dark"` to match design system |
| Mar 2026 | RLS hardening for group member removal (`harden_group_member_removal.sql`) |
| Mar 2026 | Real-time member removal detection via notification table + trigger |
| Mar 2026 | Weekly wrap, UPI integration preview, insights history added |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m "feat: your feature description"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<div align="center">
  Built with ❤️ for Indian users · <strong>Kanakku</strong> · Track smarter, spend better.
</div>
