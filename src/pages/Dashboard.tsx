import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useRecentExpenses, useTodayTotal, useMonthlyTotal } from '@/hooks/useExpenses';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useSmartInsights } from '@/hooks/useSmartInsights';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BottomNav from '@/components/layout/BottomNav';
import { LogOut, Plus, Users, TrendingUp, IndianRupee, Smartphone, Target, Bell } from 'lucide-react';
import { InsightsWidget } from '@/components/insights';
import { useNotifications } from '@/hooks/useNotifications';
import { CATEGORY_CONFIG } from '@/types/expense';
import { getCategoryIcon } from '@/lib/category-icons';
import { PageTransition, AnimatedCard, listContainerVariants, listItemVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: recentExpenses = [], isLoading: loadingRecent } = useRecentExpenses(5);
  const { data: todayTotal = 0 } = useTodayTotal();
  const { data: monthlyTotal = 0 } = useMonthlyTotal();
  const { insights, isLoading: insightsLoading } = useSmartInsights();

  // Initialize offline sync
  useOfflineSync();

  const { permission, requestPermission } = useNotifications();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">₹</span>
            </div>
            <span className="font-semibold">Kanakku</span>
          </div>
          <div className="flex items-center gap-1">
            {permission !== 'granted' && (
              <Button variant="ghost" size="icon" onClick={requestPermission} title="Enable notifications">
                <Bell className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-6">
        {/* Welcome section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Hello, {user?.user_metadata?.display_name || 'there'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Track your expenses and manage your money
          </p>
        </div>

        {/* Quick add expense card */}
        <Card className="mb-6 bg-primary text-primary-foreground">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm opacity-90">Today's spending</p>
              <div className="flex items-center text-3xl font-bold">
                <IndianRupee className="h-7 w-7" />
                {todayTotal.toLocaleString('en-IN')}
              </div>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="h-12 w-12 rounded-full p-0"
              onClick={() => navigate('/add-expense')}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </CardContent>
        </Card>

        {/* Monthly overview */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Expenses</span>
              <span className="text-xl font-semibold flex items-center">
                <IndianRupee className="h-5 w-5" />
                {monthlyTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 w-1/3 rounded-full bg-primary" />
            </div>
            <Button 
              variant="link" 
              className="text-sm p-0 h-auto" 
              onClick={() => navigate('/budget')}
            >
              Set a budget to track your spending →
            </Button>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-5 gap-2">
          <Button
            variant="outline"
            className="flex h-auto flex-col gap-2 py-4"
            onClick={() => navigate('/add-expense')}
          >
            <Plus className="h-5 w-5 text-primary" />
            <span className="text-xs">Add</span>
          </Button>
          <Button
            variant="outline"
            className="flex h-auto flex-col gap-2 py-4"
            onClick={() => navigate('/upi')}
          >
            <Smartphone className="h-5 w-5 text-green-600" />
            <span className="text-xs">UPI</span>
          </Button>
          <Button
            variant="outline"
            className="flex h-auto flex-col gap-2 py-4"
            onClick={() => navigate('/groups')}
          >
            <Users className="h-5 w-5 text-secondary-foreground" />
            <span className="text-xs">Split</span>
          </Button>
          <Button
            variant="outline"
            className="flex h-auto flex-col gap-2 py-4"
            onClick={() => navigate('/budget')}
          >
            <Target className="h-5 w-5 text-accent" />
            <span className="text-xs">Budget</span>
          </Button>
          <Button
            variant="outline"
            className="flex h-auto flex-col gap-2 py-4"
            onClick={() => navigate('/analytics')}
          >
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-xs">Stats</span>
          </Button>
        </div>

        {/* Smart Insights Widget */}
        <div className="mt-6">
          <InsightsWidget insights={insights} limit={2} isLoading={insightsLoading} />
        </div>

        {/* Recent transactions */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            {recentExpenses.length > 0 && (
              <Button variant="link" className="text-sm p-0 h-auto" onClick={() => navigate('/expenses')}>
                View all
              </Button>
            )}
          </div>

          {loadingRecent ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading...
              </CardContent>
            </Card>
          ) : recentExpenses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground">
                  Add your first expense to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y">
                {recentExpenses.map((expense) => {
                  const config = CATEGORY_CONFIG[expense.category];
                  const IconComponent = getCategoryIcon(expense.category);
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/expenses/${expense.id}`)}
                    >
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0', config.color)}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{expense.description || config.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(expense.expense_date), 'MMM d')}
                        </p>
                      </div>
                      <span className="font-semibold flex items-center">
                        <IndianRupee className="h-4 w-4" />
                        {expense.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <BottomNav />
      </div>
    </PageTransition>
  );
}
