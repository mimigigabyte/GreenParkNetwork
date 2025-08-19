// 修复用户手机号格式
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODU4NTAsImV4cCI6MjA2OTg2MTg1MH0.LaJALEd_KP6LLaKEjRo7zuwjCA6Bbt_2QpSWPmbyw1I'

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const userClient = createClient(supabaseUrl, supabaseAnonKey)

async function fixUser() {
  try {
    console.log('🔧 开始修复用户...')
    
    // 1. 删除错误格式的用户
    console.log('1️⃣ 删除错误格式的用户...')
    const oldUserId = '7927daad-f1b2-4fdc-a736-8fe3d153a087'
    
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(oldUserId)
    if (deleteError) {
      console.log('警告: 删除旧用户失败:', deleteError.message)
    } else {
      console.log('✅ 旧用户已删除')
    }
    
    // 2. 创建格式正确的新用户
    console.log('2️⃣ 创建新用户...')
    const { data, error } = await adminClient.auth.admin.createUser({
      phone: '+8618502695886', // 正确格式：+86 前缀
      password: '123456',
      phone_confirm: true,
      user_metadata: {
        name: '测试用户'
      }
    })

    if (error) {
      console.error('❌ 创建用户失败:', error.message)
      return
    }

    console.log('✅ 新用户创建成功!')
    console.log(`   👤 用户ID: ${data.user.id}`)
    console.log(`   📱 手机号: ${data.user.phone}`)
    console.log(`   ✅ 验证状态: ${data.user.phone_confirmed_at ? '已验证' : '未验证'}`)
    
    // 3. 测试登录
    console.log('\n3️⃣ 测试密码登录...')
    const { data: loginData, error: loginError } = await userClient.auth.signInWithPassword({
      phone: '+8618502695886',
      password: '123456'
    })
    
    if (loginError) {
      console.log('❌ 密码登录测试失败:', loginError.message)
    } else {
      console.log('✅ 密码登录测试成功!')
      console.log(`   👤 登录用户ID: ${loginData.user.id}`)
      
      // 登出
      await userClient.auth.signOut()
    }
    
    // 4. 测试验证码发送
    console.log('\n4️⃣ 测试验证码发送...')
    const { data: otpData, error: otpError } = await userClient.auth.signInWithOtp({
      phone: '+8618502695886',
      options: {
        shouldCreateUser: false
      }
    })
    
    if (otpError) {
      console.log('❌ 验证码发送失败:', otpError.message)
    } else {
      console.log('✅ 验证码发送成功!')
    }
    
    console.log('\n🎉 用户修复完成!')
    console.log('\n📋 测试信息:')
    console.log('   📱 手机号: 18502695886 (前端输入时不需要+86)')
    console.log('   🔑 密码: 123456')
    console.log('   🔗 测试页面: http://localhost:3000/test-login')
    console.log('\n💡 登录方式:')
    console.log('   1. 密码登录: 直接使用手机号 + 密码')
    console.log('   2. 验证码登录: 发送验证码到手机 + 输入验证码')
    
  } catch (error) {
    console.error('💥 修复过程出错:', error)
  }
}

fixUser()