# Resend 邮箱验证码注册系统

## 🎯 功能概述

已成功实现基于 Resend 的邮箱验证码注册系统，完全独立于 Supabase Auth 的 OTP 功能。

### 注册流程：
1. 用户输入邮箱地址
2. 系统发送包含 6 位 OTP 验证码的邮件
3. 用户输入验证码和设置密码
4. 验证成功后创建 Supabase 用户账户
5. 自动跳转到企业信息完善页面

## 📁 新增文件

### API 路由
- `src/app/api/email-verification/send-code/route.ts` - 发送验证码
- `src/app/api/email-verification/verify-code/route.ts` - 验证验证码  
- `src/app/api/email-verification/register/route.ts` - 完成注册

### 前端 API
- `src/api/emailVerification.ts` - 前端 API 调用封装

### 配置文件
- `.env.local.example` - 环境变量配置示例

## ⚙️ 配置要求

### 1. 环境变量配置

创建 `.env.local` 文件：

```env
# Supabase 配置（用户数据存储）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_USE_SUPABASE=true

# Resend 邮件服务配置
RESEND_API_KEY=re_YourApiKey
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 2. Resend 服务配置

#### 获取 API Key：
1. 访问 [Resend.com](https://resend.com) 注册账户
2. 在控制台创建 API Key
3. 配置发送域名（或使用测试域名 `onboarding@resend.dev`）

#### 开发测试模式：
- 如果未配置 `RESEND_API_KEY`，系统将在开发模式下运行
- 验证码会在控制台日志中显示
- 前端会弹窗显示验证码（仅开发模式）

## 🔧 技术实现

### 验证码生成与存储
- **生成规则**：6位随机数字
- **有效期**：5分钟
- **存储方式**：内存存储（使用全局变量共享）
- **安全限制**：
  - 60秒发送频率限制
  - 最多5次验证尝试
  - 自动清理过期验证码

### 邮件模板特点
- **主题**：请验证您的注册
- **内容**：专业的 HTML 邮件模板
- **验证码展示**：大字号、高对比度显示
- **品牌一致性**：使用平台绿色主题 (#00b899)
- **安全提示**：包含完整的安全使用说明

### Supabase 用户创建
- 验证码通过后创建 Supabase 用户
- 标记邮箱已验证状态
- 生成访问令牌和刷新令牌
- 自动登录用户

## 🚀 使用方式

### 开发环境测试
1. 启动应用：`npm run dev`
2. 访问注册页面，选择邮箱注册
3. 输入邮箱地址，点击"获取验证码"
4. 如果未配置邮件服务，验证码会在弹窗中显示
5. 输入验证码和密码，点击注册

### 生产环境部署
1. 配置正确的 Resend API Key 和发送域名
2. 用户将收到完整的 HTML 验证邮件
3. 邮件中包含清晰的 6 位验证码
4. 验证码输入后完成注册流程

## 📧 邮件内容示例

### 邮件主题
```
请验证您的注册
```

### 邮件内容
```html
绿色技术平台
Green Technology Platform

请验证您的注册

您好！您正在注册绿色技术平台账户，请使用以下验证码完成注册：

┌─────────────────┐
│     123456      │  <- 6位验证码
└─────────────────┘
请将此验证码输入到注册页面

重要提示：
• 验证码有效期为 5分钟，请尽快使用
• 请勿将验证码告知他人，以保护账户安全  
• 如果这不是您的操作，请忽略此邮件
```

## 🔒 安全特性

### 验证码安全
- 6位随机数字，难以猜测
- 5分钟自动过期
- 最多5次验证尝试
- 60秒发送频率限制

### 数据安全
- 验证码仅存储在服务器内存
- 验证成功后立即删除
- 不在前端暴露敏感信息
- 使用 HTTPS 传输

### 用户隐私
- 不记录用户邮件内容
- 验证码不写入日志（生产环境）
- 自动清理过期数据

## 🧪 测试场景

### 正常流程测试
1. ✅ 邮箱格式验证
2. ✅ 验证码发送成功
3. ✅ 验证码验证通过
4. ✅ 用户注册成功
5. ✅ 自动跳转到企业信息页面

### 异常情况测试
1. ✅ 无效邮箱地址处理
2. ✅ 验证码过期处理
3. ✅ 验证码错误处理
4. ✅ 重复注册检查
5. ✅ 网络错误处理

## 📊 API 接口说明

### 发送验证码
```
POST /api/email-verification/send-code
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "验证码已发送到 user@example.com",
  "devOTP": "123456" // 仅开发模式
}
```

### 验证验证码
```
POST /api/email-verification/verify-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}

Response:
{
  "success": true,
  "message": "验证码验证成功"
}
```

### 完成注册
```
POST /api/email-verification/register
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456",
  "password": "userpassword"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "...",
    "refreshToken": "..."
  },
  "message": "注册成功！"
}
```

## 🔄 生产环境优化建议

### 存储优化
- 使用 Redis 替代内存存储
- 实现分布式验证码管理
- 添加验证码使用统计

### 安全增强
- 实现 IP 频率限制
- 添加图形验证码
- 监控异常注册行为

### 性能优化
- 邮件发送队列
- 验证码批量清理
- 异步用户创建

现在邮箱验证码注册功能已完全实现，支持完整的注册流程和安全验证机制！