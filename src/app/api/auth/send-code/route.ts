import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, countryCode } = await request.json();

    // 验证手机号码格式
    if (!phoneNumber || phoneNumber.length < 11) {
      return NextResponse.json(
        { error: '请输入有效的手机号码' },
        { status: 400 }
      );
    }

    // 模拟发送验证码
    console.log(`向 ${countryCode}${phoneNumber} 发送验证码`);

    // 在实际应用中，这里会调用短信服务
    // 现在返回模拟成功响应
    return NextResponse.json({
      success: true,
      message: '验证码已发送',
      data: {
        phoneNumber: `${countryCode}${phoneNumber}`,
        expiresIn: 300 // 5分钟有效期
      }
    });

  } catch (error) {
    console.error('发送验证码错误:', error);
    return NextResponse.json(
      { error: '发送验证码失败，请稍后重试' },
      { status: 500 }
    );
  }
} 