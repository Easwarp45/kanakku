-- Fix RLS policies for group_members table
-- This allows members to view other members and admins to remove members

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups or admins can remove" ON public.group_members;

-- Step 2: Create new SELECT policy - members can view all members of their group
CREATE POLICY "Members can view all group members"
ON public.group_members FOR SELECT
USING (
  public.is_group_member(group_id, auth.uid())
);

-- Step 3: Create new INSERT policy - authenticated users can join groups
CREATE POLICY "Users can join groups"
ON public.group_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Step 4: Create new DELETE policy - users can leave or admins can remove
CREATE POLICY "Users can leave or admins can remove"
ON public.group_members FOR DELETE
USING (
  auth.uid() = user_id  -- User can delete themselves
  OR EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_members.group_id
    AND user_id = auth.uid()
    AND is_admin = true  -- Admin of the same group can delete others
  )
);

-- Step 5: Ensure is_admin and created_at columns exist with proper defaults
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.group_members
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Step 6: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_group_members_is_admin 
ON public.group_members(group_id, is_admin);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id_user_id 
ON public.group_members(group_id, user_id);

-- Step 7: Verify - check your group members exist
-- Run this to see what members you have:
-- SELECT gm.id, gm.group_id, gm.user_id, gm.is_admin, gm.created_at, p.display_name
-- FROM public.group_members gm
-- LEFT JOIN public.profiles p ON gm.user_id = p.user_id
-- ORDER BY gm.created_at DESC;
