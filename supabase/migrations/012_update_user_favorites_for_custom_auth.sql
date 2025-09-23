-- Allow user_favorites to store records for custom-auth (WeChat) users
ALTER TABLE public.user_favorites
  ADD COLUMN IF NOT EXISTS custom_user_id uuid REFERENCES public.custom_users(id) ON DELETE CASCADE;

-- Ensure Supabase-auth users remain unique per technology
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_favorites_user
  ON public.user_favorites(user_id, technology_id)
  WHERE user_id IS NOT NULL;

-- Ensure custom-auth users are unique per technology
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_favorites_custom
  ON public.user_favorites(custom_user_id, technology_id)
  WHERE custom_user_id IS NOT NULL;

-- Allow custom-auth rows to omit user_id (it will be stored in custom_user_id)
ALTER TABLE public.user_favorites
  ALTER COLUMN user_id DROP NOT NULL;
