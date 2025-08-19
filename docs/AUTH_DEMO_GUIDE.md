# 认证API Mock测试演示指南

## 🎯 快速体验

### 第一步：启用Mock模式

在项目根目录创建 `.env.local` 文件：

```bash
# 创建环境配置文件
touch .env.local
```

添加以下内容到 `.env.local`：

```env
# 启用Mock模式进行测试
NEXT_PUBLIC_USE_MOCK=true

# API基础URL（Mock模式下仅作配置，不会实际请求）
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 第二步：启动项目

```bash
# 安装依赖（如果还未安装）
npm install

# 启动开发服务器
npm run dev
```

### 第三步：访问测试页面

在浏览器中访问：
```
http://localhost:3000/auth-test
```

## 🧪 测试场景演示

### 🔐 场景1：密码登录测试

1. 点击 **"密码登录"** 按钮
2. 观察测试日志，应该看到：
   ```
   🧪 开始测试密码登录...
   ✅ 密码登录成功: 测试用户
   📄 Token: eyJhbGciOiJIUzI1NiIsInR...
   ```

### 📱 场景2：手机验证码登录

1. 点击 **"验证码登录"** 按钮
2. 观察控制台和测试日志：
   ```
   🧪 开始测试手机验证码登录...
   📱 发送手机验证码...
   ✅ 验证码发送成功: 验证码已发送至手机 +86 13800138000
   🔑 Mock验证码: 123456
   🔐 使用验证码登录...
   ✅ 验证码登录成功: 用户1380
   ```

### 📧 场景3：邮箱注册测试

1. 点击 **"邮箱注册"** 按钮
2. 系统会生成唯一的测试邮箱
3. 观察完整的注册流程：
   ```
   🧪 开始测试邮箱注册...
   📧 发送邮箱验证码...
   ✅ 邮箱验证码发送成功: 验证码已发送至邮箱 test_1704876543@example.com
   🔑 Mock验证码: 654321
   📝 使用验证码注册...
   ✅ 邮箱注册成功: 用户test_1704876543 (test_1704876543@example.com)
   ```
   
   > 注意：用户名会根据邮箱前缀自动生成，格式为"用户{邮箱前缀}"

### 📞 场景4：手机注册测试

1. 点击 **"手机注册"** 按钮
2. 系统生成随机手机号进行测试
3. 查看注册流程日志

### 🔑 场景5：密码重置测试

1. 点击 **"密码重置"** 按钮
2. 使用预设的测试邮箱进行密码重置
3. 观察重置流程

### 🔍 场景6：账号状态检查

1. 点击 **"账号检查"** 按钮
2. 查看预设账号的存在和验证状态：
   ```
   📧 邮箱 user@greentech.com - 存在: true, 已验证: true
   📱 手机 13800138000 - 存在: true, 已验证: true
   ```

## 🎮 互动测试体验

### 测试预设账号

系统预设了3个测试账号，可以直接使用：

| 账号类型 | 邮箱 | 手机号 | 密码 | 用户名 | 角色 |
|---------|------|--------|------|------|------|
| 管理员 | admin@greentech.com | 13800138000 | 123456 | 系统管理员 | admin |
| 普通用户 | user@greentech.com | 13900139000 | 123456 | 测试用户 | user |
| 演示账户 | demo@example.com | 18800188000 | 123456 | 演示账户 | user |

> 新注册用户的用户名自动生成规则：
> - 邮箱注册：用户{邮箱前缀}，如 "用户admin"
> - 手机注册：用户{手机号后4位}，如 "用户8000"

### 手动测试步骤

1. **开放浏览器控制台** (F12 → Console)
2. **依次点击测试按钮** 观察实时日志
3. **查看控制台输出** 获取验证码等详细信息
4. **使用"清除数据"按钮** 重置测试状态

## 🔧 在组件中使用认证API

### 基础用法示例

```tsx
import { useState } from 'react';
import { authApi } from '@/api/auth';

function LoginComponent() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await authApi.passwordLogin({
        account: 'user@example.com',
        password: '123456',
        type: 'email'
      });
      
      if (result.success) {
        console.log('登录成功:', result.data?.user);
        // 保存token到localStorage
        localStorage.setItem('access_token', result.data!.token);
      } else {
        console.error('登录失败:', result.error);
      }
    } catch (error) {
      console.error('登录异常:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? '登录中...' : '登录'}
    </button>
  );
}
```

### 验证码发送示例

```tsx
import { useState } from 'react';
import { authApi, AuthMockManager } from '@/api/auth';

function CodeSendComponent() {
  const [countdown, setCountdown] = useState(0);

  const sendCode = async () => {
    try {
      const result = await authApi.sendPhoneCode({
        phone: '13800138000',
        purpose: 'login'
      });
      
      if (result.success) {
        alert('验证码已发送');
        
        // Mock模式下可以获取验证码用于自动填充
        if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
          const mockCode = AuthMockManager.getMockCode('13800138000', undefined, 'login');
          console.log('Mock验证码:', mockCode);
        }
        
        // 开始60秒倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
    }
  };

  return (
    <button onClick={sendCode} disabled={countdown > 0}>
      {countdown > 0 ? `${countdown}s` : '发送验证码'}
    </button>
  );
}
```

## 📊 真实API切换

当后端API准备就绪时，可以轻松切换到真实API：

### 1. 修改环境配置

将 `.env.local` 中的配置改为：

```env
# 关闭Mock模式
NEXT_PUBLIC_USE_MOCK=false

# 配置真实的后端API地址
NEXT_PUBLIC_API_URL=http://your-backend-server:8080/api
```

### 2. 重启开发服务器

```bash
npm run dev
```

### 3. 使用相同的测试页面

访问 `http://localhost:3000/auth-test` 页面会显示：
- 🔴 真实API 模式
- 所有接口请求将发送到真实后端

## 🚀 投入生产使用

### 环境变量配置

生产环境的 `.env.production` 配置：

```env
# 生产环境必须关闭Mock
NEXT_PUBLIC_USE_MOCK=false

# 生产API地址
NEXT_PUBLIC_API_URL=https://api.yourapp.com/api
```

### 移除测试页面

生产部署前记得移除测试相关文件：

```bash
# 删除测试页面
rm -rf src/app/auth-test
rm -f src/components/auth/auth-test-panel.tsx
rm -f src/api/authMockManager.ts
```

## 💡 开发技巧

### 1. 调试验证码

Mock模式下，验证码会在控制台显示，方便调试：

```javascript
// 浏览器控制台会显示
📱 手机验证码已发送到 +86 13800138000，验证码：123456 (测试模式)
```

### 2. 快速重置状态

点击"清除数据"按钮或代码中调用：

```typescript
import { AuthMockManager } from '@/api/authMockManager';
AuthMockManager.clearMockData();
```

### 3. 自定义Mock响应

修改 `authMockManager.ts` 中的响应数据和延迟时间。

## 🎉 总结

通过Mock测试系统，您可以：

- ✅ **无需后端依赖** - 独立开发和测试前端功能
- ✅ **完整覆盖场景** - 测试所有认证相关功能
- ✅ **真实模拟体验** - 包含网络延迟和错误处理
- ✅ **开发效率提升** - 快速迭代和调试
- ✅ **无缝切换** - 轻松从Mock切换到真实API

现在就开始体验吧！访问 `/auth-test` 页面开始您的测试之旅。 🚀