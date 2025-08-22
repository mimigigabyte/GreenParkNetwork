-- 创建自定义用户表用于手机验证码认证
CREATE TABLE IF NOT EXISTS public.custom_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    country_code VARCHAR(10) NOT NULL DEFAULT '+86',
    password_hash TEXT NOT NULL,
    name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 额外的用户信息
    email VARCHAR(255), -- 可选的邮箱信息
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    
    -- 安全相关
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- 元数据
    user_metadata JSONB DEFAULT '{}',
    
    CONSTRAINT custom_users_phone_format CHECK (phone ~ '^[1-9]\d{7,14}$'),
    CONSTRAINT custom_users_country_code_format CHECK (country_code ~ '^\+\d{1,4}$')
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_custom_users_phone ON public.custom_users(phone);
CREATE INDEX IF NOT EXISTS idx_custom_users_country_code_phone ON public.custom_users(country_code, phone);
CREATE INDEX IF NOT EXISTS idx_custom_users_created_at ON public.custom_users(created_at);
CREATE INDEX IF NOT EXISTS idx_custom_users_last_login ON public.custom_users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_custom_users_is_active ON public.custom_users(is_active);

-- 创建复合索引以优化常用查询
CREATE INDEX IF NOT EXISTS idx_custom_users_auth_lookup ON public.custom_users(phone, country_code, is_active);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_custom_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_users_updated_at 
    BEFORE UPDATE ON public.custom_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_custom_users_updated_at();

-- 添加表注释
COMMENT ON TABLE public.custom_users IS '自定义用户表，用于手机验证码认证系统';
COMMENT ON COLUMN public.custom_users.phone IS '手机号码（不含国家代码）';
COMMENT ON COLUMN public.custom_users.country_code IS '国家代码，如+86';
COMMENT ON COLUMN public.custom_users.password_hash IS 'bcrypt加密后的密码哈希';
COMMENT ON COLUMN public.custom_users.login_attempts IS '登录失败尝试次数';
COMMENT ON COLUMN public.custom_users.locked_until IS '账户锁定截止时间';
COMMENT ON COLUMN public.custom_users.user_metadata IS '用户元数据JSON';

-- RLS策略（行级安全）
ALTER TABLE public.custom_users ENABLE ROW LEVEL SECURITY;

-- 允许服务角色访问所有记录
CREATE POLICY "Service role can access all custom users" ON public.custom_users
    FOR ALL USING (auth.role() = 'service_role');

-- 允许认证用户查看自己的记录
CREATE POLICY "Users can view own record" ON public.custom_users
    FOR SELECT USING (auth.uid()::text = id::text);

-- 允许认证用户更新自己的记录（除敏感字段外）
CREATE POLICY "Users can update own record" ON public.custom_users
    FOR UPDATE USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- 管理员可以查看所有用户
CREATE POLICY "Admins can view all custom users" ON public.custom_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.custom_users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 创建用户统计视图
CREATE OR REPLACE VIEW public.custom_users_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active THEN 1 END) as active_users,
    COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_users,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
    COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '7 days' THEN 1 END) as active_users_7d
FROM public.custom_users;

-- 添加视图注释
COMMENT ON VIEW public.custom_users_stats IS '自定义用户统计信息视图';