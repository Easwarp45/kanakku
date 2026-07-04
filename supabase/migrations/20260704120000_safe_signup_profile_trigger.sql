-- Make new-user signup resilient if profile creation fails.
-- The app now backfills the profile after authentication, so account creation
-- should not be blocked by a trigger-time database error.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'User'),
    COALESCE(NEW.raw_user_meta_data->>'currency', 'INR')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    currency = COALESCE(EXCLUDED.currency, public.profiles.currency),
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Never block auth signup because of profile bootstrap problems.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;