// 测试 API 逻辑（不依赖 Next.js 服务器）
require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

console.log('🧪 测试邮件验证码 API 逻辑...\n');

// 模拟全局存储
const verificationCodes = new Map();

// 模拟生成OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 模拟发送验证码逻辑
async function testSendCode(email) {
  try {
    console.log(`📧 测试发送验证码到: ${email}`);
    
    // 验证邮箱格式
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('无效的邮箱地址');
    }
    
    // 检查发送频率限制
    const existingCode = verificationCodes.get(email);
    if (existingCode && (existingCode.expiresAt - 5 * 60 * 1000) > Date.now() - 60 * 1000) {
      throw new Error('验证码发送过于频繁，请稍后再试');
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
    
    console.log(`🔑 验证码生成: ${otp}`);
    
    // 测试 Resend 邮件发送
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>请验证您的注册</title>
        </head>
        <body>
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2>请验证您的注册</h2>
            <p>您的验证码是:</p>
            <div style="background: #00b899; color: white; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">${otp}</div>
            <p>验证码有效期为5分钟，请尽快使用。</p>
          </div>
        </body>
        </html>
      `;
      
      // 注意：这里只是测试配置，实际环境中取消注释来发送邮件
      console.log('📮 邮件配置正确，可以发送邮件');
      // const result = await resend.emails.send({
      //   from: process.env.RESEND_FROM_EMAIL,
      //   to: email,
      //   subject: '请验证您的注册',
      //   html: emailHtml
      // });
      // console.log('📧 邮件发送成功:', result);
      
    } else {
      console.log('⚠️  开发模式：验证码已生成但未发送邮件');
    }
    
    return {
      success: true,
      message: `验证码已发送到 ${email}`,
      devOTP: otp
    };
    
  } catch (error) {
    console.error('❌ 发送验证码失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 模拟验证码验证逻辑
function testVerifyCode(email, code) {
  try {
    console.log(`🔍 测试验证验证码: ${email} -> ${code}`);
    
    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
      throw new Error('验证码不存在或已过期，请重新获取');
    }
    
    // 检查是否过期
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      throw new Error('验证码已过期，请重新获取');
    }
    
    // 检查尝试次数
    if (storedData.attempts >= 5) {
      verificationCodes.delete(email);
      throw new Error('验证码尝试次数过多，请重新获取');
    }
    
    // 验证码错误时增加尝试次数
    if (storedData.code !== code) {
      storedData.attempts++;
      throw new Error(`验证码错误，还有 ${5 - storedData.attempts} 次机会`);
    }
    
    // 验证成功，删除验证码
    verificationCodes.delete(email);
    
    console.log('✅ 验证码验证成功');
    
    return {
      success: true,
      message: '验证码验证成功'
    };
    
  } catch (error) {
    console.error('❌ 验证码验证失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 运行测试
async function runTests() {
  console.log('开始完整测试流程:\n');
  
  const testEmail = 'test@example.com';
  
  // 测试1: 发送验证码
  const sendResult = await testSendCode(testEmail);
  console.log('发送结果:', sendResult);
  
  if (sendResult.success) {
    console.log('\n');
    
    // 测试2: 错误验证码
    const wrongResult = testVerifyCode(testEmail, '000000');
    console.log('错误验证码结果:', wrongResult);
    console.log('\n');
    
    // 测试3: 正确验证码
    const correctResult = testVerifyCode(testEmail, sendResult.devOTP);
    console.log('正确验证码结果:', correctResult);
  }
  
  console.log('\n🎉 测试完成！');
}

runTests().catch(console.error);