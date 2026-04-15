import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft, Brain, Zap, Clock, MapPin, Repeat2,
  Target, TrendingUp, AlertTriangle, CheckCircle2,
  XCircle, ChevronRight, ChevronUp, ChevronDown,
  ArrowRight, Flame, Trophy, Gauge, Star, CreditCard,
  Users, SplitSquareHorizontal, Send, Info,
} from 'lucide-react';
import { useFinancialIntelligence } from '@/hooks/useFinancialIntelligence';
import { useFinancialGoals, useUpsertFinancialGoals } from '@/hooks/useFinancialGoals';
import { useExpenses } from '@/hooks/useExpenses';
import { useGroups, useGroupBalances, useGroupMembers, useRecordSettlement } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import BottomNav from '@/components/layout/BottomNav';
import { cn } from '@/lib/utils';
import type { SubscriptionDetection } from '@/types/financial-intelligence';
import type { Group } from '@/types/group';
// Extracted constants and helpers (UX-1 split)
import {
  SECTION_IDS, SECTION_META, STATUS_CFG, GOAL_CFG, TIME_CFG, BLOCKS, DOW,
  type SectionId,
} from './FinancialIntelligence.constants';
import {
  buildCalendarHeatmap, buildTimeDist, buildDowDist, getDefaultGoalState,
} from './FinancialIntelligence.helpers';

/* ─────────────────── SHARED UI ATOMS ─────────────────── */
function Skel({ className }: { className?: string }) {
  return <div className={cn('rounded-xl bg-white/5 animate-pulse', className)} />;
}

function SectionWrap({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="scroll-mt-20"
    >
      {children}
    </motion.section>
  );
}

