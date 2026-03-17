import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Download, Calendar, Wallet, Receipt, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition, staggerContainerVariants, staggerItemVariants, slideUpVariants } from '@/lib/animations';
import { SkeletonCardLoader } from '@/components/ui/skeleton-loader';
import BottomNav from '@/components/layout/BottomNav';
import { useAnalytics, TimePeriod } from '@/hooks/useAnalytics';
import { useSmartInsights } from '@/hooks/useSmartInsights';
import { InsightsList } from '@/components/insights';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

// Chart colors using HSL values from design system
const CHART_COLORS = [
  'hsl(217, 91%, 60%)',   // Primary blue
  'hsl(160, 84%, 39%)',   // Secondary green
  'hsl(38, 92%, 50%)',    // Accent orange
  'hsl(280, 65%, 60%)',   // Purple
  'hsl(340, 80%, 60%)',   // Pink
  'hsl(190, 80%, 45%)',   // Teal
  'hsl(0, 84%, 60%)',     // Red
  'hsl(50, 90%, 50%)',    // Yellow
  'hsl(220, 14%, 50%)',   // Gray
];

export default function Analytics() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<TimePeriod>('month');
  const { data: analytics, isLoading } = useAnalytics(period);
  const { insights, isLoading: insightsLoading } = useSmartInsights();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = () => {
    if (!analytics) return;
    
    // Create CSV content
    const headers = ['Category', 'Amount', 'Percentage'];
    const rows = analytics.categoryBreakdown.map(cat => 
      [cat.label, cat.amount.toFixed(2), cat.percentage.toFixed(1) + '%']
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
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-background pb-20">
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
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Total Spent</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(analytics.totalSpent)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {analytics.percentageChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-destructive" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-secondary" />
                    )}
                    <span className={`text-xs ${analytics.percentageChange >= 0 ? 'text-destructive' : 'text-secondary'}`}>
                      {Math.abs(analytics.percentageChange).toFixed(1)}% vs last {period}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-secondary" />
                    <span className="text-sm text-muted-foreground">Daily Avg</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(analytics.averagePerDay)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    per day
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="h-4 w-4 text-accent" />
                    <span className="text-sm text-muted-foreground">Transactions</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {analytics.transactionCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    this {period}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Previous</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(analytics.previousPeriodTotal)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    last {period}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-secondary" />
                    <span className="text-sm text-muted-foreground">Total Income</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(analytics.totalIncome)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">this {period}</p>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-accent" />
                    <span className="text-sm text-muted-foreground">Net Savings</span>
                  </div>
                  <p className={`text-2xl font-bold ${analytics.netSavings >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                    {formatCurrency(analytics.netSavings)}
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
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.trendData}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                        <XAxis 
                          dataKey="label" 
                          tick={{ fontSize: 12, fill: 'hsl(215, 16%, 47%)' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: 'hsl(215, 16%, 47%)' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(217, 91%, 60%)"
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
                  <div className="h-64">
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
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={analytics.topCategories} 
                        layout="vertical"
                        margin={{ left: 20, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 12, fill: 'hsl(215, 16%, 47%)' }}
                          tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="label"
                          tick={{ fontSize: 12, fill: 'hsl(215, 16%, 47%)' }}
                          width={80}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: 'hsl(0, 0%, 100%)',
                            border: '1px solid hsl(214, 32%, 91%)',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar 
                          dataKey="amount" 
                          fill="hsl(217, 91%, 60%)"
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
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { label: 'Income', amount: analytics.totalIncome },
                      { label: 'Expense', amount: analytics.totalSpent },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(215, 16%, 47%)' }} />
                      <YAxis
                        tick={{ fontSize: 12, fill: 'hsl(215, 16%, 47%)' }}
                        tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                      />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        <Cell fill="hsl(160, 84%, 39%)" />
                        <Cell fill="hsl(0, 84%, 60%)" />
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
        <h2 className="text-lg font-semibold px-4">Financial Insights</h2>
        <InsightsList insights={insights} isLoading={insightsLoading} />
      </div>

      <BottomNav />
    </div>
    </PageTransition>
  );
}
