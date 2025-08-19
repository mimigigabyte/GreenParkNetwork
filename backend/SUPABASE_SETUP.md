# Supabase 数据库配置指南

## 1. 创建 Supabase 项目

1. 访问 https://supabase.com
2. 注册/登录账户
3. 点击 "New Project"
4. 填写项目信息：
   - 项目名称：绿色技术平台
   - 数据库密码：设置一个强密码
   - 选择区域：建议选择离你最近的区域
5. 点击 "Create new project"

## 2. 获取数据库连接信息

### 方法一：从 Supabase 控制台获取

1. 进入项目控制台
2. 点击左侧菜单 "Settings" > "Database"
3. 在 "Connection string" 部分找到连接信息

### 方法二：从连接字符串解析

连接字符串格式：
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

需要提取的信息：
- Host: `db.[YOUR-PROJECT-REF].supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: `[YOUR-PASSWORD]`

## 3. 配置环境变量

### 方法一：使用系统环境变量

在 Windows PowerShell 中设置：

```powershell
$env:SUPABASE_DB_URL = "jdbc:postgresql://db.your-project-ref.supabase.co:5432/postgres"
$env:SUPABASE_DB_USER = "postgres"
$env:SUPABASE_DB_PASSWORD = "your-database-password"
$env:SUPABASE_URL = "https://your-project-ref.supabase.co"
$env:SUPABASE_ANON_KEY = "your-anon-key"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
```

### 方法二：修改 application-dev.yml

直接编辑 `backend/application-dev.yml` 文件，替换以下占位符：

```yaml
datasource:
  url: jdbc:postgresql://db.your-project-ref.supabase.co:5432/postgres
  username: postgres
  password: your-database-password

supabase:
  url: https://your-project-ref.supabase.co
  anon-key: your-anon-key
  service-role-key: your-service-role-key
```

## 4. 获取 API 密钥

1. 在 Supabase 控制台中，点击 "Settings" > "API"
2. 复制以下信息：
   - Project URL
   - anon public key
   - service_role secret key

## 5. 测试连接

配置完成后，运行以下命令测试连接：

```bash
mvn spring-boot:run
```

如果看到类似以下日志，说明连接成功：
```
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
```

## 6. 数据库表结构

项目启动后，Hibernate 会自动创建以下表：

- `users` - 用户表
- `verification_codes` - 验证码表
- `company_profiles` - 公司资料表
- `countries` - 国家表
- `provinces` - 省份表
- `economic_zones` - 经济区表

## 7. 故障排除

### 连接被拒绝
- 检查数据库 URL 是否正确
- 确认密码是否正确
- 检查防火墙设置

### SSL 连接问题
- 在数据库 URL 中添加 `?sslmode=require`

### 权限问题
- 确保使用正确的用户和密码
- 检查数据库用户权限

## 8. 安全注意事项

1. **不要将真实密码提交到代码仓库**
2. **使用环境变量或配置文件管理敏感信息**
3. **定期更换数据库密码**
4. **启用 Supabase 的 Row Level Security (RLS)**

## 9. 下一步

配置完成后，你可以：
1. 启动应用程序：`mvn spring-boot:run`
2. 访问 API 文档：http://localhost:8080/api/swagger-ui.html
3. 测试 API 接口
4. 配置其他服务（Redis、邮件服务等） 