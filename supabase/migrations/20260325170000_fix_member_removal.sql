-- Fix: Member removal - ensure removed users cannot access group data
-- 
-- Problem: Supabase Realtime does NOT deliver DELETE events to users who have
-- already lost RLS access on the deleted row. So a removed member never receives
-- the real-time notification that they were kicked.
--
-- Solution:
-- 1. Add a SECURITY DEFINER RPC that any authenticated user can call to check
--    if THEY are currently a member of a group. This bypasses RLS safely because
--    the function only ever returns info about the calling user (auth.uid()).
-- 2. This RPC is used by the frontend to POLL every 5 seconds - if it returns
--    false, the user is immediately kicked out of the group detail page.

CREATE OR REPLACE FUNCTION public.check_my_group_membership(group_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_uuid
      AND user_id = auth.uid()
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_my_group_membership(UUID) TO authenticated;

-- Also expose which groups the current user belongs to (for useGroups)
-- This is used as a cross-check after potential membership changes
CREATE OR REPLACE FUNCTION public.get_my_group_ids()
RETURNS TABLE(group_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_group_ids() TO authenticated;
