# 邮件服务配置指南

## 问题描述
用户注册时邮箱验证码功能存在以下问题：
1. 邮件中不显示验证码
2. 点击邮件链接无法完成注册

## 解决方案

### 1. 配置 Resend 邮件服务

#### 步骤 1: 获取 Resend API Key
1. 访问 [Resend官网](https://resend.com) 注册账号
2. 在控制台中创建 API Key
3. 配置发送域名（或使用 Resend 提供的测试域名）

#### 步骤 2: 配置环境变量
创建 `.env` 文件或设置环境变量：

```bash
# Resend邮件服务配置
RESEND_API_KEY=re_YourActualApiKey
RESEND_FROM_EMAIL=noreply@yourdomain.com
# 如果使用 Resend 测试域名
RESEND_FROM_EMAIL=onboarding@resend.dev
```

#### 步骤 3: 验证配置
启动应用后，在日志中查看：
- 如果配置正确：显示 "邮件发送成功到 xxx@xxx.com : 邮件ID=xxx"
- 如果未配置：显示 "未配置邮件服务，模拟发送邮件"

### 2. 邮件模板功能

已优化的邮件模板包含：
- **清晰的验证码显示**：大字体、高对比度显示6位验证码
- **专业的邮件设计**：包含平台Logo和品牌色彩
- **安全提示**：提醒用户验证码有效期和安全事项
- **快捷操作链接**：点击可直接跳转到对应页面

### 3. 开发测试

#### 不配置邮件服务（开发测试）
如果暂时不配置 Resend，系统会：
1. 在控制台日志中显示验证码
2. 验证码功能正常工作
3. 注册流程完整可用

查看日志示例：
```
未配置邮件服务，模拟发送邮件到 test@example.com : 主题=绿色技术平台 - 注册验证码, 验证码=123456
```

#### 配置邮件服务（生产环境）
配置后用户将收到：
1. 格式化的HTML邮件
2. 清晰显示的6位验证码
3. 快捷操作链接
4. 安全使用提示

### 4. 故障排除

#### 问题：邮件发送失败
- 检查 API Key 是否正确
- 验证发送域名是否已配置
- 查看应用日志中的错误信息

#### 问题：邮件进入垃圾箱
- 配置 SPF、DKIM 记录
- 使用已验证的发送域名
- 避免使用垃圾邮件关键词

#### 问题：验证码无法验证
- 检查数据库连接
- 确认验证码有效期设置（默认5分钟）
- 查看验证码生成和验证的日志

### 5. 生产环境建议

1. **使用自定义域名**：配置自己的域名用于发送邮件
2. **监控邮件发送**：定期检查邮件发送成功率
3. **设置邮件模板**：可以进一步自定义邮件样式
4. **配置反馈循环**：处理退信和用户反馈

### 6. API 接口测试

可以使用以下方式测试邮件功能：

```bash
# 发送邮箱验证码
curl -X POST http://localhost:8080/api/auth/code/email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "purpose": "register"}'

# 验证验证码
curl -X POST http://localhost:8080/api/auth/code/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "code": "123456", "purpose": "register"}'
```

通过以上配置，邮箱验证码注册功能将完全正常工作。