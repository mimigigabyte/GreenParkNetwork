import { NextRequest, NextResponse } from 'next/server';

// 内存存储验证码（需要与 send-code 共享数据）
interface VerificationData {
  code: string;
  expiresAt: number;
  attempts: number;
}

// 创建一个简单的共享存储
declare global {
  let __verificationCodes: Map<string, VerificationData> | undefined;
}

if (!global.__verificationCodes) {
  global.__verificationCodes = new Map();
}

const verificationCodes = global.__verificationCodes;

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: '邮箱和验证码不能为空' },
        { status: 400 }
      );
    }

    // 获取存储的验证码数据
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

    return NextResponse.json({
      success: true,
      message: '验证码验证成功'
    });

  } catch (error) {
    console.error('验证验证码失败:', error);
    return NextResponse.json(
      { success: false, error: '验证失败，请稍后重试' },
      { status: 500 }
    );
  }
}