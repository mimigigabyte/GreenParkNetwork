import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  createTencentSMSService, 
  generateVerificationCode,
  TencentSMSService 
} from '@/lib/tencent-sms'
import { formatPhoneNumber } from '@/lib/custom-auth'

// 创建Supabase客户端用于存储验证码
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 验证码存储接口
interface VerificationCode {
  id?: string
  phone: string
  country_code: string
  code: string
  purpose: 'register' | 'login' | 'reset_password'
  expires_at: string
  attempts: number
  created_at?: string
  used?: boolean
}

/**
 * 验证请求频率限制
 */
async function checkRateLimit(phone: string, countryCode: string): Promise<{ success: boolean; message?: string }> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
  
  const { data, error } = await supabase
    .from('sms_verification_codes')
    .select('created_at')
    .eq('phone', phone)
    .eq('country_code', countryCode)
    .gte('created_at', oneMinuteAgo)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('检查频率限制失败:', error)
    return { success: true } // 出错时允许发送
  }

  if (data && data.length > 0) {
    return { 
      success: false, 
      message: '发送过于频繁，请稍后再试'
    }
  }

  return { success: true }
}

/**
 * 存储验证码到数据库
 */
async function storeVerificationCode(
  phone: string,
  countryCode: string,
  code: string,
  purpose: string
): Promise<{ success: boolean; message?: string }> {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5分钟后过期

  const { error } = await supabase
    .from('sms_verification_codes')
    .insert({
      phone,
      country_code: countryCode,
      code,
      purpose,
      expires_at: expiresAt,
      attempts: 0,
      used: false,
    })

  if (error) {
    console.error('存储验证码失败:', error)
    return { 
      success: false, 
      message: '验证码存储失败'
    }
  }

  return { success: true }
}

/**
 * POST /api/auth/send-sms-code
 * 发送短信验证码
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      phone, 
      purpose = 'login', 
      countryCode = '+86' 
    } = body

    // 参数验证
    if (!phone) {
      return NextResponse.json(
        { 
          success: false, 
          error: '手机号码不能为空' 
        },
        { status: 400 }
      )
    }

    if (!['register', 'login', 'reset_password'].includes(purpose)) {
      return NextResponse.json(
        { 
          success: false, 
          error: '无效的验证码用途' 
        },
        { status: 400 }
      )
    }

    // 验证手机号格式和格式化
    let phoneData
    try {
      phoneData = formatPhoneNumber(phone, countryCode)
      
      // 验证腾讯云SMS格式
      if (!TencentSMSService.validatePhoneNumber(phoneData.phone, countryCode)) {
        return NextResponse.json(
          { 
            success: false, 
            error: '手机号码格式不正确' 
          },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : '手机号码格式不正确' 
        },
        { status: 400 }
      )
    }

    // 检查频率限制（使用格式化后的手机号）
    const rateLimitResult = await checkRateLimit(phoneData.phone, countryCode)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitResult.message 
        },
        { status: 429 }
      )
    }

    // 如果是登录验证码，检查用户是否存在
    if (purpose === 'login') {
      const { data: userData, error: userError } = await supabase
        .from('custom_users')
        .select('id')
        .eq('phone', phoneData.phone)
        .eq('country_code', countryCode)
        .single()
      
      if (userError || !userData) {
        console.log('❌ 登录验证码请求：用户不存在:', phoneData.phone)
        return NextResponse.json(
          { 
            success: false, 
            error: '您输入的手机号码未注册，请注册后重试' 
          },
          { status: 404 }
        )
      }
    }

    // 生成验证码
    const verificationCode = generateVerificationCode()
    console.log(`🔐 生成验证码: ${phoneData.phone} -> ${verificationCode}`)
    console.log(`📱 调试信息: 手机号=${phoneData.phone}, 国家代码=${countryCode}, 验证码=${verificationCode}, 用途=${purpose}`)

    // 先存储验证码到数据库（使用格式化后的手机号）
    const storeResult = await storeVerificationCode(phoneData.phone, countryCode, verificationCode, purpose)
    if (!storeResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: storeResult.message 
        },
        { status: 500 }
      )
    }

    // 创建腾讯云短信服务
    const smsService = createTencentSMSService()
    
    if (!smsService) {
      console.error('❌ 腾讯云短信服务初始化失败')
      // 在开发环境下，即使没有配置腾讯云，也返回成功（验证码已存储）
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 开发环境验证码:', verificationCode)
        console.log(`📱 开发调试 - 手机号: ${phoneData.phone}, 国家代码: ${countryCode}, 验证码: ${verificationCode}`)
        console.log(`⏰ 验证码有效期: 5分钟 (${new Date(Date.now() + 5 * 60 * 1000).toLocaleString()})`)
        return NextResponse.json({
          success: true,
          data: {
            message: `开发环境：验证码已生成，请查看控制台日志。验证码：${verificationCode}`,
            expiresIn: 300, // 5分钟
            // 在开发环境可以返回验证码方便测试
            ...(process.env.NODE_ENV === 'development' && { debugCode: verificationCode })
          }
        })
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: '短信服务暂时不可用，请稍后重试' 
        },
        { status: 503 }
      )
    }

    // 发送短信验证码（使用格式化后的手机号）
    try {
      const sendResult = await smsService.sendVerificationCode(
        phoneData.phone, 
        verificationCode, 
        countryCode
      )

      if (!sendResult.success) {
        console.error('❌ 短信发送失败:', sendResult.message)
        
        // 如果是代理连接问题，提供更明确的错误信息
        if (sendResult.message.includes('ECONNREFUSED') || sendResult.message.includes('127.0.0.1:7890')) {
          return NextResponse.json(
            { 
              success: false, 
              error: '网络连接异常，请检查代理设置或稍后重试' 
            },
            { status: 500 }
          )
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: sendResult.message 
          },
          { status: 500 }
        )
      }

      console.log('✅ 短信验证码发送成功:', phoneData.phone, sendResult.requestId)
      console.log(`📱 发送成功调试 - 手机号: ${phoneData.phone}, 国家代码: ${countryCode}, 验证码: ${verificationCode}`)
      console.log(`⏰ 验证码有效期: 5分钟 (${new Date(Date.now() + 5 * 60 * 1000).toLocaleString()})`)

      return NextResponse.json({
        success: true,
        data: {
          message: sendResult.message,
          expiresIn: 300, // 5分钟
          requestId: sendResult.requestId,
          // 在开发环境显示验证码用于调试
          ...(process.env.NODE_ENV === 'development' && { debugCode: verificationCode })
        }
      })
      
    } catch (smsError) {
      console.error('❌ 短信发送异常:', smsError)
      
      // 检查是否是代理相关错误
      const errorMessage = smsError instanceof Error ? smsError.message : String(smsError)
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('127.0.0.1:7890')) {
        return NextResponse.json(
          { 
            success: false, 
            error: '网络连接异常，请检查代理设置后重试。验证码已生成，可稍后重新发送。' 
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: '短信发送异常，请稍后重试' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ 发送短信验证码API错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '服务器内部错误，请稍后重试' 
      },
      { status: 500 }
    )
  }
}