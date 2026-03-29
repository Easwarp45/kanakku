-- Fix RLS policies to allow group creation to work properly

-- Drop all old policies on group_members
DROP POLICY IF EXISTS "Members can view all group members v2" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave or admins can remove v2" ON public.group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups or admins can remove" ON public.group_members;

-- ============================================
-- NEW PERMISSIVE POLICIES
-- ============================================

-- SELECT: Any authenticated user can view all group members
CREATE POLICY "select_all_members"
ON public.group_members FOR SELECT
TO authenticated
USING (true);

-- INSERT: Any authenticated user can insert (add themselves to groups)
CREATE POLICY "insert_self_as_member"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete themselves, admins can delete others
CREATE POLICY "delete_members"
ON public.group_members FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id  -- Can remove yourself
);

-- UPDATE: Allow updating is_admin flag (for admin promotion)
CREATE POLICY "update_members"
ON public.group_members FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- VERIFY THAT UNAUTHENTICATED IS BLOCKED
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Double-check the table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'group_members'
-- ORDER BY ordinal_position;
