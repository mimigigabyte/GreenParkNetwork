// 简单的 API 测试脚本
const API_BASE = 'http://localhost:3001';

async function testSendCode() {
  try {
    console.log('测试发送验证码...');
    const response = await fetch(`${API_BASE}/api/email-verification/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    const text = await response.text();
    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    console.log('响应内容:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('解析后的JSON:', data);
      return data.devOTP; // 返回开发模式下的验证码
    } catch (e) {
      console.log('无法解析为JSON，可能是HTML错误页面');
      return null;
    }
  } catch (error) {
    console.error('请求失败:', error);
    return null;
  }
}

async function testVerifyCode(email, code) {
  try {
    console.log('\n测试验证验证码...');
    const response = await fetch(`${API_BASE}/api/email-verification/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        code
      })
    });
    
    const text = await response.text();
    console.log('响应状态:', response.status);
    console.log('响应内容:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('解析后的JSON:', data);
      return data.success;
    } catch (e) {
      console.log('无法解析为JSON，可能是HTML错误页面');
      return false;
    }
  } catch (error) {
    console.error('请求失败:', error);
    return false;
  }
}

// 执行测试
async function runTests() {
  console.log('开始 API 测试...\n');
  
  // 测试1: 发送验证码
  const otp = await testSendCode();
  
  if (otp) {
    console.log(`\n获得验证码: ${otp}`);
    
    // 测试2: 验证验证码
    const verified = await testVerifyCode('test@example.com', otp);
    
    if (verified) {
      console.log('\n✅ 验证码验证成功！');
    } else {
      console.log('\n❌ 验证码验证失败');
    }
  } else {
    console.log('\n❌ 无法获得验证码');
  }
}

// 如果是在 Node.js 环境中运行
if (typeof window === 'undefined') {
  // 需要安装 node-fetch: npm install node-fetch
  const fetch = require('node-fetch');
  runTests();
}

module.exports = { testSendCode, testVerifyCode };