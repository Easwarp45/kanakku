-- Complete fix for group member issue
-- This migration adds the missing is_admin column and recaches the schema

-- Step 1: Add is_admin column to group_members (if not already present)
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Add created_at column (timestamp when member joined)
ALTER TABLE public.group_members
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_members_is_admin 
ON public.group_members(group_id, is_admin);

-- Step 4: Update RLS to allow admins to remove members
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

CREATE POLICY "Users can leave groups or admins can remove"
ON public.group_members FOR DELETE
USING (
  auth.uid() = user_id 
  OR is_admin = true
);

-- Step 5: Clear the schema cache by revalidating
-- This forces Supabase to refresh the schema info
NOTIFY pgrst, 'reload schema';

-- Done! The Supabase JS client should now see the is_admin column
