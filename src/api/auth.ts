import { apiClient, USE_MOCK, USE_SUPABASE } from './index'
import { AuthMockManager } from './authMockManager'
import { supabaseAuthApi } from './supabaseAuth'
import { resendAuthApi } from './resendAuth'
import { tencentSmsAuthApi } from './tencentSmsAuth'

// 短信服务配置 - 在生产环境优先使用腾讯云SMS避免Supabase/Twilio配置问题
const USE_TENCENT_SMS = process.env.NEXT_PUBLIC_USE_TENCENT_SMS === 'true' || 
  (process.env.NODE_ENV === 'production' && process.env.TENCENT_SMS_SDK_APP_ID)

// 重新导出常量供其他组件使用
export { USE_MOCK, USE_SUPABASE, USE_TENCENT_SMS }

// 调试日志 - 显示当前使用的短信服务
console.log('📱 短信服务配置:', {
  USE_MOCK,
  USE_SUPABASE, 
  USE_TENCENT_SMS,
  NODE_ENV: process.env.NODE_ENV,
  HAS_TENCENT_CONFIG: !!process.env.TENCENT_SMS_SDK_APP_ID,
  NEXT_PUBLIC_USE_TENCENT_SMS: process.env.NEXT_PUBLIC_USE_TENCENT_SMS,
  selectedService: USE_TENCENT_SMS ? 'Tencent' : USE_SUPABASE ? 'Supabase' : USE_MOCK ? 'Mock' : 'Backend'
})

// ========================= 类型定义 =========================

