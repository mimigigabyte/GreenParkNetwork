-- 为 admin_companies 表添加统一社会信用代码字段
-- 用于企查查集成功能

-- 检查字段是否存在，如果不存在则添加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_companies' 
        AND column_name = 'credit_code'
    ) THEN
        ALTER TABLE admin_companies ADD COLUMN credit_code VARCHAR(50);
        
        -- 添加注释
        COMMENT ON COLUMN admin_companies.credit_code IS '统一社会信用代码，从企查查API自动获取';
        
        -- 创建索引提高查询性能
        CREATE INDEX IF NOT EXISTS idx_admin_companies_credit_code 
        ON admin_companies(credit_code);
        
        RAISE NOTICE 'Successfully added credit_code column to admin_companies table';
    ELSE
        RAISE NOTICE 'credit_code column already exists in admin_companies table';
    END IF;
END $$;