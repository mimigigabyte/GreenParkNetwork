# 认证API Mock测试指南

## 📋 概述

本指南详细介绍如何使用Mock数据测试认证API接口，包括环境配置、测试流程和注意事项。

## 🚀 快速开始

### 1. 启用Mock模式

在项目根目录创建 `.env.local` 文件：

```bash
# 复制示例配置文件
cp .env.local.example .env.local
```

编辑 `.env.local` 文件，确保包含以下配置：

```env
# 启用Mock模式
NEXT_PUBLIC_USE_MOCK=true

# API基础URL（Mock模式下不会实际请求）
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 2. 访问测试页面

启动开发服务器后，访问测试页面：

```
http://localhost:3000/auth-test
```

## 🧪 测试功能

### 密码登录测试
- **测试账号**: `admin@greentech.com` / `user@greentech.com` / `demo@example.com`
- **测试密码**: `123456`
- **手机号**: `13800138000` / `13900139000` / `18800188000`

**操作步骤**:
1. 点击"密码登录"按钮
2. 系统自动使用测试账号进行登录
3. 查看返回的用户信息和Token

### 验证码登录测试
**操作步骤**:
1. 点击"验证码登录"按钮
2. 系统自动发送验证码到测试手机号
3. 在控制台查看生成的验证码
4. 自动使用验证码进行登录

### 邮箱注册测试
**操作步骤**:
1. 点击"邮箱注册"按钮
2. 系统生成新的测试邮箱地址
3. 发送邮箱验证码
4. 自动使用验证码完成注册

### 手机注册测试
**操作步骤**:
1. 点击"手机注册"按钮
2. 系统生成新的测试手机号
3. 发送手机验证码
4. 自动使用验证码完成注册

### 密码重置测试
**操作步骤**:
1. 点击"密码重置"按钮
2. 使用已存在的邮箱发送重置验证码
3. 自动使用验证码重置密码

### 账号检查测试
**操作步骤**:
1. 点击"账号检查"按钮
2. 检查测试邮箱和手机号的存在状态
3. 查看验证状态

### 用户信息测试
**操作步骤**:
1. 点击"用户信息"按钮
2. 获取当前用户的详细信息

## 🔧 Mock数据配置

### 预设用户数据

```typescript
const mockUsers = [
  {
    id: 'user_001',
    email: 'admin@greentech.com',
    phone: '13800138000',
    name: '系统管理员',
    role: 'admin',
    emailVerified: true,
    phoneVerified: true
  },
  {
    id: 'user_002',
    email: 'user@greentech.com',
    phone: '13900139000',
    name: '测试用户',
    role: 'user',
    emailVerified: true,
    phoneVerified: false
  },
  {
    id: 'user_003',
    email: 'demo@example.com',
    phone: '18800188000',
    name: '演示账户',
    role: 'user',
    emailVerified: false,
    phoneVerified: true
  }
];
```

### 验证码规则
- **格式**: 6位数字验证码
- **有效期**: 5分钟
- **用途**: 注册、登录、密码重置
- **显示**: 控制台日志中显示生成的验证码

### 密码规则
- **测试密码**: `123456`
- **最小长度**: 6位
- **复杂度**: 仅作演示，实际项目需要更强的密码策略

## 📱 控制台日志

Mock模式下，重要信息会在浏览器控制台显示：

```javascript
// 验证码发送日志
📧 邮箱验证码已发送到 test@example.com，验证码：123456 (测试模式)
📱 手机验证码已发送到 +86 13800138000，验证码：654321 (测试模式)

// 密码重置日志  
🔐 用户 admin@greentech.com 密码重置成功 (测试模式)
```

## 🛠️ 自定义Mock数据

### 添加新用户
```typescript
// 在 authMockManager.ts 中的 mockUsers 数组中添加
{
  id: 'user_004',
  email: 'newuser@example.com',
  phone: '15800158000',
  name: '新用户',
  role: 'user',
  emailVerified: true,
  phoneVerified: true
}
```

### 修改验证码生成规则
```typescript
// 在 authMockManager.ts 中修改 generateVerificationCode 函数
const generateVerificationCode = (): string => {
  // 返回固定验证码用于调试
  return '888888';
  
  // 或生成4位验证码
  return Math.floor(1000 + Math.random() * 9000).toString();
};
```

### 调整响应延迟
```typescript
// 在 authMockManager.ts 中修改 mockDelay 函数
const mockDelay = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms));
```

## 🔍 调试技巧

### 1. 查看验证码
Mock模式下，验证码会在控制台显示，也可以通过以下方式获取：

```typescript
import { AuthMockManager } from '@/api/authMockManager';

// 获取指定用途的验证码
const code = AuthMockManager.getMockCode('13800138000', undefined, 'login');
console.log('验证码:', code);
```

### 2. 清除Mock状态
测试过程中如需重置状态：

```typescript
// 清除所有验证码和新注册用户
AuthMockManager.clearMockData();
```

### 3. 手动测试API
也可以在代码中直接调用Mock方法：

```typescript
import { AuthMockManager } from '@/api/authMockManager';

// 直接测试登录
const result = await AuthMockManager.passwordLogin({
  account: 'admin@greentech.com',
  password: '123456',
  type: 'email'
});

console.log('登录结果:', result);
```

## ⚠️ 注意事项

### 安全提醒
- Mock模式仅用于开发和测试
- 生产环境必须禁用Mock模式
- 不要在生产代码中硬编码测试密码

### 环境配置
- 确保 `.env.local` 不被提交到版本控制
- 团队开发时统一Mock配置
- CI/CD环境中正确配置环境变量

### 性能考虑
- Mock响应包含模拟延迟，更接近真实网络环境
- 可根据需要调整延迟时间
- 大量测试时考虑关闭不必要的日志输出

## 🔄 切换到真实API

当需要测试真实后端API时：

1. 修改 `.env.local` 文件：
```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://your-backend-api-url/api
```

2. 确保后端服务已启动并可访问

3. 重新启动前端开发服务器

4. 使用相同的测试页面进行真实API测试

## 📊 测试报告

测试页面会实时显示测试结果，包括：
- ✅ 成功操作
- ❌ 失败操作  
- 💥 异常错误
- 📄 返回数据
- 🔑 验证码信息

所有测试结果按时间倒序显示，方便查看最新的测试状态。

## 🎯 最佳实践

1. **测试流程**: 按照用户实际使用流程进行测试
2. **边界测试**: 测试各种异常情况和边界条件
3. **数据验证**: 验证返回数据的格式和内容
4. **性能测试**: 观察Mock响应时间是否合理
5. **兼容性**: 确保Mock数据与真实API格式一致

通过合理使用Mock测试，可以大大提高开发效率，减少对后端服务的依赖，确保前端功能的稳定性。