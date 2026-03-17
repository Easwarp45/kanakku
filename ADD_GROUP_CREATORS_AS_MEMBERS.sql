-- Add group creators to group_members table
-- This fixes the issue where groups exist but have no members

-- First, let's see what groups exist
-- SELECT id, name, created_by FROM public.groups;

-- Now add the creators as members (this is the fix)
INSERT INTO public.group_members (id, group_id, user_id, is_admin, created_at)
SELECT 
  gen_random_uuid(),
  g.id,
  g.created_by,
  true,
  g.created_at
FROM public.groups g
WHERE NOT EXISTS (
  SELECT 1 FROM public.group_members gm
  WHERE gm.group_id = g.id
  AND gm.user_id = g.created_by
);

-- Verify the members were added
-- SELECT gm.id, gm.group_id, gm.user_id, gm.is_admin, g.name, p.display_name
-- FROM public.group_members gm
-- JOIN public.groups g ON g.id = gm.group_id
-- LEFT JOIN public.profiles p ON p.user_id = gm.user_id
-- ORDER BY gm.created_at DESC;
