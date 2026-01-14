-- Create expense category enum
CREATE TYPE public.expense_category AS ENUM (
  'food',
  'transport',
  'entertainment',
  'shopping',
  'bills',
  'health',
  'education',
  'travel',
  'other'
);

-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM (
  'upi',
  'cash',
  'card',
  'bank_transfer',
  'other'
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category expense_category NOT NULL DEFAULT 'other',
  description TEXT,
  payment_method payment_method NOT NULL DEFAULT 'upi',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own expenses"
ON public.expenses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses"
ON public.expenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
ON public.expenses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
ON public.expenses FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_category ON public.expenses(category);