import { format } from 'date-fns';
import type { Insight, InsightHistoryEntry } from '@/types/insights';

const MAX_HISTORY_ITEMS = 240;
const HISTORY_KEY_PREFIX = 'kanakku_insight_history_';

function buildHistoryKey(userId: string): string {
  return `${HISTORY_KEY_PREFIX}${userId}`;
}

export function getInsightHistory(userId: string): InsightHistoryEntry[] {
  try {
    const raw = localStorage.getItem(buildHistoryKey(userId));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as InsightHistoryEntry[];
    if (!Array.isArray(parsed)) return [];

    return parsed.sort((a, b) => b.recordedAt - a.recordedAt);
  } catch {
    return [];
  }
}

function normalizeToHistoryEntry(insight: Insight, recordedDate: string, recordedAt: number): InsightHistoryEntry {
  return {
    ...insight,
    recordedDate,
    recordedAt,
  };
}

function historyFingerprint(item: Pick<InsightHistoryEntry, 'recordedDate' | 'type' | 'title' | 'message'>): string {
  return `${item.recordedDate}|${item.type}|${item.title}|${item.message}`;
}

export function appendInsightHistory(userId: string, insights: Insight[], now: Date = new Date()): InsightHistoryEntry[] {
  if (!userId || insights.length === 0) {
    return getInsightHistory(userId);
  }

  const recordedDate = format(now, 'yyyy-MM-dd');
  const recordedAt = now.getTime();

  const existing = getInsightHistory(userId);
  const fingerprints = new Set(existing.map((item) => historyFingerprint(item)));

  const nextItems: InsightHistoryEntry[] = [...existing];

  for (const insight of insights) {
    const candidate = normalizeToHistoryEntry(insight, recordedDate, recordedAt);
    const key = historyFingerprint(candidate);

    if (!fingerprints.has(key)) {
      nextItems.push(candidate);
      fingerprints.add(key);
    }
  }

  const trimmed = nextItems
    .sort((a, b) => b.recordedAt - a.recordedAt)
    .slice(0, MAX_HISTORY_ITEMS);

  localStorage.setItem(buildHistoryKey(userId), JSON.stringify(trimmed));
  return trimmed;
}

export function filterInsightHistory(
  entries: InsightHistoryEntry[],
  filterType: Insight['type'] | 'all'
): InsightHistoryEntry[] {
  if (filterType === 'all') {
    return [...entries];
  }

  return entries.filter((entry) => entry.type === filterType);
}

export function groupInsightHistoryByDate(
  entries: InsightHistoryEntry[]
): Record<string, InsightHistoryEntry[]> {
  return entries.reduce((acc, item) => {
    if (!acc[item.recordedDate]) {
      acc[item.recordedDate] = [];
    }

    acc[item.recordedDate].push(item);
    return acc;
  }, {} as Record<string, InsightHistoryEntry[]>);
}
