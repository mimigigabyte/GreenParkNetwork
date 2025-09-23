-- 支持自定义认证用户的站内信
ALTER TABLE public.internal_messages
  ADD COLUMN IF NOT EXISTS custom_from_user_id uuid REFERENCES public.custom_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS custom_to_user_id uuid REFERENCES public.custom_users(id) ON DELETE CASCADE;

ALTER TABLE public.internal_messages
  ALTER COLUMN from_user_id DROP NOT NULL,
  ALTER COLUMN to_user_id DROP NOT NULL;

ALTER TABLE public.internal_messages
  DROP CONSTRAINT IF EXISTS internal_messages_from_user_id_fkey;
ALTER TABLE public.internal_messages
  DROP CONSTRAINT IF EXISTS internal_messages_to_user_id_fkey;

ALTER TABLE public.internal_messages
  ADD CONSTRAINT internal_messages_from_user_id_fkey
    FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.internal_messages
  ADD CONSTRAINT internal_messages_to_user_id_fkey
    FOREIGN KEY (to_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_internal_messages_custom_from_user
  ON public.internal_messages(custom_from_user_id);
CREATE INDEX IF NOT EXISTS idx_internal_messages_custom_to_user
  ON public.internal_messages(custom_to_user_id);

-- 调整RLS策略：允许自定义用户访问自己的消息
DROP POLICY IF EXISTS "Users can view messages sent to them" ON public.internal_messages;
CREATE POLICY "Users can view messages sent to them"
  ON public.internal_messages FOR SELECT
  USING (
    auth.uid() = to_user_id
    OR EXISTS (
      SELECT 1 FROM public.custom_users cu
      WHERE cu.id = custom_to_user_id AND cu.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can view messages they sent" ON public.internal_messages;
CREATE POLICY "Users can view messages they sent"
  ON public.internal_messages FOR SELECT
  USING (
    auth.uid() = from_user_id
    OR EXISTS (
      SELECT 1 FROM public.custom_users cu
      WHERE cu.id = custom_from_user_id AND cu.is_active = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can send internal messages" ON public.internal_messages;
CREATE POLICY "Authenticated users can send internal messages"
  ON public.internal_messages FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id
    OR EXISTS (
      SELECT 1 FROM public.custom_users cu
      WHERE cu.id = custom_from_user_id AND cu.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update read status of received messages" ON public.internal_messages;
CREATE POLICY "Users can update read status of received messages"
  ON public.internal_messages FOR UPDATE
  USING (
    auth.uid() = to_user_id
    OR EXISTS (
      SELECT 1 FROM public.custom_users cu
      WHERE cu.id = custom_to_user_id AND cu.is_active = true
    )
  )
  WITH CHECK (
    auth.uid() = to_user_id
    OR EXISTS (
      SELECT 1 FROM public.custom_users cu
      WHERE cu.id = custom_to_user_id AND cu.is_active = true
    )
  );
