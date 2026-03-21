-- Fix: Allow group members to view each other's profiles
-- Root cause: The existing RLS policy only lets users view their own profile.
-- When useGroupMembers fetches profiles of all group members, the query silently
-- blocks other users' profiles → display_name is null → UI shows "Unknown User".
--
-- Solution: Add a second SELECT policy. In Supabase/PostgreSQL, multiple SELECT 
-- policies for the same role are evaluated with OR logic, so a user only needs 
-- to satisfy ONE policy to get access.

CREATE POLICY "Group members can view each other profiles"
ON public.profiles FOR SELECT
USING (
  -- Allow viewing profiles of users who share any group with the current user
  EXISTS (
    SELECT 1
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
      AND gm2.user_id = profiles.user_id
  )
);
