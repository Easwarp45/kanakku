# 🧠 Smart Insights Engine - Visual Reference

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     KANAKKU EXPENSE APP                       │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              USER DATA SOURCES                         │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  • useExpenses() → Last 30 days expenses               │  │
│  │  • useBudgets() → Category & total budgets             │  │
│  │  • useAuth() → Current user ID                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ↓                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           useSmartInsights() [Custom Hook]             │  │
│  │         Orchestrates data → Calculates → Returns       │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ↓                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │      INSIGHTS ENGINE (lib/insightsEngine.ts)          │  │
│  │                                                        │  │
│  │  calculateAnalytics()                                 │  │
│  │    ├─ Monthly total & daily average                   │  │
│  │    ├─ Category-wise breakdown                         │  │
│  │    ├─ Weekend vs weekday analysis                     │  │
│  │    ├─ Budget status & remaining                       │  │
│  │    └─ Month-over-month growth                         │  │
│  │           ↓                                            │  │
│  │  generateInsights()                                   │  │
│  │    ├─ Rule 1: Budget Overspend Check                  │  │
│  │    ├─ Rule 2: High Usage Alert                        │  │
│  │    ├─ Rule 3: Category Spike Detection                │  │
│  │    ├─ Rule 4: Top Category Identification             │  │
│  │    ├─ Rule 5: Weekend Pattern Analysis                │  │
│  │    ├─ Rule 6: Future Spending Forecast                │  │
│  │    ├─ Rule 7: Frequent Spending Detection             │  │
│  │    ├─ Rule 8: Positive Reinforcement                  │  │
│  │    ├─ Rule 9: Savings Opportunity Suggestions         │  │
│  │    └─ Rule 10: Growth Alert Detection                 │  │
│  │           ↓                                            │  │
│  │  Sort by Priority (High → Medium → Low)               │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ↓                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         COMPONENTS (UI Layer)                          │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │  InsightCard          InsightsList      InsightsWidget│  │
│  │  ────────────        ──────────────     ───────────── │  │
│  │  Single insight      Full list with      Top insights │  │
│  │  display card        priority groups     for dashboard│  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ↓                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         PAGES (User-Facing)                            │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  Dashboard                    Analytics Page          │  │
│  │  ──────────                   ────────────────         │  │
│  │  • InsightsWidget (top 2)      • InsightsList (all)    │  │
│  │  • "View All" link             • Grouped by priority   │  │
│  │  • Compact display             • Detailed view         │  │
│  │  • Quick glance                • With charts/stats     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Transformation Pipeline

```
RAW EXPENSES
├─ {amount: 250, category: 'food', date: '2026-03-10'}
├─ {amount: 500, category: 'transport', date: '2026-03-10'}
├─ {amount: 100, category: 'entertainment', date: '2026-03-11'}
└─ ... (27 more)
         │
         ↓
ANALYTICS CALCULATION
├─ monthlyTotal: 15,000
├─ dailyAverage: 500
├─ categoryTotals: {food: 3500, transport: 2000, ...}
├─ weekendSpending: 4000
├─ weekdaySpending: 11000
├─ topCategory: 'food'
└─ budgetStatus: {isOverBudget: true, percentage: 100}
         │
         ↓
INSIGHT RULES APPLICATION
├─ Rule 1 (Budget) → "⚠️ You're ₹1,200 over budget"
├─ Rule 4 (Top Cat) → "🍔 Food is 28% of spending"
├─ Rule 9 (Savings) → "💡 Cut food by 15%, save ₹525"
├─ Rule 8 (Positive) → "✨ Transport spending OK"
└─ Rule 10 (Growth) → "📈 Spending up 30%"
         │
         ↓
PRIORITY SORTING
├─ [HIGH] ⚠️ Budget Alert
├─ [HIGH] 📈 Growth Alert
├─ [MEDIUM] 🍔 Top Category
├─ [MEDIUM] 💡 Savings Suggestion
└─ [LOW] ✨ Positive Feedback
         │
         ↓
USER DISPLAY
┌─────────────────────────────┐
│ ⚠️ Budget Alert          [!] │
│ You're ₹1,200 over budget   │
├─────────────────────────────┤
│ 📈 Growth Alert          [!] │
│ Spending up 30% vs last mo  │
├─────────────────────────────┤
│ 🍔 Top Category          [i] │
│ Food is 28% of your spend   │
└─────────────────────────────┘
```

