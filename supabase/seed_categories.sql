-- 产业分类初始数据种子文件
-- 仅包含产业分类和子分类数据

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