export interface User {
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

// 登录相关接口
export interface PasswordLoginRequest {
  account: string // 手机号或邮箱
  password: string
  type: 'email' | 'phone' // 指定账号类型
  turnstileToken?: string // Turnstile人机验证token
}

export interface PhoneCodeLoginRequest {
  phone: string
  code: string
  countryCode?: string
  turnstileToken?: string // Turnstile人机验证token
}

// 注册相关接口
export interface EmailRegisterRequest {
  email: string
  emailCode: string
  password: string
  name?: string // 可选，不传则自动生成
}

export interface PhoneRegisterRequest {
  phone: string
  phoneCode: string
  password: string
  name?: string // 可选，不传则自动生成
  countryCode?: string
}

// 验证码相关接口
export interface SendEmailCodeRequest {
  email: string
  purpose: 'register' | 'login' | 'reset_password'
}

export interface SendPhoneCodeRequest {
  phone: string
  purpose: 'register' | 'login' | 'reset_password'
  countryCode?: string
}

// 密码找回相关接口
export interface ResetPasswordByEmailRequest {
  email: string
  emailCode: string
  newPassword: string
}

export interface ResetPasswordByPhoneRequest {
  phone: string
  phoneCode: string
  newPassword: string
  countryCode?: string
}

export interface VerifyCodeRequest {
  code: string
  phone?: string
  email?: string
  purpose: 'register' | 'login' | 'reset_password'
  countryCode?: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}

export interface CodeResponse {
  success: boolean
  message: string
  expiresIn: number // 过期时间（秒）
}

// ========================= API 接口 =========================

export const authApi = {
  // =============== 登录相关 ===============
  
  /**
   * 密码登录（支持手机号/邮箱）
   */
  passwordLogin: (data: PasswordLoginRequest) => 
    USE_MOCK 
      ? AuthMockManager.passwordLogin(data)
      : USE_SUPABASE
      ? supabaseAuthApi.passwordLogin(data)
      : apiClient.post<AuthResponse>('/auth/login/password', data),

  /**
   * 手机验证码登录
   */
  phoneCodeLogin: (data: PhoneCodeLoginRequest) => 
    USE_MOCK 
      ? AuthMockManager.phoneCodeLogin(data)
      : USE_TENCENT_SMS
      ? tencentSmsAuthApi.phoneCodeLogin(data)
      : USE_SUPABASE
      ? supabaseAuthApi.phoneCodeLogin(data)
      : apiClient.post<AuthResponse>('/auth/login/phone-code', data),

  // =============== 注册相关 ===============
  
  /**
   * 邮箱验证码注册
   */
  emailRegister: (data: EmailRegisterRequest) => 
    USE_MOCK 
      ? AuthMockManager.emailRegister(data)
      : USE_SUPABASE
      ? supabaseAuthApi.emailRegister(data)
      : apiClient.post<AuthResponse>('/auth/register/email', data),

  /**
   * 手机验证码注册
   */
  phoneRegister: (data: PhoneRegisterRequest) => 
    USE_MOCK 
      ? AuthMockManager.phoneRegister(data)
      : USE_TENCENT_SMS
      ? tencentSmsAuthApi.phoneRegister(data)
      : USE_SUPABASE
      ? supabaseAuthApi.phoneRegister(data)
      : apiClient.post<AuthResponse>('/auth/register/phone', data),

  // =============== 验证码相关 ===============
  
  /**
   * 发送邮箱验证码（使用Resend替代Supabase）
   */
  sendEmailCode: (data: SendEmailCodeRequest) => 
    USE_MOCK 
      ? AuthMockManager.sendEmailCode(data)
      : resendAuthApi.sendEmailCode(data), // 总是使用Resend，不再使用Supabase发送邮件

  /**
   * 发送手机验证码
   */
  sendPhoneCode: (data: SendPhoneCodeRequest) => 
    USE_MOCK 
      ? AuthMockManager.sendPhoneCode(data)
      : USE_TENCENT_SMS
      ? tencentSmsAuthApi.sendPhoneCode(data)
      : USE_SUPABASE
      ? supabaseAuthApi.sendPhoneCode(data)
      : apiClient.post<CodeResponse>('/auth/code/phone', data),

  /**
   * 验证验证码（邮箱使用Resend，手机使用腾讯云或Supabase）
   */
  verifyCode: (data: VerifyCodeRequest) => 
    USE_MOCK 
      ? AuthMockManager.verifyCode(data)
      : data.email 
      ? resendAuthApi.verifyCode(data) // 邮箱验证码使用Resend
      : USE_TENCENT_SMS
      ? tencentSmsAuthApi.verifyCode(data) // 手机验证码优先使用腾讯云
      : USE_SUPABASE
      ? supabaseAuthApi.verifyCode(data) // 手机验证码备用Supabase
      : apiClient.post<{ valid: boolean; message: string }>('/auth/code/verify', data),

  // =============== 密码找回 ===============
  
  /**
   * 通过邮箱重置密码（使用Resend验证）
   */
  resetPasswordByEmail: (data: ResetPasswordByEmailRequest) => 
    USE_MOCK 
      ? AuthMockManager.resetPasswordByEmail(data)
      : resendAuthApi.resetPasswordByEmail(data), // 使用Resend验证码

  /**
   * 通过手机重置密码
   */
  resetPasswordByPhone: (data: ResetPasswordByPhoneRequest) => 
    USE_MOCK 
      ? AuthMockManager.resetPasswordByPhone(data)
      : USE_TENCENT_SMS
      ? tencentSmsAuthApi.resetPasswordByPhone(data)
      : apiClient.post<{ success: boolean; message: string }>('/auth/password/reset/phone', data),

  // =============== 用户管理 ===============
  
  /**
   * 获取当前用户信息
   */
  getCurrentUser: () => 
    USE_MOCK 
      ? AuthMockManager.getCurrentUser()
      : USE_SUPABASE
      ? supabaseAuthApi.getCurrentUser()
      : apiClient.get<User>('/auth/me'),

  /**
   * 用户登出
   */
  logout: () => 
    USE_MOCK 
      ? AuthMockManager.logout()
      : USE_SUPABASE
      ? supabaseAuthApi.logout()
      : apiClient.post('/auth/logout'),

  /**
   * 刷新token
   */
  refreshToken: (refreshToken: string) => 
    USE_MOCK 
      ? AuthMockManager.refreshToken(refreshToken)
      : apiClient.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  /**
   * 检查账号是否存在
   */
  checkAccountExists: (account: string, type: 'email' | 'phone') => 
    USE_MOCK 
      ? AuthMockManager.checkAccountExists(account, type)
      : apiClient.post<{ exists: boolean; verified: boolean }>('/auth/check-account', { account, type }),
}

// ========================= 便捷方法（向后兼容） =========================

/**
 * @deprecated 请使用 authApi.sendPhoneCode 替代
 * 发送手机验证码（兼容旧版本）
 */
export const sendVerificationCode = async (phoneNumber: string, countryCode: string = '+86') => {
  const result = await authApi.sendPhoneCode({
    phone: phoneNumber,
    purpose: 'login',
    countryCode
  });
  
  if (!result.success) {
    throw new Error('error' in result ? result.error : '发送验证码失败');
  }
  
  return 'data' in result ? result.data : result;
};

/**
 * @deprecated 请使用 authApi.phoneCodeLogin 替代
 * 验证码登录（兼容旧版本）
 */
export const loginWithVerificationCode = async (phoneNumber: string, verificationCode: string, countryCode: string = '+86') => {
  const result = await authApi.phoneCodeLogin({
    phone: phoneNumber,
    code: verificationCode,
    countryCode
  });
  
  if (!result.success) {
    throw new Error('error' in result ? result.error : '验证码登录失败');
  }
  
  return 'data' in result ? result.data : result;
}; 