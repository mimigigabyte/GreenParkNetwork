-- 添加企业相关字段到 admin_technologies 表
-- 创建时间: 2025-01-15

-- 为 admin_technologies 表添加企业相关字段
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES admin_companies(id);
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS company_name_zh VARCHAR(200);
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS company_name_en VARCHAR(200);
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS company_logo_url VARCHAR(500);
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS company_country_id UUID REFERENCES admin_countries(id);
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS company_province_id UUID REFERENCES admin_provinces(id);
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS company_development_zone_id UUID REFERENCES admin_development_zones(id);

-- 添加附件相关字段
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS attachments JSON DEFAULT '[]'::json;

-- 添加创建者字段
ALTER TABLE admin_technologies ADD COLUMN IF NOT EXISTS created_by UUID;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_admin_technologies_company_id ON admin_technologies(company_id);
CREATE INDEX IF NOT EXISTS idx_admin_technologies_company_country_id ON admin_technologies(company_country_id);
CREATE INDEX IF NOT EXISTS idx_admin_technologies_company_province_id ON admin_technologies(company_province_id);
CREATE INDEX IF NOT EXISTS idx_admin_technologies_company_development_zone_id ON admin_technologies(company_development_zone_id);
CREATE INDEX IF NOT EXISTS idx_admin_technologies_created_by ON admin_technologies(created_by);