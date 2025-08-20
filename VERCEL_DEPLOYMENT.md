# Vercel 部署指南

## 环境变量配置

在Vercel控制台中设置以下环境变量：

### 必需的环境变量

```bash
NEXT_PUBLIC_SUPABASE_URL=https://qpeanozckghazlzzhrni.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODU4NTAsImV4cCI6MjA2OTg2MTg1MH0.LaJALEd_KP6LLaKEjRo7zuwjCA6Bbt_2QpSWPmbyw1I
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8
SUPABASE_JWT_SECRET=Ccnv371q3wHF7dBIMOiY5IzXzqm3mWw8yb1jyVTIx+MnopCKEELSRdoQs/oaO7KxkXrqBFvhuXR0v6nf/GsPKg==
SUPABASE_DB_PASSWORD=Dr8sb1arf8jO2vUh
```

### 邮件服务配置

```bash
RESEND_API_KEY=re_fPd6tQcm_8wpouJHDk3Gqo9nh9gHKLJCY
RESEND_FROM_EMAIL=noreply@greendev.org.cn
NEXT_PUBLIC_USE_RESEND_EMAIL=true
```

### 第三方API配置

```bash
QICHACHA_API_KEY=496a5a7e8dee489ba87d29b44bc0b103
QICHACHA_SECRET_KEY=875C77BDF7DD41D1ED30647417275AA6
```

## 部署步骤

1. **连接GitHub仓库**
   - 在Vercel控制台导入GitHub仓库
   - 选择 `mimigigabyte/GreenTechPlatform`

2. **配置环境变量**
   - 在项目设置中添加上述所有环境变量
   - 确保变量名完全匹配（区分大小写）

3. **构建设置**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **域名配置**
   - 添加自定义域名（如果需要）
   - 配置SSL证书

## 故障排除

### 登录fetch错误

如果用户在Vercel环境下遇到 `Failed to execute 'fetch' on 'Window': Invalid value` 错误：

1. **检查环境变量**
   ```bash
   # 在Vercel控制台检查这些变量是否正确设置
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **查看构建日志**
   - 检查是否有环境变量相关的警告
   - 确认Supabase客户端初始化成功

3. **备用方案**
   - 系统已配置Vercel环境的备用登录方案
   - 当Supabase直接调用失败时会自动启用

### 常见问题

1. **环境变量未生效**
   - 重新部署项目
   - 检查变量名是否包含 `NEXT_PUBLIC_` 前缀

2. **CORS错误**
   - 确保Supabase项目配置了正确的域名
   - 检查vercel.json中的headers配置

3. **构建失败**
   - 检查package.json中的依赖版本
   - 确保所有必需的环境变量都已设置

## 监控和调试

### 日志查看
- 在Vercel控制台的Functions标签查看运行时日志
- 在浏览器控制台查看客户端错误

### 性能监控
- 使用Vercel Analytics监控性能
- 检查API响应时间

## 更新部署

每次Git推送到main分支会自动触发重新部署。

## 联系支持

如果遇到问题，请：
1. 检查Vercel控制台的构建和运行时日志
2. 在浏览器开发者工具中查看详细错误信息
3. 提供错误截图和控制台输出