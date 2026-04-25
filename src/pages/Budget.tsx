import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, AlertTriangle, CheckCircle, Trash2, Edit2, X, Save, MoreHorizontal, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useBudgetsWithSpent, useCreateBudget, useUpdateBudget, useDeleteBudget, BudgetWithSpent } from '@/hooks/useBudgets';
import { useCurrency } from '@/hooks/useCurrency';
import { CATEGORY_CONFIG, ExpenseCategory } from '@/types/expense';
import { getCategoryIcon } from '@/lib/category-icons';

export default function Budget() {
  const navigate = useNavigate();
  const { symbol, formatCurrency, convertFromBase, convertToBase } = useCurrency();
  const formatBudgetAmount = (amount: number) => formatCurrency(amount, { maximumFractionDigits: 0 });
  const { data: budgets, isLoading } = useBudgetsWithSpent();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const toEditableAmount = (amountInBase: number) => {
    const converted = convertFromBase(amountInBase);
    return (Math.round(converted * 100) / 100).toString();
  };

  const availableCategories = Object.keys(CATEGORY_CONFIG).filter(
    cat => !budgets?.some(b => b.category === cat)
  );

  const handleCreateBudget = async () => {
    if (!selectedCategory || !budgetAmount) return;

    const parsedAmount = parseFloat(budgetAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    const amountInBaseCurrency = convertToBase(parsedAmount);
    
    await createBudget.mutateAsync({
      category: selectedCategory,
      amount: amountInBaseCurrency,
    });

    setIsDialogOpen(false);
    setSelectedCategory('');
    setBudgetAmount('');
  };

  const handleUpdateBudget = async (id: string) => {
    if (!editAmount) return;

    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    const amountInBaseCurrency = convertToBase(parsedAmount);
    
    await updateBudget.mutateAsync({
      id,
      amount: amountInBaseCurrency,
    });

    setEditingBudget(null);
    setEditAmount('');
  };

  const handleDeleteBudget = async (id: string) => {
    await deleteBudget.mutateAsync(id);
  };

  const getProgressColor = (budget: BudgetWithSpent) => {
    if (budget.isOverBudget) return 'bg-destructive';
    if (budget.isNearLimit) return 'bg-accent';
    return 'bg-secondary';
  };

  const totalBudget = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + b.spent, 0) || 0;
  const overBudgetCount = budgets?.filter(b => b.isOverBudget).length || 0;
  const nearLimitCount = budgets?.filter(b => b.isNearLimit).length || 0;

  return (
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
            <h1 className="text-xl font-bold text-foreground">Budget</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={availableCategories.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Category Budget</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {CATEGORY_CONFIG[category as ExpenseCategory].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Budget Amount ({symbol})</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateBudget}
                  disabled={!selectedCategory || !budgetAmount || createBudget.isPending}
                >
                  {createBudget.isPending ? 'Creating...' : 'Create Budget'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-bold text-foreground">{formatBudgetAmount(totalBudget)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className={`text-2xl font-bold ${totalSpent > totalBudget ? 'text-destructive' : 'text-foreground'}`}>
                      {formatBudgetAmount(totalSpent)}
                    </p>
                  </div>
                </div>
                
                {/* Overall Progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Overall Usage</span>
                    <span className="text-foreground font-medium">
                      {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0} 
                    className="h-3"
                  />
                </div>

                {/* Alerts Summary */}
                {(overBudgetCount > 0 || nearLimitCount > 0) && (
                  <div className="mt-4 flex gap-4">
                    {overBudgetCount > 0 && (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">{overBudgetCount} over budget</span>
                      </div>
                    )}
                    {nearLimitCount > 0 && (
                      <div className="flex items-center gap-2 text-accent">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">{nearLimitCount} near limit</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget List */}
            {budgets && budgets.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Category Budgets</h2>
                {budgets.map(budget => {
                  const Icon = getCategoryIcon(budget.category as ExpenseCategory);
                  const config = CATEGORY_CONFIG[budget.category as ExpenseCategory];
                  const isEditing = editingBudget?.id === budget.id;

                  return (
                    <Card key={budget.id} className="bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config?.color || 'bg-muted'}`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {config?.label || budget.category}
                              </p>
                              {budget.isOverBudget && (
                                <div className="flex items-center gap-1 text-destructive text-xs">
                                  <AlertTriangle className="h-3 w-3" />
                                  Over budget by {formatBudgetAmount(Math.abs(budget.remaining))}
                                </div>
                              )}
                              {budget.isNearLimit && !budget.isOverBudget && (
                                <div className="flex items-center gap-1 text-accent text-xs">
                                  <AlertTriangle className="h-3 w-3" />
                                  Approaching limit
                                </div>
                              )}
                              {!budget.isOverBudget && !budget.isNearLimit && (
                                <div className="flex items-center gap-1 text-secondary text-xs">
                                  <CheckCircle className="h-3 w-3" />
                                  On track
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleUpdateBudget(budget.id)}
                                >
                                  <Save className="h-4 w-4 text-secondary" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditingBudget(null);
                                    setEditAmount('');
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditingBudget(budget);
                                    setEditAmount(toEditableAmount(budget.amount));
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDeleteBudget(budget.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="mb-3">
                            <Label className="text-xs">Budget Amount ({symbol})</Label>
                            <Input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        ) : (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">
                              {formatBudgetAmount(budget.spent)} spent
                            </span>
                            <span className="text-foreground font-medium">
                              {formatBudgetAmount(budget.amount)} budget
                            </span>
                          </div>
                        )}

                        {!isEditing && (
                          <>
                            <div className="relative h-3 bg-muted rounded-full ">
                              <div
                                className={`absolute inset-y-0 left-0 rounded-full transition-all ${getProgressColor(budget)}`}
                                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                              />
                              {budget.isOverBudget && (
                                <div
                                  className="absolute inset-y-0 bg-destructive/30 rounded-full"
                                  style={{ 
                                    left: '100%', 
                                    width: `${Math.min((budget.percentage - 100), 50)}%`,
                                    transform: 'translateX(-100%)'
                                  }}
                                />
                              )}
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-muted-foreground">
                                {budget.percentage.toFixed(0)}% used
                              </span>
                              <span className={budget.remaining >= 0 ? 'text-secondary' : 'text-destructive'}>
                                {budget.remaining >= 0 ? `${formatBudgetAmount(budget.remaining)} left` : 'Over budget'}
                              </span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-card">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Budgets Set</h3>
                  <p className="text-muted-foreground mb-4">
                    Set monthly budgets for different categories to track your spending
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Budget
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Tips Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <h3 className="font-medium text-foreground mb-2">💡 Budget Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Set realistic budgets based on your past spending patterns</li>
                  <li>• Review and adjust budgets monthly as your needs change</li>
                  <li>• Categories reaching 80% will show a warning</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
