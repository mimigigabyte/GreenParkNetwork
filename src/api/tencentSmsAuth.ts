import { apiClient } from './index'
import type {
  SendPhoneCodeRequest,
  PhoneCodeLoginRequest,
  PhoneRegisterRequest,
  ResetPasswordByPhoneRequest,
  VerifyCodeRequest,
  AuthResponse,
  CodeResponse,
  User
} from './auth'

/**
 * 腾讯云短信认证API接口
 */
export const tencentSmsAuthApi = {
  /**
   * 发送手机验证码（使用腾讯云短信服务）
   */
  sendPhoneCode: async (data: SendPhoneCodeRequest) => {
    try {
      const response = await fetch('/api/auth/send-sms-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || '发送验证码失败'
        }
      }

      const result = await response.json()
      return {
        success: true,
        data: {
          success: true,
          message: result.data?.message || '验证码已发送',
          expiresIn: result.data?.expiresIn || 300
        }
      }
    } catch (error) {
      console.error('发送短信验证码失败:', error)
      return {
        success: false,
        error: '网络错误，请稍后重试'
      }
    }
  },

  /**
   * 手机验证码登录（使用腾讯云短信服务）
   */
  phoneCodeLogin: async (data: PhoneCodeLoginRequest) => {
    try {
      const response = await fetch('/api/auth/login-sms-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || '登录失败'
        }
      }

      const result = await response.json()
      return {
        success: true,
        data: {
          user: result.data.user,
          token: result.data.token,
          refreshToken: result.data.refreshToken
        }
      }
    } catch (error) {
      console.error('手机验证码登录失败:', error)
      return {
        success: false,
        error: '网络错误，请稍后重试'
      }
    }
  },

  /**
   * 验证手机验证码
   */
  verifyCode: async (data: VerifyCodeRequest) => {
    try {
      const response = await fetch('/api/auth/verify-sms-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || '验证码验证失败'
        }
      }

      const result = await response.json()
      return {
        success: true,
        data: {
          valid: true,
          message: result.data?.message || '验证成功'
        }
      }
    } catch (error) {
      console.error('验证码验证失败:', error)
      return {
        success: false,
        error: '网络错误，请稍后重试'
      }
    }
  },

  /**
   * 手机验证码注册（使用腾讯云短信服务）
   */
  phoneRegister: async (data: PhoneRegisterRequest) => {
    try {
      const response = await fetch('/api/auth/phone-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: data.phone,
          code: data.phoneCode,
          password: data.password,
          name: data.name,
          countryCode: data.countryCode
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || '注册失败'
        }
      }

      const result = await response.json()
      return {
        success: true,
        data: {
          user: result.data.user,
          token: result.data.token,
          refreshToken: result.data.refreshToken
        }
      }
    } catch (error) {
      console.error('手机号注册失败:', error)
      return {
        success: false,
        error: '网络错误，请稍后重试'
      }
    }
  },

  /**
   * 通过手机验证码重置密码（使用腾讯云短信服务）
   */
  resetPasswordByPhone: async (data: ResetPasswordByPhoneRequest) => {
    try {
      // 首先验证验证码
      const verifyResult = await tencentSmsAuthApi.verifyCode({
        phone: data.phone,
        code: data.phoneCode,
        purpose: 'reset_password',
        countryCode: data.countryCode
      })

      if (!verifyResult.success) {
        return verifyResult
      }

      // 重置密码 - 这里可以集成现有的密码重置逻辑
      // 暂时返回模拟数据，实际应该调用密码重置API
      return {
        success: false,
        error: '手机号重置密码功能正在开发中'
      }
    } catch (error) {
      console.error('手机号重置密码失败:', error)
      return {
        success: false,
        error: '网络错误，请稍后重试'
      }
    }
  }
}