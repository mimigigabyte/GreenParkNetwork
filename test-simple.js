// 最简单的测试脚本
require('dotenv').config({ path: '.env.local' });

console.log('测试邮件验证码功能...');

// 测试环境变量是否加载
console.log('RESEND_API_KEY 存在:', !!process.env.RESEND_API_KEY);
console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL);

// 测试生成OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const testOTP = generateOTP();
console.log('生成测试OTP:', testOTP);

// 测试Resend配置
const { Resend } = require('resend');

try {
  const resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend 初始化成功');
  
  // 测试邮件发送 (不实际发送，只是测试配置)
  console.log('测试邮件配置完成');
  
} catch (error) {
  console.error('❌ Resend 初始化失败:', error.message);
}