-- Create indexes for faster filtering and sorting
-- These optimize queries on common filter conditions

-- Expense indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_category 
ON public.expenses(user_id, category);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date
ON public.expenses(user_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_payment_method
ON public.expenses(user_id, payment_method);

-- Income indexes
CREATE INDEX IF NOT EXISTS idx_income_user_source
ON public.income(user_id, source);

CREATE INDEX IF NOT EXISTS idx_income_user_date
ON public.income(user_id, income_date DESC);

-- Budget indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_category
ON public.budgets(user_id, category);

-- Group indexes
CREATE INDEX IF NOT EXISTS idx_group_members_user
ON public.group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_group_members_group_user
ON public.group_members(group_id, user_id);

-- Group expense indexes
CREATE INDEX IF NOT EXISTS idx_group_expenses_group_date
ON public.group_expenses(group_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expense_splits_group_expense
ON public.expense_splits(group_expense_id);

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user
ON public.profiles(user_id);

-- Settlement indexes
CREATE INDEX IF NOT EXISTS idx_settlements_group
ON public.settlements(group_id);
