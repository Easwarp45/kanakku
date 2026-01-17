-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_by UUID NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nickname TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group expenses table
CREATE TABLE public.group_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  category expense_category NOT NULL DEFAULT 'other',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense splits table (who owes what)
CREATE TABLE public.expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_expense_id UUID NOT NULL REFERENCES public.group_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_expense_id, user_id)
);

-- Create settlements table (payment records)
CREATE TABLE public.settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL,
  paid_to UUID NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  note TEXT,
  settled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Helper function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_uuid AND user_id = user_uuid
  )
$$;

-- Groups policies
CREATE POLICY "Users can view groups they are members of"
ON public.groups FOR SELECT
USING (public.is_group_member(id, auth.uid()) OR created_by = auth.uid());

CREATE POLICY "Users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
ON public.groups FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
ON public.groups FOR DELETE
USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Users can view members of their groups"
ON public.group_members FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Users can join groups"
ON public.group_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
ON public.group_members FOR DELETE
USING (auth.uid() = user_id);

-- Group expenses policies
CREATE POLICY "Users can view expenses of their groups"
ON public.group_expenses FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can add expenses to their groups"
ON public.group_expenses FOR INSERT
WITH CHECK (public.is_group_member(group_id, auth.uid()) AND auth.uid() = paid_by);

CREATE POLICY "Expense creator can update"
ON public.group_expenses FOR UPDATE
USING (auth.uid() = paid_by);

CREATE POLICY "Expense creator can delete"
ON public.group_expenses FOR DELETE
USING (auth.uid() = paid_by);

-- Expense splits policies
CREATE POLICY "Users can view splits for their group expenses"
ON public.expense_splits FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.group_expenses ge
  WHERE ge.id = group_expense_id
  AND public.is_group_member(ge.group_id, auth.uid())
));

CREATE POLICY "Members can create splits"
ON public.expense_splits FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.group_expenses ge
  WHERE ge.id = group_expense_id
  AND ge.paid_by = auth.uid()
));

CREATE POLICY "Split owner can update"
ON public.expense_splits FOR UPDATE
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.group_expenses ge
  WHERE ge.id = group_expense_id AND ge.paid_by = auth.uid()
));

-- Settlements policies
CREATE POLICY "Users can view settlements in their groups"
ON public.settlements FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Users can create settlements they paid"
ON public.settlements FOR INSERT
WITH CHECK (public.is_group_member(group_id, auth.uid()) AND auth.uid() = paid_by);

-- Triggers for updated_at
CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_expenses_updated_at
BEFORE UPDATE ON public.group_expenses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_group_expenses_group_id ON public.group_expenses(group_id);
CREATE INDEX idx_expense_splits_expense_id ON public.expense_splits(group_expense_id);
CREATE INDEX idx_settlements_group_id ON public.settlements(group_id);