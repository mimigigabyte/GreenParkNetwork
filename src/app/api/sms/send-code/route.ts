import { NextRequest, NextResponse } from 'next/server'
import { smsClient, isSmsServiceAvailable } from '@/lib/smsClient'
import { 
  generateVerificationCode, 
  storeVerificationCode, 
  canSendCode 
} from '@/lib/verificationCode'

// 手机号正则验证
const PHONE_REGEX = /^1[3-9]\d{9}$/

interface SendCodeRequest {
  mobile: string
  purpose: 'register' | 'login' | 'reset_password'
}

export async function POST(request: NextRequest) {
  try {
    const body: SendCodeRequest = await request.json()
    const { mobile, purpose } = body

    // 参数验证
    if (!mobile || !purpose) {
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

    // 验证用途
    if (!['register', 'login', 'reset_password'].includes(purpose)) {
      return NextResponse.json({
        success: false,
        error: '不支持的验证码用途'
      }, { status: 400 })
    }

    // 检查是否可以发送验证码
    const { canSend, waitTime } = canSendCode(mobile, purpose)
    if (!canSend) {
      return NextResponse.json({
        success: false,
        error: `请等待 ${waitTime} 秒后再试`
      }, { status: 429 })
    }

    console.log('📱 发送验证码请求:', { mobile, purpose })

    // 生成验证码
    const code = generateVerificationCode()
    
    // 检查短信服务是否可用
    if (!isSmsServiceAvailable()) {
      console.warn('⚠️ 短信服务不可用，使用模拟模式')
      // 在开发模式下使用固定验证码 123456
      const mockCode = '123456'
      storeVerificationCode(mobile, mockCode, purpose)
      
      console.log('🔧 模拟验证码发送成功:', { mobile, purpose, code: mockCode })
      
      return NextResponse.json({
        success: true,
        data: {
          message: '验证码发送成功（开发模式：请使用验证码 123456）',
          expiresIn: 300 // 5分钟
        }
      })
    }
    
    // 发送短信
    const sendSuccess = await smsClient!.sendVerificationCode(mobile, code, purpose)
    
    if (!sendSuccess) {
      return NextResponse.json({
        success: false,
        error: '短信发送失败，请稍后重试'
      }, { status: 500 })
    }

    // 存储验证码
    storeVerificationCode(mobile, code, purpose)

    console.log('✅ 验证码发送成功:', { mobile, purpose })

    return NextResponse.json({
      success: true,
      data: {
        message: '验证码发送成功',
        expiresIn: 300 // 5分钟
      }
    })

  } catch (error) {
    console.error('❌ 发送验证码失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '服务器错误，请稍后重试'
    }, { status: 500 })
  }
}