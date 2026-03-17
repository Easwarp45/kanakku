# 🧠 Smart Insights Engine - Quick Start Guide

## TL;DR (30 seconds)

The **Smart Insights Engine** is a rule-based analytics system that generates intelligent insights about spending without using AI/ML. It analyzes expenses and generates human-friendly alerts and suggestions.

---

## ⚡ Quick Integration (5 minutes)

### 1️⃣ Use in Dashboard (Compact Widget)
```typescript
import { useSmartInsights } from '@/hooks/useSmartInsights';
import { InsightsWidget } from '@/components/insights/InsightsWidget';

function Dashboard() {
  const { insights, isLoading } = useSmartInsights();
  
  return (
    <InsightsWidget 
      insights={insights}
      maxItems={3}           // Show top 3 insights
      isLoading={isLoading}
    />
  );
}
```

### 2️⃣ Use in Analytics Page (Full List)
```typescript
import { useSmartInsights } from '@/hooks/useSmartInsights';
import { InsightsList } from '@/components/insights/InsightsList';

function Analytics() {
  const { insights, isLoading } = useSmartInsights();
  
  return (
    <InsightsList 
      insights={insights}
      isLoading={isLoading}
      title="Smart Insights"
      description="AI-powered spending analysis"
    />
  );
}
```

### 3️⃣ Custom Display
```typescript
import { useSmartInsights } from '@/hooks/useSmartInsights';
import { InsightCard } from '@/components/insights/InsightCard';

function CustomPage() {
  const { insights } = useSmartInsights();
  
  return (
    <div className="space-y-4">
      {insights
        .filter(i => i.priority === 'high')  // Only warnings
        .map(insight => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
    </div>
  );
}
```

---

## 🎯 What You Get

### Automatic Insights Generated:
```
1. ⚠️  Budget alerts when overspending
2. 🔔 High usage warnings (80%+ of budget)
3. 📊 Category spike detection
4. 🍔 Top spending category identification
5. 🎉 Weekend vs weekday patterns
6. 📈 Monthly spending forecast
7. 🥘 Recurring expense detection
8. ✨ Positive reinforcement
9. 💡 Savings recommendations
10. 📈 Growth alerts (month-over-month)
```

---

## 📊 Example Outputs

### Insight 1: Budget Warning
```
{
  type: 'warning',
  priority: 'high',
  icon: '⚠️',
  title: 'Budget Alert',
  message: '⚠️ You\'re spending ₹1,200 over your ₹15,000 budget. Slow down! 🛑'
}
```

### Insight 2: Top Category
```
{
  type: 'insight',
  priority: 'medium',
  icon: '🍔',
  title: 'Top Spending Category',
  message: '🍔 Food is your biggest expense — ₹3,500 (28% of spending)'
}
```

### Insight 3: Savings Suggestion
```
{
  type: 'suggestion',
  priority: 'medium',
  icon: '🍱',
  title: 'Savings Opportunity',
  message: '🍱 Cut food spending by 15% (save ~₹525) — Order less, cook more!'
}
```

---

## 🔌 API Reference

### Hook: `useSmartInsights()`
```typescript
const { insights, isLoading, isEmpty } = useSmartInsights();

// Returns:
// - insights: Insight[]    // Array of insights, sorted by priority
// - isLoading: boolean     // Data fetching status
// - isEmpty: boolean       // True if no insights available
```

### Component: `<InsightsWidget />`
```typescript
<InsightsWidget 
  insights={Insight[]}        // Required: insights array
  maxItems={number}           // Optional: max insights to show (default: 3)
  isLoading={boolean}         // Optional: show loading state
/>
```

### Component: `<InsightsList />`
```typescript
<InsightsList 
  insights={Insight[]}                    // Required
  isLoading={boolean}                     // Optional
  title={string}                          // Optional: custom title
  description={string}                    // Optional: custom description
/>
```

### Component: `<InsightCard />`
```typescript
<InsightCard insight={Insight} />
// Single insight display with icon, type badge, title, message
```

---

## 🧬 How It Works (Under the Hood)

