import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, eachDayOfInterval } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Sparkles, Flame, Gem, CalendarDays, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/hooks/useExpenses';
import { useIncome } from '@/hooks/useIncome';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCurrency } from '@/hooks/useCurrency';
import { CATEGORY_CONFIG } from '@/types/expense';
import { toast } from 'sonner';

export default function MonthlyWrap() {
  const navigate = useNavigate();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthLabel = format(now, 'MMMM yyyy');
  const startDate = format(monthStart, 'yyyy-MM-dd');
  const endDate = format(now, 'yyyy-MM-dd');

  const { formatCurrency } = useCurrency();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics('month');
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses({
    startDate,
    endDate,
  });
  const { data: income = [], isLoading: incomeLoading } = useIncome({
    startDate,
    endDate,
  });

  const wrap = useMemo(() => {
    const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const net = totalIncome - totalSpent;
    const savingsRate = totalIncome > 0 ? (net / totalIncome) * 100 : 0;

    const topExpense =
      expenses.length > 0
        ? [...expenses].sort((a, b) => b.amount - a.amount)[0]
        : null;

    const spendByDate = new Map<string, number>();
    expenses.forEach((item) => {
      spendByDate.set(item.expense_date, (spendByDate.get(item.expense_date) || 0) + item.amount);
    });

    let topSpendingDay: { date: string; amount: number } | null = null;
    spendByDate.forEach((amount, date) => {
      if (!topSpendingDay || amount > topSpendingDay.amount) {
        topSpendingDay = { date, amount };
      }
    });

    const daysElapsed = eachDayOfInterval({ start: monthStart, end: now });
    const noSpendDays = Math.max(daysElapsed.length - spendByDate.size, 0);
    const topCategory = analytics?.topCategories?.[0] || null;

    return {
      totalSpent,
      totalIncome,
      net,
      savingsRate,
      topExpense,
      topSpendingDay,
      noSpendDays,
      topCategory,
    };
  }, [analytics?.topCategories, expenses, income, monthStart, now]);

  const handleShare = async () => {
    const lines = [
      `My Kanakku Monthly Wrap (${monthLabel})`,
      `Spent: ${formatCurrency(wrap.totalSpent, { maximumFractionDigits: 0 })}`,
      `Income: ${formatCurrency(wrap.totalIncome, { maximumFractionDigits: 0 })}`,
      `Net: ${formatCurrency(wrap.net, { maximumFractionDigits: 0 })}`,
      `No-spend days: ${wrap.noSpendDays}`,
      wrap.topCategory
        ? `Top category: ${wrap.topCategory.label} (${formatCurrency(wrap.topCategory.amount, { maximumFractionDigits: 0 })})`
        : 'Top category: Not enough data',
    ];

    const shareText = lines.join('\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Kanakku Monthly Wrap',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Wrap summary copied to clipboard');
      }
    } catch {
      toast.info('Share cancelled');
    }
  };

  const loading = analyticsLoading || expensesLoading || incomeLoading;

  return (
    <div className="min-h-screen pb-8 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.2),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_50%_120%,rgba(244,114,182,0.12),transparent_45%),hsl(var(--background))]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-background/65 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <p className="font-display text-sm tracking-[0.15em] uppercase text-primary/80">Monthly Wrap</p>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-44 rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <motion.section
              className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-xs tracking-[0.2em] uppercase text-primary/80">{monthLabel}</p>
              <h1 className="font-display text-4xl mt-2">Your Money Story</h1>
              <p className="text-sm mt-2 text-muted-foreground">A snapshot worth sharing</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-foreground/80">Generated live from your monthly transactions</p>
              </div>
            </motion.section>

            <motion.section
              className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 via-cyan-400/8 to-transparent p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 }}
            >
              <p className="text-xs tracking-[0.18em] uppercase text-cyan-200/80">Scoreboard</p>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="font-display text-3xl">{formatCurrency(wrap.totalSpent, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-muted-foreground">Net Balance</p>
                  <p className="font-display text-3xl">{formatCurrency(wrap.net, { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs mt-1 text-muted-foreground">Savings rate: {Number.isFinite(wrap.savingsRate) ? wrap.savingsRate.toFixed(1) : '0.0'}%</p>
                </div>
              </div>
            </motion.section>

            <motion.section
              className="rounded-3xl border border-pink-400/20 bg-gradient-to-br from-pink-500/22 via-fuchsia-500/8 to-transparent p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 }}
            >
              <p className="text-xs tracking-[0.18em] uppercase text-pink-200/80">Highlights</p>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 h-9 w-9 rounded-xl bg-pink-500/25 flex items-center justify-center">
                    <Gem className="h-4 w-4 text-pink-200" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Top category</p>
                    <p className="font-display text-2xl">
                      {wrap.topCategory ? wrap.topCategory.label : 'Not enough data'}
                    </p>
                    {wrap.topCategory && (
                      <p className="text-sm text-foreground/80">{formatCurrency(wrap.topCategory.amount, { maximumFractionDigits: 0 })}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-0.5 h-9 w-9 rounded-xl bg-orange-500/25 flex items-center justify-center">
                    <Flame className="h-4 w-4 text-orange-200" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Biggest single expense</p>
                    <p className="font-display text-2xl">{wrap.topExpense ? formatCurrency(wrap.topExpense.amount, { maximumFractionDigits: 0 }) : 'No expense yet'}</p>
                    {wrap.topExpense && (
                      <p className="text-sm text-foreground/80">{wrap.topExpense.description || CATEGORY_CONFIG[wrap.topExpense.category].label}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/20 via-emerald-400/8 to-transparent p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 }}
            >
              <p className="text-xs tracking-[0.18em] uppercase text-emerald-200/80">Consistency</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-muted-foreground">No-spend days</p>
                  <p className="font-display text-3xl">{wrap.noSpendDays}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-muted-foreground">Peak spend day</p>
                  <p className="font-display text-xl">
                    {wrap.topSpendingDay ? format(new Date(wrap.topSpendingDay.date), 'MMM d') : '-'}
                  </p>
                  {wrap.topSpendingDay && (
                    <p className="text-xs mt-1">{formatCurrency(wrap.topSpendingDay.amount, { maximumFractionDigits: 0 })}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-emerald-300" />
                  <p className="text-sm text-foreground/90">Money mood this month</p>
                </div>
                <p className="font-display text-2xl mt-1">
                  {wrap.net >= 0 ? 'Financial Hero Arc' : 'Comeback Season Loading'}
                </p>
              </div>
            </motion.section>

            <motion.section
              className="rounded-3xl border border-amber-300/25 bg-gradient-to-br from-amber-500/18 via-amber-300/8 to-transparent p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.24 }}
            >
              <div className="flex items-center gap-2 text-amber-200">
                <Trophy className="h-5 w-5" />
                <p className="text-sm uppercase tracking-[0.16em]">Share-Worthy</p>
              </div>
              <p className="font-display text-3xl mt-3">Drop this wrap in your group chat.</p>
              <p className="text-sm text-muted-foreground mt-2">One tap to share your monthly money flex.</p>
              <Button className="mt-5 w-full" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Monthly Wrap
              </Button>
            </motion.section>
          </div>
        )}
      </main>
    </div>
  );
}
