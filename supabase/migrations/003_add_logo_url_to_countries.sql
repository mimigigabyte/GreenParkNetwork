-- 为 admin_countries 表添加 logo_url 列（如果不存在）
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'admin_countries' 
        AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE admin_countries ADD COLUMN logo_url VARCHAR(500);
    END IF;
END $$;

-- 确保 RLS 策略正确
ALTER TABLE admin_countries ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Authenticated users can manage admin_countries" ON admin_countries;

-- 重新创建策略
CREATE POLICY "Authenticated users can manage admin_countries" 
ON admin_countries 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- 添加一些测试数据（如果表是空的）
INSERT INTO admin_countries (name_zh, name_en, code, logo_url, sort_order, is_active)
VALUES 
    ('美国', 'United States', 'usa', 'https://flagcdn.com/w320/us.png', 1, true),
    ('日本', 'Japan', 'japan', 'https://flagcdn.com/w320/jp.png', 2, true),
    ('德国', 'Germany', 'germany', 'https://flagcdn.com/w320/de.png', 3, true),
    ('英国', 'United Kingdom', 'uk', 'https://flagcdn.com/w320/gb.png', 4, true),
    ('法国', 'France', 'france', 'https://flagcdn.com/w320/fr.png', 5, true)
ON CONFLICT (code) DO NOTHING;