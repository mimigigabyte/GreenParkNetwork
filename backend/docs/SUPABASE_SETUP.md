# Supabase 数据库配置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase 控制台](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息：
   - Organization：选择或创建一个组织
   - Name：绿色技术平台
   - Database Password：设置一个安全的数据库密码
   - Region：选择离你最近的区域（如 Southeast Asia (Singapore)）
   - Pricing Plan：选择合适的套餐（可以从 Free 开始）

## 2. 获取数据库连接信息

项目创建完成后：

1. 在左侧菜单中选择 "Project Settings" > "Database"
2. 在 "Connection Info" 部分找到以下信息：
   - Host
   - Database Name
   - Port
   - User
   - Password
   - Database URL

## 3. 配置环境变量

创建 `.env` 文件（不要提交到 Git）：

```env
# Supabase 数据库配置
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=[YOUR-PASSWORD]

# Supabase 项目配置
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```

## 4. 初始化数据库

1. 在 Supabase 的 SQL 编辑器中运行以下 SQL 来创建必要的表：

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 公司档案表
CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    company_name VARCHAR(255) NOT NULL,
    business_license_no VARCHAR(100),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    province VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 国家表
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 省份表
CREATE TABLE IF NOT EXISTS provinces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    country_id UUID REFERENCES countries(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 经济区表
CREATE TABLE IF NOT EXISTS economic_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    province_id UUID REFERENCES provinces(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_profile_updated_at
    BEFORE UPDATE ON company_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_economic_zone_updated_at
    BEFORE UPDATE ON economic_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 5. 配置 RLS（行级安全）

为了确保数据安全，需要配置适当的 RLS 策略：

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_zones ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Company profiles are viewable by owner" ON company_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Company profiles are updatable by owner" ON company_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 公共数据可查看策略
CREATE POLICY "Countries are viewable by everyone" ON countries
    FOR SELECT
    USING (true);

CREATE POLICY "Provinces are viewable by everyone" ON provinces
    FOR SELECT
    USING (true);

CREATE POLICY "Economic zones are viewable by everyone" ON economic_zones
    FOR SELECT
    USING (true);
```

## 6. 测试连接

配置完成后，可以使用以下命令测试数据库连接：

```bash
# 使用 psql 命令行工具测试连接
psql "postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

## 注意事项

1. 确保将所有敏感信息（如数据库密码、API 密钥等）保存在环境变量中
2. 不要将包含敏感信息的配置文件提交到版本控制系统
3. 在生产环境中使用强密码和安全的连接字符串
4. 定期备份数据库
5. 监控数据库性能和连接池状态