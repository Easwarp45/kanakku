-- Harden group member removal permissions and normalize admin data.
-- This migration ensures member removal is enforced at DB level, not just UI.

-- 1) Ensure group creators are always present in group_members as admins.
INSERT INTO public.group_members (group_id, user_id, is_admin)
SELECT g.id, g.created_by, true
FROM public.groups g
WHERE NOT EXISTS (
  SELECT 1
  FROM public.group_members gm
  WHERE gm.group_id = g.id
    AND gm.user_id = g.created_by
);

-- 2) Ensure existing creator membership rows are marked as admin.
UPDATE public.group_members gm
SET is_admin = true
FROM public.groups g
WHERE gm.group_id = g.id
  AND gm.user_id = g.created_by
  AND gm.is_admin IS DISTINCT FROM true;

-- 3) Recreate DELETE policy with explicit creator/admin permissions.
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Admins can remove members and users can leave groups" ON public.group_members;

CREATE POLICY "Admins can remove members and users can leave groups"
ON public.group_members FOR DELETE
USING (
  -- Any user can remove themself (leave group)
  auth.uid() = user_id
  OR
  -- Group admin can remove any member in the same group
  EXISTS (
    SELECT 1
    FROM public.group_members gm_admin
    WHERE gm_admin.group_id = public.group_members.group_id
      AND gm_admin.user_id = auth.uid()
      AND gm_admin.is_admin = true
  )
  OR
  -- Group creator can always remove members, even if legacy admin flag was missing
  EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = public.group_members.group_id
      AND g.created_by = auth.uid()
  )
);
