// 诊断用户登录问题
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'

// 管理员客户端
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 普通客户端
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODU4NTAsImV4cCI6MjA2OTg2MTg1MH0.LaJALEd_KP6LLaKEjRo7zuwjCA6Bbt_2QpSWPmbyw1I'
const userClient = createClient(supabaseUrl, supabaseAnonKey)

async function diagnoseUser() {
  console.log('🔍 开始诊断用户登录问题...\n')
  
  try {
    // 1. 检查用户是否存在
    console.log('1️⃣ 检查用户是否存在...')
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ 无法获取用户列表:', listError.message)
      return
    }
    
    const testUser = users.users.find(user => 
      user.phone === '+8618502695886' || 
      user.phone === '18502695886' ||
      user.phone === '+86 18502695886'
    )
    
    if (!testUser) {
      console.log('❌ 未找到手机号 18502695886 的用户')
      console.log('📋 现有用户列表:')
      users.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}`)
        console.log(`      📱 手机: ${user.phone || '无'}`)
        console.log(`      📧 邮箱: ${user.email || '无'}`)
        console.log(`      ✅ 手机验证: ${user.phone_confirmed_at ? '已验证' : '未验证'}`)
        console.log(`      🔒 状态: ${user.banned_until ? '被封禁' : '正常'}`)
        console.log('')
      })
      return
    }
    
    console.log('✅ 找到用户!')
    console.log(`   👤 用户ID: ${testUser.id}`)
    console.log(`   📱 手机号: ${testUser.phone}`)
    console.log(`   ✅ 手机验证: ${testUser.phone_confirmed_at ? '已验证' : '未验证'}`)
    console.log(`   📅 创建时间: ${testUser.created_at}`)
    console.log(`   🔒 状态: ${testUser.banned_until ? '被封禁' : '正常'}`)
    console.log('')
    
    // 2. 测试密码登录
    console.log('2️⃣ 测试密码登录...')
    const { data: loginData, error: loginError } = await userClient.auth.signInWithPassword({
      phone: '+8618502695886',
      password: '123456'
    })
    
    if (loginError) {
      console.log('❌ 密码登录失败:', loginError.message)
      
      // 尝试不同的手机号格式
      console.log('🔄 尝试其他手机号格式...')
      
      const phoneFormats = ['18502695886', '+8618502695886', '+86 18502695886']
      
      for (const phoneFormat of phoneFormats) {
        console.log(`   测试格式: ${phoneFormat}`)
        const { data, error } = await userClient.auth.signInWithPassword({
          phone: phoneFormat,
          password: '123456'
        })
        
        if (error) {
          console.log(`   ❌ 失败: ${error.message}`)
        } else {
          console.log(`   ✅ 成功! 正确格式是: ${phoneFormat}`)
          console.log(`   👤 登录用户: ${data.user.id}`)
          break
        }
      }
    } else {
      console.log('✅ 密码登录成功!')
      console.log(`   👤 用户ID: ${loginData.user.id}`)
      console.log(`   🎫 访问令牌: ${loginData.session.access_token.substring(0, 20)}...`)
    }
    
    console.log('')
    
    // 3. 测试验证码登录流程
    console.log('3️⃣ 测试发送验证码...')
    const { data: otpData, error: otpError } = await userClient.auth.signInWithOtp({
      phone: '+8618502695886',
      options: {
        shouldCreateUser: false
      }
    })
    
    if (otpError) {
      console.log('❌ 发送验证码失败:', otpError.message)
    } else {
      console.log('✅ 验证码发送成功!')
      console.log('📱 请检查手机短信，然后可以在测试页面输入验证码')
    }
    
    console.log('')
    console.log('🎯 测试完成!')
    console.log('📋 访问测试页面: http://localhost:3000/test-login')
    
  } catch (error) {
    console.error('💥 诊断过程出错:', error)
  }
}

// 执行诊断
diagnoseUser()