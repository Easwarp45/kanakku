-- Add is_admin and role columns to group_members
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create function to check if user is group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(group_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.group_members
    WHERE group_id = group_uuid
    AND user_id = user_uuid
    AND is_admin = true
  );
$$;

-- Update RLS policies for group_members to allow admins to delete members
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

CREATE POLICY "Users can leave groups"
ON public.group_members FOR DELETE
USING (
  auth.uid() = user_id 
  OR public.is_group_admin(group_id, auth.uid())
);

-- Create group_chats table
CREATE TABLE IF NOT EXISTS public.group_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on group_chats for faster queries
CREATE INDEX IF NOT EXISTS idx_group_chats_group_id ON public.group_chats(group_id);
CREATE INDEX IF NOT EXISTS idx_group_chats_created_at ON public.group_chats(created_at DESC);

-- Enable RLS on group_chats
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;

-- RLS policies for group_chats
CREATE POLICY "Users can view group chats for their groups"
ON public.group_chats FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Users can insert messages to their groups"
ON public.group_chats FOR INSERT
WITH CHECK (
  public.is_group_member(group_id, auth.uid())
  AND auth.uid() = user_id
);

CREATE POLICY "Users can update own messages"
ON public.group_chats FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
ON public.group_chats FOR DELETE
USING (auth.uid() = user_id);
