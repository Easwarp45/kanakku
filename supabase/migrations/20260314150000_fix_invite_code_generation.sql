-- Fix group invite code generation with proper function
-- This migration creates a function to generate random invite codes and applies it to the groups table

-- Create function to generate random alphanumeric code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-character code (uppercase alphanumeric)
    code := upper(substring(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      floor(random() * 36)::int + 1,
      1
    )) || upper(substring(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      floor(random() * 36)::int + 1,
      1
    )) || upper(substring(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      floor(random() * 36)::int + 1,
      1
    )) || upper(substring(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      floor(random() * 36)::int + 1,
      1
    )) || upper(substring(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      floor(random() * 36)::int + 1,
      1
    )) || upper(substring(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      floor(random() * 36)::int + 1,
      1
    )) || upper(substring(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      floor(random() * 36)::int + 1,
      1
    )) || upper(substring(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      floor(random() * 36)::int + 1,
      1
    ));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.groups WHERE invite_code = code) INTO exists_code;
    
    -- If code doesn't exist, return it
    IF NOT exists_code THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Create trigger to generate invite code on insert
CREATE OR REPLACE FUNCTION public.set_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := public.generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_group_invite_code ON public.groups;

-- Create trigger
CREATE TRIGGER set_group_invite_code
BEFORE INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.set_invite_code();

-- Ensure invite_code column is NOT NULL (if not already)
ALTER TABLE public.groups
ALTER COLUMN invite_code SET NOT NULL;