### Step 1: Fetch Data
```
useSmartInsights()
  ↓
Fetches last 30 days expenses
+ Previous month expenses
+ Current budgets
```

### Step 2: Calculate Metrics
```
calculateAnalytics()
  ↓
Computes 15+ metrics:
- Monthly total, daily avg
- Category breakdown
- Budget status
- Weekend vs weekday analysis
- Month-over-month growth
- Payment method frequency
```

### Step 3: Generate Insights
```
generateInsights()
  ↓
Applies 10 rule-based rules:
- Budget rules
- Category rules
- Pattern rules
- Growth rules
```

### Step 4: Sort & Return
```
Sort by priority (high → medium → low)
↓
Return insights array
```

---

## 🎨 Styling

### Insight Types (Auto-colored)
- **warning** → Red background
- **insight** → Blue background
- **suggestion** → Amber background
- **positive** → Green background

### Priorities
- **high** → ⚠️ Needs Attention (red icon)
- **medium** → 💡 Key Insights (amber icon)
- **low** → ℹ️ Additional Info (blue icon)

---

## 💡 Best Practices

### ✅ Do
- Use `InsightsWidget` on dashboard (compact)
- Use `InsightsList` on analytics page (detailed)
- Filter by priority if needed
- Check `isEmpty` before rendering empty state
- Let the system sort insights (by priority)

### ❌ Don't
- Modify insight messages programmatically
- Create custom insight types outside the 4 defined types
- Fetch insights more than once per page load
- Expect real-time updates (queries cache for 10 mins)

---

## 🔍 Debugging

### No insights showing?
```typescript
const { insights, isEmpty, isLoading } = useSmartInsights();

// Check:
console.log('isEmpty:', isEmpty);        // No categories/expenses?
console.log('isLoading:', isLoading);    // Still fetching?
console.log('insights:', insights);      // Any insights?
```

### Wrong insight showing?
- Check latest calculation rules in `insightsEngine.ts`
- Verify expense data is correct
- Check budget amounts are set

### Performance issue?
- Insights are memoized (useSmemo)
- Analytics calculation: < 10ms
- Typically only 6-10 insights generated
- Check network tab for expense fetching time

---

## 🚀 Common Tasks

### Show only high-priority insights
```typescript
const highPriority = insights.filter(i => i.priority === 'high');
```

### Show insights for a specific category
```typescript
const foodInsights = insights.filter(i => i.relatedCategory === 'food');
```

### Count insights by type
```typescript
const warnings = insights.filter(i => i.type === 'warning').length;
```

### Get insight with most savings potential
```typescript
const maxSavings = insights
  .filter(i => i.data?.potential_savings)
  .sort((a, b) => (b.data?.potential_savings || 0) - (a.data?.potential_savings || 0))[0];
```

---

## 📱 Mobile Responsiveness

All components are fully responsive:
- **InsightsWidget**: Stacks cleanly on mobile
- **InsightsList**: Full-width on mobile
- **InsightCard**: Readable on any screen size

---

## ♿ Accessibility

- Semantic HTML structure
- ARIA labels for icons
- Color-blind friendly (not relying on color alone)
- Keyboard navigable
- Clear visual hierarchy

---

## 🧪 Testing

### Test with different data:
```typescript
// Overspend scenario
const expenses = [/* 50+ daily expenses totaling 16000 */];

// Happy path
const expenses = [/* expenses totaling 8000 with budget 15000 */];

// No data
const expenses = [];
```

---

## 📚 More Info

See `SMART_INSIGHTS_DOCUMENTATION.md` for:
- Complete architecture
- All 10 rules explained
- Calculation examples
- Design principles
- Future enhancements

---

## 🎯 Summary

| Component | Use Case | Best For |
|-----------|----------|----------|
| `useSmartInsights()` | Logic | Custom implementations |
| `InsightsWidget` | Compact display | Dashboard, home screen |
| `InsightsList` | Full display | Analytics, insights page |
| `InsightCard` | Single item | Custom layouts |

---

**That's it! 🎉 Start using insights in 5 minutes.**
