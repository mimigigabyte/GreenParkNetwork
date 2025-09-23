-- 支持自定义认证用户创建技术
ALTER TABLE public.admin_technologies
  ADD COLUMN IF NOT EXISTS custom_created_by uuid REFERENCES public.custom_users(id) ON DELETE SET NULL;

ALTER TABLE public.admin_technologies
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.admin_technologies
  DROP CONSTRAINT IF EXISTS admin_technologies_created_by_fkey;

ALTER TABLE public.admin_technologies
  ADD CONSTRAINT admin_technologies_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admin_technologies_custom_created_by
  ON public.admin_technologies(custom_created_by);
