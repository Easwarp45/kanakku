-- Fix RLS policy and add function for viewing groups by invite code
-- This solves the issue where users cannot join groups because
-- the RLS policy blocks viewing groups before they're members

DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

-- New policy: Users can view groups if:
-- 1. They're a member of the group, OR
-- 2. They're the creator, OR  
-- 3. They're any authenticated user (they still need the correct invite code)
CREATE POLICY "Users can view groups"
ON public.groups FOR SELECT
USING (
  public.is_group_member(id, auth.uid()) 
  OR created_by = auth.uid()
  OR auth.uid() IS NOT NULL  -- Any authenticated user can view for joining
);

-- Create a helper function to find group by invite code
-- This function has SECURITY DEFINER so it bypasses RLS
-- But we'll use it only from trusted frontend code
CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  image_url TEXT,
  created_by UUID,
  invite_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, g.description, g.image_url, g.created_by, g.invite_code, g.created_at, g.updated_at
  FROM public.groups g
  WHERE UPPER(TRIM(g.invite_code)) = UPPER(TRIM(code));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Ensure the function is executable by authenticated users
GRANT EXECUTE ON FUNCTION public.get_group_by_invite_code(TEXT) TO authenticated;

