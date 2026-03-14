# Kanakku 💰

A modern, feature-rich personal expense tracking application built with React, TypeScript, and Supabase. Kanakku helps you manage your finances by tracking expenses, income, budgets, and group expenses — all in one place.

---

## Features

- **Expense Tracking** — Log expenses with categories (Food, Transport, Entertainment, Shopping, Bills, Health, Education, Travel, Other) and payment methods (UPI, Cash, Card, Bank Transfer)
- **Income Management** — Record and monitor income from multiple sources
- **Receipt Uploads** — Attach receipt images to expenses, stored securely in Supabase Storage
- **Budget Management** — Set budgets per category and track spending against them
- **Analytics & Charts** — Visualize spending trends with interactive charts powered by Recharts
- **Group Expenses** — Create groups, split costs, and settle up with friends or roommates
- **UPI Integration** — Demo UPI payment flow integration
- **Offline Support (PWA)** — Works offline; expenses saved locally sync when back online
- **Authentication** — Secure sign-up, login, and password reset via Supabase Auth
- **Responsive Design** — Mobile-first UI with swipe gestures and pull-to-refresh

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 18](https://react.dev/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Build Tool | [Vite](https://vitejs.dev/) |
| Backend / DB | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) |
| Data Fetching | [TanStack Query (React Query)](https://tanstack.com/query) |
| Routing | [React Router DOM v6](https://reactrouter.com/) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Charts | [Recharts](https://recharts.org/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) |
| Notifications | [Sonner](https://sonner.emilkowal.ski/) |
| Date Utilities | [date-fns](https://date-fns.org/) |

---

## Project Structure

```
kanakku/
├── public/                   # Static assets
├── src/
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom React hooks (useExpenses, useIncome, useGroups, …)
│   ├── integrations/
│   │   └── supabase/         # Supabase client & auto-generated TypeScript types
│   ├── lib/                  # Utilities (receiptStorage, offlineStorage, …)
│   ├── pages/                # Route-level page components
│   │   ├── Dashboard.tsx
│   │   ├── Expenses.tsx
│   │   ├── AddExpense.tsx
│   │   ├── ExpenseDetail.tsx
│   │   ├── Income.tsx
│   │   ├── Analytics.tsx
│   │   ├── Budget.tsx
│   │   ├── Groups.tsx
│   │   ├── Profile.tsx
│   │   └── …
│   ├── types/                # Shared TypeScript type definitions
│   ├── App.tsx               # Root component with routing & QueryClient setup
│   └── main.tsx              # Application entry point
├── supabase/
│   └── migrations/           # SQL migration files
├── PERFORMANCE_OPTIMIZATION.md
├── RECEIPT_STORAGE_SETUP.md
├── RLS_POLICY_FIX.md
├── index.html
├── package.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) v9 or later (or [Bun](https://bun.sh/))
- A [Supabase](https://supabase.com/) account and project

---

## Installation

### 1. Clone the repository

```sh
git clone https://github.com/Easwarp45/kanakku.git
cd kanakku
```

### 2. Install dependencies

```sh
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and add your Supabase credentials:

```sh
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
```

See the [Environment Variables](#environment-variables) section for details on where to find these values.

### 4. Set up Supabase

- Create a new Supabase project at [app.supabase.com](https://app.supabase.com).
- Run the SQL migrations in `supabase/migrations/` via the Supabase SQL Editor or the Supabase CLI.
- Follow the receipt storage guide to create the `receipts` bucket: [RECEIPT_STORAGE_SETUP.md](./RECEIPT_STORAGE_SETUP.md).
- If you encounter RLS policy errors on uploads, refer to [RLS_POLICY_FIX.md](./RLS_POLICY_FIX.md).

---

## Getting Started

Start the development server:

```sh
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser. The app supports hot-module replacement, so changes are reflected instantly.

---

## Environment Variables

Add the following variables to your `.env` file:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL (e.g. `https://<project-id>.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anonymous/public API key |

You can find both values in your Supabase project under **Project Settings → API**.

> **Note:** Never commit real credentials. These are Vite public variables (prefixed with `VITE_`) and will be bundled into the client. Use Supabase Row Level Security (RLS) policies to protect your data.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Documentation

| Document | Description |
|---|---|
| [RECEIPT_STORAGE_SETUP.md](./RECEIPT_STORAGE_SETUP.md) | How to create the Supabase Storage receipts bucket and configure access policies |
| [RLS_POLICY_FIX.md](./RLS_POLICY_FIX.md) | Fix for "new row violates row-level security policy" errors on receipt uploads |
| [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) | Query optimizations, caching strategy, and database index recommendations |

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: add your feature"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a pull request

Please ensure your code follows the existing code style and that ESLint passes (`npm run lint`) before submitting.

---

## License

This project is open source. See the repository for license details.
