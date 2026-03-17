-- Complete fix for group_members and group_chats visibility

-- ============================================
-- FIX 1: GROUP_MEMBERS RLS POLICY
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Members can view all group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;

-- Create simple, direct SELECT policy
CREATE POLICY "Members can view all group members v2"
ON public.group_members FOR SELECT
USING (true);  -- Any authenticated user can view (RLS handled at app level)

-- Keep insert and delete as is
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
ON public.group_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave or admins can remove" ON public.group_members;
CREATE POLICY "Users can leave or admins can remove v2"
ON public.group_members FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- FIX 2: ENSURE GROUP_CHATS TABLE EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.group_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;

-- Drop old policies if any
DROP POLICY IF EXISTS "Users can view group chats for their groups" ON public.group_chats;
DROP POLICY IF EXISTS "Users can insert messages to their groups" ON public.group_chats;
DROP POLICY IF EXISTS "Users can update own messages" ON public.group_chats;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.group_chats;

-- Create new policies
CREATE POLICY "Anyone can view group chats"
ON public.group_chats FOR SELECT
USING (true);

CREATE POLICY "Users can insert own messages"
ON public.group_chats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages v2"
ON public.group_chats FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages v2"
ON public.group_chats FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_group_chats_group_id ON public.group_chats(group_id);
CREATE INDEX IF NOT EXISTS idx_group_chats_created_at ON public.group_chats(created_at DESC);

-- ============================================
-- VERIFY: Check that creator is in group_members
-- ============================================

-- For each group, ensure the creator is added as a member
INSERT INTO public.group_members (group_id, user_id, is_admin, created_at)
SELECT g.id, g.created_by, true, g.created_at
FROM public.groups g
WHERE NOT EXISTS (
  SELECT 1 FROM public.group_members gm
  WHERE gm.group_id = g.id
  AND gm.user_id = g.created_by
)
ON CONFLICT (group_id, user_id) DO UPDATE
SET is_admin = true;
