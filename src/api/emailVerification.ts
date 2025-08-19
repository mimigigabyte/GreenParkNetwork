import { apiClient, ApiResponse } from './index'

// 邮件验证码相关接口类型定义
export interface SendEmailCodeRequest {
  email: string
}

export interface VerifyEmailCodeRequest {
  email: string
  code: string
}

export interface EmailRegisterRequest {
  email: string
  password: string
  code: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'user'
    createdAt: string
    emailVerified: boolean
    phoneVerified: boolean
  }
  token: string
  refreshToken?: string
}

export interface CodeResponse {
  success: boolean
  message: string
  devOTP?: string // 开发模式下返回的验证码
  attemptsLeft?: number // 剩余尝试次数
}

// 邮件验证码 API
export const emailVerificationApi = {
  
  /**
   * 发送邮箱验证码
   */
  async sendCode(data: SendEmailCodeRequest): Promise<ApiResponse<CodeResponse>> {
    try {
      const response = await fetch('/api/email-verification/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '发送验证码失败'
        };
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
  },

  /**
   * 验证邮箱验证码
   */
  async verifyCode(data: VerifyEmailCodeRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch('/api/email-verification/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '验证码验证失败',
          attemptsLeft: result.attemptsLeft
        };
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
  },

  /**
   * 邮箱验证码注册
   */
  async register(data: EmailRegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch('/api/email-verification/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '注册失败'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误'
      };
    }
  }
}