# 🚀 产业分类数据库设置指南

## 📋 仅设置产业分类相关表

### 第一步：访问Supabase控制台
1. 打开浏览器，访问：https://supabase.com/dashboard
2. 选择项目：**绿色技术平台** (qpeanozckghazlzzhrni)
3. 点击左侧菜单 **"SQL Editor"**
4. 点击 **"New query"**

### 第二步：创建产业分类表
**复制以下SQL到编辑器并执行**：

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

-- 为分类表添加更新时间触发器
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
```

### 第三步：插入初始分类数据
**新建查询，复制以下SQL并执行**：

```sql
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
  -- 节能环保技术子分类
  ('energy-saving', '工业节能技术', 'Industrial Energy Saving Technology', 'industrial-energy-saving', 1),
  ('energy-saving', '建筑节能技术', 'Building Energy Saving Technology', 'building-energy-saving', 2),
  ('energy-saving', '交通节能技术', 'Transportation Energy Saving Technology', 'transportation-energy-saving', 3),
  ('energy-saving', '水处理技术', 'Water Treatment Technology', 'water-treatment', 4),
  ('energy-saving', '废气处理技术', 'Exhaust Gas Treatment Technology', 'exhaust-gas-treatment', 5),
  ('energy-saving', '固废处理技术', 'Solid Waste Treatment Technology', 'solid-waste-treatment', 6),
  
  -- 清洁能源技术子分类
  ('clean-energy', '太阳能技术', 'Solar Energy Technology', 'solar-energy', 1),
  ('clean-energy', '风能技术', 'Wind Energy Technology', 'wind-energy', 2),
  ('clean-energy', '水能技术', 'Hydroelectric Technology', 'hydro-energy', 3),
  ('clean-energy', '地热能技术', 'Geothermal Energy Technology', 'geothermal-energy', 4),
  ('clean-energy', '生物质能技术', 'Biomass Energy Technology', 'biomass-energy', 5),
  ('clean-energy', '储能技术', 'Energy Storage Technology', 'energy-storage', 6),
  
  -- 清洁生产技术子分类
  ('clean-production', '清洁生产工艺', 'Clean Production Process', 'clean-production-process', 1),
  ('clean-production', '循环经济技术', 'Circular Economy Technology', 'circular-economy', 2),
  ('clean-production', '绿色材料技术', 'Green Materials Technology', 'green-materials', 3),
  ('clean-production', '资源综合利用', 'Comprehensive Resource Utilization', 'resource-utilization', 4),
  
  -- 新能源汽车技术子分类
  ('new-energy-vehicle', '纯电动汽车技术', 'Pure Electric Vehicle Technology', 'pure-electric-vehicle', 1),
  ('new-energy-vehicle', '混合动力汽车技术', 'Hybrid Vehicle Technology', 'hybrid-vehicle', 2),
  ('new-energy-vehicle', '燃料电池汽车技术', 'Fuel Cell Vehicle Technology', 'fuel-cell-vehicle', 3),
  ('new-energy-vehicle', '充电设施技术', 'Charging Infrastructure Technology', 'charging-infrastructure', 4)
) AS t(category_slug, name_zh, name_en, slug, sort_order) ON c.slug = t.category_slug;
```

## ✅ 验证设置成功

完成以上步骤后：

1. **返回产业分类管理页面**
2. **刷新页面** (F5)
3. **点击"重新连接数据库"按钮** (如果有黄色提示条)
4. **确认页面显示4个主分类和20个子分类**

## 🎯 预期结果

- ✅ 页面不再显示"数据库表尚未创建"错误
- ✅ 可以看到4个主要分类：
  - 节能环保技术 (6个子分类)
  - 清洁能源技术 (6个子分类)  
  - 清洁生产技术 (4个子分类)
  - 新能源汽车技术 (4个子分类)
- ✅ 可以正常进行新增、编辑、删除操作
- ✅ 数据操作会永久保存到数据库

## 🔍 创建的表结构

### admin_categories (产业分类表)
- `id` - 主键 (UUID)
- `name_zh` - 中文名称
- `name_en` - 英文名称  
- `slug` - 唯一标识符
- `sort_order` - 排序值
- `is_active` - 是否启用
- `created_at` - 创建时间
- `updated_at` - 更新时间

### admin_subcategories (产业子分类表)
- `id` - 主键 (UUID)
- `category_id` - 关联分类ID
- `name_zh` - 中文名称
- `name_en` - 英文名称
- `slug` - 标识符 (同分类下唯一)
- `sort_order` - 排序值
- `is_active` - 是否启用  
- `created_at` - 创建时间
- `updated_at` - 更新时间

现在您只需要执行这两个简化的SQL脚本，就能让产业分类管理功能完全正常工作！🚀