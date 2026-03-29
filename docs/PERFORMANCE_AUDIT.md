# Performance Audit Guide

## Overview

This guide provides instructions for monitoring and optimizing the performance of the Kanakku expense tracking application.

## Quick Performance Check

### Build Size Analysis
```bash
npm run build

# Check bundle size (target: < 500KB for main chunk)
# Current: ~1.4MB (see warnings in build output)
```

### Lighthouse Audit
1. Build the production app: `npm run build`
2. Serve it: `npm run preview`
3. Open Chrome DevTools → Lighthouse tab
4. Run audit with "Performance" selected

**Target Metrics:**
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Total Blocking Time (TBT): < 200ms
- Cumulative Layout Shift (CLS): < 0.1

---

## React DevTools Profiler

### Setup
1. Install React DevTools extension for Chrome/Firefox
2. Start dev server: `npm run dev`
3. Open DevTools → Profiler tab

### What to Profile

#### 1. **Group Detail Page** (Most Complex)
Critical interactions to profile:
- Initial page load with group data
- Switching between tabs (Members, Expenses, Balances, Chat)
- Real-time message updates in chat
- Member removal detection

**How to profile:**
1. Click "Record" in Profiler
2. Navigate to a group detail page
3. Switch between all tabs
4. Send a chat message
5. Stop recording

**Red flags:**
- Any component taking > 16ms to render (60fps threshold)
- Unnecessary re-renders of child components
- Expensive calculations not memoized

#### 2. **Expenses List** (Data Heavy)
Test with:
- Group with 50+ expenses
- Scroll performance
- Filter/search interactions

#### 3. **Dashboard** (Initial Load)
Profile:
- Cold start (first visit)
- Warm start (cached data)
- Analytics chart rendering

---

## Known Performance Optimizations

### 1. React Query Configuration (App.tsx:35-50)
```typescript
staleTime: 1000 * 60 * 2  // 2 minutes (reduced from 10 min)
gcTime: 1000 * 60 * 60    // 1 hour cache retention
refetchOnWindowFocus: false  // Disabled to reduce bandwidth
```

**Impact:** Reduces unnecessary network requests while balancing data freshness.

### 2. WebSocket vs Polling (useGroups.ts)
**Before:** Polled membership status every 5 seconds = 12 requests/minute
**After:** Single persistent WebSocket connection
**Savings:** ~99% reduction in membership check traffic

### 3. Database Indexes (migrations/20260314150000_performance_indexes.sql)
- Indexed group_id on group_members for faster lookups
- Indexed user_id on expenses for quicker personal expense queries
- Composite indexes for common join patterns

---

## Performance Monitoring Utilities

### Built-in Performance API
Add to any component:

```typescript
import { useEffect } from 'react';

export function MyComponent() {
  useEffect(() => {
    const mark = `MyComponent-render-${Date.now()}`;
    performance.mark(mark);

    return () => {
      performance.measure('MyComponent render', mark);
      const measures = performance.getEntriesByName('MyComponent render');
      console.log(`MyComponent took ${measures[0]?.duration}ms`);
      performance.clearMarks(mark);
      performance.clearMeasures('MyComponent render');
    };
  });

  return <div>...</div>;
}
```

### React Query Devtools
Already included in development:
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Shows cache status, refetch triggers, and query timing
```

---

## Common Performance Issues & Solutions

### Issue 1: Large Bundle Size (Current: 1.4MB)
**Cause:** All dependencies bundled into single chunk
**Solutions:**
- [ ] Code-split routes using React.lazy()
- [ ] Lazy load heavy dependencies (recharts, framer-motion)
- [ ] Remove unused dependencies
- [ ] Use dynamic imports for admin-only features

**Example:**
```typescript
const Analytics = React.lazy(() => import('./pages/Analytics'));
```

### Issue 2: Expensive Re-renders
**Symptoms:** Lag when typing in forms, slow list scrolling
**Solutions:**
- Use `React.memo()` for expensive list items
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for event handlers passed to children

### Issue 3: Unoptimized Images/Assets
**Checklist:**
- [ ] Avatar images lazy-loaded
- [ ] Receipt images compressed before upload
- [ ] Use modern formats (WebP) with fallbacks

### Issue 4: Too Many Realtime Subscriptions
**Current subscriptions per GroupDetail page:**
- group_members changes
- group_chats changes
- member_removal_notifications

**Monitor:** Supabase dashboard → Realtime tab → Active connections

---

## Performance Benchmarking Checklist

### Before Deployment
- [ ] Run Lighthouse audit (Performance score > 90)
- [ ] Check bundle size (< 500KB ideal, < 1MB acceptable)
- [ ] Test on 3G network simulation (Chrome DevTools → Network → Throttling)
- [ ] Test with React DevTools Profiler (no components > 16ms render)
- [ ] Verify offline functionality (PWA)

### After Deployment
- [ ] Monitor Web Vitals in production (use Google Analytics or Vercel Analytics)
- [ ] Track Supabase query performance (Dashboard → Performance)
- [ ] Monitor error rates (Sentry/LogRocket)

---

## Tools

### Development
- **React DevTools Profiler** - Component render performance
- **Chrome DevTools Performance** - Overall page performance
- **Network tab** - Request waterfall and sizes

### Production
- **Lighthouse CI** - Automated performance regression testing
- **Web Vitals** - Real user monitoring (RUM)
- **Sentry** - Error tracking with performance monitoring

### Database
- **Supabase Performance Dashboard** - Query execution times
- **pg_stat_statements** - PostgreSQL query analytics

---

## Next Steps

1. **Immediate**: Profile GroupDetail page with React DevTools
2. **Short-term**: Implement code-splitting for route-based chunks
3. **Medium-term**: Add performance monitoring to production (Web Vitals)
4. **Long-term**: Set up Lighthouse CI in GitHub Actions

---

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Supabase Performance Best Practices](https://supabase.com/docs/guides/platform/performance)
