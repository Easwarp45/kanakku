-- Fix RLS policy for group_members SELECT
-- The issue is that the SELECT policy is using is_group_member() but it needs to be more direct

-- Drop the problematic policy
DROP POLICY IF EXISTS "Members can view all group members" ON public.group_members;

-- Create a new, more direct SELECT policy
-- Users can view all members if they are in that group
CREATE POLICY "Members can view all group members"
ON public.group_members FOR SELECT
USING (
  -- Check if the current user is a member of this group
  EXISTS (
    SELECT 1 FROM public.group_members AS gm2
    WHERE gm2.group_id = group_members.group_id
    AND gm2.user_id = auth.uid()
  )
);

-- Verify the group creator is added as member by updating any records without is_admin set
UPDATE public.group_members 
SET is_admin = true
WHERE group_id IN (
  SELECT id FROM public.groups WHERE created_by = auth.uid()
)
AND user_id = auth.uid()
AND is_admin = false;

-- Test query - uncomment to see members in your group
-- SELECT gm.id, gm.user_id, gm.is_admin, gm.created_at, p.display_name
-- FROM public.group_members gm
-- LEFT JOIN public.profiles p ON gm.user_id = p.user_id
-- ORDER BY gm.created_at;
