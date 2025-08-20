import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// 内存存储验证码（与其他API共享数据）
interface VerificationData {
  code: string;
  expiresAt: number;
  attempts: number;
}

// 使用全局变量共享验证码数据
declare global {
  let __verificationCodes: Map<string, VerificationData> | undefined;
}

if (!global.__verificationCodes) {
  global.__verificationCodes = new Map();
}

const verificationCodes = global.__verificationCodes;

// 生成6位数字验证码
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 清理过期的验证码
function cleanExpiredCodes() {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (data.expiresAt < now) {
      verificationCodes.delete(email);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 添加请求体解析的错误处理
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: '无效的JSON数据' },
        { status: 400 }
      );
    }

    const { email } = body;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 检查发送频率限制（60秒内只能发送一次）
    const existingCode = verificationCodes.get(email);
    if (existingCode && (existingCode.expiresAt - 5 * 60 * 1000) > Date.now() - 60 * 1000) {
      return NextResponse.json(
        { success: false, error: '验证码发送过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    // 生成验证码
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5分钟过期

    // 存储验证码
    verificationCodes.set(email, {
      code: otp,
      expiresAt,
      attempts: 0
    });

    // 清理过期验证码
    cleanExpiredCodes();

    console.log(`验证码生成: ${email} -> ${otp}`);

    // 如果没有配置 Resend API Key，返回验证码用于开发测试
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      console.log(`开发模式：发送验证码到 ${email}，验证码：${otp}`);
      return NextResponse.json({
        success: true,
        message: `验证码已发送到 ${email}`,
        devOTP: otp // 开发模式下返回验证码
      });
    }

    // 发送邮件
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>请验证您的注册</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: 'Microsoft YaHei', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="padding: 40px 30px;">
            <!-- Logo和标题 -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #00b899; font-size: 28px; margin: 0; font-weight: bold;">绿色技术平台</h1>
              <p style="color: #666; font-size: 14px; margin: 8px 0 0 0;">Green Technology Platform</p>
            </div>
            
            <!-- 验证码内容 -->
            <div style="margin-bottom: 40px;">
              <h2 style="color: #333; font-size: 20px; margin-bottom: 20px;">请验证您的注册</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                您好！您正在注册绿色技术平台账户，请使用以下验证码完成注册：
              </p>
              
              <!-- 验证码框 -->
              <div style="background: linear-gradient(135deg, #00b899 0%, #009a7a 100%); border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                <div style="color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
                <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 10px;">请将此验证码输入到注册页面</div>
              </div>
              
              <!-- 重要提示 -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>重要提示：</strong><br>
                  • 验证码有效期为 <strong>5分钟</strong>，请尽快使用<br>
                  • 请勿将验证码告知他人，以保护账户安全<br>
                  • 如果这不是您的操作，请忽略此邮件
                </p>
              </div>
            </div>
            
            <!-- 底部信息 -->
            <div style="border-top: 1px solid #eee; padding-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                此邮件由绿色技术平台系统自动发送，请勿回复<br>
                如有疑问，请联系我们的客服团队
              </p>
              <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                © 2024 绿色技术平台 版权所有
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: '请验证您的注册',
      html: emailHtml
    });

    console.log(`验证码邮件发送成功：${email}，验证码：${otp}`);

    return NextResponse.json({
      success: true,
      message: `验证码已发送到 ${email}，请查收邮件`
    });

  } catch (error) {
    console.error('发送验证码失败:', error);
    return NextResponse.json(
      { success: false, error: '发送验证码失败，请稍后重试' },
      { status: 500 }
    );
  }
}