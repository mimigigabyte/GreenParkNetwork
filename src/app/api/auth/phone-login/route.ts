import { NextRequest, NextResponse } from 'next/server'
import { verifyCode } from '@/lib/verificationCode'
import { supabase } from '@/lib/supabase'

// 手机号正则验证
const PHONE_REGEX = /^1[3-9]\d{9}$/

interface PhoneLoginRequest {
  mobile: string
  code: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PhoneLoginRequest = await request.json()
    const { mobile, code } = body

    // 参数验证
    if (!mobile || !code) {
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

    console.log('📱 手机验证码登录请求:', { mobile })

    // 验证验证码
    const codeResult = verifyCode(mobile, code, 'login')
    if (!codeResult.success) {
      return NextResponse.json({
        success: false,
        error: codeResult.message,
        attemptsLeft: codeResult.attemptsLeft
      }, { status: 400 })
    }

    try {
      // 使用 Supabase Auth 验证 OTP（如果支持的话）
      // 注意：Supabase 的手机验证码登录需要先发送OTP，这里我们用自定义验证码
      
      // 查找用户
      const { data: users, error: userError } = await supabase
        .from('auth.users')
        .select('*')
        .eq('phone', mobile)

      if (userError) {
        console.error('❌ 查询用户失败:', userError)
        return NextResponse.json({
          success: false,
          error: '登录失败，请稍后重试'
        }, { status: 500 })
      }

      if (!users || users.length === 0) {
        return NextResponse.json({
          success: false,
          error: '该手机号未注册'
        }, { status: 404 })
      }

      const user = users[0]

      // 创建自定义 JWT Token（简化版，生产环境需要更安全的实现）
      const token = Buffer.from(JSON.stringify({
        sub: user.id,
        phone: user.phone,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时过期
      })).toString('base64')

      console.log('✅ 手机验证码登录成功:', { mobile, userId: user.id })

      // 返回用户信息
      const userResponse = {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.raw_user_meta_data?.name || `用户${mobile.slice(-4)}`,
        role: 'user' as const,
        createdAt: user.created_at,
        emailVerified: user.email_confirmed_at != null,
        phoneVerified: user.phone_confirmed_at != null
      }

      return NextResponse.json({
        success: true,
        data: {
          user: userResponse,
          token: token,
          refreshToken: `refresh_${token.substring(0, 20)}`
        }
      })

    } catch (supabaseError) {
      console.error('❌ Supabase 操作失败:', supabaseError)
      return NextResponse.json({
        success: false,
        error: '登录失败，请稍后重试'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ 手机验证码登录失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '服务器错误，请稍后重试'
    }, { status: 500 })
  }
}