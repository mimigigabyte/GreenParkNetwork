import { createClient } from '@supabase/supabase-js'

// Supabase 配置 - 优先使用环境变量，Vercel兼容
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODU4NTAsImV4cCI6MjA2OTg2MTg1MH0.LaJALEd_KP6LLaKEjRo7zuwjCA6Bbt_2QpSWPmbyw1I'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'

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

// 创建 Supabase 客户端 - Vercel优化配置
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: !isVercel, // Vercel环境下可能需要禁用持久化
    detectSessionInUrl: !isVercel, // Vercel环境下可能导致问题
    flowType: 'pkce' // 使用更安全的PKCE流程
  },
  global: {
    headers: {
      'x-client-info': `supabase-js-web@${isVercel ? 'vercel' : 'local'}`
    }
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

// 创建管理员客户端（用于服务端操作）
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

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