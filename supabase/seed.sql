-- 管理员Dashboard初始数据种子文件
-- 用于填充基础数据以便测试和开发

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

-- 获取中国的ID用于后续插入
WITH china_id AS (SELECT id FROM admin_countries WHERE code = 'china')

-- 插入中国省份数据
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

-- 插入部分经开区数据（示例数据）
WITH provinces AS (
  SELECT id, code FROM admin_provinces
)
INSERT INTO admin_development_zones (province_id, name_zh, name_en, code, sort_order)
SELECT p.id, t.name_zh, t.name_en, t.code, t.sort_order
FROM provinces p
JOIN (VALUES
  -- 北京经开区
  ('beijing', '北京经济技术开发区', 'Beijing Economic and Technological Development Area', 'beijing-etda', 1),
  
  -- 天津经开区
  ('tianjin', '天津经济技术开发区', 'Tianjin Economic and Technological Development Area', 'tianjin-etda', 1),
  
  -- 上海经开区
  ('shanghai', '上海漕河泾新兴技术开发区', 'Shanghai Caohejing Hi-Tech Park', 'shanghai-caohejing', 1),
  ('shanghai', '上海张江高科技园区', 'Shanghai Zhangjiang Hi-Tech Park', 'shanghai-zhangjiang', 2),
  
  -- 江苏经开区
  ('jiangsu', '苏州工业园区', 'Suzhou Industrial Park', 'suzhou-sip', 1),
  ('jiangsu', '南京高新技术产业开发区', 'Nanjing Hi-Tech Industrial Development Zone', 'nanjing-hitech', 2),
  ('jiangsu', '昆山经济技术开发区', 'Kunshan Economic and Technological Development Zone', 'kunshan-etdz', 3),
  
  -- 浙江经开区
  ('zhejiang', '杭州经济技术开发区', 'Hangzhou Economic and Technological Development Zone', 'hangzhou-etdz', 1),
  ('zhejiang', '宁波经济技术开发区', 'Ningbo Economic and Technological Development Zone', 'ningbo-etdz', 2),
  
  -- 广东经开区
  ('guangdong', '深圳经济特区', 'Shenzhen Special Economic Zone', 'shenzhen-sez', 1),
  ('guangdong', '广州经济技术开发区', 'Guangzhou Economic and Technological Development Zone', 'guangzhou-etdz', 2),
  ('guangdong', '珠海经济技术开发区', 'Zhuhai Economic and Technological Development Zone', 'zhuhai-etdz', 3)
) AS t(province_code, name_zh, name_en, code, sort_order) ON p.code = t.province_code;

-- 插入示例轮播图数据
INSERT INTO admin_carousel_images (title_zh, title_en, description_zh, description_en, image_url, link_url, sort_order) VALUES
('绿色低碳技术创新', 'Green Low-Carbon Technology Innovation', '推动可持续发展，共建美好未来', 'Promoting sustainable development for a better future', 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1920&h=800&fit=crop', '#', 1),
('清洁能源解决方案', 'Clean Energy Solutions', '打造清洁、高效、可持续的能源体系', 'Building a clean, efficient and sustainable energy system', 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1920&h=800&fit=crop', '#', 2),
('智能制造与环保', 'Smart Manufacturing & Environmental Protection', '科技驱动绿色制造，实现产业升级', 'Technology-driven green manufacturing for industrial upgrading', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&h=800&fit=crop', '#', 3);