# 认证API使用示例

本文档提供了在React组件中使用认证API的具体示例。

## 登录功能示例

### 1. 密码登录组件

```tsx
// components/auth/password-login.tsx
'use client';

import { useState } from 'react';
import { authApi, type PasswordLoginRequest } from '@/api/auth';

export function PasswordLogin() {
  const [formData, setFormData] = useState({
    account: '',
    password: '',
    type: 'email' as 'email' | 'phone'
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authApi.passwordLogin(formData);
      
      if (result.success && result.data) {
        // 保存token
        localStorage.setItem('access_token', result.data.token);
        if (result.data.refreshToken) {
          localStorage.setItem('refresh_token', result.data.refreshToken);
        }
        
        // 登录成功处理
        alert('登录成功！');
        window.location.href = '/dashboard';
      } else {
        alert(result.error || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      alert('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <select 
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            type: e.target.value as 'email' | 'phone' 
          }))}
          className="w-full p-2 border rounded"
        >
          <option value="email">邮箱登录</option>
          <option value="phone">手机登录</option>
        </select>
      </div>
      
      <div>
        <input
          type={formData.type === 'email' ? 'email' : 'tel'}
          placeholder={formData.type === 'email' ? '请输入邮箱' : '请输入手机号'}
          value={formData.account}
          onChange={(e) => setFormData(prev => ({ ...prev, account: e.target.value }))}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <div>
        <input
          type="password"
          placeholder="请输入密码"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
```

### 2. 验证码登录组件

```tsx
// components/auth/phone-code-login.tsx
'use client';

import { useState, useEffect } from 'react';
import { authApi } from '@/api/auth';

export function PhoneCodeLogin() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendCode = async () => {
    if (!phone) {
      alert('请输入手机号');
      return;
    }

    try {
      const result = await authApi.sendPhoneCode({
        phone,
        purpose: 'login'
      });

      if (result.success) {
        setCountdown(60);
        alert('验证码已发送');
      } else {
        alert(result.error || '发送失败');
      }
    } catch (error) {
      console.error('发送验证码错误:', error);
      alert('发送失败，请稍后重试');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authApi.phoneCodeLogin({
        phone,
        code
      });

      if (result.success && result.data) {
        localStorage.setItem('access_token', result.data.token);
        alert('登录成功！');
        window.location.href = '/dashboard';
      } else {
        alert(result.error || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      alert('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <input
          type="tel"
          placeholder="请输入手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="请输入验证码"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 p-2 border rounded"
          required
        />
        <button
          type="button"
          onClick={sendCode}
          disabled={countdown > 0 || !phone}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          {countdown > 0 ? `${countdown}s` : '获取验证码'}
        </button>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
```

## 注册功能示例

### 邮箱注册组件

```tsx
// components/auth/email-register.tsx
'use client';

import { useState } from 'react';
import { authApi } from '@/api/auth';

export function EmailRegister() {
  const [formData, setFormData] = useState({
    email: '',
    emailCode: '',
    password: '',
    confirmPassword: ''
  });
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const sendEmailCode = async () => {
    if (!formData.email) {
      alert('请输入邮箱');
      return;
    }

    try {
      const result = await authApi.sendEmailCode({
        email: formData.email,
        purpose: 'register'
      });

      if (result.success) {
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
        alert('验证码已发送至您的邮箱');
      } else {
        alert(result.error || '发送失败');
      }
    } catch (error) {
      console.error('发送邮箱验证码错误:', error);
      alert('发送失败，请稍后重试');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      alert('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      const result = await authApi.emailRegister({
        email: formData.email,
        emailCode: formData.emailCode,
        password: formData.password
      });

      if (result.success && result.data) {
        localStorage.setItem('access_token', result.data.token);
        alert('注册成功！');
        window.location.href = '/company-profile';
      } else {
        alert(result.error || '注册失败');
      }
    } catch (error) {
      console.error('注册错误:', error);
      alert('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <input
          type="email"
          placeholder="邮箱地址"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="邮箱验证码"
          value={formData.emailCode}
          onChange={(e) => setFormData(prev => ({ ...prev, emailCode: e.target.value }))}
          className="flex-1 p-2 border rounded"
          required
        />
        <button
          type="button"
          onClick={sendEmailCode}
          disabled={countdown > 0 || !formData.email}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          {countdown > 0 ? `${countdown}s` : '获取验证码'}
        </button>
      </div>
      
      {/* 用户名字段已移除，系统会自动生成 */}
      
      <div>
        <input
          type="password"
          placeholder="密码"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <div>
        <input
          type="password"
          placeholder="确认密码"
          value={formData.confirmPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full p-2 bg-green-500 text-white rounded disabled:opacity-50"
      >
        {loading ? '注册中...' : '注册'}
      </button>
    </form>
  );
}
```

## 密码找回功能示例

