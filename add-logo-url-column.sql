-- 为 admin_countries 表添加 logo_url 列
-- 可以在 Supabase 控制台的 SQL Editor 中直接运行

-- 1. 添加 logo_url 列（如果不存在）
ALTER TABLE admin_countries 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

-- 2. 为现有的国家数据添加国旗URL
UPDATE admin_countries 
SET logo_url = CASE 
  WHEN code = 'china' THEN 'https://flagcdn.com/w320/cn.png'
  WHEN code = 'usa' THEN 'https://flagcdn.com/w320/us.png'
  WHEN code = 'japan' THEN 'https://flagcdn.com/w320/jp.png'
  WHEN code = 'germany' THEN 'https://flagcdn.com/w320/de.png'
  WHEN code = 'uk' THEN 'https://flagcdn.com/w320/gb.png'
  WHEN code = 'france' THEN 'https://flagcdn.com/w320/fr.png'
  ELSE NULL
END
WHERE logo_url IS NULL;

-- 3. 检查结果
SELECT id, name_zh, name_en, code, logo_url 
FROM admin_countries 
ORDER BY sort_order;

-- 4. 确保 RLS 策略正确
DROP POLICY IF EXISTS "Authenticated users can manage admin_countries" ON admin_countries;

CREATE POLICY "Authenticated users can manage admin_countries" 
ON admin_countries 
FOR ALL 
USING (auth.uid() IS NOT NULL);