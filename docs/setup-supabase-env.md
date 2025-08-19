# Supabase 环境配置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并登录
2. 点击 "New Project"
3. 填写项目信息：
   - 项目名称：绿色技术平台
   - 数据库密码：设置强密码
   - 区域：选择最近的区域
4. 等待项目创建完成

## 2. 获取配置信息

### 在 Supabase 控制台中：

1. **API 设置** (Settings > API)：
   - Project URL: `https://your-project-ref.supabase.co`
   - anon public key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - service_role secret key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

2. **数据库设置** (Settings > Database)：
   - Connection string: `postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres`

3. **JWT 设置** (Settings > API > JWT Settings)：
   - JWT Secret: `your-super-secret-jwt-token-with-at-least-32-characters-long`

## 3. 配置环境变量

### 前端配置 (.env.local)

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_USE_SUPABASE=true

# API 配置
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_USE_MOCK=false
```

### 后端配置 (环境变量或 application-supabase.yml)

```bash
# Supabase 配置
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# 数据库配置
SUPABASE_DB_URL=jdbc:postgresql://db.your-project-ref.supabase.co:5432/postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-database-password

# Spring 配置
SPRING_PROFILES_ACTIVE=supabase
```

## 4. 启用认证功能

在 Supabase 控制台中：

1. **Authentication > Settings**：
   - 启用 Email confirmations
   - 启用 Phone confirmations（如果需要手机验证）
   - 配置 Site URL: `http://localhost:3000`

2. **Authentication > Providers**：
   - 启用 Email provider
   - 启用 Phone provider（如果需要）

## 5. 数据库表设置

Supabase 会自动创建认证相关的表。如果需要额外的用户信息表，可以在 SQL Editor 中执行：

```sql
-- 创建用户扩展信息表
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看和更新自己的资料
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

## 6. 测试连接

### 前端测试

```bash
npm run dev
```

### 后端测试

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=supabase
```

## 7. 常见问题

1. **连接被拒绝**：检查 URL 和密钥是否正确
2. **认证失败**：检查 JWT Secret 是否匹配
3. **数据库连接失败**：检查数据库密码和 URL

## 8. 安全提醒

- 永远不要将真实的密钥提交到代码仓库
- 使用环境变量管理敏感信息
- 在生产环境中启用 RLS (Row Level Security)
- 定期更换数据库密码和 API 密钥