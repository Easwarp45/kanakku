-- Fix foreign key relationships for profiles table

-- Step 1: Ensure profiles table has proper FK to auth.users
ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create or update the explicit relationship for Supabase
-- This helps Supabase recognize the relationship in queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Step 3: Verify profiles table structure
-- SELECT * FROM public.profiles LIMIT 1;

-- Step 4: Test the relationship
-- SELECT gm.id, gm.user_id, p.display_name, p.avatar_url
-- FROM public.group_members gm
-- LEFT JOIN public.profiles p ON p.user_id = gm.user_id
-- LIMIT 1;
