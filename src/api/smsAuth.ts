import { ApiResponse } from './index'

// ========================= 类型定义 =========================

export interface SendSmsCodeRequest {
  mobile: string
  purpose: 'register' | 'login' | 'reset_password'
}

export interface VerifySmsCodeRequest {
  mobile: string
  code: string
  purpose: 'register' | 'login' | 'reset_password'
}

export interface PhoneRegisterRequest {
  mobile: string
  code: string
  password: string
  name?: string
}

export interface PhoneLoginRequest {
  mobile: string
  code: string
}

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

export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}

export interface SmsResponse {
  message: string
  expiresIn: number
}

export interface VerifyResponse {
  message: string
  mobile: string
  purpose: string
  attemptsLeft?: number
}

// ========================= API 接口 =========================

export const smsAuthApi = {
  /**
   * 发送短信验证码
   */
  async sendSmsCode(data: SendSmsCodeRequest): Promise<ApiResponse<SmsResponse>> {
    try {
      const response = await fetch('/api/sms/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '发送验证码失败'
        }
      }

      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  },

  /**
   * 验证短信验证码
   */
  async verifySmsCode(data: VerifySmsCodeRequest): Promise<ApiResponse<VerifyResponse>> {
    try {
      const response = await fetch('/api/sms/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '验证码验证失败',
          attemptsLeft: result.attemptsLeft
        }
      }

      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  },

  /**
   * 手机验证码注册
   */
  async phoneRegister(data: PhoneRegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch('/api/auth/phone-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '注册失败'
        }
      }

      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  },

  /**
   * 手机验证码登录
   */
  async phoneLogin(data: PhoneLoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '登录失败'
        }
      }

      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      }
    }
  }
}