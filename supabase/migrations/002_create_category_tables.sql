-- 产业分类数据库表结构
-- 仅包含产业分类和子分类表
-- 创建时间: 2025-01-15

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 基础数据表：产业分类
CREATE TABLE admin_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_zh VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 基础数据表：产业子分类
CREATE TABLE admin_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES admin_categories(id) ON DELETE CASCADE,
  name_zh VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_admin_subcategories_category_id ON admin_subcategories(category_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_admin_categories_updated_at BEFORE UPDATE ON admin_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_subcategories_updated_at BEFORE UPDATE ON admin_subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略 (RLS)
ALTER TABLE admin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_subcategories ENABLE ROW LEVEL SECURITY;

-- 管理员权限策略
CREATE POLICY "Authenticated users can manage admin_categories" ON admin_categories FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_subcategories" ON admin_subcategories FOR ALL USING (auth.uid() IS NOT NULL);

-- 公共读取策略（用于前端展示）
CREATE POLICY "Anyone can read active categories" ON admin_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active subcategories" ON admin_subcategories FOR SELECT USING (is_active = true);