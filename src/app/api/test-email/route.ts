import { NextRequest, NextResponse } from 'next/server';
import { sendResetPasswordCode } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: '邮箱地址是必需的' }, { status: 400 });
    }

    console.log('测试发送邮件到:', email);
    
    // 测试Resend配置
    const result = await sendResetPasswordCode(email);
    
    console.log('测试结果:', result);
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? '邮件发送成功' : '邮件发送失败',
      error: result.error,
      code: result.code // 仅用于测试，生产环境不应返回验证码
    });
    
  } catch (error) {
    console.error('测试邮件发送异常:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}