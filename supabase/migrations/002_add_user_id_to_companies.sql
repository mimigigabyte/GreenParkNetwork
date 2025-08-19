-- 添加 user_id 字段到 admin_companies 表
-- 创建时间: 2025-01-15

-- 添加 user_id 列，引用 auth.users 表
ALTER TABLE admin_companies 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 创建索引以提高查询性能
CREATE INDEX idx_admin_companies_user_id ON admin_companies(user_id);

-- 添加额外的字段来支持用户注册时填写的企业信息
ALTER TABLE admin_companies 
ADD COLUMN requirement VARCHAR(100), -- 用户需求
ADD COLUMN address VARCHAR(500); -- 统一地址字段，替代原来的 address_zh

-- 更新 company_type 的约束以支持更多企业类型
ALTER TABLE admin_companies 
DROP CONSTRAINT IF EXISTS admin_companies_company_type_check;

ALTER TABLE admin_companies 
ADD CONSTRAINT admin_companies_company_type_check 
CHECK (company_type IN (
  'state_owned_enterprise',
  'state_owned_company', 
  'private_enterprise',
  'private_company',
  'foreign_enterprise',
  'joint_venture',
  'cooperative',
  'individual_business',
  'partnership',
  'other'
));

-- 更新用户企业信息策略，用户只能管理自己的企业信息
DROP POLICY IF EXISTS "Authenticated users can manage admin_companies" ON admin_companies;
DROP POLICY IF EXISTS "Anyone can read active companies" ON admin_companies;

-- 用户只能查看和编辑自己的企业信息
CREATE POLICY "Users can manage own companies" ON admin_companies 
FOR ALL USING (auth.uid() = user_id);

-- 管理员可以管理所有企业信息（这里暂时允许所有认证用户，实际应用中需要基于角色）
CREATE POLICY "Admins can manage all companies" ON admin_companies 
FOR ALL USING (auth.uid() IS NOT NULL);

-- 公开读取活跃的企业信息
CREATE POLICY "Anyone can read active companies" ON admin_companies 
FOR SELECT USING (is_active = true);