---

## Insight Priorities & Flow

```
START: Generate All Insights
         │
         ↓
┌─────────────────────────────────────────────────────┐
│ HIGH PRIORITY (Critical Warnings)                   │
├─────────────────────────────────────────────────────┤
│ ⚠️  Budget Overspend         (if total > budget)     │
│ 🔔 High Usage Alert          (if 80-100% used)      │
│ 🚨 Category Over Budget      (if category over)     │
│ 📈 Growth Alert              (if +15% growth)       │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ MEDIUM PRIORITY (Insights & Suggestions)             │
├─────────────────────────────────────────────────────┤
│ 🍔 Top Spending Category     (always)                │
│ 🎉 Weekend/Weekday Pattern   (if significant ratio) │
│ 📊 Monthly Forecast          (if enough data)       │
│ 💡 Savings Opportunity       (always)                │
│ 🍔 Frequent Spending         (if pattern detected)  │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│ LOW PRIORITY (General Observations)                 │
├─────────────────────────────────────────────────────┤
│ ✨ Positive Reinforcement    (if under budget/down)│
└─────────────────────────────────────────────────────┘
         ↓
DISPLAY: Warnings First, Then Insights, Finally Positive
```

---

## Component Hierarchy

```
useSmartInsights()
      │
      ├─→ InsightsWidget
      │     └─→ InsightCard (x2)
      │
      ├─→ InsightsList
      │     ├─→ HIGH PRIORITY Section
      │     │     └─→ InsightCard (x N)
      │     ├─→ MEDIUM PRIORITY Section
      │     │     └─→ InsightCard (x N)
      │     └─→ LOW PRIORITY Section
      │           └─→ InsightCard (x N)
      │
      └─→ Custom Implementation
            └─→ Filter/Sort insights as needed
```

---

## Rule Decision Tree

```
START: Analyze User Expenses
│
├─ RULE 1: Budget Overspend?
│  ├─ YES → Generate WARNING: "Over budget by ₹X"
│  └─ NO → Continue to RULE 2
│
├─ RULE 2: Budget Usage ≥ 80%?
│  ├─ YES → Generate WARNING: "Using X% of budget"
│  └─ NO → Continue to RULE 3
│
├─ RULE 3: Category Spike?
│  ├─ YES → Generate WARNING: "Category over budget"
│  └─ NO → Continue to RULE 4
│
├─ RULE 4: Top Category?
│  ├─ YES → Generate INSIGHT: "Top category is X (Y%)"
│  └─ NO → Continue to RULE 5
│
├─ RULE 5: Weekend Pattern?
│  ├─ YES → Generate INSIGHT: "Spending pattern observed"
│  └─ NO → Continue to RULE 6
│
├─ RULE 6: Future Forecast?
│  ├─ YES → Generate INSIGHT: "Predicted month total ₹X"
│  └─ NO → Continue to RULE 7
│
├─ RULE 7: Frequent Spending?
│  ├─ YES → Generate SUGGESTION: "Reduce X category"
│  └─ NO → Continue to RULE 8
│
├─ RULE 8: Positive Feedback?
│  ├─ YES → Generate POSITIVE: "Great spending control!"
│  └─ NO → Continue to RULE 9
│
├─ RULE 9: Savings Opportunity?
│  ├─ YES → Generate SUGGESTION: "Save ₹X by reducing Y"
│  └─ NO → Continue to RULE 10
│
└─ RULE 10: Growth Alert?
   ├─ YES → Generate WARNING: "Spending up by X%"
   └─ NO → Continue to next month
```

