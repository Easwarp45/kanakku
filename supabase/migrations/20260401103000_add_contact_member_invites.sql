-- Add secure RPCs for contact-based group member discovery and admin member add.

CREATE OR REPLACE FUNCTION public.find_contacts_on_kanakku(phone_numbers TEXT[])
RETURNS TABLE(user_id UUID, display_name TEXT, phone_number TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH normalized_input AS (
    SELECT DISTINCT right(regexp_replace(value, '[^0-9]', '', 'g'), 10) AS normalized_phone
    FROM unnest(phone_numbers) AS value
    WHERE value IS NOT NULL
      AND value <> ''
      AND right(regexp_replace(value, '[^0-9]', '', 'g'), 10) <> ''
  )
  SELECT
    p.user_id,
    p.display_name,
    p.phone_number
  FROM public.profiles p
  JOIN normalized_input i
    ON right(regexp_replace(COALESCE(p.phone_number, ''), '[^0-9]', '', 'g'), 10) = i.normalized_phone
  WHERE p.user_id <> auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.find_contacts_on_kanakku(TEXT[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_group_member_by_admin(group_uuid UUID, new_user_uuid UUID)
RETURNS TABLE(added BOOLEAN, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF group_uuid IS NULL OR new_user_uuid IS NULL THEN
    RAISE EXCEPTION 'Invalid input';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = group_uuid
      AND gm.user_id = auth.uid()
      AND gm.is_admin = true
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = group_uuid
      AND g.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only group admins can add members';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = new_user_uuid
  ) THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = group_uuid
      AND gm.user_id = new_user_uuid
  ) THEN
    RETURN QUERY SELECT false, 'already_member'::TEXT;
    RETURN;
  END IF;

  INSERT INTO public.group_members (group_id, user_id, is_admin)
  VALUES (group_uuid, new_user_uuid, false);

  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_group_member_by_admin(UUID, UUID) TO authenticated;
