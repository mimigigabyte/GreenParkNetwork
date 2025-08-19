import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, verificationCode, countryCode } = await request.json();

    // 验证输入
    if (!phoneNumber || !verificationCode) {
      return NextResponse.json(
        { error: '请输入手机号码和验证码' },
        { status: 400 }
      );
    }

    // 验证验证码格式（6位数字）
    if (!/^\d{6}$/.test(verificationCode)) {
      return NextResponse.json(
        { error: '验证码格式不正确' },
        { status: 400 }
      );
    }

    // 模拟验证码验证
    // 在实际应用中，这里会验证验证码是否正确
    console.log(`验证 ${countryCode}${phoneNumber} 的验证码: ${verificationCode}`);

    // 模拟验证成功
    return NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: 'user_' + Date.now(),
          phoneNumber: `${countryCode}${phoneNumber}`,
          loginType: 'verification_code',
          lastLoginAt: new Date().toISOString()
        },
        token: 'mock_jwt_token_' + Date.now(),
        expiresIn: 3600 // 1小时
      }
    });

  } catch (error) {
    console.error('验证码登录错误:', error);
    return NextResponse.json(
      { error: '登录失败，请检查验证码是否正确' },
      { status: 500 }
    );
  }
} 