```tsx
// components/auth/reset-password.tsx
'use client';

import { useState } from 'react';
import { authApi } from '@/api/auth';

export function ResetPassword() {
  const [step, setStep] = useState(1); // 1: 选择重置方式, 2: 验证身份, 3: 设置新密码
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    const target = resetMethod === 'email' ? formData.email : formData.phone;
    if (!target) {
      alert(`请输入${resetMethod === 'email' ? '邮箱' : '手机号'}`);
      return;
    }

    try {
      const result = resetMethod === 'email' 
        ? await authApi.sendEmailCode({ email: formData.email, purpose: 'reset_password' })
        : await authApi.sendPhoneCode({ phone: formData.phone, purpose: 'reset_password' });

      if (result.success) {
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
        alert('验证码已发送');
        setStep(2);
      } else {
        alert(result.error || '发送失败');
      }
    } catch (error) {
      console.error('发送验证码错误:', error);
      alert('发送失败，请稍后重试');
    }
  };

  const verifyCode = async () => {
    try {
      const result = await authApi.verifyCode({
        code: formData.code,
        email: resetMethod === 'email' ? formData.email : undefined,
        phone: resetMethod === 'phone' ? formData.phone : undefined,
        purpose: 'reset_password'
      });

      if (result.success && result.data?.valid) {
        setStep(3);
      } else {
        alert(result.data?.message || '验证码错误');
      }
    } catch (error) {
      console.error('验证码验证错误:', error);
      alert('验证失败，请稍后重试');
    }
  };

  const resetPassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }

    if (formData.newPassword.length < 6) {
      alert('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      const result = resetMethod === 'email'
        ? await authApi.resetPasswordByEmail({
            email: formData.email,
            emailCode: formData.code,
            newPassword: formData.newPassword
          })
        : await authApi.resetPasswordByPhone({
            phone: formData.phone,
            phoneCode: formData.code,
            newPassword: formData.newPassword
          });

      if (result.success) {
        alert('密码重置成功！');
        window.location.href = '/login';
      } else {
        alert(result.error || '重置失败');
      }
    } catch (error) {
      console.error('密码重置错误:', error);
      alert('重置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">密码找回</h2>
        
        <div>
          <label className="block text-sm font-medium mb-2">选择重置方式</label>
          <select 
            value={resetMethod}
            onChange={(e) => setResetMethod(e.target.value as 'email' | 'phone')}
            className="w-full p-2 border rounded"
          >
            <option value="email">邮箱重置</option>
            <option value="phone">手机重置</option>
          </select>
        </div>
        
        <div>
          <input
            type={resetMethod === 'email' ? 'email' : 'tel'}
            placeholder={resetMethod === 'email' ? '请输入邮箱' : '请输入手机号'}
            value={resetMethod === 'email' ? formData.email : formData.phone}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              [resetMethod]: e.target.value 
            }))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <button 
          onClick={sendCode}
          className="w-full p-2 bg-blue-500 text-white rounded"
        >
          发送验证码
        </button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">验证身份</h2>
        
        <div>
          <p className="text-sm text-gray-600 mb-2">
            验证码已发送至您的{resetMethod === 'email' ? '邮箱' : '手机'}
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="请输入验证码"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              className="flex-1 p-2 border rounded"
              required
            />
            <button
              onClick={sendCode}
              disabled={countdown > 0}
              className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
            >
              {countdown > 0 ? `${countdown}s` : '重新发送'}
            </button>
          </div>
        </div>
        
        <button 
          onClick={verifyCode}
          className="w-full p-2 bg-blue-500 text-white rounded"
        >
          验证
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">设置新密码</h2>
      
      <div>
        <input
          type="password"
          placeholder="新密码"
          value={formData.newPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <div>
        <input
          type="password"
          placeholder="确认新密码"
          value={formData.confirmPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <button 
        onClick={resetPassword}
        disabled={loading}
        className="w-full p-2 bg-green-500 text-white rounded disabled:opacity-50"
      >
        {loading ? '重置中...' : '重置密码'}
      </button>
    </div>
  );
}
```

## 工具函数示例

### Token管理

```typescript
// utils/auth.ts

export class AuthManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  // 自动刷新token
  static async refreshTokenIfNeeded(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const result = await authApi.refreshToken(refreshToken);
      if (result.success && result.data) {
        this.setAccessToken(result.data.token);
        if (result.data.refreshToken) {
          this.setRefreshToken(result.data.refreshToken);
        }
        return true;
      }
    } catch (error) {
      console.error('刷新token失败:', error);
      this.clearTokens();
    }
    
    return false;
  }
}
```

### 表单验证

```typescript
// utils/validation.ts

export class AuthValidation {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  static validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: '密码长度至少6位' };
    }
    
    if (password.length > 20) {
      return { valid: false, message: '密码长度不能超过20位' };
    }
    
    // 可以添加更复杂的密码强度验证
    // const hasLetter = /[a-zA-Z]/.test(password);
    // const hasNumber = /\d/.test(password);
    // const hasSpecial = /[!@#$%^&*]/.test(password);
    
    return { valid: true };
  }

  static validateCode(code: string): boolean {
    return /^\d{6}$/.test(code);
  }
}
```

这些示例展示了如何在实际项目中使用认证API，包括错误处理、状态管理和用户体验优化。