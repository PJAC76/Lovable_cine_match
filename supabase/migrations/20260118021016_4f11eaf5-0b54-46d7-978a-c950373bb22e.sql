-- Fix 1: Update user_ratings SELECT policy to restrict viewing to own ratings only
-- This prevents exposure of user viewing habits and preferences
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.user_ratings;

CREATE POLICY "Users can view their own ratings" 
  ON public.user_ratings 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Fix 2: Update handle_new_user function to NOT insert email into profiles
-- Email is already available in auth.users and duplicating it creates unnecessary exposure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$;

-- Fix 3: Remove email column from profiles table to eliminate exposure point
-- Users can access their email from the auth session instead
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;