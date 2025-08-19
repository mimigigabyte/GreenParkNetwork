import { NextRequest, NextResponse } from 'next/server'
import { verifyCode } from '@/lib/verificationCode'

// 手机号正则验证
const PHONE_REGEX = /^1[3-9]\d{9}$/

interface VerifyCodeRequest {
  mobile: string
  code: string
  purpose: 'register' | 'login' | 'reset_password'
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyCodeRequest = await request.json()
    const { mobile, code, purpose } = body

    // 参数验证
    if (!mobile || !code || !purpose) {
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

    // 验证码格式验证
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({
        success: false,
        error: '验证码格式不正确'
      }, { status: 400 })
    }

    // 验证用途
    if (!['register', 'login', 'reset_password'].includes(purpose)) {
      return NextResponse.json({
        success: false,
        error: '不支持的验证码用途'
      }, { status: 400 })
    }

    console.log('🔍 验证验证码请求:', { mobile, purpose, code: code.substring(0, 2) + '****' })

    // 验证验证码
    const result = verifyCode(mobile, code, purpose)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message,
        attemptsLeft: result.attemptsLeft
      }, { status: 400 })
    }

    console.log('✅ 验证码验证成功:', { mobile, purpose })

    return NextResponse.json({
      success: true,
      data: {
        message: result.message,
        mobile,
        purpose
      }
    })

  } catch (error) {
    console.error('❌ 验证验证码失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '服务器错误，请稍后重试'
    }, { status: 500 })
  }
}