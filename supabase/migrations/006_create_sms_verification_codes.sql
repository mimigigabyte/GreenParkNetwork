-- 创建短信验证码存储表
CREATE TABLE IF NOT EXISTS public.sms_verification_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    country_code VARCHAR(10) NOT NULL DEFAULT '+86',
    code VARCHAR(10) NOT NULL,
    purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('register', 'login', 'reset_password')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_sms_codes_phone_purpose ON public.sms_verification_codes(phone, purpose);
CREATE INDEX IF NOT EXISTS idx_sms_codes_expires_at ON public.sms_verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_sms_codes_used ON public.sms_verification_codes(used);
CREATE INDEX IF NOT EXISTS idx_sms_codes_created_at ON public.sms_verification_codes(created_at);

-- 创建复合索引以优化常用查询
CREATE INDEX IF NOT EXISTS idx_sms_codes_lookup ON public.sms_verification_codes(phone, country_code, purpose, used, expires_at);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sms_verification_codes_updated_at 
    BEFORE UPDATE ON public.sms_verification_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE public.sms_verification_codes IS '短信验证码存储表，用于手机验证码登录、注册和密码重置';
COMMENT ON COLUMN public.sms_verification_codes.phone IS '手机号码';
COMMENT ON COLUMN public.sms_verification_codes.country_code IS '国家代码，如+86';
COMMENT ON COLUMN public.sms_verification_codes.code IS '验证码';
COMMENT ON COLUMN public.sms_verification_codes.purpose IS '验证码用途：register注册、login登录、reset_password重置密码';
COMMENT ON COLUMN public.sms_verification_codes.expires_at IS '过期时间';
COMMENT ON COLUMN public.sms_verification_codes.attempts IS '验证尝试次数';
COMMENT ON COLUMN public.sms_verification_codes.used IS '是否已使用';

-- RLS策略（行级安全）
ALTER TABLE public.sms_verification_codes ENABLE ROW LEVEL SECURITY;

-- 允许服务角色访问所有记录
CREATE POLICY "Service role can access all records" ON public.sms_verification_codes
    FOR ALL USING (auth.role() = 'service_role');

-- 定期清理过期验证码的函数（可选，通过定时任务调用）
CREATE OR REPLACE FUNCTION clean_expired_sms_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 删除过期超过1小时的验证码记录
    DELETE FROM public.sms_verification_codes 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;