import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * 验证短信验证码
 */
async function verifyCode(
  phone: string, 
  countryCode: string, 
  code: string, 
  purpose: string
): Promise<{ success: boolean; message: string; shouldMarkUsed?: boolean }> {
  const now = new Date().toISOString()
  
  // 查询有效的验证码
  const { data: codeRecord, error: queryError } = await supabase
    .from('sms_verification_codes')
    .select('*')
    .eq('phone', phone)
    .eq('country_code', countryCode)
    .eq('purpose', purpose)
    .eq('used', false)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (queryError || !codeRecord) {
    console.log('验证码查询失败或未找到:', queryError?.message || '无匹配记录')
    return { 
      success: false, 
      message: '验证码不存在或已过期' 
    }
  }

  // 检查尝试次数
  if (codeRecord.attempts >= 5) {
    return { 
      success: false, 
      message: '验证码尝试次数过多，请重新获取' 
    }
  }

  // 验证码比对
  if (codeRecord.code !== code) {
    // 更新尝试次数
    await supabase
      .from('sms_verification_codes')
      .update({ 
        attempts: codeRecord.attempts + 1 
      })
      .eq('id', codeRecord.id)

    return { 
      success: false, 
      message: `验证码错误，还可尝试 ${4 - codeRecord.attempts} 次` 
    }
  }

  return { 
    success: true, 
    message: '验证码验证成功',
    shouldMarkUsed: true 
  }
}

/**
 * 标记验证码为已使用
 */
async function markCodeAsUsed(phone: string, countryCode: string, code: string, purpose: string): Promise<void> {
  await supabase
    .from('sms_verification_codes')
    .update({ used: true })
    .eq('phone', phone)
    .eq('country_code', countryCode)
    .eq('code', code)
    .eq('purpose', purpose)
    .eq('used', false)
}

/**
 * POST /api/auth/verify-sms-code
 * 验证短信验证码
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      phone, 
      code, 
      purpose = 'login', 
      countryCode = '+86',
      markUsed = false // 是否立即标记为已使用
    } = body

    // 参数验证
    if (!phone || !code) {
      return NextResponse.json(
        { 
          success: false, 
          error: '手机号码和验证码不能为空' 
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

    // 验证验证码
    const verifyResult = await verifyCode(phone, countryCode, code, purpose)
    
    if (!verifyResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: verifyResult.message 
        },
        { status: 400 }
      )
    }

    // 如果需要立即标记为已使用
    if (markUsed && verifyResult.shouldMarkUsed) {
      await markCodeAsUsed(phone, countryCode, code, purpose)
      console.log(`✅ 验证码已标记为已使用: ${phone} ${purpose}`)
    }

    console.log(`✅ 短信验证码验证成功: ${phone} ${purpose}`)

    return NextResponse.json({
      success: true,
      data: {
        message: verifyResult.message,
        phone,
        countryCode,
        purpose
      }
    })

  } catch (error) {
    console.error('❌ 验证短信验证码API错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '服务器内部错误，请稍后重试' 
      },
      { status: 500 }
    )
  }
}