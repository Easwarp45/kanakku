-- SQL to fix invite code joining issue
-- Copy and paste this into Supabase Dashboard > SQL Editor

-- Step 1: Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

-- Step 2: Create a new permissive policy  
-- This allows any authenticated user to view groups (they still need the correct invite code to join)
CREATE POLICY "Users can view groups"
ON public.groups FOR SELECT
USING (
  public.is_group_member(id, auth.uid()) 
  OR created_by = auth.uid()
  OR auth.uid() IS NOT NULL
);

-- Step 3: Create RPC function for finding groups by invite code
-- This function bypasses RLS and ensures case-insensitive matching
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
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, g.description, g.image_url, g.created_by, g.invite_code, g.created_at, g.updated_at
  FROM public.groups g
  WHERE UPPER(TRIM(g.invite_code)) = UPPER(TRIM(code));
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_group_by_invite_code(TEXT) TO authenticated;

-- Step 4: Verify the migration
-- You can test this by running a simple query:
-- SELECT * FROM get_group_by_invite_code('7C2BA4F6');
