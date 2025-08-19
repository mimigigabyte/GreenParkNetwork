import { NextRequest, NextResponse } from 'next/server';
import { sendResetPasswordCode, sendRegisterCode, sendLoginCode } from '@/lib/resend';

// 内存中存储验证码（生产环境应使用Redis或数据库）
const otpStore = new Map<string, { 
  code: string; 
  expires: number; 
  purpose: string; 
  attempts: number;
}>();

// 清理过期验证码
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expires < now) {
      otpStore.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

// 生成存储key
function getOtpKey(email: string, purpose: string): string {
  return `${email}:${purpose}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email, purpose } = await request.json();

    if (!email || !purpose) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    if (!['register', 'login', 'reset_password'].includes(purpose)) {
      return NextResponse.json(
        { success: false, error: '无效的用途参数' },
        { status: 400 }
      );
    }

    // 检查邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    const otpKey = getOtpKey(email, purpose);
    const existing = otpStore.get(otpKey);

    // 检查是否在冷却时间内（60秒）
    if (existing && existing.expires > Date.now()) {
      const remainingTime = Math.ceil((existing.expires - Date.now()) / 1000);
      if (remainingTime > 240) { // 如果剩余时间大于4分钟，说明是在冷却期内
        return NextResponse.json(
          { 
            success: false, 
            error: `请等待 ${300 - Math.floor((Date.now() - (existing.expires - 300000)) / 1000)} 秒后再试` 
          },
          { status: 429 }
        );
      }
    }

    // 根据用途发送不同类型的验证码
    let result;
    switch (purpose) {
      case 'reset_password':
        result = await sendResetPasswordCode(email);
        break;
      case 'register':
        result = await sendRegisterCode(email);
        break;
      case 'login':
        result = await sendLoginCode(email);
        break;
      default:
        return NextResponse.json(
          { success: false, error: '未知的用途' },
          { status: 400 }
        );
    }

    if (result.success && result.code) {
      // 存储验证码，有效期5分钟
      const otpData = {
        code: result.code,
        expires: Date.now() + 5 * 60 * 1000, // 5分钟
        purpose,
        attempts: 0
      };
      otpStore.set(otpKey, otpData);

      console.log(`验证码已存储: key=${otpKey}, code=${result.code}, expires=${new Date(otpData.expires).toISOString()}`);

      return NextResponse.json({
        success: true,
        data: {
          message: '验证码已发送到您的邮箱，请查收',
          expiresIn: 300 // 5分钟
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || '发送失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('发送邮箱验证码失败:', error);
    return NextResponse.json(
      { success: false, error: '发送验证码失败' },
      { status: 500 }
    );
  }
}

// 验证验证码的API
export async function PUT(request: NextRequest) {
  try {
    const { email, code, purpose } = await request.json();

    if (!email || !code || !purpose) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const otpKey = getOtpKey(email, purpose);
    const stored = otpStore.get(otpKey);

    console.log(`验证码验证: key=${otpKey}, stored=${stored ? 'exists' : 'not found'}, input_code=${code}`);
    if (stored) {
      console.log(`存储的验证码: code=${stored.code}, expires=${new Date(stored.expires).toISOString()}, now=${new Date().toISOString()}`);
    }

    if (!stored) {
      console.log(`验证码不存在: key=${otpKey}, 当前存储的keys=${Array.from(otpStore.keys()).join(', ')}`);
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          message: '验证码不存在或已过期'
        }
      });
    }

    // 检查是否过期
    if (stored.expires < Date.now()) {
      otpStore.delete(otpKey);
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          message: '验证码已过期'
        }
      });
    }

    // 检查尝试次数
    if (stored.attempts >= 3) {
      otpStore.delete(otpKey);
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          message: '验证码错误次数过多，请重新获取'
        }
      });
    }

    // 验证验证码
    if (stored.code !== code) {
      stored.attempts++;
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          message: `验证码错误，还可以尝试 ${3 - stored.attempts} 次`
        }
      });
    }

    // 验证成功，删除验证码
    otpStore.delete(otpKey);
    
    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        message: '验证码验证成功'
      }
    });
  } catch (error) {
    console.error('验证码验证失败:', error);
    return NextResponse.json(
      { success: false, error: '验证码验证失败' },
      { status: 500 }
    );
  }
}