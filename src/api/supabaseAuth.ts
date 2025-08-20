import { supabase } from '@/lib/supabase'
import { ApiResponse } from './index'

// 类型定义（与后端保持一致）
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

export interface SendEmailCodeRequest {
  email: string
  purpose: 'register' | 'login' | 'reset_password'
}

export interface SendPhoneCodeRequest {
  phone: string
  purpose: 'register' | 'login' | 'reset_password'
  countryCode?: string
}

export interface VerifyCodeRequest {
  code: string
  phone?: string
  email?: string
  purpose: 'register' | 'login' | 'reset_password'
  countryCode?: string
}

export interface EmailRegisterRequest {
  email: string
  emailCode: string
  password: string
  name?: string
}

export interface PhoneRegisterRequest {
  phone: string
  phoneCode: string
  password: string
  name?: string
  countryCode?: string
}

export interface PhoneCodeLoginRequest {
  phone: string
  code: string
  countryCode?: string
}

// Supabase 认证 API
export const supabaseAuthApi = {
  
  /**
   * 邮箱密码登录
   */
  async passwordLogin(data: { account: string; password: string; type: 'email' | 'phone' }): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('🔐 密码登录尝试:', { 
        account: data.account, 
        type: data.type, 
        hasPassword: !!data.password,
        passwordLength: data.password?.length 
      })

      // 检查Supabase客户端是否正确初始化
      if (!supabase) {
        console.error('❌ Supabase客户端未初始化')
        return {
          success: false,
          error: 'Supabase客户端配置错误'
        }
      }

      // 检查Supabase URL和Key
      console.log('🔧 Supabase配置检查:', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      })

      // 输入验证
      if (!data.account || !data.password) {
        console.error('❌ 登录参数为空:', { account: !!data.account, password: !!data.password })
        return {
          success: false,
          error: '账号和密码不能为空'
        }
      }

      // 清理输入数据
      const cleanAccount = String(data.account).trim()
      const cleanPassword = String(data.password)

      // 验证清理后的数据
      if (!cleanAccount || !cleanPassword) {
        console.error('❌ 清理后的登录参数为空:', { cleanAccount: !!cleanAccount, cleanPassword: !!cleanPassword })
        return {
          success: false,
          error: '账号和密码不能为空'
        }
      }

      // 检查密码是否包含可能导致问题的字符
      console.log('🔍 密码安全检查:', {
        length: cleanPassword.length,
        hasSpecialChars: /[^\w@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(cleanPassword),
        hasNullBytes: cleanPassword.includes('\0'),
        isValidString: typeof cleanPassword === 'string'
      })

      // 检查是否包含null字节或其他可能导致fetch问题的字符
      if (cleanPassword.includes('\0') || cleanAccount.includes('\0')) {
        console.error('❌ 参数包含null字节')
        return {
          success: false,
          error: '输入参数格式不正确'
        }
      }

      // 根据类型确定登录方式并调用相应的API
      let authData: any, error: any
      
      if (data.type === 'phone') {
        // 手机号登录，确保包含国家代码
        const phoneWithCountryCode = cleanAccount.startsWith('+') 
          ? cleanAccount 
          : `+86${cleanAccount}`
        
        console.log('📱 手机号登录参数:', { phone: phoneWithCountryCode })
        
        // 验证手机号格式
        const phoneRegex = /^\+\d{1,4}\d{7,15}$/
        if (!phoneRegex.test(phoneWithCountryCode)) {
          console.error('❌ 手机号格式错误:', phoneWithCountryCode)
          return {
            success: false,
            error: '手机号格式不正确'
          }
        }
        
        try {
          console.log('🚀 准备调用Supabase手机号登录...')
          const loginParams = {
            phone: phoneWithCountryCode,
            password: cleanPassword
          }
          console.log('📝 登录参数:', { phone: loginParams.phone, hasPassword: !!loginParams.password })
          
          const result = await supabase.auth.signInWithPassword(loginParams)
          authData = result.data
          error = result.error
          console.log('📱 手机号登录结果:', { success: !!authData?.user, error: error?.message })
        } catch (fetchError) {
          console.error('❌ 手机号登录fetch错误:', fetchError)
          console.error('🔍 错误详情:', {
            name: fetchError instanceof Error ? fetchError.name : 'Unknown',
            message: fetchError instanceof Error ? fetchError.message : String(fetchError),
            stack: fetchError instanceof Error ? fetchError.stack : 'No stack'
          })
          
          // 尝试使用API路由作为备用方案
          console.log('🔄 尝试使用API路由备用方案...')
          try {
            const response = await fetch('/api/auth/phone-login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                mobile: phoneWithCountryCode,
                code: '000000' // 临时验证码，实际应该从其他地方获取
              })
            })
            
            if (response.ok) {
              const apiResult = await response.json()
              console.log('✅ API路由登录成功')
              return {
                success: true,
                data: apiResult.data
              }
            }
          } catch (apiError) {
            console.error('❌ API路由也失败了:', apiError)
          }
          
          return {
            success: false,
            error: `登录请求失败: ${fetchError instanceof Error ? fetchError.message : '未知错误'}`
          }
        }
      } else {
        // 邮箱登录
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(cleanAccount)) {
          console.error('❌ 邮箱格式错误:', cleanAccount)
          return {
            success: false,
            error: '邮箱格式不正确'
          }
        }
        
        console.log('📧 邮箱登录参数:', { email: cleanAccount })
        
        try {
          console.log('🚀 准备调用Supabase邮箱登录...')
          const loginParams = {
            email: cleanAccount,
            password: cleanPassword
          }
          console.log('📝 登录参数:', { email: loginParams.email, hasPassword: !!loginParams.password })
          
          const result = await supabase.auth.signInWithPassword(loginParams)
          authData = result.data
          error = result.error
          console.log('📧 邮箱登录结果:', { success: !!authData?.user, error: error?.message })
        } catch (fetchError) {
          console.error('❌ 邮箱登录fetch错误:', fetchError)
          console.error('🔍 错误详情:', {
            name: fetchError instanceof Error ? fetchError.name : 'Unknown',
            message: fetchError instanceof Error ? fetchError.message : String(fetchError),
            stack: fetchError instanceof Error ? fetchError.stack : 'No stack'
          })
          
          // 对于邮箱登录，目前没有API备用方案，直接返回错误
          return {
            success: false,
            error: `邮箱登录失败: ${fetchError instanceof Error ? fetchError.message : '未知网络错误'}`
          }
        }
      }
      
      if (error) {
        return {
          success: false,
          error: error.message
        }
      }
      
      if (authData.user && authData.session) {
        // 转换为应用的用户格式
        const user: User = {
          id: authData.user.id,
          email: authData.user.email,
          phone: authData.user.phone,
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || '用户',
          role: 'user',
          createdAt: authData.user.created_at,
          emailVerified: authData.user.email_confirmed_at != null,
          phoneVerified: authData.user.phone_confirmed_at != null
        }
        
        const response: AuthResponse = {
          user,
          token: authData.session.access_token,
          refreshToken: authData.session.refresh_token
        }
        
        return {
          success: true,
          data: response
        }
      }
      
      return {
        success: false,
        error: '登录失败'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '邮箱登录失败'
      }
    }
  },

  /**
   * 发送邮箱验证码（已禁用 - 使用Resend替代）
   */
  async sendEmailCode(): Promise<ApiResponse<{ message: string }>> {
    // 不再使用Supabase发送邮件，返回提示信息
    return {
      success: false,
      error: '邮箱验证码发送功能已迁移至Resend服务，请使用resendAuth.sendEmailCode'
    }
  },

  /**
   * 发送手机验证码
   */
  async sendPhoneCode(data: SendPhoneCodeRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      // 输入验证
      if (!data.phone) {
        return {
          success: false,
          error: '手机号不能为空'
        }
      }

      // 确保手机号包含国家代码
      const phoneWithCountryCode = data.phone.startsWith('+') 
        ? data.phone 
        : `${data.countryCode || '+86'}${data.phone}`
      
      // 验证手机号格式
      const phoneRegex = /^\+\d{1,4}\d{7,15}$/
      if (!phoneRegex.test(phoneWithCountryCode)) {
        return {
          success: false,
          error: '手机号格式不正确'
        }
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneWithCountryCode,
        options: {
          shouldCreateUser: data.purpose === 'register'
        }
      })
      
      if (error) {
        return {
          success: false,
          error: error.message
        }
      }
      
      return {
        success: true,
        data: { message: '手机验证码发送成功' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '发送手机验证码失败'
      }
    }
  },

  /**
   * 验证码验证
   */
  async verifyCode(data: VerifyCodeRequest): Promise<ApiResponse<{ valid: boolean; message: string }>> {
    try {
      let result
      
      if (data.email) {
        result = await supabase.auth.verifyOtp({
          email: data.email,
          token: data.code,
          type: 'email'
        })
      } else if (data.phone) {
        result = await supabase.auth.verifyOtp({
          phone: data.phone,
          token: data.code,
          type: 'sms'
        })
      } else {
        return {
          success: false,
          error: '请提供邮箱或手机号'
        }
      }
      
      if (result.error) {
        return {
          success: false,
          error: result.error.message === 'Token has expired or is invalid' 
            ? '验证码已过期或无效，请重新获取' 
            : result.error.message
        }
      }
      
      return {
        success: true,
        data: { 
          message: '验证码验证成功',
          valid: true
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '验证码验证失败'
      }
    }
  },

  /**
   * 邮箱验证码注册
   */
  async emailRegister(data: EmailRegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const { data: authData, error } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.emailCode,
        type: 'email'
      })
      
      if (error) {
        return {
          success: false,
          error: error.message
        }
      }
      
      if (authData.user && authData.session) {
        // 转换为应用的用户格式
        const user: User = {
          id: authData.user.id,
          email: authData.user.email,
          name: data.name || authData.user.email?.split('@')[0] || '用户',
          role: 'user',
          createdAt: authData.user.created_at,
          emailVerified: authData.user.email_confirmed_at != null,
          phoneVerified: authData.user.phone_confirmed_at != null
        }
        
        const response: AuthResponse = {
          user,
          token: authData.session.access_token,
          refreshToken: authData.session.refresh_token
        }
        
        return {
          success: true,
          data: response
        }
      }
      
      return {
        success: false,
        error: '注册失败'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '邮箱注册失败'
      }
    }
  },

  /**
   * 手机验证码注册
   */
  async phoneRegister(data: PhoneRegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // 输入验证
      if (!data.phone || !data.phoneCode) {
        return {
          success: false,
          error: '手机号和验证码不能为空'
        }
      }

      // 确保手机号包含国家代码
      const phoneWithCountryCode = data.phone.startsWith('+') 
        ? data.phone 
        : `${data.countryCode || '+86'}${data.phone}`
      
      // 验证手机号格式
      const phoneRegex = /^\+\d{1,4}\d{7,15}$/
      if (!phoneRegex.test(phoneWithCountryCode)) {
        return {
          success: false,
          error: '手机号格式不正确'
        }
      }

      // 验证验证码格式
      if (!/^\d{6}$/.test(data.phoneCode)) {
        return {
          success: false,
          error: '验证码格式不正确'
        }
      }
      
      const { data: authData, error } = await supabase.auth.verifyOtp({
        phone: phoneWithCountryCode,
        token: data.phoneCode,
        type: 'sms'
      })
      
      if (error) {
        return {
          success: false,
          error: error.message
        }
      }
      
      if (authData.user && authData.session) {
        // 转换为应用的用户格式
        const user: User = {
          id: authData.user.id,
          phone: authData.user.phone,
          name: data.name || '用户' + Date.now(),
          role: 'user',
          createdAt: authData.user.created_at,
          emailVerified: authData.user.email_confirmed_at != null,
          phoneVerified: authData.user.phone_confirmed_at != null
        }
        
        const response: AuthResponse = {
          user,
          token: authData.session.access_token,
          refreshToken: authData.session.refresh_token
        }
        
        return {
          success: true,
          data: response
        }
      }
      
      return {
        success: false,
        error: '注册失败'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '手机注册失败'
      }
    }
  },

  /**
   * 手机验证码登录
   */
  async phoneCodeLogin(data: PhoneCodeLoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // 输入验证
      if (!data.phone || !data.code) {
        return {
          success: false,
          error: '手机号和验证码不能为空'
        }
      }

      // 确保手机号包含国家代码
      const phoneWithCountryCode = data.phone.startsWith('+') 
        ? data.phone 
        : `${data.countryCode || '+86'}${data.phone}`
      
      // 验证手机号格式
      const phoneRegex = /^\+\d{1,4}\d{7,15}$/
      if (!phoneRegex.test(phoneWithCountryCode)) {
        return {
          success: false,
          error: '手机号格式不正确'
        }
      }

      // 验证验证码格式
      if (!/^\d{6}$/.test(data.code)) {
        return {
          success: false,
          error: '验证码格式不正确'
        }
      }
      
      const { data: authData, error } = await supabase.auth.verifyOtp({
        phone: phoneWithCountryCode,
        token: data.code,
        type: 'sms'
      })
      
      if (error) {
        return {
          success: false,
          error: error.message
        }
      }
      
      if (authData.user && authData.session) {
        // 转换为应用的用户格式
        const user: User = {
          id: authData.user.id,
          phone: authData.user.phone,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || '用户',
          role: 'user',
          createdAt: authData.user.created_at,
          emailVerified: authData.user.email_confirmed_at != null,
          phoneVerified: authData.user.phone_confirmed_at != null
        }
        
        const response: AuthResponse = {
          user,
          token: authData.session.access_token,
          refreshToken: authData.session.refresh_token
        }
        
        return {
          success: true,
          data: response
        }
      }
      
      return {
        success: false,
        error: '登录失败'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '手机验证码登录失败'
      }
    }
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        return {
          success: false,
          error: error.message
        }
      }
      
      if (user) {
        const currentUser: User = {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.user_metadata?.name || user.email?.split('@')[0] || '用户',
          role: 'user',
          createdAt: user.created_at,
          emailVerified: user.email_confirmed_at != null,
          phoneVerified: user.phone_confirmed_at != null
        }
        
        return {
          success: true,
          data: currentUser
        }
      }
      
      return {
        success: false,
        error: '用户未登录'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户信息失败'
      }
    }
  },

  /**
   * 用户登出
   */
  async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return {
          success: false,
          error: error.message
        }
      }
      
      return {
        success: true,
        data: { message: '登出成功' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '登出失败'
      }
    }
  },

  /**
   * 监听认证状态变化
   */
  onAuthStateChange(callback: (user: User | null, session: unknown) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email,
          phone: session.user.phone,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '用户',
          role: 'user',
          createdAt: session.user.created_at,
          emailVerified: session.user.email_confirmed_at != null,
          phoneVerified: session.user.phone_confirmed_at != null
        }
        callback(user, session)
      } else {
        callback(null, null)
      }
    })
  }
}