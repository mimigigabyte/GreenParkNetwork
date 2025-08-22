import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  hashPassword, 
  generateToken, 
  generateRefreshToken, 
  formatPhoneNumber,
  validatePasswordStrength,
  type CustomUser,
  type CustomAuthResult 
} from '@/lib/custom-auth'

// 创建Supabase客户端用于数据库操作
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CustomPhoneRegisterRequest {
  mobile: string
  code: string
  password: string
  name?: string
  countryCode?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CustomPhoneRegisterRequest = await request.json()
    const { mobile, code, password, name, countryCode = '+86' } = body

    console.log('📱 自定义手机验证码注册请求:', { mobile, name, countryCode })

    // 参数验证
    if (!mobile || !code || !password) {
      return NextResponse.json({
        success: false,
        error: '参数不完整'
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

    // 密码强度验证
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: `密码不符合要求: ${passwordValidation.issues.join(', ')}`
      }, { status: 400 })
    }

    // 验证验证码（使用Supabase存储的验证码）
    console.log('🔍 查询验证码参数:', { 
      mobile: phoneData.phone, 
      countryCode, 
      purpose: 'register', 
      currentTime: new Date().toISOString() 
    })
    
    const { data: verificationData, error: verifyError } = await supabase
      .from('sms_verification_codes')
      .select('*')
      .eq('phone', phoneData.phone)
      .eq('country_code', countryCode)
      .eq('purpose', 'register')
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

    try {
      // 检查手机号是否已注册（检查自定义用户表和Auth表）
      const [customUserCheck, authUserCheck] = await Promise.all([
        supabase
          .from('custom_users')
          .select('id')
          .eq('phone', phoneData.phone)
          .eq('country_code', countryCode)
          .single(),
        supabase.auth.admin.listUsers()
      ]);

      // 检查自定义用户表
      if (customUserCheck.data && !customUserCheck.error) {
        return NextResponse.json({
          success: false,
          error: '该手机号已注册'
        }, { status: 409 });
      }

      // 检查Auth表中的手机号
      const phoneExists = authUserCheck.data?.users?.some(u => u.phone === phoneData.phoneWithCountryCode);
      if (phoneExists) {
        return NextResponse.json({
          success: false,
          error: '该手机号已注册'
        }, { status: 409 });
      }

      // 哈希密码
      const passwordHash = await hashPassword(password)

      console.log('🔧 准备创建自定义用户:', {
        phone: phoneData.phone,
        phoneWithCountryCode: phoneData.phoneWithCountryCode,
        name: name || `用户${phoneData.phone.slice(-4)}`,
        countryCode
      })

      // 1. 首先在Supabase Auth中创建用户（用于外键约束，只使用手机号）
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        phone: phoneData.phoneWithCountryCode,
        password: password,
        phone_confirm: true,
        user_metadata: {
          name: name || `用户${phoneData.phone.slice(-4)}`,
          registration_method: 'custom_phone_sms',
          custom_auth: true
        }
      });

      if (authError) {
        console.error('❌ 创建Supabase Auth用户失败:', authError);
        return NextResponse.json({
          success: false,
          error: `认证系统注册失败: ${authError.message}`
        }, { status: 400 });
      }

      console.log('✅ Supabase Auth用户创建成功:', authUser.user.id);

      // 2. 创建自定义用户记录（使用Supabase Auth的user ID保持一致）
      const { data: userData, error: userError } = await supabase
        .from('custom_users')
        .insert({
          id: authUser.user.id, // 使用Supabase Auth的user ID
          phone: phoneData.phone,
          country_code: countryCode,
          email: null, // 手机号注册不设置邮箱
          password_hash: passwordHash,
          name: name || `用户${phoneData.phone.slice(-4)}`,
          role: 'user',
          is_active: true,
          user_metadata: {
            phone_verified: true,
            registration_method: 'phone_sms',
            phone_with_country_code: phoneData.phoneWithCountryCode,
            supabase_auth_id: authUser.user.id
          }
        })
        .select()
        .single()

      console.log('🔧 用户创建结果:', { userData: !!userData, userError })

      if (userError) {
        console.error('❌ 用户创建失败:', userError)
        return NextResponse.json({
          success: false,
          error: userError.message
        }, { status: 400 })
      }

      if (!userData) {
        return NextResponse.json({
          success: false,
          error: '用户创建失败，请稍后重试'
        }, { status: 500 })
      }

      // 更新最后登录时间
      await supabase
        .from('custom_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userData.id)

      console.log('✅ 自定义手机验证码注册成功:', { mobile: phoneData.phone, userId: userData.id })

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
        lastLoginAt: userData.last_login_at,
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

    } catch (dbError) {
      console.error('❌ 数据库操作失败:', dbError)
      return NextResponse.json({
        success: false,
        error: '注册失败，请稍后重试'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ 自定义手机验证码注册失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '服务器错误，请稍后重试'
    }, { status: 500 })
  }
}