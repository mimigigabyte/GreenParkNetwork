# Resend 邮件服务迁移指南

## 概述

本项目已将邮件验证码发送功能从 Supabase Auth 迁移至 Resend 邮件服务，以提供更好的邮件发送体验和更多的自定义选项。

## 已完成的更改

### 1. 新增文件

- `src/lib/resend.ts` - Resend 邮件服务配置和模板
- `src/app/api/auth/send-email-code/route.ts` - 邮件验证码发送API
- `src/api/resendAuth.ts` - Resend 认证API封装

### 2. 修改文件

- `src/api/auth.ts` - 更新邮箱验证码发送逻辑，使用 Resend 替代 Supabase
- `src/api/supabaseAuth.ts` - 禁用 Supabase 邮件发送功能
- `.env.local` - 添加 Resend 配置

### 3. 环境变量

```bash
# Resend 邮件服务配置
RESEND_API_KEY=re_fPd6tQcm_8wpouJHDk3Gqo9nh9gHKLJCY
RESEND_FROM_EMAIL=noreply@greendev.org.cn
NEXT_PUBLIC_USE_RESEND_EMAIL=true
```

## 功能对比

### 原 Supabase 邮件功能
- ❌ 邮件模板固定，无法自定义
- ❌ 发送地址固定为 noreply@mail.app.supabase.co
- ❌ 邮件样式无法完全控制
- ✅ 与 Supabase Auth 深度集成

### 新 Resend 邮件功能
- ✅ 完全自定义邮件模板和样式
- ✅ 使用自定义域名发送邮件 (noreply@greendev.org.cn)
- ✅ 更好的送达率和邮件统计
- ✅ 支持多种邮件模板（注册、登录、重置密码）
- ✅ 更灵活的验证码管理

## 邮件模板

项目提供三种邮件模板：

1. **注册验证码** - 用户注册时的邮箱验证
2. **登录验证码** - 邮箱验证码登录
3. **重置密码验证码** - 忘记密码时的验证码

每个模板都包含：
- 美观的HTML格式邮件
- 纯文本备用版本
- 绿色技术平台品牌风格
- 6位数字验证码
- 5分钟有效期提醒

## 验证码管理

### 存储机制
- 使用内存存储验证码（适用于开发环境）
- 生产环境建议使用 Redis 或数据库存储

### 安全特性
- 验证码有效期：5分钟
- 发送冷却时间：60秒
- 错误尝试限制：最多3次
- 自动清理过期验证码

## API 接口

### 发送邮箱验证码
```typescript
POST /api/auth/send-email-code
{
  "email": "user@example.com",
  "purpose": "reset_password" | "register" | "login"
}
```

### 验证邮箱验证码
```typescript
PUT /api/auth/send-email-code
{
  "email": "user@example.com",
  "code": "123456",
  "purpose": "reset_password" | "register" | "login"
}
```

## 迁移影响

### ✅ 不受影响的功能
- 手机验证码发送（仍使用 Supabase）
- 密码登录
- 用户注册和登录流程
- 用户会话管理

### 🔄 已升级的功能
- 邮箱验证码发送（使用 Resend）
- 邮箱验证码验证（使用本地API）
- 忘记密码邮箱验证（使用 Resend）

## 禁用 Supabase 邮件发送

为了完全阻止 Supabase 发送邮件，需要在 Supabase 项目设置中进行以下配置：

### 1. 登录 Supabase Dashboard
访问：https://app.supabase.com/project/qpeanozckghazlzzhrni

### 2. 禁用邮件模板
1. 进入 `Authentication` > `Email Templates`
2. 禁用以下模板：
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

### 3. 修改认证设置
1. 进入 `Authentication` > `Settings`
2. 关闭 `Enable email confirmations`
3. 关闭 `Enable email change confirmations`

## 测试

### 测试发送重置密码邮件
```bash
curl -X POST http://localhost:3000/api/auth/send-email-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","purpose":"reset_password"}'
```

### 测试验证验证码
```bash
curl -X PUT http://localhost:3000/api/auth/send-email-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456","purpose":"reset_password"}'
```

## 监控和日志

- 邮件发送结果会在服务器控制台输出
- 验证码存储和验证过程有详细日志
- 可通过 Resend Dashboard 查看邮件发送统计

## 生产环境建议

1. **使用 Redis 存储验证码**
   ```bash
   npm install ioredis
   ```

2. **配置邮件发送限制**
   - 每小时最多发送次数
   - 每天每邮箱最大发送量

3. **监控邮件发送**
   - 设置 Resend webhook 监控送达状态
   - 记录发送失败日志

4. **安全加固**
   - 验证邮箱格式和域名白名单
   - 添加图形验证码防止滥用
   - IP 频率限制

## 故障排除

### 常见问题

1. **邮件发送失败**
   - 检查 RESEND_API_KEY 是否正确
   - 确认 RESEND_FROM_EMAIL 域名已验证

2. **验证码验证失败**
   - 检查验证码是否过期（5分钟）
   - 确认邮箱地址大小写匹配

3. **邮件未收到**
   - 检查垃圾邮件文件夹
   - 确认邮箱地址正确
   - 查看 Resend Dashboard 发送状态

## 回滚方案

如果需要回滚到 Supabase 邮件：

1. 修改 `.env.local`：
   ```bash
   NEXT_PUBLIC_USE_RESEND_EMAIL=false
   ```

2. 恢复 `src/api/auth.ts` 中的 Supabase 邮件逻辑

3. 重新启用 Supabase 邮件模板