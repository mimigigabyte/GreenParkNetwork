import { createClient } from '@supabase/supabase-js'

import { sanitizeHeaderValue } from './header-utils'

// Supabase 配置 - 清理环境变量中的无效字符
const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpeanozckghazlzzhrni.supabase.co'
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODU4NTAsImV4cCI6MjA2OTg2MTg1MH0.LaJALEd_KP6LLaKEjRo7zuwjCA6Bbt_2QpSWPmbyw1I'
const rawSupabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'

// 清理配置值，移除可能的无效字符
const supabaseUrl = sanitizeHeaderValue(rawSupabaseUrl)
const supabaseAnonKey = sanitizeHeaderValue(rawSupabaseAnonKey)
const supabaseServiceRoleKey = sanitizeHeaderValue(rawSupabaseServiceRoleKey)

// 环境检测
const isVercel = process.env.VERCEL === '1'
const isProduction = process.env.NODE_ENV === 'production'

// 详细的环境信息日志
console.log('🌍 Supabase 环境配置:', {
  isVercel,
  isProduction,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlDomain: supabaseUrl ? new URL(supabaseUrl).hostname : 'unknown',
  environment: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV
})

// 验证必要的配置
if (!supabaseUrl || supabaseUrl === 'undefined') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing or undefined')
}
if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or undefined')
}

// 验证配置值
if (!supabaseUrl || supabaseUrl.length < 10) {
  console.error('❌ Supabase URL 无效:', { url: supabaseUrl, length: supabaseUrl?.length })
}
if (!supabaseAnonKey || supabaseAnonKey.length < 10) {
  console.error('❌ Supabase Anon Key 无效:', { key: supabaseAnonKey?.substring(0, 20) + '...', length: supabaseAnonKey?.length })
}

// 创建安全的客户端headers
const createSafeClientHeaders = () => {
  try {
    const headers: Record<string, string> = {}
    
    // 只添加安全的headers
    const clientInfo = sanitizeHeaderValue(`supabase-js-web@${isVercel ? 'vercel' : 'local'}`)
    if (clientInfo) {
      headers['x-client-info'] = clientInfo
    }
    
    return headers
  } catch (error) {
    console.warn('创建客户端headers失败:', error)
    return {}
  }
}

// 创建 Supabase 客户端 - 增强安全配置
export const supabase = (() => {
  try {
    console.log('🔧 创建Supabase客户端:', {
      url: supabaseUrl?.substring(0, 30) + '...',
      keyLength: supabaseAnonKey?.length,
      isVercel,
      isProduction
    })
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: !isVercel, // Vercel环境下禁用持久化
        detectSessionInUrl: false, // 禁用URL检测避免问题
        flowType: 'pkce' // 使用安全的PKCE流程
      },
      global: {
        headers: createSafeClientHeaders()
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 2 // 限制实时事件频率
        }
      }
    })
  } catch (error) {
    console.error('❌ 创建Supabase客户端失败:', error)
    // 返回一个最小化的客户端作为fallback
    return createClient('https://fallback.supabase.co', 'fallback-key')
  }
})()

// 创建管理员客户端（用于服务端操作）
export const supabaseAdmin = (() => {
  try {
    if (!supabaseServiceRoleKey || supabaseServiceRoleKey.length < 10) {
      console.warn('⚠️ Supabase Service Role Key 无效，跳过管理员客户端创建')
      return null
    }
    
    console.log('🔧 创建Supabase管理员客户端')
    
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: createSafeClientHeaders()
      },
      db: {
        schema: 'public'
      }
    })
  } catch (error) {
    console.error('❌ 创建Supabase管理员客户端失败:', error)
    return null
  }
})()

// 类型定义
export interface SupabaseUser {
  id: string
  email?: string
  phone?: string
  name?: string
  avatar?: string
  role?: string
  email_verified?: boolean
  phone_verified?: boolean
  created_at?: string
  updated_at?: string
}

export interface SupabaseAuthResponse {
  user: SupabaseUser | null
  session: { access_token: string; refresh_token: string; user: SupabaseUser } | null
  error: { message: string; status?: number } | null
}