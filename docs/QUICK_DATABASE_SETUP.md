# 🚀 快速数据库设置指南

## 📋 简化操作步骤

### 第一步：访问Supabase控制台
1. 打开浏览器，访问：https://supabase.com/dashboard
2. 选择项目：**绿色技术平台** (qpeanozckghazlzzhrni)
3. 点击左侧菜单 **"SQL Editor"**
4. 点击 **"New query"**

### 第二步：执行建表脚本
1. **复制以下完整SQL内容** 到编辑器：

```sql
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
  annual_output_value DECIMAL(15,2),
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
  attachment_urls JSON DEFAULT '[]'::json,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
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

-- 管理员权限策略
CREATE POLICY "Authenticated users can manage admin_categories" ON admin_categories FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_subcategories" ON admin_subcategories FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_countries" ON admin_countries FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_provinces" ON admin_provinces FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_development_zones" ON admin_development_zones FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_carousel_images" ON admin_carousel_images FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_companies" ON admin_companies FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage admin_technologies" ON admin_technologies FOR ALL USING (auth.uid() IS NOT NULL);

-- 公共读取策略
CREATE POLICY "Anyone can read active categories" ON admin_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active subcategories" ON admin_subcategories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active countries" ON admin_countries FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active provinces" ON admin_provinces FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active development_zones" ON admin_development_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active carousel_images" ON admin_carousel_images FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active companies" ON admin_companies FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read active technologies" ON admin_technologies FOR SELECT USING (is_active = true);
```

2. **点击 "Run" 按钮执行**

### 第三步：插入初始数据
1. **新建查询** (点击 "New query")
2. **复制以下初始数据SQL**：

