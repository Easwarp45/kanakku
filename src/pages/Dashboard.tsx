import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useRecentExpenses, useTodayTotal, useMonthlyTotal } from '@/hooks/useExpenses';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useSmartInsights } from '@/hooks/useSmartInsights';
import { useCurrency } from '@/hooks/useCurrency';
import BottomNav from '@/components/layout/BottomNav';
import { CountUpNumber } from '@/components/ui/count-up-number';
import {
  LogOut, Plus, Users, TrendingUp,
  Smartphone, Target, Bell, Zap, ArrowUpRight, Sparkles, History
} from 'lucide-react';
import { FinancialHealthPanel, InsightsWidget } from '@/components/insights';
import { useNotifications } from '@/hooks/useNotifications';
import { CATEGORY_CONFIG } from '@/types/expense';
import { getCategoryIcon } from '@/lib/category-icons';
import { cn } from '@/lib/utils';

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4,0,0.2,1] } },
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { symbol, formatCurrency, formatLocalNumber, convertFromBase } = useCurrency();

  const { data: recentExpenses = [], isLoading: loadingRecent } = useRecentExpenses(5);
  const { data: todayTotal = 0 } = useTodayTotal();
  const { data: monthlyTotal = 0 } = useMonthlyTotal();
  const { insights, gamification, isLoading: insightsLoading } = useSmartInsights();

  const quickActionsRef = useRef<HTMLDivElement | null>(null);
  const [showQuickActionFadeLeft, setShowQuickActionFadeLeft] = useState(false);
  const [showQuickActionFadeRight, setShowQuickActionFadeRight] = useState(false);

  useOfflineSync();

  const { permission, requestPermission } = useNotifications();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const firstName = (user?.user_metadata?.display_name as string)?.split(' ')[0] || 'there';

  const quickActions = [
    { icon: Plus,       label: 'Add',     path: '/add-expense',  color: 'from-violet-500 to-purple-600' },
    { icon: Smartphone, label: 'UPI',     path: '/upi',          color: 'from-cyan-500 to-sky-600' },
    { icon: Users,      label: 'Split',   path: '/groups',       color: 'from-pink-500 to-rose-600' },
    { icon: Target,     label: 'Budget',  path: '/budget',       color: 'from-amber-500 to-orange-600' },
    { icon: TrendingUp, label: 'Stats',   path: '/analytics',    color: 'from-emerald-500 to-teal-600' },
    { icon: History,    label: 'History', path: '/insights/history', color: 'from-slate-500 to-zinc-600' },
    { icon: Sparkles,   label: 'Wrap',    path: '/wrap',         color: 'from-indigo-500 to-violet-600' },
  ];

  const updateQuickActionFade = useCallback(() => {
    const node = quickActionsRef.current;
    if (!node) return;

    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    const isScrollable = maxScrollLeft > 2;

    setShowQuickActionFadeLeft(isScrollable && node.scrollLeft > 4);
    setShowQuickActionFadeRight(isScrollable && node.scrollLeft < maxScrollLeft - 4);
  }, []);

  useEffect(() => {
    const node = quickActionsRef.current;
    if (!node) return;

    updateQuickActionFade();

    const onScroll = () => updateQuickActionFade();
    node.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateQuickActionFade);

    return () => {
      node.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateQuickActionFade);
    };
  }, [updateQuickActionFade]);

  const monthlyDisplayTotal = convertFromBase(monthlyTotal);
  const todayDisplayTotal = convertFromBase(todayTotal);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
              <span className="text-sm font-bold text-gradient font-display">{symbol}</span>
            </div>
            <span className="font-display text-base font-bold tracking-tight">Kanakku</span>
          </div>
          <div className="flex items-center gap-1">
            {permission !== 'granted' && (
              <button
                onClick={requestPermission}
                title="Enable notifications"
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 pt-2 pb-6 space-y-4">
        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="font-display text-2xl font-bold">
            Hey, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here's your money situation</p>
        </motion.div>

        {/* ── Bento Hero: Balance + Today ── */}
        <motion.div
          className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {/* Monthly total — big hero */}
          <div
            className="bento-card col-span-1 min-[360px]:col-span-2 cursor-pointer group"
            onClick={() => navigate('/expenses')}
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(12,200,224,0.08) 100%)',
              borderColor: 'rgba(168,85,247,0.25)',
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Month</p>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-xs text-primary/70 font-medium">{symbol}</span>
                  <CountUpNumber
                    value={monthlyDisplayTotal}
                    durationMs={950}
                    className="font-display text-[clamp(1.8rem,9vw,2.5rem)] font-bold amount-neutral truncate"
                    formatter={(value) => formatLocalNumber(value, { maximumFractionDigits: 0 })}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">total expenses tracked</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Today */}
          <div
            className="bento-card cursor-pointer"
            onClick={() => navigate('/add-expense')}
          >
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Today</p>
            <div className="mt-2 flex items-end gap-0.5">
              <span className="text-[10px] text-cyan-400/70">{symbol}</span>
              <CountUpNumber
                value={todayDisplayTotal}
                durationMs={800}
                className="font-display text-2xl font-bold text-cyan-400"
                formatter={(value) => formatLocalNumber(value, { maximumFractionDigits: 0 })}
              />
            </div>
            <div className="mt-3 flex items-center gap-1">
              <div className="h-5 w-5 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Plus className="h-3 w-3 text-cyan-400" />
              </div>
              <span className="text-[10px] text-muted-foreground">Add expense</span>
            </div>
          </div>

          {/* Groups teaser */}
          <div
            className="bento-card cursor-pointer"
            onClick={() => navigate('/groups')}
          >
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Groups</p>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="h-7 w-7 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-pink-400" />
              </div>
              <span className="font-display text-lg font-bold text-pink-400">Split</span>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Manage group expenses</p>
          </div>
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="font-display text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Quick Actions</h2>
          <div className="relative">
            <div ref={quickActionsRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 pr-4">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/8 hover:border-primary/30 hover:bg-primary/5 transition-all shrink-0 w-[72px]"
                >
                  <div className={cn('h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center', action.color)}>
                    <action.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-foreground/80">{action.label}</span>
                </button>
              ))}
            </div>

            {showQuickActionFadeLeft && (
              <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background via-background/85 to-transparent" />
            )}
            {showQuickActionFadeRight && (
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background via-background/85 to-transparent" />
            )}
          </div>
        </motion.div>

        {/* ── Smart Insights ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <FinancialHealthPanel gamification={gamification} isLoading={insightsLoading} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
        >
          <InsightsWidget insights={insights} limit={2} isLoading={insightsLoading} />
        </motion.div>

        {/* ── Recent Transactions ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-bold">Recent</h2>
            {recentExpenses.length > 0 && (
              <button
                onClick={() => navigate('/expenses')}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {loadingRecent ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="shimmer h-16 w-full" />
              ))}
            </div>
          ) : recentExpenses.length === 0 ? (
            <div className="bento-card text-center py-8">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <p className="font-display font-semibold text-sm">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first expense to get started</p>
            </div>
          ) : (
            <motion.div
              className="space-y-2"
              variants={listVariants}
              initial="hidden"
              animate="show"
            >
              {recentExpenses.map((expense) => {
                const config = CATEGORY_CONFIG[expense.category];
                const IconComponent = getCategoryIcon(expense.category);
                return (
                  <motion.div
                    key={expense.id}
                    variants={itemVariants}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/4 border border-white/6 hover:bg-white/7 hover:border-primary/20 cursor-pointer transition-all"
                    onClick={() => navigate(`/expenses/${expense.id}`)}
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0', config.color)}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{expense.description || config.label}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(expense.expense_date), 'MMM d')}</p>
                    </div>
                    <span className="font-display font-bold text-sm text-foreground/90 shrink-0">
                      {formatCurrency(expense.amount, { maximumFractionDigits: 0 })}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
