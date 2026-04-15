// Pure helper functions extracted from FinancialIntelligence.tsx (UX-1)
// Keeping them in a separate file reduces the main component parse time on low-end devices.

import { format, subDays, startOfDay, getDay, getHours, eachDayOfInterval, getISOWeek } from 'date-fns';
import type { TimeBlock } from './constants';

export function getTimeBlock(hour: number): TimeBlock {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/** Build a per-day spending totals map for the last `weeks` weeks */
export function buildCalendarHeatmap(
  expenses: { amount: number; expense_date: string }[],
  weeks = 14
) {
  const today = startOfDay(new Date());
  const start = subDays(today, weeks * 7 - 1);
  const days = eachDayOfInterval({ start, end: today });

  const map: Record<string, number> = {};
  for (const e of expenses) {
    const key = e.expense_date.slice(0, 10);
    map[key] = (map[key] || 0) + e.amount;
  }

  return days.map((d) => ({
    date: format(d, 'yyyy-MM-dd'),
    label: format(d, 'dd MMM'),
    dow: getDay(d),
    week: getISOWeek(d),
    amount: map[format(d, 'yyyy-MM-dd')] ?? 0,
  }));
}

/** Build time-of-day spending distribution from expense updated_at timestamps */
export function buildTimeDist(expenses: { amount: number; updated_at: string }[]) {
  const buckets: Record<TimeBlock, { spent: number; count: number }> = {
    morning: { spent: 0, count: 0 },
    afternoon: { spent: 0, count: 0 },
    evening: { spent: 0, count: 0 },
    night: { spent: 0, count: 0 },
  };
  const BLOCKS: TimeBlock[] = ['morning', 'afternoon', 'evening', 'night'];

  for (const e of expenses) {
    const h = getHours(new Date(e.updated_at));
    const b = getTimeBlock(h);
    buckets[b].spent += e.amount;
    buckets[b].count += 1;
  }

  return BLOCKS.map((b) => ({ block: b, ...buckets[b] }));
}

/** Build day-of-week spending totals */
export function buildDowDist(expenses: { amount: number; expense_date: string }[]) {
  const buckets = Array.from({ length: 7 }, (_, i) => ({ dow: i, amount: 0, count: 0 }));
  for (const e of expenses) {
    const d = getDay(new Date(e.expense_date));
    buckets[d].amount += e.amount;
    buckets[d].count += 1;
  }
  return buckets;
}

/** Default goal state: target ₹1L, saved ₹20K, 3 months from now */
export function getDefaultGoalState() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return {
    target: 100000,
    saved: 20000,
    deadline: d.toISOString().split('T')[0],
  };
}
