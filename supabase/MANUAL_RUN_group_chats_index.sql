-- ============================================================
-- Run in: Supabase Dashboard → SQL Editor
-- Purpose: Add index on group_chats.group_id for fast chat queries
--          and verify RLS allows members to SELECT chat messages
-- ============================================================

-- 1. Fast lookup index (idempotent)
CREATE INDEX IF NOT EXISTS idx_group_chats_group_id
  ON public.group_chats(group_id, created_at DESC);

-- 2. Verify RLS is enabled
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;

-- 3. Drop + recreate SELECT policy to ensure members can read messages
DROP POLICY IF EXISTS "Group members can view chat messages" ON public.group_chats;
CREATE POLICY "Group members can view chat messages"
  ON public.group_chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_chats.group_id
        AND gm.user_id  = auth.uid()
    )
  );

-- 4. Drop + recreate INSERT policy so only members can send messages
DROP POLICY IF EXISTS "Group members can send chat messages" ON public.group_chats;
CREATE POLICY "Group members can send chat messages"
  ON public.group_chats FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_chats.group_id
        AND gm.user_id  = auth.uid()
    )
  );

-- 5. Verify
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'group_chats';