function SHead({ icon: Icon, color, title, sub }: { icon: React.ElementType; color: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
        <Icon className={cn('h-4.5 w-4.5', color)} />
      </div>
      <div>
        <h2 className="font-display text-base font-bold leading-tight">{title}</h2>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

/* ─────────────────── SETTLEMENT PANEL (reads hooks at component level) ─────────────────── */
function SettlementPanel({ group, currentUserId, fmt }: {
  group: Group;
  currentUserId: string;
  fmt: (n: number) => string;
}) {
  const navigate = useNavigate();
  const { balances, simplifiedDebts } = useGroupBalances(group.id);
  const { data: members = [] }        = useGroupMembers(group.id);
  const recordSettlement              = useRecordSettlement();

  const memberMap = useMemo(() => {
    const m: Record<string, string> = {};
    members.forEach(mem => {
      m[mem.user_id] = mem.nickname || mem.profile?.display_name || 'Member';
    });
    return m;
  }, [members]);

  const myBalance = balances.find(b => b.user_id === currentUserId);
  const myDebts   = simplifiedDebts.filter(d => d.from_user_id === currentUserId);
  const myCredits = simplifiedDebts.filter(d => d.to_user_id   === currentUserId);

  const handleSettle = async (toUserId: string, amount: number) => {
    await recordSettlement.mutateAsync({ group_id: group.id, paid_to: toUserId, amount });
  };

  return (
    <div className="bento-card space-y-4">
      {/* group header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Users className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="font-display font-bold text-sm">{group.name}</p>
            <p className="text-[10px] text-muted-foreground">{simplifiedDebts.length} pending transfers</p>
          </div>
        </div>
        {myBalance && (
          <div className="text-right">
            <p className={cn('font-display font-bold text-sm', myBalance.balance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {myBalance.balance >= 0 ? '+' : ''}{fmt(myBalance.balance)}
            </p>
            <p className="text-[10px] text-muted-foreground">your balance</p>
          </div>
        )}
      </div>

      {/* what YOU owe */}
      {myDebts.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">You owe</p>
          <div className="space-y-2">
            {myDebts.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/8 border border-red-500/15">
                <div className="h-8 w-8 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-red-400">{(memberMap[d.to_user_id] || 'M').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{memberMap[d.to_user_id] || 'Member'}</p>
                  <p className="text-[10px] text-muted-foreground">Pay to clear balance</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-sm text-red-400">{fmt(d.amount)}</p>
                  <button
                    onClick={() => handleSettle(d.to_user_id, d.amount)}
                    disabled={recordSettlement.isPending}
                    className="mt-1 flex items-center gap-1 text-[10px] text-primary font-semibold bg-primary/15 border border-primary/25 px-2 py-0.5 rounded-full hover:bg-primary/25 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-2.5 w-2.5" />
                    Settle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* what others owe YOU */}
      {myCredits.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Owed to you</p>
          <div className="space-y-2">
            {myCredits.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
                <div className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-emerald-400">{(memberMap[d.from_user_id] || 'M').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{memberMap[d.from_user_id] || 'Member'}</p>
                  <p className="text-[10px] text-muted-foreground">Will pay you</p>
                </div>
                <p className="font-display font-bold text-sm text-emerald-400 shrink-0">{fmt(d.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* all-member balances mini-table */}
      {balances.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">All balances</p>
          <div className="space-y-1.5">
            {balances.map(b => (
              <div key={b.user_id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <p className="text-xs font-medium">{b.display_name}{b.user_id === currentUserId ? ' (you)' : ''}</p>
                <p className={cn('font-display font-bold text-xs', b.balance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {b.balance >= 0 ? '+' : ''}{fmt(b.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {simplifiedDebts.length === 0 && balances.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-300/80 font-medium">All settled up in this group! 🎉</p>
        </div>
      )}

      <button
        onClick={() => navigate(`/groups/${group.id}`)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/8 text-xs font-medium hover:bg-white/8 transition-colors"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        Open Group
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function FinancialIntelligence() {
  const navigate          = useNavigate();
  const { user }          = useAuth();
  const { formatCurrency, convertFromBase } = useCurrency();
  const fmt = (n: number) => formatCurrency(convertFromBase(n));
  const defaultGoalState = useMemo(() => getDefaultGoalState(), []);

  /* ── state ── */
  const [activeSection, setActiveSection] = useState<SectionId>('subscriptions');
  const [sortDesc,      setSortDesc]      = useState(true);
  const [expandedSub,   setExpandedSub]   = useState<string | null>(null);

  /* goal editor */
  const [goalTarget,   setGoalTarget]   = useState(defaultGoalState.target);
  const [goalSaved,    setGoalSaved]    = useState(defaultGoalState.saved);
  const [goalDeadline, setGoalDeadline] = useState(defaultGoalState.deadline);
  const [goalSaveError, setGoalSaveError] = useState<string | null>(null);
  const hasHydratedGoalsRef = useRef(false);
  const lastPersistedGoalRef = useRef('');

  const { data: savedGoal, isLoading: goalsLoading } = useFinancialGoals();
  const upsertGoal = useUpsertFinancialGoals();

  useEffect(() => {
    if (goalsLoading || hasHydratedGoalsRef.current) {
      return;
    }

    if (savedGoal) {
      const nextTarget = Number(savedGoal.target_amount) || defaultGoalState.target;
      const nextSaved = Number(savedGoal.current_saved) || 0;
      const nextDeadline = savedGoal.deadline || defaultGoalState.deadline;

      setGoalTarget(nextTarget);
      setGoalSaved(nextSaved);
      setGoalDeadline(nextDeadline);
      lastPersistedGoalRef.current = `${nextTarget}|${nextSaved}|${nextDeadline}`;
    } else {
      lastPersistedGoalRef.current = `${defaultGoalState.target}|${defaultGoalState.saved}|${defaultGoalState.deadline}`;
    }

    hasHydratedGoalsRef.current = true;
  }, [goalsLoading, savedGoal, defaultGoalState]);

  useEffect(() => {
    if (!user?.id || !hasHydratedGoalsRef.current || !goalDeadline) {
      return;
    }

    const sanitizedTarget = Math.max(1, Number.isFinite(goalTarget) ? goalTarget : 1);
    const sanitizedSaved = Math.max(0, Number.isFinite(goalSaved) ? goalSaved : 0);
    const goalFingerprint = `${sanitizedTarget}|${sanitizedSaved}|${goalDeadline}`;

    if (goalFingerprint === lastPersistedGoalRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setGoalSaveError(null);

      void upsertGoal
        .mutateAsync({
          targetAmount: sanitizedTarget,
          currentSaved: sanitizedSaved,
          deadline: goalDeadline,
        })
        .then(() => {
          lastPersistedGoalRef.current = goalFingerprint;
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Failed to save goals';
          setGoalSaveError(message);
        });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [goalTarget, goalSaved, goalDeadline, user?.id, upsertGoal]);

  /* ── data hooks ── */
  const { subscriptions, goals, gamification, isLoading: fiLoading } = useFinancialIntelligence({
    goals: { targetAmount: goalTarget, currentSaved: goalSaved, deadline: `${goalDeadline}T00:00:00` },
  });

  /* raw expenses for heatmap + time dist (all time, no filter) */
  const { data: rawExpenses = [], isLoading: expLoading } = useExpenses();
  const { data: groups = [],      isLoading: grpLoading } = useGroups();

  const isLoading = fiLoading || expLoading || grpLoading || goalsLoading;

  /* ── computed: calendar heatmap ── */
  const calHeat = useMemo(() => buildCalendarHeatmap(rawExpenses, 14), [rawExpenses]);
  const calMax  = useMemo(() => Math.max(...calHeat.map(d => d.amount), 1), [calHeat]);

  /* group weeks for grid layout */
  const heatWeeks = useMemo(() => {
    const weeks: typeof calHeat[] = [];
    let cur: typeof calHeat = [];
    for (const day of calHeat) {
      cur.push(day);
      if (day.dow === 6) { weeks.push(cur); cur = []; }
    }
    if (cur.length) weeks.push(cur);
    return weeks;
  }, [calHeat]);

  /* ── computed: time distribution (real hours from updated_at) ── */
  const timeDist = useMemo(() => buildTimeDist(rawExpenses), [rawExpenses]);
  const timeMax  = useMemo(() => Math.max(...timeDist.map(b => b.spent), 1), [timeDist]);
  const dominant = useMemo(() => timeDist.reduce((a, b) => b.spent > a.spent ? b : a, timeDist[0]), [timeDist]);

  /* ── computed: day-of-week distribution ── */
  const dowDist = useMemo(() => buildDowDist(rawExpenses), [rawExpenses]);
  const dowMax  = useMemo(() => Math.max(...dowDist.map(d => d.amount), 1), [dowDist]);

  /* ── subscriptions sorted ── */
  const sortedSubs = useMemo<SubscriptionDetection[]>(() => {
    if (!subscriptions) return [];
    const P = { 'low-value-possible-unused': 0, 'possible-unused': 1, 'low-value': 2, 'active': 3 };
    return [...subscriptions].sort((a, b) => {
      const p = P[a.status] - P[b.status];
      if (p !== 0) return sortDesc ? p : -p;
      return sortDesc ? b.monthlyCostEstimate - a.monthlyCostEstimate : a.monthlyCostEstimate - b.monthlyCostEstimate;
    });
  }, [subscriptions, sortDesc]);

  /* ── goal config ── */
  const goalCfg = goals ? GOAL_CFG[goals.status] : GOAL_CFG['on-track'];

  /* ── pace meter: 0-100 where 100 = very easy (≤₹50/day), 0 = impossible (>₹5000/day) ── */
  const paceScore = useMemo(() => {
    if (!goals || goals.status === 'completed') return 100;
    if (!goals.daysLeft || goals.dailySavingRequired <= 0) return 0;
    // log scale: ₹50/day = 100, ₹5000/day = 0
    const score = 100 - (Math.log10(Math.max(1, goals.dailySavingRequired)) / Math.log10(5000)) * 100;
    return Math.max(0, Math.min(100, score));
  }, [goals]);

  /* ─── nav scroll helper ─── */
  const scrollTo = (id: SectionId) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ══════════════════════════════════════════════════════ RENDER ═══ */
  return (
    <div className="min-h-screen bg-background pb-28">

      {/* ════ HEADER ════ */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-white/6 px-4 pt-3 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/40 to-cyan-500/20 border border-primary/30 flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-sm leading-tight">Financial Intelligence</p>
              <p className="text-[10px] text-muted-foreground leading-none">Real data · Always live</p>
            </div>
          </div>
        </div>

        <nav className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {SECTION_IDS.map(id => {
            const { label, icon: Icon, color } = SECTION_META[id];
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                  active
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'bg-white/4 border-white/8 text-muted-foreground hover:bg-white/8 hover:text-foreground',
                )}
              >
                <Icon className={cn('h-3 w-3', active ? 'text-primary' : color)} />
                {label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="px-4 py-5 space-y-8 max-w-lg mx-auto">

        {/* ════════════════════════════════════════════════════════════
            SECTION 1 · SUBSCRIPTIONS
        ════════════════════════════════════════════════════════════ */}
        <SectionWrap id="subscriptions">
          <SHead
            icon={SECTION_META.subscriptions.icon}
            color={SECTION_META.subscriptions.color}
            title="Subscription Tracker"
            sub="Sorted by cancel urgency — worst offenders first"
          />

          {/* info banner */}
          <div className="flex items-start gap-2 p-3 mb-3 rounded-xl bg-white/4 border border-white/8 text-xs">
            <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Detected by finding the same merchant charged at <strong className="text-foreground">~monthly intervals</strong> across your last 5 months of expenses.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skel key={i} className="h-20" />)}</div>
          ) : sortedSubs.length === 0 ? (
            <div className="bento-card text-center py-10">
              <CheckCircle2 className="h-9 w-9 text-emerald-400 mx-auto mb-3" />
              <p className="font-display font-semibold">No subscriptions detected</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto leading-relaxed">
                Log the same merchant expense 3+ months in a row — the tracker will pick it up automatically.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">
                  <span className="text-foreground font-semibold">{sortedSubs.length}</span> recurring charges found ·{' '}
                  <span className="text-red-400 font-semibold">
                    {fmt(sortedSubs.reduce((s, x) => s + x.monthlyCostEstimate, 0))}/mo
                  </span>
                </span>
                <button
                  onClick={() => setSortDesc(v => !v)}
                  className="flex items-center gap-1 text-xs text-primary font-semibold"
                >
                  {sortDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                  {sortDesc ? 'Worst first' : 'Best first'}
                </button>
              </div>

              <div className="space-y-2">
                {sortedSubs.map(sub => {
                  const cfg     = STATUS_CFG[sub.status];
                  const CfgIcon = cfg.icon;
                  const open    = expandedSub === sub.merchant;
                  return (
                    <motion.div key={sub.merchant} layout className="bento-card overflow-hidden">
                      <button className="w-full text-left" onClick={() => setExpandedSub(open ? null : sub.merchant)}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <CreditCard className="h-4 w-4 text-primary/70" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{sub.merchant}</p>
                            <p className="text-xs text-muted-foreground">
                              every {sub.averageIntervalDays}d · {sub.occurrences} charges detected
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-display font-bold text-sm">
                              {fmt(sub.monthlyCostEstimate)}
                              <span className="font-normal text-muted-foreground text-xs">/mo</span>
                            </p>
                            <span className={cn('text-[10px] font-bold border px-1.5 py-0.5 rounded-full', cfg.cls)}>
                              {cfg.label}
                            </span>
                          </div>
                          <ChevronRight className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200', open && 'rotate-90')} />
                        </div>
                      </button>

                      <AnimatePresence>
                        {open && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 mt-3 border-t border-white/6 space-y-3 text-xs">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-muted-foreground">Last charge</p>
                                  <p className="font-semibold">{format(parseISO(sub.lastChargedAt), 'dd MMM yyyy')}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Next expected</p>
                                  <p className="font-semibold">{format(parseISO(sub.nextExpectedAt), 'dd MMM yyyy')}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Per charge</p>
                                  <p className="font-semibold">{fmt(sub.amount)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Annual cost</p>
                                  <p className="font-semibold text-red-400">{fmt(sub.monthlyCostEstimate * 12)}</p>
                                </div>
                              </div>
                              <div className={cn('flex items-start gap-2 p-3 rounded-xl border', cfg.cls)}>
                                <CfgIcon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <p>{sub.reason}</p>
                              </div>
                              {sub.status !== 'active' && (
                                <button
                                  onClick={() => navigate('/expenses')}
                                  className="w-full py-2 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-semibold hover:bg-red-500/25 transition-colors"
                                >
                                  View in Expenses → Cancel
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </SectionWrap>

        {/* ════════════════════════════════════════════════════════════
            SECTION 2 · SPENDING HEATMAP  (real calendar data)
        ════════════════════════════════════════════════════════════ */}
        <SectionWrap id="heatmap">
          <SHead
            icon={SECTION_META.heatmap.icon}
            color={SECTION_META.heatmap.color}
            title="Spending Heatmap"
            sub="Last 14 weeks — darker = more spent that day"
          />

          {isLoading ? <Skel className="h-36" /> : (
            <div className="bento-card">
              {/* DOW labels */}
              <div className="flex gap-1 mb-1 pl-[18px]">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} className="flex-1 text-center text-[8px] text-muted-foreground">{d}</div>
                ))}
              </div>

              {/* weeks grid — each row = one week (Mon-Sun rotated) */}
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {/* month labels column */}
                <div className="flex flex-col gap-1 w-4 shrink-0">
                  {heatWeeks.map((wk, wi) => {
                    const firstDay = wk[0];
                    const showLabel = wi === 0 || firstDay.date.endsWith('-01') ||
                      (wi > 0 && heatWeeks[wi-1][0] && format(parseISO(heatWeeks[wi-1][0].date), 'MMM') !== format(parseISO(firstDay.date), 'MMM'));
                    return (
                      <div key={wi} className="h-[22px] flex items-center">
                        {showLabel && (
                          <span className="text-[7px] text-muted-foreground leading-none">{format(parseISO(firstDay.date), 'MMM')}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* day cells — column per day-of-week (Sun=0 … Sat=6) */}
                {Array.from({ length: 7 }, (_, dow) => (
                  <div key={dow} className="flex flex-col gap-1 flex-1">
                    {heatWeeks.map((wk, wi) => {
                      const cell = wk.find(d => d.dow === dow);
                      const intensity = cell ? cell.amount / calMax : 0;
                      return (
                        <div key={wi} className="relative group">
                          <div
                            className="h-[22px] rounded-sm border border-white/5 transition-all cursor-default"
                            style={{ backgroundColor: `rgba(168,85,247,${cell?.amount ? Math.max(0.07, intensity * 0.95) : 0.04})` }}
                          />
                          {cell?.amount ? (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex z-10 pointer-events-none">
                              <div className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-[10px] whitespace-nowrap shadow-xl">
                                <span className="font-bold text-foreground">{fmt(cell.amount)}</span>
                                <span className="text-muted-foreground ml-1">{cell.label}</span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* legend */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[9px] text-muted-foreground">Less</span>
                {[0.06, 0.25, 0.5, 0.75, 0.95].map(o => (
                  <div key={o} className="h-3 w-3 rounded-sm" style={{ backgroundColor: `rgba(168,85,247,${o})` }} />
                ))}
                <span className="text-[9px] text-muted-foreground">More</span>
              </div>

              {/* day-of-week insight */}
              {rawExpenses.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/6">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Spending by day of week</p>
                  <div className="flex gap-1 items-end h-10">
                    {dowDist.map((d, i) => {
                      const h = (d.amount / dowMax) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <div className="w-full rounded-t-sm" style={{ height: `${Math.max(4, h)}%`, backgroundColor: `rgba(168,85,247,${0.15 + (h/100)*0.75})` }} />
                          <span className="text-[8px] text-muted-foreground">{DOW[i].charAt(0)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Biggest day: <span className="text-foreground font-semibold">{DOW[dowDist.reduce((a, b) => b.amount > a.amount ? b : a, dowDist[0]).dow]}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </SectionWrap>

        {/* ════════════════════════════════════════════════════════════
            SECTION 3 · TIME PATTERN  (real hours from updated_at)
        ════════════════════════════════════════════════════════════ */}
        <SectionWrap id="time">
          <SHead
            icon={SECTION_META.time.icon}
            color={SECTION_META.time.color}
            title="Time-Pattern Distribution"
            sub="Based on when expenses were logged"
          />

          {isLoading ? <Skel className="h-52" /> : (
            <div className="space-y-2.5">
              {timeDist.map(bucket => {
                const cfg = TIME_CFG[bucket.block];
                const pct = (bucket.spent / timeMax) * 100;
                const isPeak = dominant && bucket.block === dominant.block;
                const totalAll = timeDist.reduce((s, b) => s + b.spent, 0);
                const sharePct = totalAll > 0 ? ((bucket.spent / totalAll) * 100).toFixed(0) : '0';

                return (
                  <div key={bucket.block} className={cn('bento-card transition-all', isPeak && 'ring-1 ring-primary/30')}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{cfg.label.split(' ')[0]}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold">{cfg.label.split(' ').slice(1).join(' ')}</span>
                            {isPeak && (
                              <span className="text-[9px] font-bold text-primary border border-primary/30 bg-primary/10 px-1.5 py-0.5 rounded-full">
                                PEAK
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{cfg.sub}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-sm">{fmt(bucket.spent)}</p>
                        <p className="text-[10px] text-muted-foreground">{sharePct}% · {bucket.count} txns</p>
                      </div>
                    </div>

                    <div className="h-2.5 rounded-full bg-white/7 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                    </div>
                  </div>
                );
              })}

              {rawExpenses.length === 0 && (
                <div className="bento-card text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-semibold">No expense history yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Add some expenses to see your spending time patterns</p>
                </div>
              )}
            </div>
          )}
        </SectionWrap>

        {/* ════════════════════════════════════════════════════════════
            SECTION 4 · SETTLEMENT SIMULATION  (real group data)
        ════════════════════════════════════════════════════════════ */}
        <SectionWrap id="settlements">
          <SHead
            icon={SECTION_META.settlements.icon}
            color={SECTION_META.settlements.color}
            title="Settlement Simulation"
            sub="Minimum transfers to clear all group debts"
          />

          <div className="flex items-start gap-2 p-3 mb-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs">
            <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200/80">
              Shows the <strong className="text-amber-200">fewest possible payments</strong> needed to clear every debt in each group. Tap <em>Settle</em> to record a payment instantly.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1,2].map(i => <Skel key={i} className="h-40" />)}</div>
          ) : groups.length === 0 ? (
            <div className="bento-card text-center py-10">
              <Users className="h-9 w-9 text-muted-foreground mx-auto mb-3" />
              <p className="font-display font-semibold">No groups yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create or join a group to see settlement simulations</p>
              <button
                onClick={() => navigate('/groups')}
                className="mt-4 mx-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 border border-primary/25 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors"
              >
                <Users className="h-3.5 w-3.5" />
                Go to Groups
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(group => (
                <SettlementPanel
                  key={group.id}
                  group={group}
                  currentUserId={user?.id ?? ''}
                  fmt={fmt}
                />
              ))}
            </div>
          )}
        </SectionWrap>

        {/* ════════════════════════════════════════════════════════════
            SECTION 5 · GOAL TRAJECTORY  (live-recalculating)
        ════════════════════════════════════════════════════════════ */}
        <SectionWrap id="goals">
          <SHead
            icon={SECTION_META.goals.icon}
            color={SECTION_META.goals.color}
            title="Goal Trajectory Tracker"
            sub="Edit your goal live — pace meter updates instantly"
          />

          {/* editable goal inputs */}
          <div className="bento-card mb-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Configure Goal</p>
              <p
                className={cn(
                  'text-[10px]',
                  goalSaveError
                    ? 'text-red-400'
                    : upsertGoal.isPending || goalsLoading
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                )}
              >
                {goalSaveError
                  ? 'Save failed'
                  : upsertGoal.isPending || goalsLoading
                  ? 'Saving...'
                  : 'Auto-saved'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Target (₹)</label>
                <input
                  type="number"
                  value={goalTarget}
                  onChange={e => setGoalTarget(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-primary/50 focus:outline-none font-display font-bold"
                  min={1}
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Saved (₹)</label>
                <input
                  type="number"
                  value={goalSaved}
                  onChange={e => setGoalSaved(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-primary/50 focus:outline-none font-display font-bold"
                  min={0}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Deadline</label>
              <input
                type="date"
                value={goalDeadline}
                onChange={e => setGoalDeadline(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          {/* trajectory card */}
          {isLoading ? <Skel className="h-56" /> : goals ? (
            <div className={cn('bento-card bg-gradient-to-br', goalCfg.grad)}>

              {/* status + days left */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                  <p className={cn('font-display text-2xl font-bold mt-0.5', goalCfg.color)}>
                    {goalCfg.icon} <span className="capitalize">{goals.status.replace('-', ' ')}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Days left</p>
                  <p className="font-display text-3xl font-bold">{Math.max(0, goals.daysLeft)}</p>
                </div>
              </div>

              {/* progress ring + amounts */}
              <div className="flex items-center gap-5 mb-5">
                <div className="relative h-24 w-24 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                    <motion.circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={goals.status === 'on-track' || goals.status === 'completed' ? '#4ADE80'
                        : goals.status === 'at-risk' ? '#FACC15' : '#F87171'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 100' }}
                      animate={{ strokeDasharray: `${goals.progressPercent} 100` }}
                      transition={{ duration: 1.1, ease: 'easeOut', delay: 0.1 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display font-bold text-base">{Math.round(goals.progressPercent)}%</span>
                    <span className="text-[9px] text-muted-foreground">saved</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2.5">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Target</p>
                    <p className="font-display font-bold">{fmt(goalTarget)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Saved so far</p>
                    <p className="font-display font-bold text-emerald-400">{fmt(goalSaved)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Still needed</p>
                    <p className={cn('font-display font-bold', goalCfg.color)}>{fmt(goals.remainingAmount)}</p>
                  </div>
                </div>
              </div>

              {/* ── Pace Meter ── */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Saving Pace Required</span>
                  </div>
                  <span className="text-xs font-bold">
                    {goals.dailySavingRequired > 0 && goals.status !== 'completed'
                      ? <>{fmt(goals.dailySavingRequired)}<span className="text-muted-foreground font-normal">/day</span></>
                      : <span className="text-emerald-400">Goal complete!</span>
                    }
                  </span>
                </div>

                <div className="relative h-4 rounded-full bg-white/8 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${paceScore}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{
                      background: paceScore > 70
                        ? 'linear-gradient(90deg,#4ADE80,#22D3EE)'
                        : paceScore > 40
                        ? 'linear-gradient(90deg,#FACC15,#FB923C)'
                        : 'linear-gradient(90deg,#F87171,#F43F5E)',
                    }}
                  />
                  {[25, 50, 75].map(t => (
                    <div key={t} className="absolute top-0 bottom-0 w-px bg-black/20" style={{ left: `${t}%` }} />
                  ))}
                </div>

                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>🔥 Very hard</span><span>⚡ Moderate</span><span>✅ Easy</span>
                </div>
              </div>

              {/* trajectory timeline */}
              <div className="mb-5">
                <p className="text-[10px] text-muted-foreground mb-1.5">Trajectory to deadline</p>
                <div className="relative h-2 rounded-full bg-white/7 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goals.progressPercent}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-emerald-400"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>Start</span>
                  <span>🏁 {goalDeadline}</span>
                </div>
              </div>

              {/* AI message */}
              <div className={cn('flex items-start gap-2.5 p-3.5 rounded-xl border border-white/10 bg-white/5 text-xs')}>
                <Brain className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', goalCfg.color)} />
                <p className="text-foreground/90 leading-relaxed">{goals.message}</p>
              </div>
            </div>
          ) : null}

          {/* achievements */}
          {gamification && (
            <div className="mt-3">
              {/* health score */}
              <div className="bento-card flex items-center gap-4 mb-3">
                <div className="relative h-16 w-16 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" />
                    <motion.circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={gamification.score >= 80 ? '#4ADE80' : gamification.score >= 60 ? '#FACC15' : '#F87171'}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 100' }}
                      animate={{ strokeDasharray: `${gamification.score} 100` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-sm">
                    {gamification.score}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Financial Health</p>
                  <p className="font-display font-bold text-lg">{gamification.label}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <Flame className="h-3 w-3" />{gamification.streaks.dailyLogging}d logging streak
                    </span>
                    <span className="flex items-center gap-1 text-xs text-violet-400">
                      <Trophy className="h-3 w-3" />{gamification.streaks.budgetControlWeeks}w budget control
                    </span>
                  </div>
                </div>
              </div>

              {/* achievement cards */}
              <div className="grid grid-cols-2 gap-2">
                {gamification.achievements.map(ach => (
                  <div
                    key={ach.id}
                    className={cn('bento-card transition-all', ach.unlocked ? 'ring-1 ring-primary/30' : 'opacity-55')}
                  >
                    <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-2', ach.unlocked ? 'bg-primary/20 border border-primary/30' : 'bg-white/5')}>
                      {ach.unlocked ? <Trophy className="h-4 w-4 text-primary" /> : <Star className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="text-xs font-bold leading-tight">{ach.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{ach.description}</p>
                    <div className="mt-2.5 h-1.5 rounded-full bg-white/7 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${ach.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">{Math.round(ach.progress)}% complete</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionWrap>

      </main>

      <BottomNav />
    </div>
  );
}
