-- Create income source enum
CREATE TYPE public.income_source AS ENUM (
  'salary',
  'freelance',
  'investment',
  'business',
  'gift',
  'refund',
  'other'
);

-- Create income table
CREATE TABLE public.income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  source income_source NOT NULL DEFAULT 'salary',
  description TEXT,
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own income"
ON public.income FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own income"
ON public.income FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income"
ON public.income FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income"
ON public.income FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_income_updated_at
BEFORE UPDATE ON public.income
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_income_user_id ON public.income(user_id);
CREATE INDEX idx_income_date ON public.income(income_date);
CREATE INDEX idx_income_source ON public.income(source);
