// 创建邮箱测试用户
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODU4NTAsImV4cCI6MjA2OTg2MTg1MH0.LaJALEd_KP6LLaKEjRo7zuwjCA6Bbt_2QpSWPmbyw1I'

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const userClient = createClient(supabaseUrl, supabaseAnonKey)

async function createEmailUser() {
  try {
    console.log('📧 创建邮箱测试用户...')
    
    // 创建邮箱用户
    const testEmail = 'test@greentech.com'
    const testPassword = '123456'
    
    const { data, error } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: '测试用户'
      }
    })

    if (error) {
      console.error('❌ 创建邮箱用户失败:', error.message)
      return
    }

    console.log('✅ 邮箱用户创建成功!')
    console.log(`   👤 用户ID: ${data.user.id}`)
    console.log(`   📧 邮箱: ${data.user.email}`)
    console.log(`   ✅ 验证状态: ${data.user.email_confirmed_at ? '已验证' : '未验证'}`)
    
    // 测试邮箱密码登录
    console.log('\n🔐 测试邮箱密码登录...')
    const { data: loginData, error: loginError } = await userClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (loginError) {
      console.log('❌ 邮箱密码登录失败:', loginError.message)
    } else {
      console.log('✅ 邮箱密码登录成功!')
      console.log(`   👤 登录用户ID: ${loginData.user.id}`)
      console.log(`   📧 用户邮箱: ${loginData.user.email}`)
      
      // 登出
      await userClient.auth.signOut()
      console.log('🔓 已登出')
    }
    
    console.log('\n🎉 邮箱用户创建和测试完成!')
    console.log('\n📋 登录信息:')
    console.log(`   📧 邮箱: ${testEmail}`)
    console.log(`   🔑 密码: ${testPassword}`)
    console.log('   🔗 测试页面: http://localhost:3000/test-login')
    
    console.log('\n💡 测试建议:')
    console.log('   1. 访问测试页面')
    console.log('   2. 使用邮箱密码登录功能')
    console.log('   3. 手机功能需要在 Supabase 控制台配置 SMS 提供商')
    
  } catch (error) {
    console.error('💥 创建过程出错:', error)
  }
}

createEmailUser()