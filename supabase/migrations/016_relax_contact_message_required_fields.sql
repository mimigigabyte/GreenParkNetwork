-- 允许联系消息的姓名、电话、邮箱字段为空
ALTER TABLE public.contact_messages
  ALTER COLUMN contact_name DROP NOT NULL;
ALTER TABLE public.contact_messages
  ALTER COLUMN contact_phone DROP NOT NULL;
ALTER TABLE public.contact_messages
  ALTER COLUMN contact_email DROP NOT NULL;
