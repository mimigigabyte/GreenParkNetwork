import { NextRequest, NextResponse } from 'next/server'
import { verifyCode } from '@/lib/verificationCode'
import { supabase } from '@/lib/supabase'

// 手机号正则验证
const PHONE_REGEX = /^1[3-9]\d{9}$/

interface PhoneRegisterRequest {
  mobile: string
  code: string
  password: string
  name?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PhoneRegisterRequest = await request.json()
    const { mobile, code, password, name } = body

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

    console.log('📱 手机验证码注册请求:', { mobile, name })

    // 验证验证码
    const codeResult = verifyCode(mobile, code, 'register')
    if (!codeResult.success) {
      return NextResponse.json({
        success: false,
        error: codeResult.message,
        attemptsLeft: codeResult.attemptsLeft
      }, { status: 400 })
    }

    try {
      // 检查手机号是否已注册
      const { data: existingUser, error: checkError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('phone', mobile)
        .single()

      if (existingUser && !checkError) {
        return NextResponse.json({
          success: false,
          error: '该手机号已注册'
        }, { status: 409 })
      }

      // 使用 Supabase Auth 注册
      const { data: authData, error: authError } = await supabase.auth.signUp({
        phone: mobile,
        password: password,
        options: {
          data: {
            name: name || `用户${mobile.slice(-4)}`,
            phone: mobile
          }
        }
      })

      if (authError) {
        console.error('❌ Supabase 注册失败:', authError)
        return NextResponse.json({
          success: false,
          error: authError.message
        }, { status: 400 })
      }

      if (!authData.user || !authData.session) {
        return NextResponse.json({
          success: false,
          error: '注册失败，请稍后重试'
        }, { status: 500 })
      }

      console.log('✅ 手机验证码注册成功:', { mobile, userId: authData.user.id })

      // 返回用户信息
      const user = {
        id: authData.user.id,
        phone: authData.user.phone,
        name: authData.user.user_metadata?.name || name || `用户${mobile.slice(-4)}`,
        role: 'user' as const,
        createdAt: authData.user.created_at,
        emailVerified: authData.user.email_confirmed_at != null,
        phoneVerified: authData.user.phone_confirmed_at != null
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