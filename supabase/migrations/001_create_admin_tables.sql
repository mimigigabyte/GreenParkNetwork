-- 管理员Dashboard数据库表结构
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

-- 基础数据表：国别
CREATE TABLE admin_countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_zh VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  logo_url VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 基础数据表：省份
CREATE TABLE admin_provinces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id UUID REFERENCES admin_countries(id) ON DELETE CASCADE,
  name_zh VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(country_id, code)
);

-- 基础数据表：国家级经开区
CREATE TABLE admin_development_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  province_id UUID REFERENCES admin_provinces(id) ON DELETE CASCADE,
  name_zh VARCHAR(200) NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(province_id, code)
);

-- 轮播图表
CREATE TABLE admin_carousel_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_zh VARCHAR(200),
  title_en VARCHAR(200),
  description_zh TEXT,
  description_en TEXT,
  image_url VARCHAR(500) NOT NULL,
  link_url VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 企业信息表
CREATE TABLE admin_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_zh VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  logo_url VARCHAR(500),
  address_zh TEXT,
  address_en TEXT,
  company_type VARCHAR(50) CHECK (company_type IN ('state_owned', 'private', 'foreign_trade')),
  country_id UUID REFERENCES admin_countries(id),
  province_id UUID REFERENCES admin_provinces(id),
  development_zone_id UUID REFERENCES admin_development_zones(id),
  industry_code VARCHAR(20),
  annual_output_value DECIMAL(15,2), -- 亿元
  contact_person VARCHAR(100),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 技术信息表
CREATE TABLE admin_technologies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_zh VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description_zh TEXT,
  description_en TEXT,
  image_url VARCHAR(500),
  tech_source VARCHAR(50) CHECK (tech_source IN ('self_developed', 'cooperative', 'transfer', 'import_digest', 'other')),
  brief_zh TEXT,
  brief_en TEXT,
  category_id UUID REFERENCES admin_categories(id),
  subcategory_id UUID REFERENCES admin_subcategories(id),
  attachment_urls JSON DEFAULT '[]'::json, -- 存储多个附件URL
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_admin_subcategories_category_id ON admin_subcategories(category_id);
CREATE INDEX idx_admin_provinces_country_id ON admin_provinces(country_id);
CREATE INDEX idx_admin_development_zones_province_id ON admin_development_zones(province_id);
CREATE INDEX idx_admin_companies_country_id ON admin_companies(country_id);
CREATE INDEX idx_admin_companies_province_id ON admin_companies(province_id);
CREATE INDEX idx_admin_companies_development_zone_id ON admin_companies(development_zone_id);
CREATE INDEX idx_admin_technologies_category_id ON admin_technologies(category_id);
CREATE INDEX idx_admin_technologies_subcategory_id ON admin_technologies(subcategory_id);

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
CREATE TRIGGER update_admin_countries_updated_at BEFORE UPDATE ON admin_countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_provinces_updated_at BEFORE UPDATE ON admin_provinces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_development_zones_updated_at BEFORE UPDATE ON admin_development_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_carousel_images_updated_at BEFORE UPDATE ON admin_carousel_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_companies_updated_at BEFORE UPDATE ON admin_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_technologies_updated_at BEFORE UPDATE ON admin_technologies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略 (RLS)
ALTER TABLE admin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_development_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_carousel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_technologies ENABLE ROW LEVEL SECURITY;

-- 管理员权限策略 (暂时允许所有认证用户操作，后续需要根据实际权限系统调整)
CREATE POLICY "Authenticated users can manage admin_categories" ON admin_categories FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_subcategories" ON admin_subcategories FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_countries" ON admin_countries FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_provinces" ON admin_provinces FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_development_zones" ON admin_development_zones FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_carousel_images" ON admin_carousel_images FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_companies" ON admin_companies FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_technologies" ON admin_technologies FOR ALL USING (auth.uid() IS NOT NULL);

-- 公共读取策略（用于前端展示）
CREATE POLICY "Anyone can read active categories" ON admin_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active subcategories" ON admin_subcategories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active countries" ON admin_countries FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active provinces" ON admin_provinces FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active development_zones" ON admin_development_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active carousel_images" ON admin_carousel_images FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active companies" ON admin_companies FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active technologies" ON admin_technologies FOR SELECT USING (is_active = true);