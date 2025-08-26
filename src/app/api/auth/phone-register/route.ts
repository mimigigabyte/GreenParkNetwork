import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '@/lib/custom-auth'

// 创建Supabase客户端用于存储验证码
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 手机号正则验证
const PHONE_REGEX = /^1[3-9]\d{9}$/

interface PhoneRegisterRequest {
  mobile: string
  code: string
  password: string
  name?: string
  countryCode?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PhoneRegisterRequest = await request.json()
    const { mobile, code, password, name, countryCode = '+86' } = body

    // 参数验证
    if (!mobile || !code || !password) {
      return NextResponse.json({
        success: false,
        error: '参数不完整'
      }, { status: 400 })
    }

    // 手机号格式验证
    if (!PHONE_REGEX.test(mobile)) {
      return NextResponse.json({
        success: false,
        error: '手机号格式不正确'
      }, { status: 400 })
    }

    // 密码长度验证
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: '密码长度不能少于6位'
      }, { status: 400 })
    }

    console.log('📱 手机验证码注册请求:', { mobile, name, countryCode })

    // 验证验证码（使用Supabase存储的验证码）
    console.log('🔍 查询验证码参数:', { mobile, countryCode, purpose: 'register', currentTime: new Date().toISOString() })
    
    const { data: verificationData, error: verifyError } = await supabase
      .from('sms_verification_codes')
      .select('*')
      .eq('phone', mobile)
      .eq('country_code', countryCode)
      .eq('purpose', 'register')
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    console.log('🔍 验证码查询结果:', { verificationData, verifyError })

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
      // 使用纯手机号密码注册（不使用邮箱）
      const phoneWithCountryCode = countryCode === '+86' ? `+86${mobile}` : `${countryCode}${mobile}`
      
      console.log('🔧 准备注册Supabase账户:', {
        phone: phoneWithCountryCode,
        name: name || `用户${mobile.slice(-4)}`,
        countryCode,
        password: password ? '已提供' : '未提供'
      })
      
      // 避免调用 Supabase Auth API 以防止 SMS 触发
      // 直接创建用户记录到数据库
      const userId = crypto.randomUUID()
      const { data: authData, error: authError } = await supabase
        .from('custom_users')
        .insert({
          id: userId,
          phone: mobile,
          country_code: countryCode,
          password_hash: await hashPassword(password),
          name: name || `用户${mobile.slice(-4)}`,
          role: 'user',
          is_active: true,
          user_metadata: {
            phone_verified: true,
            registration_method: 'phone_sms',
            phone_with_country_code: phoneWithCountryCode
          }
        })
        .select()
        .single()

      // 兼容性：模拟原来的 authData 结构
      const simulatedAuthData = authData ? {
        user: {
          id: authData.id,
          phone: phoneWithCountryCode,
          user_metadata: {
            name: authData.name,
            country_code: countryCode,
            phone_verified: true,
            is_phone_registration: true
          }
        }
      } : null
      
      console.log('🔧 Supabase注册响应:', { authData: !!authData, authError: !!authError })

      if (authError) {
        console.error('❌ Supabase 注册失败:', authError)
        console.error('❌ 详细错误信息:', {
          message: authError.message,
          status: authError.status,
          code: authError.code,
          details: authError
        })
        return NextResponse.json({
          success: false,
          error: authError.message
        }, { status: 400 })
      }

      console.log('🔍 详细检查用户创建响应:', {
        hasUser: !!simulatedAuthData?.user,
        userId: simulatedAuthData?.user?.id,
        userPhone: simulatedAuthData?.user?.phone,
        userMetadata: simulatedAuthData?.user?.user_metadata
      })

      if (!simulatedAuthData?.user) {
        console.error('❌ 用户数据为空')
        return NextResponse.json({
          success: false,
          error: '注册失败，用户数据为空'
        }, { status: 500 })
      }

      if (!authData.session) {
        console.error('❌ 会话数据为空')
        return NextResponse.json({
          success: false,
          error: '注册失败，会话数据为空'
        }, { status: 500 })
      }

      console.log('✅ 手机验证码注册成功:', { mobile, userId: authData.user.id })

      // 注册成功后，尝试更新用户手机号（使用管理员权限）
      try {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          authData.user.id,
          {
            phone: mobile,
            phone_confirm: true, // 标记手机号已验证
            user_metadata: {
              ...authData.user.user_metadata,
              name: name || `用户${mobile.slice(-4)}`,
              phone: mobile,
              country_code: countryCode,
              phone_verified: true,
              is_phone_registration: true
            }
          }
        )
        
        if (updateError) {
          console.warn('⚠️ 更新用户手机号失败:', updateError)
        } else {
          console.log('✅ 用户手机号更新成功:', mobile)
        }
      } catch (updateErr) {
        console.warn('⚠️ 更新用户信息失败:', updateErr)
      }

      // 返回用户信息
      const user = {
        id: authData.user.id,
        email: authData.user.email,
        phone: authData.user.user_metadata?.phone || mobile,
        name: authData.user.user_metadata?.name || name || `用户${mobile.slice(-4)}`,
        role: 'user' as const,
        createdAt: authData.user.created_at,
        emailVerified: authData.user.email_confirmed_at != null,
        phoneVerified: authData.user.user_metadata?.phone_verified || true
      }

      return NextResponse.json({
        success: true,
        data: {
          user,
          token: authData.session.access_token,
          refreshToken: authData.session.refresh_token
        }
      })

    } catch (supabaseError) {
      console.error('❌ Supabase 操作失败:', supabaseError)
      return NextResponse.json({
        success: false,
        error: '注册失败，请稍后重试'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ 手机验证码注册失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '服务器错误，请稍后重试'
    }, { status: 500 })
  }
}