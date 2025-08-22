import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  verifyPassword, 
  generateToken, 
  generateRefreshToken, 
  formatPhoneNumber,
  checkAccountLock,
  type CustomUser,
  type CustomAuthResult 
} from '@/lib/custom-auth'
import { verifyTurnstileToken, extractIpAddress } from '@/lib/turnstile-verification'

// 创建Supabase客户端用于数据库操作
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CustomPhoneLoginRequest {
  mobile: string
  password: string
  countryCode?: string
  turnstileToken?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CustomPhoneLoginRequest = await request.json()
    const { mobile, password, countryCode = '+86', turnstileToken } = body

    console.log('📱 自定义手机密码登录请求:', { mobile, countryCode })

    // Turnstile人机验证（如果配置了）
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      console.log('🛡️ 开始Turnstile验证...')
      const clientIp = extractIpAddress(request)
      const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp)
      
      if (!turnstileResult.success) {
        console.log('❌ Turnstile验证失败:', turnstileResult.error)
        return NextResponse.json({
          success: false,
          error: turnstileResult.error || '人机验证失败，请重试'
        }, { status: 400 })
      }
      console.log('✅ Turnstile验证成功')
    } else if (process.env.TURNSTILE_SECRET_KEY && !turnstileToken) {
      return NextResponse.json({
        success: false,
        error: '缺少人机验证信息'
      }, { status: 400 })
    }

    // 参数验证
    if (!mobile || !password) {
      return NextResponse.json({
        success: false,
        error: '手机号和密码不能为空'
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
      // 为了安全，不告诉用户具体是用户不存在还是密码错误
      return NextResponse.json({
        success: false,
        error: '手机号或密码错误'
      }, { status: 401 })
    }

    // 检查用户是否被禁用
    if (!userData.is_active) {
      return NextResponse.json({
        success: false,
        error: '账户已被禁用，请联系管理员'
      }, { status: 403 })
    }

    // 检查账户锁定状态
    const lockStatus = checkAccountLock(userData.login_attempts || 0, userData.locked_until)
    
    if (lockStatus.isLocked) {
      return NextResponse.json({
        success: false,
        error: lockStatus.message
      }, { status: 423 }) // 423 Locked
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, userData.password_hash)
    
    if (!isPasswordValid) {
      console.log('❌ 密码验证失败')
      
      // 增加登录失败次数
      const newAttempts = (userData.login_attempts || 0) + 1
      const updateData: any = { login_attempts: newAttempts }
      
      // 检查是否需要锁定账户
      const lockCheck = checkAccountLock(newAttempts, null)
      if (lockCheck.shouldLock) {
        updateData.locked_until = lockCheck.lockUntil
      }
      
      await supabase
        .from('custom_users')
        .update(updateData)
        .eq('id', userData.id)
      
      return NextResponse.json({
        success: false,
        error: lockCheck.shouldLock 
          ? lockCheck.message 
          : `手机号或密码错误${lockCheck.remainingAttempts ? `，还可尝试${lockCheck.remainingAttempts}次` : ''}`
      }, { status: 401 })
    }

    console.log('✅ 密码验证成功')

    // 登录成功，清零失败次数并更新最后登录时间
    await supabase
      .from('custom_users')
      .update({ 
        login_attempts: 0, 
        locked_until: null,
        last_login_at: new Date().toISOString() 
      })
      .eq('id', userData.id)

    console.log('✅ 自定义手机密码登录成功:', { mobile: phoneData.phone, userId: userData.id })

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
    console.error('❌ 自定义手机密码登录失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '服务器错误，请稍后重试'
    }, { status: 500 })
  }
}