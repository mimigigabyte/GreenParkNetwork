import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  verifyRefreshToken,
  generateToken, 
  generateRefreshToken,
  type CustomUser,
  type CustomAuthResult 
} from '@/lib/custom-auth'

// 创建Supabase客户端用于数据库操作
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface RefreshTokenRequest {
  refreshToken: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RefreshTokenRequest = await request.json()
    const { refreshToken } = body

    console.log('🔄 刷新Token请求')

    // 参数验证
    if (!refreshToken) {
      return NextResponse.json({
        success: false,
        error: 'Refresh token不能为空'
      }, { status: 400 })
    }

    // 验证refresh token
    let userId: string
    try {
      userId = verifyRefreshToken(refreshToken)
    } catch (error) {
      console.log('❌ Refresh token验证失败:', error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Refresh token无效'
      }, { status: 401 })
    }

    // 查询用户记录
    const { data: userData, error: userError } = await supabase
      .from('custom_users')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('🔍 用户查询结果:', { 
      found: !!userData, 
      error: userError?.message,
      userId 
    })

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        error: '用户不存在'
      }, { status: 404 })
    }

    // 检查用户是否被禁用
    if (!userData.is_active) {
      return NextResponse.json({
        success: false,
        error: '账户已被禁用，请联系管理员'
      }, { status: 403 })
    }

    console.log('✅ Refresh token验证成功，生成新Token')

    // 生成新的JWT token
    const phoneWithCountryCode = `${userData.country_code}${userData.phone}`
    const newToken = generateToken({
      userId: userData.id,
      phone: phoneWithCountryCode,
      name: userData.name || '用户',
      role: userData.role
    })

    // 生成新的refresh token（可选，通常refresh token有更长的有效期）
    const newRefreshToken = generateRefreshToken(userData.id)

    // 构建用户对象
    const user: CustomUser = {
      id: userData.id,
      phone: userData.phone,
      countryCode: userData.country_code,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      avatarUrl: userData.avatar_url,
      createdAt: userData.created_at,
      lastLoginAt: userData.last_login_at,
      isActive: userData.is_active,
      userMetadata: userData.user_metadata || {}
    }

    const authResult: CustomAuthResult = {
      user,
      token: newToken,
      refreshToken: newRefreshToken
    }

    return NextResponse.json({
      success: true,
      data: authResult
    })

  } catch (error) {
    console.error('❌ 刷新Token失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '服务器错误，请稍后重试'
    }, { status: 500 })
  }
}