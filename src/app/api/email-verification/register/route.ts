import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// 创建admin客户端，用于绕过邮件确认
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 使用与其他API相同的全局变量

if (!global.__verificationCodes) {
  global.__verificationCodes = new Map();
}

const verificationCodes = global.__verificationCodes;

export async function POST(request: NextRequest) {
  try {
    const { email, password, code } = await request.json();

    if (!email || !password || !code) {
      return NextResponse.json(
        { success: false, error: '邮箱、密码和验证码不能为空' },
        { status: 400 }
      );
    }

    // 直接验证验证码（避免循环调用）
    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return NextResponse.json(
        { success: false, error: '验证码不存在或已过期，请重新获取' },
        { status: 400 }
      );
    }

    // 检查是否过期
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return NextResponse.json(
        { success: false, error: '验证码已过期，请重新获取' },
        { status: 400 }
      );
    }

    // 检查尝试次数
    if (storedData.attempts >= 5) {
      verificationCodes.delete(email);
      return NextResponse.json(
        { success: false, error: '验证码尝试次数过多，请重新获取' },
        { status: 400 }
      );
    }

    // 验证码错误时增加尝试次数
    if (storedData.code !== code) {
      storedData.attempts++;
      return NextResponse.json(
        { 
          success: false, 
          error: '验证码错误',
          attemptsLeft: 5 - storedData.attempts
        },
        { status: 400 }
      );
    }

    // 验证成功，删除验证码
    verificationCodes.delete(email);

    // 验证码通过，使用admin客户端创建用户（绕过邮件确认）
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 标记邮箱已确认
      user_metadata: {
        email_confirmed: true,
        source: 'email_verification'
      }
    });

    if (signUpError) {
      console.error('Supabase 用户创建失败:', signUpError);
      
      // 处理常见错误
      let errorMessage = '注册失败，请稍后重试';
      if (signUpError.message.includes('already registered')) {
        errorMessage = '该邮箱已被注册，请使用其他邮箱或直接登录';
      } else if (signUpError.message.includes('password')) {
        errorMessage = '密码格式不正确，请确保密码至少6位字符';
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: '用户创建失败' },
        { status: 500 }
      );
    }

    // 使用普通客户端为新创建的用户生成会话
    // 确保参数有效
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '登录参数不完整' },
        { status: 400 }
      );
    }
    
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (sessionError || !sessionData.session) {
      console.error('创建会话失败:', sessionError);
      return NextResponse.json(
        { success: false, error: '用户创建成功但登录失败，请手动登录' },
        { status: 500 }
      );
    }

    // 返回用户信息和访问令牌
    const user = {
      id: authData.user.id,
      email: authData.user.email,
      name: authData.user.email?.split('@')[0] || '用户',
      role: 'user' as const,
      createdAt: authData.user.created_at,
      emailVerified: true,
      phoneVerified: false
    };

    const response = {
      user,
      token: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token
    };

    console.log(`用户注册成功: ${email}`);

    return NextResponse.json({
      success: true,
      data: response,
      message: '注册成功！'
    });

  } catch (error) {
    console.error('注册过程出错:', error);
    return NextResponse.json(
      { success: false, error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}