---

## State Management & Caching

```
┌──────────────────────────────┐
│  React Query Cache (10 min)   │
├──────────────────────────────┤
│  queryKey: ['expenses', ...]  │
│  queryKey: ['budgets', ...]   │
│  queryKey: ['groups', ...]    │
└──────────────────────────────┘
         │
         ↓ (triggers calculation if stale)
┌──────────────────────────────┐
│  useSmartInsights() Hook      │
│  (runs calculateAnalytics)    │
│  (runs generateInsights)      │
│  (memoized with useMemo)      │
└──────────────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│  insights: Insight[]          │
│  isLoading: boolean           │
│  isEmpty: boolean             │
└──────────────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│  React Component Tree         │
│  Re-render only if deps       │
│  change (expenses/budgets)    │
└──────────────────────────────┘
```

---

## Insight Type Color Coding

```
┌────────────┬────────────────┬──────────────────┬─────────────┐
│  Type      │  Background    │  Badge Color     │  Icon       │
├────────────┼────────────────┼──────────────────┼─────────────┤
│ warning    │  Red-50        │  Red-100/800     │  ⚠️ 🚨 🔴   │
│ insight    │  Blue-50       │  Blue-100/800    │  💡 📊 🎯   │
│ suggestion │  Amber-50      │  Amber-100/800   │  💬 📝 ✏️   │
│ positive   │  Green-50      │  Green-100/800   │  ✨ 💰 👍   │
└────────────┴────────────────┴──────────────────┴─────────────┘
```

---

## Category to Emoji Mapping

```
🍔 Food & Dining       💎 Health & Wellness    📚 Education
🚗 Transport           ✈️ Travel               📌 Other
🎬 Entertainment       📱 Bills & Utilities    🛍️ Shopping
```

---

## Performance Characteristics

```
Operation                    Time      Notes
─────────────────────────────────────────────────────────
Fetch 30 day expenses        50-150ms  From Supabase
Fetch budgets                30-100ms  From Supabase
Calculate analytics          5-10ms    In-memory calc
Apply 10 insight rules       5-15ms    Rule evaluation
Sort insights                < 1ms     Array sort
Component render             50-200ms  React + CSS
─────────────────────────────────────────────────────────
Total pipeline               150-550ms Typical user
Recalc (memoized)            < 1ms     If cached
```

---

## File Dependencies

```
Dashboard.tsx
    │
    └─→ useSmartInsights()
        │
        ├─→ useExpenses()
        ├─→ useBudgets()
        ├─→ useAuth()
        │
        └─→ insightsEngine.ts
            ├─→ calculateAnalytics()
            │   └─→ date-fns
            │
            └─→ generateInsights()
                └─→ 10 rule functions

Analytics.tsx
    │
    └─→ InsightsList.tsx
        │
        └─→ InsightCard.tsx
            └─→ Tailwind + Lucide Icons
```

---

## Mobile Layout

```
DESKTOP (1024px+)          TABLET (768px-1023px)    MOBILE (<768px)
┌──────────────────┐       ┌──────────────────┐      ┌────────────┐
│ Smart Insights   │       │ Smart Insights   │      │ Smart      │
│ ─────────────    │       │ ─────────────    │      │ Insights   │
│ ⚠️ Warning 1     │       │ ⚠️ Warning 1     │      │ ────────── │
│ 💡 Insight 2     │       │ 💡 Insight 2     │      │ ⚠️ Warning │
│ 💬 Suggestion 3  │       │ (Single column)  │      │ (Stacked)  │
│ ✨ Positive 4    │       │                  │      │ 💡 Insight │
└──────────────────┘       └──────────────────┘      │ 💬 Suggest │
   4 cards                      3 cards               │ ✨ Positive│
   side by side                 stacked               └────────────┘
```

---

## This Diagram Powers Kanakku! 💚

The Smart Insights Engine analyzes expenses automatically and generates intelligent insights without AI/ML models.