```sql
-- 插入国别数据
INSERT INTO admin_countries (name_zh, name_en, code, logo_url, sort_order) VALUES
('中国', 'China', 'china', 'https://flagcdn.com/w160/cn.png', 1),
('美国', 'United States', 'usa', 'https://flagcdn.com/w160/us.png', 2),
('日本', 'Japan', 'japan', 'https://flagcdn.com/w160/jp.png', 3),
('德国', 'Germany', 'germany', 'https://flagcdn.com/w160/de.png', 4),
('英国', 'United Kingdom', 'uk', 'https://flagcdn.com/w160/gb.png', 5),
('法国', 'France', 'france', 'https://flagcdn.com/w160/fr.png', 6),
('韩国', 'South Korea', 'korea', 'https://flagcdn.com/w160/kr.png', 7),
('其他', 'Others', 'others', null, 999);

-- 获取中国的ID并插入省份数据
WITH china_id AS (SELECT id FROM admin_countries WHERE code = 'china')
INSERT INTO admin_provinces (country_id, name_zh, name_en, code, sort_order)
SELECT china_id.id, name_zh, name_en, code, sort_order FROM china_id, (VALUES
  ('北京市', 'Beijing', 'beijing', 1),
  ('天津市', 'Tianjin', 'tianjin', 2),
  ('河北省', 'Hebei', 'hebei', 3),
  ('山西省', 'Shanxi', 'shanxi', 4),
  ('内蒙古自治区', 'Inner Mongolia', 'neimenggu', 5),
  ('辽宁省', 'Liaoning', 'liaoning', 6),
  ('吉林省', 'Jilin', 'jilin', 7),
  ('黑龙江省', 'Heilongjiang', 'heilongjiang', 8),
  ('上海市', 'Shanghai', 'shanghai', 9),
  ('江苏省', 'Jiangsu', 'jiangsu', 10),
  ('浙江省', 'Zhejiang', 'zhejiang', 11),
  ('安徽省', 'Anhui', 'anhui', 12),
  ('福建省', 'Fujian', 'fujian', 13),
  ('江西省', 'Jiangxi', 'jiangxi', 14),
  ('山东省', 'Shandong', 'shandong', 15),
  ('河南省', 'Henan', 'henan', 16),
  ('湖北省', 'Hubei', 'hubei', 17),
  ('湖南省', 'Hunan', 'hunan', 18),
  ('广东省', 'Guangdong', 'guangdong', 19),
  ('广西壮族自治区', 'Guangxi', 'guangxi', 20),
  ('海南省', 'Hainan', 'hainan', 21),
  ('重庆市', 'Chongqing', 'chongqing', 22),
  ('四川省', 'Sichuan', 'sichuan', 23),
  ('贵州省', 'Guizhou', 'guizhou', 24),
  ('云南省', 'Yunnan', 'yunnan', 25),
  ('西藏自治区', 'Tibet', 'xizang', 26),
  ('陕西省', 'Shaanxi', 'shaanxi', 27),
  ('甘肃省', 'Gansu', 'gansu', 28),
  ('青海省', 'Qinghai', 'qinghai', 29),
  ('宁夏回族自治区', 'Ningxia', 'ningxia', 30),
  ('新疆维吾尔自治区', 'Xinjiang', 'xinjiang', 31),
  ('台湾省', 'Taiwan', 'taiwan', 32),
  ('香港特别行政区', 'Hong Kong', 'xianggang', 33),
  ('澳门特别行政区', 'Macau', 'aomen', 34)
) AS t(name_zh, name_en, code, sort_order);

-- 插入产业分类数据
INSERT INTO admin_categories (name_zh, name_en, slug, sort_order) VALUES
('节能环保技术', 'Energy Saving and Environmental Protection Technology', 'energy-saving', 1),
('清洁能源技术', 'Clean Energy Technology', 'clean-energy', 2),
('清洁生产技术', 'Clean Production Technology', 'clean-production', 3),
('新能源汽车技术', 'New Energy Vehicle Technology', 'new-energy-vehicle', 4);

-- 插入子分类数据
WITH categories AS (
  SELECT id, slug FROM admin_categories
)
INSERT INTO admin_subcategories (category_id, name_zh, name_en, slug, sort_order)
SELECT c.id, t.name_zh, t.name_en, t.slug, t.sort_order
FROM categories c
JOIN (VALUES
  ('energy-saving', '工业节能技术', 'Industrial Energy Saving Technology', 'industrial-energy-saving', 1),
  ('energy-saving', '建筑节能技术', 'Building Energy Saving Technology', 'building-energy-saving', 2),
  ('energy-saving', '交通节能技术', 'Transportation Energy Saving Technology', 'transportation-energy-saving', 3),
  ('energy-saving', '水处理技术', 'Water Treatment Technology', 'water-treatment', 4),
  ('energy-saving', '废气处理技术', 'Exhaust Gas Treatment Technology', 'exhaust-gas-treatment', 5),
  ('energy-saving', '固废处理技术', 'Solid Waste Treatment Technology', 'solid-waste-treatment', 6),
  ('clean-energy', '太阳能技术', 'Solar Energy Technology', 'solar-energy', 1),
  ('clean-energy', '风能技术', 'Wind Energy Technology', 'wind-energy', 2),
  ('clean-energy', '水能技术', 'Hydroelectric Technology', 'hydro-energy', 3),
  ('clean-energy', '地热能技术', 'Geothermal Energy Technology', 'geothermal-energy', 4),
  ('clean-energy', '生物质能技术', 'Biomass Energy Technology', 'biomass-energy', 5),
  ('clean-energy', '储能技术', 'Energy Storage Technology', 'energy-storage', 6),
  ('clean-production', '清洁生产工艺', 'Clean Production Process', 'clean-production-process', 1),
  ('clean-production', '循环经济技术', 'Circular Economy Technology', 'circular-economy', 2),
  ('clean-production', '绿色材料技术', 'Green Materials Technology', 'green-materials', 3),
  ('clean-production', '资源综合利用', 'Comprehensive Resource Utilization', 'resource-utilization', 4),
  ('new-energy-vehicle', '纯电动汽车技术', 'Pure Electric Vehicle Technology', 'pure-electric-vehicle', 1),
  ('new-energy-vehicle', '混合动力汽车技术', 'Hybrid Vehicle Technology', 'hybrid-vehicle', 2),
  ('new-energy-vehicle', '燃料电池汽车技术', 'Fuel Cell Vehicle Technology', 'fuel-cell-vehicle', 3),
  ('new-energy-vehicle', '充电设施技术', 'Charging Infrastructure Technology', 'charging-infrastructure', 4)
) AS t(category_slug, name_zh, name_en, slug, sort_order) ON c.slug = t.category_slug;

-- 插入示例轮播图数据
INSERT INTO admin_carousel_images (title_zh, title_en, description_zh, description_en, image_url, link_url, sort_order) VALUES
('绿色低碳技术创新', 'Green Low-Carbon Technology Innovation', '推动可持续发展，共建美好未来', 'Promoting sustainable development for a better future', 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1920&h=800&fit=crop', '#', 1),
('清洁能源解决方案', 'Clean Energy Solutions', '打造清洁、高效、可持续的能源体系', 'Building a clean, efficient and sustainable energy system', 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1920&h=800&fit=crop', '#', 2),
('智能制造与环保', 'Smart Manufacturing & Environmental Protection', '科技驱动绿色制造，实现产业升级', 'Technology-driven green manufacturing for industrial upgrading', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&h=800&fit=crop', '#', 3);
```

3. **点击 "Run" 按钮执行**

## ✅ 验证设置成功

完成以上步骤后：

1. **返回产业分类管理页面**
2. **刷新页面** (F5)
3. **点击"重新连接数据库"按钮** (如果有黄色提示条)
4. **确认页面显示真实数据** 而非"模拟数据"提示

## 🎯 预期结果

- ✅ 页面不再显示"数据库表尚未创建"错误
- ✅ 可以看到4个主要分类及其子分类
- ✅ 可以正常进行新增、编辑、删除操作
- ✅ 数据操作会永久保存到数据库

## 🆘 如果遇到问题

**SQL执行错误**：
- 确保具有数据库管理员权限
- 检查SQL语法是否完整复制
- 查看具体错误信息

**页面仍显示错误**：
- 清除浏览器缓存并刷新
- 检查网络连接
- 重启开发服务器 (`npm run dev`)

完成设置后，您将拥有一个完全功能的管理员控制台！🚀