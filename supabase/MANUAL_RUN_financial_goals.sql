-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Project: xtqtmcmheazewnpfftty
-- Purpose: Create financial_goals table for goal trajectory tracker
-- ============================================================

-- 1. Create the table (idempotent: safe to run even if partially applied)
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id            UUID                     NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID                     NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  target_amount DECIMAL(12, 2)           NOT NULL CHECK (target_amount > 0),
  current_saved DECIMAL(12, 2)           NOT NULL DEFAULT 0 CHECK (current_saved >= 0),
  deadline      DATE                     NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (drop first so re-running is safe)
DROP POLICY IF EXISTS "Users can view their own financial goals"   ON public.financial_goals;
DROP POLICY IF EXISTS "Users can create their own financial goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users can update their own financial goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users can delete their own financial goals" ON public.financial_goals;

CREATE POLICY "Users can view their own financial goals"
  ON public.financial_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial goals"
  ON public.financial_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial goals"
  ON public.financial_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial goals"
  ON public.financial_goals FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_financial_goals_updated_at ON public.financial_goals;
CREATE TRIGGER update_financial_goals_updated_at
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON public.financial_goals(user_id);

-- 6. Verify it worked
SELECT
  table_name,
  (SELECT COUNT(*) FROM public.financial_goals) AS row_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'financial_goals';
