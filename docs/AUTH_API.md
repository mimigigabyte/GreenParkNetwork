# 用户登录注册 API 接口文档

## 概述

本文档描述了绿色技术平台用户认证系统的前端API接口，包括用户登录、注册、密码找回等功能。

## 基础信息

- **基础URL**: `http://localhost:8080/api`
- **请求格式**: JSON
- **响应格式**: JSON
- **认证方式**: Bearer Token

## 通用响应格式

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
```

## 数据类型定义

### User 用户信息
```typescript
interface User {
  id: string
  email?: string
  phone?: string
  name: string
  avatar?: string
  role: 'admin' | 'user'
  createdAt: string
  emailVerified: boolean
  phoneVerified: boolean
}
```

### AuthResponse 认证响应
```typescript
interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}
```

## API 接口

### 1. 登录相关

#### 1.1 密码登录
支持手机号或邮箱登录

**接口地址**: `POST /auth/login/password`

**请求参数**:
```typescript
interface PasswordLoginRequest {
  account: string    // 手机号或邮箱
  password: string   // 密码
  type: 'email' | 'phone'  // 账号类型
}
```

**请求示例**:
```json
{
  "account": "user@example.com",
  "password": "123456",
  "type": "email"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "张三",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00Z",
      "emailVerified": true,
      "phoneVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

#### 1.2 手机验证码登录

**接口地址**: `POST /auth/login/phone-code`

**请求参数**:
```typescript
interface PhoneCodeLoginRequest {
  phone: string       // 手机号
  code: string        // 验证码
  countryCode?: string // 国家代码，默认+86
}
```

**请求示例**:
```json
{
  "phone": "13800138000",
  "code": "123456",
  "countryCode": "+86"
}
```

**响应示例**: 同密码登录

### 2. 注册相关

#### 2.1 邮箱验证码注册

**接口地址**: `POST /auth/register/email`

**请求参数**:
```typescript
interface EmailRegisterRequest {
  email: string      // 邮箱地址
  emailCode: string  // 邮箱验证码
  password: string   // 密码
  name?: string      // 用户名（可选，不传则自动生成）
}
```

**请求示例**:
```json
{
  "email": "newuser@example.com",
  "emailCode": "123456",
  "password": "123456"
}
```

**响应示例**: 同登录响应

#### 2.2 手机验证码注册

**接口地址**: `POST /auth/register/phone`

**请求参数**:
```typescript
interface PhoneRegisterRequest {
  phone: string       // 手机号
  phoneCode: string   // 手机验证码
  password: string    // 密码
  name?: string       // 用户名（可选，不传则自动生成）
  countryCode?: string // 国家代码，默认+86
}
```

**请求示例**:
```json
{
  "phone": "13800138000",
  "phoneCode": "123456",
  "password": "123456",
  "countryCode": "+86"
}
```

**响应示例**: 同登录响应

### 3. 验证码相关

#### 3.1 发送邮箱验证码

**接口地址**: `POST /auth/code/email`

**请求参数**:
```typescript
interface SendEmailCodeRequest {
  email: string    // 邮箱地址
  purpose: 'register' | 'login' | 'reset_password'  // 使用目的
}
```

**请求示例**:
```json
{
  "email": "user@example.com",
  "purpose": "register"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "验证码已发送至您的邮箱",
    "expiresIn": 300
  }
}
```

#### 3.2 发送手机验证码

**接口地址**: `POST /auth/code/phone`

**请求参数**:
```typescript
interface SendPhoneCodeRequest {
  phone: string       // 手机号
  purpose: 'register' | 'login' | 'reset_password'  // 使用目的
  countryCode?: string // 国家代码，默认+86
}
```

**请求示例**:
```json
{
  "phone": "13800138000",
  "purpose": "login",
  "countryCode": "+86"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "验证码已发送至您的手机",
    "expiresIn": 300
  }
}
```

#### 3.3 验证验证码

**接口地址**: `POST /auth/code/verify`

**请求参数**:
```typescript
interface VerifyCodeRequest {
  code: string        // 验证码
  phone?: string      // 手机号（验证手机验证码时必填）
  email?: string      // 邮箱（验证邮箱验证码时必填）
  purpose: 'register' | 'login' | 'reset_password'  // 使用目的
  countryCode?: string // 国家代码
}
```

**请求示例**:
```json
{
  "code": "123456",
  "phone": "13800138000",
  "purpose": "login",
  "countryCode": "+86"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "验证码验证成功"
  }
}
```

### 4. 密码找回

#### 4.1 通过邮箱重置密码

**接口地址**: `POST /auth/password/reset/email`

**请求参数**:
```typescript
interface ResetPasswordByEmailRequest {
  email: string       // 邮箱地址
  emailCode: string   // 邮箱验证码
  newPassword: string // 新密码
}
```

**请求示例**:
```json
{
  "email": "user@example.com",
  "emailCode": "123456",
  "newPassword": "newpassword123"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "密码重置成功"
  }
}
```

#### 4.2 通过手机重置密码

**接口地址**: `POST /auth/password/reset/phone`

**请求参数**:
```typescript
interface ResetPasswordByPhoneRequest {
  phone: string       // 手机号
  phoneCode: string   // 手机验证码
  newPassword: string // 新密码
  countryCode?: string // 国家代码，默认+86
}
```

**请求示例**:
```json
{
  "phone": "13800138000",
  "phoneCode": "123456",
  "newPassword": "newpassword123",
  "countryCode": "+86"
}
```

**响应示例**: 同邮箱重置密码

### 5. 用户管理

#### 5.1 获取当前用户信息

**接口地址**: `GET /auth/me`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "张三",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z",
    "emailVerified": true,
    "phoneVerified": false
  }
}
```

#### 5.2 用户登出

**接口地址**: `POST /auth/logout`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

#### 5.3 刷新Token

**接口地址**: `POST /auth/refresh`

**请求参数**:
```json
{
  "refreshToken": "refresh_token_here"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

#### 5.4 检查账号是否存在

**接口地址**: `POST /auth/check-account`

**请求参数**:
```json
{
  "account": "user@example.com",
  "type": "email"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "exists": true,
    "verified": true
  }
}
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权，token无效或过期 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户已存在） |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 常见错误响应示例

```json
{
  "success": false,
  "error": "用户名或密码错误"
}
```

```json
{
  "success": false,
  "error": "验证码已过期，请重新获取"
}
```

```json
{
  "success": false,
  "error": "该邮箱已被注册"
}
```

## 使用示例

### 前端调用示例

```typescript
import { authApi } from '@/api/auth'

// 密码登录
const loginWithPassword = async () => {
  try {
    const result = await authApi.passwordLogin({
      account: 'user@example.com',
      password: '123456',
      type: 'email'
    })
    
    if (result.success) {
      const { user, token } = result.data!
      // 保存token到localStorage
      localStorage.setItem('token', token)
      // 处理登录成功逻辑
      console.log('登录成功', user)
    } else {
      console.error('登录失败', result.error)
    }
  } catch (error) {
    console.error('登录错误', error)
  }
}

// 发送验证码
const sendCode = async () => {
  try {
    const result = await authApi.sendPhoneCode({
      phone: '13800138000',
      purpose: 'login'
    })
    
    if (result.success) {
      console.log('验证码发送成功')
    }
  } catch (error) {
    console.error('发送验证码失败', error)
  }
}

// 注册用户
const registerUser = async () => {
  try {
    const result = await authApi.emailRegister({
      email: 'newuser@example.com',
      emailCode: '123456',
      password: '123456',
      name: '新用户'
    })
    
    if (result.success) {
      console.log('注册成功', result.data?.user)
    }
  } catch (error) {
    console.error('注册失败', error)
  }
}
```

## 安全注意事项

1. **Token管理**: 前端需要安全存储access token，建议使用httpOnly cookie或secure storage
2. **验证码限制**: 验证码有效期为5分钟，同一手机号/邮箱1分钟内只能发送一次
3. **密码强度**: 密码长度至少6位，建议包含数字、字母和特殊字符
4. **请求频率**: 接口有频率限制，防止恶意攻击
5. **HTTPS**: 生产环境必须使用HTTPS协议

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本
- 支持密码登录、验证码登录
- 支持邮箱/手机注册
- 支持密码找回功能