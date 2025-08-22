import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  generateToken, 
  generateRefreshToken, 
  formatPhoneNumber,
  type CustomUser,
  type CustomAuthResult 
} from '@/lib/custom-auth'

// 创建Supabase客户端用于数据库操作
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CustomPhoneCodeLoginRequest {
  mobile: string
  code: string
  countryCode?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CustomPhoneCodeLoginRequest = await request.json()
    const { mobile, code, countryCode = '+86' } = body

    console.log('📱 自定义手机验证码登录请求:', { mobile, countryCode })

    // 参数验证
    if (!mobile || !code) {
      return NextResponse.json({
        success: false,
        error: '手机号和验证码不能为空'
      }, { status: 400 })
    }

    // 手机号格式验证和格式化
    let phoneData
    try {
      phoneData = formatPhoneNumber(mobile, countryCode)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : '手机号格式不正确'
      }, { status: 400 })
    }

    // 验证验证码（使用Supabase存储的验证码）
    console.log('🔍 查询验证码参数:', { 
      mobile: phoneData.phone, 
      countryCode, 
      purpose: 'login', 
      currentTime: new Date().toISOString() 
    })
    
    const { data: verificationData, error: verifyError } = await supabase
      .from('sms_verification_codes')
      .select('*')
      .eq('phone', phoneData.phone)
      .eq('country_code', countryCode)
      .eq('purpose', 'login')
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    console.log('🔍 验证码查询结果:', { verificationData: !!verificationData, verifyError })

    if (verifyError || !verificationData) {
      console.log('❌ 验证码查询失败:', verifyError)
      return NextResponse.json({
        success: false,
        error: '验证码不存在或已过期'
      }, { status: 400 })
    }

    // 检查验证码是否正确
    if (verificationData.code !== code) {
      // 增加尝试次数
      await supabase
        .from('sms_verification_codes')
        .update({ attempts: verificationData.attempts + 1 })
        .eq('id', verificationData.id)

      return NextResponse.json({
        success: false,
        error: '验证码错误'
      }, { status: 400 })
    }

    // 检查尝试次数
    if (verificationData.attempts >= 5) {
      return NextResponse.json({
        success: false,
        error: '验证码错误次数过多，请重新获取'
      }, { status: 400 })
    }

    // 标记验证码为已使用
    await supabase
      .from('sms_verification_codes')
      .update({ used: true })
      .eq('id', verificationData.id)

    // 查询用户记录
    const { data: userData, error: userError } = await supabase
      .from('custom_users')
      .select('*')
      .eq('phone', phoneData.phone)
      .eq('country_code', countryCode)
      .single()

    console.log('🔍 用户查询结果:', { 
      found: !!userData, 
      error: userError?.message,
      phone: phoneData.phone 
    })

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        error: '用户不存在，请先注册'
      }, { status: 404 })
    }

    // 检查用户是否被禁用
    if (!userData.is_active) {
      return NextResponse.json({
        success: false,
        error: '账户已被禁用，请联系管理员'
      }, { status: 403 })
    }

    // 更新最后登录时间并清零登录失败次数
    await supabase
      .from('custom_users')
      .update({ 
        last_login_at: new Date().toISOString(),
        login_attempts: 0,
        locked_until: null
      })
      .eq('id', userData.id)

    console.log('✅ 自定义手机验证码登录成功:', { mobile: phoneData.phone, userId: userData.id })

    // 生成JWT token
    const token = generateToken({
      userId: userData.id,
      phone: phoneData.phoneWithCountryCode,
      name: userData.name || '用户',
      role: userData.role
    })

    const refreshToken = generateRefreshToken(userData.id)

    // 构建用户对象
    const user: CustomUser = {
      id: userData.id,
      phone: phoneData.phone,
      countryCode: userData.country_code,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      avatarUrl: userData.avatar_url,
      createdAt: userData.created_at,
      lastLoginAt: new Date().toISOString(), // 使用当前时间
      isActive: userData.is_active,
      userMetadata: userData.user_metadata || {}
    }

    const authResult: CustomAuthResult = {
      user,
      token,
      refreshToken
    }

    return NextResponse.json({
      success: true,
      data: authResult
    })

  } catch (error) {
    console.error('❌ 自定义手机验证码登录失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '服务器错误，请稍后重试'
    }, { status: 500 })
  }
}