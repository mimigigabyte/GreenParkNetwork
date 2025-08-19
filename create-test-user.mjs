// 创建测试用户脚本 (ES Module)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'

// 创建 Supabase 管理员客户端
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  try {
    console.log('🚀 开始创建测试用户...')
    
    // 创建用户账户
    const { data, error } = await supabase.auth.admin.createUser({
      phone: '+8618502695886',
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

    console.log('✅ 用户创建成功!')
    console.log('📱 手机号: 18502695886')
    console.log('🔑 密码: 123456')
    console.log('👤 用户ID:', data.user.id)
    console.log('📧 手机验证状态:', data.user.phone_confirmed_at ? '已验证' : '未验证')
    console.log('')
    console.log('🔗 现在您可以访问前端应用测试登录:')
    console.log('   http://localhost:3000')
    
  } catch (error) {
    console.error('💥 脚本执行错误:', error)
  }
}

// 执行创建用户
createTestUser()