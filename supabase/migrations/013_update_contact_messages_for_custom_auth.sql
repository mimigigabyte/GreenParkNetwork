-- 支持自定义认证用户的联系消息
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS custom_user_id uuid REFERENCES public.custom_users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_contact_messages_custom_user
  ON public.contact_messages(custom_user_id);

ALTER TABLE public.contact_messages
  ALTER COLUMN user_id DROP NOT NULL;
