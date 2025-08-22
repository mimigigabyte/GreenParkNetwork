-- 修改admin_companies表以支持自定义认证用户
-- 移除对auth.users的外键约束，添加对custom_users的关联

-- 1. 删除现有的外键约束
ALTER TABLE admin_companies 
DROP CONSTRAINT IF EXISTS admin_companies_user_id_fkey;

-- 2. 修改user_id字段为可空，因为现在可能关联不同的用户表
ALTER TABLE admin_companies 
ALTER COLUMN user_id DROP NOT NULL;

-- 3. 添加新字段来标识用户类型和关联
ALTER TABLE admin_companies 
ADD COLUMN IF NOT EXISTS auth_type VARCHAR(20) DEFAULT 'supabase' CHECK (auth_type IN ('supabase', 'custom')),
ADD COLUMN IF NOT EXISTS custom_user_id UUID REFERENCES custom_users(id) ON DELETE CASCADE;

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_admin_companies_custom_user_id 
ON admin_companies(custom_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_companies_auth_type 
ON admin_companies(auth_type);

-- 5. 添加约束确保user_id和custom_user_id至少有一个不为空
ALTER TABLE admin_companies 
ADD CONSTRAINT check_user_reference 
CHECK (
  (auth_type = 'supabase' AND user_id IS NOT NULL AND custom_user_id IS NULL) OR
  (auth_type = 'custom' AND custom_user_id IS NOT NULL AND user_id IS NULL)
);

-- 6. 添加表注释
COMMENT ON COLUMN admin_companies.auth_type IS '认证类型：supabase或custom';
COMMENT ON COLUMN admin_companies.custom_user_id IS '自定义认证用户ID，当auth_type=custom时使用';
COMMENT ON CONSTRAINT check_user_reference ON admin_companies IS '确保根据认证类型正确关联用户';