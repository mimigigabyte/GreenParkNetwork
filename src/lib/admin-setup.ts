import { supabase, supabaseAdmin } from '@/lib/supabase';

/**
 * 管理员设置工具 - 创建和管理管理员用户
 */
export class AdminSetup {
  
  /**
   * 创建管理员用户
   */
  static async createAdminUser(adminData: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ success: boolean; message: string; user?: any }> {
    
    console.log('👤 开始创建管理员用户:', adminData.email);
    
    try {
      // 检查管理员客户端是否可用
      if (!supabaseAdmin) {
        return {
          success: false,
          message: '缺少管理员权限 (SUPABASE_SERVICE_ROLE_KEY 未配置)'
        };
      }

      // 1. 使用 Admin API 创建用户
      console.log('📝 使用 Admin API 创建用户...');
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminData.email,
        password: adminData.password,
        email_confirm: true, // 自动确认邮箱
        user_metadata: {
          name: adminData.name,
          role: 'admin'
        }
      });

      if (authError) {
        console.error('❌ 创建认证用户失败:', authError);
        return {
          success: false,
          message: `创建认证用户失败: ${authError.message}`
        };
      }

      console.log('✅ 认证用户创建成功:', authUser.user.id);

      // 2. 在 users 表中创建用户记录
      console.log('📊 在 users 表中创建记录...');
      const { data: dbUser, error: dbError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: authUser.user.id,
          email: adminData.email,
          name: adminData.name,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (dbError) {
        console.error('❌ 创建数据库用户失败:', dbError);
        // 如果用户已存在，更新角色
        if (dbError.code === '23505') { // 唯一约束冲突
          console.log('🔄 用户已存在，更新为管理员角色...');
          const { data: updatedUser, error: updateError } = await supabaseAdmin
            .from('users')
            .update({ 
              role: 'admin', 
              name: adminData.name,
              updated_at: new Date().toISOString() 
            })
            .eq('id', authUser.user.id)
            .select()
            .single();

          if (updateError) {
            console.error('❌ 更新用户角色失败:', updateError);
            return {
              success: false,
              message: `更新用户角色失败: ${updateError.message}`
            };
          }

          return {
            success: true,
            message: '管理员用户已更新',
            user: updatedUser
          };
        }

        return {
          success: false,
          message: `创建数据库用户失败: ${dbError.message}`
        };
      }

      console.log('✅ 管理员用户创建完成');
      return {
        success: true,
        message: '管理员用户创建成功',
        user: dbUser
      };

    } catch (error) {
      console.error('💥 创建管理员用户异常:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 管理员登录
   */
  static async loginAdmin(email: string, password: string): Promise<{ 
    success: boolean; 
    message: string; 
    user?: any; 
  }> {
    console.log('🔐 管理员尝试登录:', email);

    try {
      // 输入验证
      if (!email || !password) {
        return {
          success: false,
          message: '邮箱和密码不能为空'
        };
      }
      
      // 1. 使用 Supabase Auth 登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('❌ 登录失败:', error);
        return {
          success: false,
          message: `登录失败: ${error.message}`
        };
      }

      if (!data.user) {
        return {
          success: false,
          message: '登录失败：未返回用户信息'
        };
      }

      console.log('✅ 认证成功:', data.user.email);

      // 2. 检查用户是否为管理员
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('❌ 获取用户信息失败:', userError);
        return {
          success: false,
          message: '获取用户信息失败'
        };
      }

      if (userRecord.role !== 'admin') {
        console.warn('⚠️ 用户不是管理员:', userRecord.role);
        await supabase.auth.signOut(); // 登出非管理员用户
        return {
          success: false,
          message: '权限不足：您不是管理员用户'
        };
      }

      console.log('✅ 管理员登录成功');
      return {
        success: true,
        message: '登录成功',
        user: userRecord
      };

    } catch (error) {
      console.error('💥 登录异常:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '登录异常'
      };
    }
  }

  /**
   * 检查是否有管理员用户
   */
  static async checkAdminExists(): Promise<{ 
    hasAdmin: boolean; 
    adminCount: number; 
  }> {
    try {
      const client = supabaseAdmin || supabase;
      const { count, error } = await client
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (error) {
        console.error('❌ 检查管理员用户失败:', error);
        return { hasAdmin: false, adminCount: 0 };
      }

      console.log(`📊 找到 ${count || 0} 个管理员用户`);
      return { 
        hasAdmin: (count || 0) > 0, 
        adminCount: count || 0 
      };
    } catch (error) {
      console.error('💥 检查管理员异常:', error);
      return { hasAdmin: false, adminCount: 0 };
    }
  }

  /**
   * 获取当前登录用户信息
   */
  static async getCurrentUser(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // 获取完整的用户信息
      const { data: userRecord } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return userRecord;
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return null;
    }
  }
}