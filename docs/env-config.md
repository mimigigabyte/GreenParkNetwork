# 您的 Supabase 环境变量配置

## ✅ 已配置的变量

```bash
# Supabase 项目信息
Project URL: https://qpeanozckghazlzzhrni.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODU4NTAsImV4cCI6MjA2OTg2MTg1MH0.LaJALEd_KP6LLaKEjRo7zuwjCA6Bbt_2QpSWPmbyw1I
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8
JWT Secret: Ccnv371q3wHF7dBIMOiY5IzXzqm3mWw8yb1jyVTIx+MnopCKEELSRdoQs/oaO7KxkXrqBFvhuXR0v6nf/GsPKg==

# 数据库连接
Database URL: jdbc:postgresql://db.qpeanozckghazlzzhrni.supabase.co:5432/postgres
Database User: postgres
Database Password: Dr8sb1arf8jO2vUh
```

## 🔧 还需要的环境变量

为了完整启动项目，您还需要在 Supabase 控制台中获取以下信息：

### ✅ Service Role Key - 已配置
### ✅ JWT Secret - 已配置
### ✅ Database Password - 已配置

🎉 **所有环境变量配置完成！项目现在可以完整启动了！**

## 📝 如何配置

### 方法一：创建 .env.local 文件
```bash
# 在项目根目录创建 .env.local 文件，添加：
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret  
SUPABASE_DB_PASSWORD=your-database-password
```

### 方法二：在启动脚本中设置
更新 `start-supabase.bat` 或 `start-supabase.sh`，添加：
```bash
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
set SUPABASE_JWT_SECRET=your-jwt-secret
set SUPABASE_DB_PASSWORD=your-database-password
```

## 🚀 准备启动

一旦您获得了这些变量，就可以启动项目了：

**Windows:**
```cmd
start-supabase.bat
```

**Linux/Mac:**
```bash
./start-supabase.sh
```

## 📍 获取缺失变量的步骤

1. 登录您的 Supabase 控制台
2. 选择项目：qpeanozckghazlzzhrni
3. 进入 **Settings → API**
4. 复制 **service_role secret key** 和 **JWT Secret**
5. 如果忘记了数据库密码，可以在 **Settings → Database** 中重置

请提供这些缺失的环境变量，我会帮您完成最终配置！