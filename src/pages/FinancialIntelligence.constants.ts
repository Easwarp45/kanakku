// Constants extracted from FinancialIntelligence.tsx (UX-1)
// Separating constants reduces re-evaluation cost during hot reloads and
// allows tree-shaking if sections are further split in the future.

import {
  Repeat2, MapPin, Clock, SplitSquareHorizontal, Target,
  AlertTriangle, CheckCircle2, XCircle, TrendingUp,
} from 'lucide-react';

export const SECTION_IDS = ['subscriptions', 'heatmap', 'time', 'settlements', 'goals'] as const;
export type SectionId = (typeof SECTION_IDS)[number];
export type TimeBlock = 'morning' | 'afternoon' | 'evening' | 'night';

export const SECTION_META: Record<SectionId, { label: string; icon: React.ElementType; color: string }> = {
  subscriptions: { label: 'Subscriptions', icon: Repeat2,              color: 'text-violet-400'  },
  heatmap:       { label: 'Spend Map',     icon: MapPin,                color: 'text-cyan-400'    },
  time:          { label: 'Time Patterns', icon: Clock,                 color: 'text-pink-400'    },
  settlements:   { label: 'Settlements',   icon: SplitSquareHorizontal, color: 'text-amber-400'   },
  goals:         { label: 'Goals',         icon: Target,                color: 'text-emerald-400' },
};

export const STATUS_CFG = {
  'active':                    { label: 'Active',   cls: 'text-emerald-400 bg-emerald-500/12 border-emerald-500/25', icon: CheckCircle2 },
  'possible-unused':           { label: 'Unused?',  cls: 'text-amber-400   bg-amber-500/12   border-amber-500/25',   icon: AlertTriangle },
  'low-value':                 { label: 'Pricey',   cls: 'text-red-400    bg-red-500/12    border-red-500/25',      icon: TrendingUp   },
  'low-value-possible-unused': { label: '⚠ Cancel', cls: 'text-red-400    bg-red-500/12    border-red-500/25',      icon: XCircle      },
} as const;

export const GOAL_CFG = {
  'on-track':  { color: 'text-emerald-400', grad: 'from-emerald-500/15 to-teal-500/5',    icon: '🚀' },
  'at-risk':   { color: 'text-amber-400',   grad: 'from-amber-500/15 to-orange-500/5',    icon: '⚡' },
  'behind':    { color: 'text-red-400',     grad: 'from-red-500/15 to-rose-500/5',        icon: '🔥' },
  'completed': { color: 'text-violet-400',  grad: 'from-violet-500/15 to-purple-500/5',   icon: '🎉' },
  'expired':   { color: 'text-slate-400',   grad: 'from-slate-500/15 to-gray-500/5',      icon: '⏰' },
} as const;

export const TIME_CFG: Record<TimeBlock, { label: string; sub: string; color: string }> = {
  morning:   { label: '☀️ Morning',   sub: '5 AM – 12 PM', color: '#FACC15' },
  afternoon: { label: '🌤 Afternoon', sub: '12 PM – 5 PM', color: '#FB923C' },
  evening:   { label: '🌆 Evening',   sub: '5 PM – 9 PM',  color: '#A855F7' },
  night:     { label: '🌙 Night',     sub: '9 PM – 5 AM',  color: '#22D3EE' },
};

export const BLOCKS: TimeBlock[] = ['morning', 'afternoon', 'evening', 'night'];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
