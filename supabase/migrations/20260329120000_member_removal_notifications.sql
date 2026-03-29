-- Replace polling with WebSocket-based member removal notifications
--
-- Problem: Polling every 5 seconds wastes battery, network, and server resources.
-- Supabase Realtime won't deliver DELETE events to users who lost RLS access.
--
-- Solution: Create a notification table that logs member removals with RLS
-- allowing removed users to see their own removal notifications via real-time.

-- Create member removal notifications table
CREATE TABLE IF NOT EXISTS public.member_removal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  removed_user_id UUID NOT NULL,
  removed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_removal_notifications_user
  ON public.member_removal_notifications(removed_user_id, created_at DESC);

-- RLS: Users can only see notifications where they were removed
ALTER TABLE public.member_removal_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own removal notifications"
ON public.member_removal_notifications FOR SELECT
USING (auth.uid() = removed_user_id);

-- Create a trigger function to auto-insert notification when member is deleted
CREATE OR REPLACE FUNCTION public.notify_member_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get the admin who is performing the deletion (from current session)
  -- If auth.uid() is doing the deletion, they're the admin
  admin_id := auth.uid();

  -- Insert notification record
  INSERT INTO public.member_removal_notifications (
    group_id,
    removed_user_id,
    removed_by,
    created_at
  ) VALUES (
    OLD.group_id,
    OLD.user_id,
    COALESCE(admin_id, OLD.user_id), -- fallback if no auth context
    now()
  );

  RETURN OLD;
END;
$$;

-- Attach trigger to group_members table
DROP TRIGGER IF EXISTS on_member_removal ON public.group_members;

CREATE TRIGGER on_member_removal
  AFTER DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_member_removal();

-- Grant permissions
GRANT SELECT ON public.member_removal_notifications TO authenticated;

-- Auto-cleanup: Delete notifications older than 1 hour (they've served their purpose)
-- This prevents table bloat
CREATE OR REPLACE FUNCTION public.cleanup_old_removal_notifications()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.member_removal_notifications
  WHERE created_at < (now() - interval '1 hour');
$$;

-- Optional: Set up a pg_cron job to run cleanup periodically
-- COMMENT: This requires pg_cron extension - enable it manually if desired:
-- SELECT cron.schedule('cleanup-removal-notifications', '0 * * * *',
--   'SELECT public.cleanup_old_removal_notifications()');
