import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Download, Calendar, Wallet, Receipt, Target, History, Clock3, MapPin, Repeat, Flag, HandCoins } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition, staggerContainerVariants, staggerItemVariants, slideUpVariants } from '@/lib/animations';
import { SkeletonCardLoader } from '@/components/ui/skeleton-loader';
import { useAnalytics, TimePeriod } from '@/hooks/useAnalytics';
import { useSmartInsights } from '../hooks/useSmartInsights';
import { useCurrency } from '@/hooks/useCurrency';
import { InsightsList } from '@/components/insights';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

// Theme-aware chart colors from design-system CSS variables
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  'hsl(var(--ring))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--primary) / 0.75)',
  'hsl(var(--secondary) / 0.75)',
  'hsl(var(--accent) / 0.75)',
];

const GRID_COLOR = 'hsl(var(--border))';
const AXIS_COLOR = 'hsl(var(--muted-foreground))';
const TOOLTIP_BG = 'hsl(var(--card))';
const TOOLTIP_BORDER = 'hsl(var(--border))';

export default function Analytics() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<TimePeriod>('month');
  const { formatCurrency, formatCompactCurrency, formatLocalCurrency, formatLocalNumber } = useCurrency();
  const { data: analytics, isLoading } = useAnalytics(period);
  const { insights, subscriptions, locations, timeAnalysis, settlements, goals, isLoading: insightsLoading } = useSmartInsights();

  const formatGridAmount = (value: number) => {
    const full = formatCurrency(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (full.length > 12) {
      return formatCompactCurrency(value);
    }
    return full;
  };

  const handleExport = () => {
    if (!analytics) return;
    
    // Create CSV content
    const headers = ['Category', 'Amount', 'Percentage'];
    const rows = analytics.categoryBreakdown.map(cat => 
      [cat.label, formatCurrency(cat.amount), cat.percentage.toFixed(1) + '%']
    );
    
    const csvContent = [
      `Analytics Report - ${period.charAt(0).toUpperCase() + period.slice(1)}`,
      '',
      `Total Spent: ${formatCurrency(analytics.totalSpent)}`,
      `Total Income: ${formatCurrency(analytics.totalIncome)}`,
      `Net Savings: ${formatCurrency(analytics.netSavings)}`,
      `Average per Day: ${formatCurrency(analytics.averagePerDay)}`,
      `Total Transactions: ${analytics.transactionCount}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanakku-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: TOOLTIP_BG, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: '12px', padding: '10px 14px' }}>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-base font-bold text-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const topSubscription = subscriptions[0];
  const topLocation = locations.topLocations[0];
  const dominantTimeBucket = timeAnalysis.buckets.find((item) => item.block === timeAnalysis.dominantPattern);

  return (
    <PageTransition>
    <div className="page-content min-h-full bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="min-h-10 min-w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Analytics</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            disabled={!analytics || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Period Selector */}
        <div className="px-4 pb-4">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {isLoading ? (
          <SkeletonCardLoader count={4} />
        ) : analytics ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-4 items-stretch">
              <Card className="bg-card h-full">
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Total Spent</span>
                  </div>
                  <p
                    className="text-[clamp(1.4rem,5vw,2rem)] font-bold text-foreground leading-tight truncate tabular-nums"
                    title={formatCurrency(analytics.totalSpent, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  >
                    {formatGridAmount(analytics.totalSpent)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {analytics.percentageChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-destructive" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-secondary" />
                    )}
                    <span className={`text-xs truncate ${analytics.percentageChange >= 0 ? 'text-destructive' : 'text-secondary'}`}>
                      {Math.abs(analytics.percentageChange).toFixed(1)}% vs last {period}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card h-full">
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-secondary" />
                    <span className="text-sm text-muted-foreground">Daily Avg</span>
                  </div>
                  <p
                    className="text-[clamp(1.4rem,5vw,2rem)] font-bold text-foreground leading-tight truncate tabular-nums"
                    title={formatCurrency(analytics.averagePerDay, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  >
                    {formatGridAmount(analytics.averagePerDay)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    per day
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card h-full">
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="h-4 w-4 text-accent" />
                    <span className="text-sm text-muted-foreground">Transactions</span>
                  </div>
                  <p className="text-[clamp(1.4rem,5vw,2rem)] font-bold text-foreground leading-tight truncate tabular-nums">
                    {analytics.transactionCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    this {period}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card h-full">
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Previous</span>
                  </div>
                  <p
                    className="text-[clamp(1.4rem,5vw,2rem)] font-bold text-foreground leading-tight truncate tabular-nums"
                    title={formatCurrency(analytics.previousPeriodTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  >
                    {formatGridAmount(analytics.previousPeriodTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    last {period}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card h-full">
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-secondary" />
                    <span className="text-sm text-muted-foreground">Total Income</span>
                  </div>
                  <p
                    className="text-[clamp(1.4rem,5vw,2rem)] font-bold text-foreground leading-tight truncate tabular-nums"
                    title={formatCurrency(analytics.totalIncome, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  >
                    {formatGridAmount(analytics.totalIncome)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">this {period}</p>
                </CardContent>
              </Card>

              <Card className="bg-card h-full">
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-accent" />
                    <span className="text-sm text-muted-foreground">Net Savings</span>
                  </div>
                  <p
                    className={`text-[clamp(1.4rem,5vw,2rem)] font-bold leading-tight truncate tabular-nums ${analytics.netSavings >= 0 ? 'text-secondary' : 'text-destructive'}`}
                    title={formatCurrency(analytics.netSavings, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  >
                    {formatGridAmount(analytics.netSavings)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">income minus expenses</p>
                </CardContent>
              </Card>
            </div>

            {/* Spending Trend Chart */}
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Spending Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.trendData.length > 0 ? (
                  <div className="h-52 min-[420px]:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.trendData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                        <XAxis 
                          dataKey="label" 
                          tick={{ fontSize: 11, fill: AXIS_COLOR }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: AXIS_COLOR }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => formatCompactCurrency(value)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorAmount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data for this period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.categoryBreakdown.length > 0 ? (
                  <div className="h-52 min-[420px]:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="amount"
                          nameKey="label"
                        >
                          {analytics.categoryBreakdown.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={CHART_COLORS[index % CHART_COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: TOOLTIP_BG,
                            border: `1px solid ${TOOLTIP_BORDER}`,
                            borderRadius: '12px',
                          }}
                          labelStyle={{ color: AXIS_COLOR }}
                          itemStyle={{ color: AXIS_COLOR }}
                        />
                        <Legend 
                          formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No expenses in this period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Categories Bar Chart */}
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Top Spending Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topCategories.length > 0 ? (
                  <div className="h-52 min-[420px]:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={analytics.topCategories} 
                        layout="vertical"
                        margin={{ left: 20, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 11, fill: AXIS_COLOR }}
                          tickFormatter={(value) => formatCompactCurrency(value)}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="label"
                          tick={{ fontSize: 11, fill: AXIS_COLOR }}
                          width={80}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: TOOLTIP_BG,
                            border: `1px solid ${TOOLTIP_BORDER}`,
                            borderRadius: '12px',
                          }}
                        />
                        <Bar 
                          dataKey="amount" 
                          fill="hsl(var(--primary))"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No categories to display
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Income vs Expense */}
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Income vs Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 min-[420px]:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { label: 'Income', amount: analytics.totalIncome },
                      { label: 'Expense', amount: analytics.totalSpent },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: AXIS_COLOR }} />
                      <YAxis
                        tick={{ fontSize: 12, fill: AXIS_COLOR }}
                        tickFormatter={(value) => formatCompactCurrency(value)}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: TOOLTIP_BG,
                          border: `1px solid ${TOOLTIP_BORDER}`,
                          borderRadius: '12px',
                        }}
                        labelStyle={{ color: AXIS_COLOR }}
                        itemStyle={{ color: AXIS_COLOR }}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        <Cell fill="hsl(var(--secondary))" />
                        <Cell fill="hsl(var(--destructive))" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category List */}
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">All Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.categoryBreakdown.length > 0 ? (
                  analytics.categoryBreakdown.map((category, index) => (
                    <div key={category.category} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-foreground">{category.label}</span>
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(category.amount)}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              width: `${category.percentage}%`,
                              backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {category.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No expenses recorded this {period}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No analytics data available
          </div>
        )}
      </div>

      {/* Smart Insights Section */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold">Financial Intelligence</h2>
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Subscription Detector
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xl font-semibold">{subscriptions.length}</p>
              <p className="text-xs text-muted-foreground">recurring patterns identified</p>
              <p className="text-xs text-foreground/90">
                {topSubscription
                  ? `Top: ${topSubscription.merchant} (${topSubscription.status})`
                  : 'No recurring pattern yet. Keep tracking to detect subscriptions.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Spend Map
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xl font-semibold">{locations.topLocations.length}</p>
              <p className="text-xs text-muted-foreground">spending clusters</p>
              <p className="text-xs text-foreground/90">
                {topLocation
                  ? `Top cluster: ${topLocation.key} (${formatLocalCurrency(topLocation.totalSpent, { maximumFractionDigits: 0 })})`
                  : 'Location data not available yet. Enable geo-tagged inputs to unlock heatmaps.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Time Behavior
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xl font-semibold capitalize">{timeAnalysis.dominantPattern}</p>
              <p className="text-xs text-muted-foreground">dominant spending block</p>
              <p className="text-xs text-foreground/90">
                {dominantTimeBucket
                  ? `${formatLocalNumber(dominantTimeBucket.transactionCount)} transactions in this block`
                  : 'Time behavior will appear once expenses are logged.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Goal Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xl font-semibold">{formatLocalCurrency(goals.dailySavingRequired, { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-muted-foreground">daily saving recommendation</p>
              <p className="text-xs text-foreground/90">{goals.message}</p>
            </CardContent>
          </Card>

          <Card className="min-[420px]:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HandCoins className="h-4 w-4" />
                Group Debt Simplifier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xl font-semibold">{settlements.length}</p>
              <p className="text-xs text-muted-foreground">optimized settlement transactions</p>
              <p className="text-xs text-foreground/90">
                {settlements.length > 0
                  ? 'Debt settlement path is optimized using creditor/debtor greedy matching.'
                  : 'No pending cross-member debt path right now.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold">Financial Insights</h2>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/insights/history')}>
            <History className="h-3.5 w-3.5" />
            History
          </Button>
        </div>
        <InsightsList insights={insights} isLoading={insightsLoading} />
      </div>
    </div>
    </PageTransition>
  );
}
