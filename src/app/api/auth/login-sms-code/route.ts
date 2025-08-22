import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sign } from 'jsonwebtoken'

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret'

/**
 * 验证验证码（内部使用）
 */
async function verifyCodeInternal(
  phone: string, 
  countryCode: string, 
  code: string, 
  purpose: string
): Promise<{ success: boolean; message: string }> {
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
    return { success: false, message: '验证码不存在或已过期' }
  }

  if (codeRecord.attempts >= 5) {
    return { success: false, message: '验证码尝试次数过多，请重新获取' }
  }

  if (codeRecord.code !== code) {
    // 更新尝试次数
    await supabase
      .from('sms_verification_codes')
      .update({ attempts: codeRecord.attempts + 1 })
      .eq('id', codeRecord.id)

    return { success: false, message: `验证码错误，还可尝试 ${4 - codeRecord.attempts} 次` }
  }

  // 标记为已使用
  await supabase
    .from('sms_verification_codes')
    .update({ used: true })
    .eq('id', codeRecord.id)

  return { success: true, message: '验证码验证成功' }
}

/**
 * 查找或创建用户
 */
async function findOrCreateUser(phone: string, countryCode: string): Promise<any> {
  // 首先查找现有用户
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single()

  if (existingUser) {
    console.log('找到现有用户:', existingUser.id)
    return existingUser
  }

  // 如果用户不存在，创建新用户
  console.log('创建新用户，手机号:', phone)
  
  // 生成用户名
  const username = `用户${phone.slice(-4)}` // 使用手机号后4位作为用户名
  
  const newUserData = {
    phone,
    name: username,
    phone_verified: true, // 通过验证码验证，标记手机号已验证
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert(newUserData)
    .select()
    .single()

  if (createError) {
    console.error('创建用户失败:', createError)
    throw new Error('创建用户失败')
  }

  console.log('新用户创建成功:', newUser.id)
  return newUser
}

/**
 * 生成JWT token
 */
function generateTokens(user: any) {
  const payload = {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role || 'user',
  }

  const accessToken = sign(payload, JWT_SECRET, { 
    expiresIn: '24h',
    subject: user.id.toString() 
  })

  const refreshToken = sign(
    { userId: user.id }, 
    JWT_SECRET, 
    { 
      expiresIn: '7d',
      subject: user.id.toString() 
    }
  )

  return { accessToken, refreshToken }
}

/**
 * POST /api/auth/login-sms-code
 * 手机验证码登录
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      phone, 
      code, 
      countryCode = '+86' 
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

    // 验证验证码
    const verifyResult = await verifyCodeInternal(phone, countryCode, code, 'login')
    
    if (!verifyResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: verifyResult.message 
        },
        { status: 400 }
      )
    }

    // 查找或创建用户
    const user = await findOrCreateUser(phone, countryCode)
    
    // 生成tokens
    const { accessToken, refreshToken } = generateTokens(user)

    // 更新用户最后登录时间
    await supabase
      .from('users')
      .update({ 
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    console.log(`✅ 手机验证码登录成功: ${phone} (用户ID: ${user.id})`)

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role || 'user',
          phoneVerified: user.phone_verified || true,
          createdAt: user.created_at,
        },
        token: accessToken,
        refreshToken,
        message: '登录成功'
      }
    })

  } catch (error) {
    console.error('❌ 手机验证码登录API错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '服务器内部错误，请稍后重试' 
      },
      { status: 500 }
    )
  }
}