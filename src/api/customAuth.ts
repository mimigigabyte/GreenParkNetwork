/**
 * 自定义认证API客户端
 * 提供手机验证码注册、登录、验证码登录等功能
 */

import { safeFetch, handleApiResponse } from '@/lib/safe-fetch'
import { type CustomUser, type CustomAuthResult } from '@/lib/custom-auth'

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// 注册请求接口
export interface CustomPhoneRegisterRequest {
  phone: string
  phoneCode: string
  password: string
  name?: string
  countryCode?: string
}

// 密码登录请求接口
export interface CustomPhoneLoginRequest {
  phone: string
  password: string
  countryCode?: string
  turnstileToken?: string
}

// 验证码登录请求接口
export interface CustomPhoneCodeLoginRequest {
  phone: string
  code: string
  countryCode?: string
  turnstileToken?: string
}

/**
 * 自定义认证API
 */
export const customAuthApi = {
  
  /**
   * 手机验证码注册
   */
  async phoneRegister(data: CustomPhoneRegisterRequest): Promise<ApiResponse<CustomAuthResult>> {
    try {
      console.log('📱 自定义手机验证码注册请求:', { 
        phone: data.phone, 
        countryCode: data.countryCode,
        hasPassword: !!data.password 
      })

      const response = await safeFetch('/api/auth/custom-phone-register', {
        method: 'POST',
        body: JSON.stringify({
          mobile: data.phone,
          code: data.phoneCode,
          password: data.password,
          name: data.name,
          countryCode: data.countryCode
        })
      })

      const result = await handleApiResponse(response)
      
      // 如果注册成功，保存认证信息
      if (result.success && result.data) {
        console.log('✅ 自定义注册成功，保存认证信息')
        localStorage.setItem('custom_auth_token', result.data.token)
        localStorage.setItem('custom_refresh_token', result.data.refreshToken)
        localStorage.setItem('custom_user', JSON.stringify(result.data.user))
      }

      return result
    } catch (error) {
      console.error('❌ 自定义手机验证码注册失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '注册失败，请稍后重试'
      }
    }
  },

  /**
   * 手机号密码登录
   */
  async phoneLogin(data: CustomPhoneLoginRequest): Promise<ApiResponse<CustomAuthResult>> {
    try {
      console.log('📱 自定义手机号密码登录请求:', { 
        phone: data.phone, 
        countryCode: data.countryCode 
      })

      const response = await safeFetch('/api/auth/custom-phone-login', {
        method: 'POST',
        body: JSON.stringify({
          mobile: data.phone,
          password: data.password,
          countryCode: data.countryCode,
          turnstileToken: data.turnstileToken
        })
      })

      const result = await handleApiResponse(response)
      
      // 如果登录成功，保存认证信息
      if (result.success && result.data) {
        console.log('✅ 自定义密码登录成功，保存认证信息')
        localStorage.setItem('custom_auth_token', result.data.token)
        localStorage.setItem('custom_refresh_token', result.data.refreshToken)
        localStorage.setItem('custom_user', JSON.stringify(result.data.user))
      }

      return result
    } catch (error) {
      console.error('❌ 自定义手机号密码登录失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '登录失败，请稍后重试'
      }
    }
  },

  /**
   * 手机验证码登录
   */
  async phoneCodeLogin(data: CustomPhoneCodeLoginRequest): Promise<ApiResponse<CustomAuthResult>> {
    try {
      console.log('📱 自定义手机验证码登录请求:', { 
        phone: data.phone, 
        countryCode: data.countryCode 
      })

      const response = await safeFetch('/api/auth/custom-phone-code-login', {
        method: 'POST',
        body: JSON.stringify({
          mobile: data.phone,
          code: data.code,
          countryCode: data.countryCode,
          turnstileToken: data.turnstileToken
        })
      })

      const result = await handleApiResponse(response)
      
      // 如果登录成功，保存认证信息
      if (result.success && result.data) {
        console.log('✅ 自定义验证码登录成功，保存认证信息')
        localStorage.setItem('custom_auth_token', result.data.token)
        localStorage.setItem('custom_refresh_token', result.data.refreshToken)
        localStorage.setItem('custom_user', JSON.stringify(result.data.user))
      }

      return result
    } catch (error) {
      console.error('❌ 自定义手机验证码登录失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '登录失败，请稍后重试'
      }
    }
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<ApiResponse<CustomUser>> {
    try {
      const token = localStorage.getItem('custom_auth_token')
      const userStr = localStorage.getItem('custom_user')
      
      if (!token || !userStr) {
        return {
          success: false,
          error: '用户未登录'
        }
      }

      // 简单的token过期检查（解析JWT payload）
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const now = Math.floor(Date.now() / 1000)
        
        if (payload.exp && payload.exp < now) {
          // Token已过期，尝试刷新
          return await this.refreshToken()
        }
      } catch (parseError) {
        console.warn('Token解析失败:', parseError)
        return {
          success: false,
          error: 'Token格式错误'
        }
      }

      const user = JSON.parse(userStr) as CustomUser
      return {
        success: true,
        data: user
      }
    } catch (error) {
      console.error('❌ 获取当前用户失败:', error)
      return {
        success: false,
        error: '获取用户信息失败'
      }
    }
  },

  /**
   * 刷新Token
   */
  async refreshToken(): Promise<ApiResponse<CustomUser>> {
    try {
      const refreshToken = localStorage.getItem('custom_refresh_token')
      
      if (!refreshToken) {
        return {
          success: false,
          error: 'Refresh token不存在'
        }
      }

      const response = await safeFetch('/api/auth/custom-refresh-token', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken
        })
      })

      const result = await handleApiResponse(response)
      
      if (result.success && result.data) {
        localStorage.setItem('custom_auth_token', result.data.token)
        if (result.data.refreshToken) {
          localStorage.setItem('custom_refresh_token', result.data.refreshToken)
        }
        
        return {
          success: true,
          data: result.data.user
        }
      }

      return result
    } catch (error) {
      console.error('❌ 刷新Token失败:', error)
      // Token刷新失败，清理本地存储
      this.logout()
      return {
        success: false,
        error: '会话已过期，请重新登录'
      }
    }
  },

  /**
   * 登出
   */
  logout(): void {
    console.log('🚪 自定义认证登出')
    localStorage.removeItem('custom_auth_token')
    localStorage.removeItem('custom_refresh_token')
    localStorage.removeItem('custom_user')
  },

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('custom_auth_token')
    const user = localStorage.getItem('custom_user')
    return !!(token && user)
  },

  /**
   * 获取认证Token
   */
  getAuthToken(): string | null {
    return localStorage.getItem('custom_auth_token')
  },

  /**
   * 监听认证状态变化
   */
  onAuthStateChange(callback: (user: CustomUser | null) => void) {
    // 监听localStorage变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'custom_user') {
        if (e.newValue) {
          try {
            const user = JSON.parse(e.newValue) as CustomUser
            callback(user)
          } catch (error) {
            console.error('解析用户信息失败:', error)
            callback(null)
          }
        } else {
          callback(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // 返回清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }
}