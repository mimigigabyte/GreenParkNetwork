import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

/**
 * 认证同步工具 - 处理传统登录和 Supabase 认证的同步问题
 */
export class AuthSync {
  /**
   * 检查并同步认证状态
   */
  static async syncAuthState(): Promise<User | null> {
    console.log('🔄 开始同步认证状态');
    
    try {
      // 1. 检查 Supabase 会话
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session?.user && !sessionError) {
        console.log('✅ Supabase 会话有效:', session.user.email);
        return AuthSync.mapSupabaseUser(session.user);
      }
      
      console.log('⚠️ Supabase 会话无效或不存在');
      
      // 2. 检查传统 token 登录
      const token = localStorage.getItem('access_token');
      if (token) {
        console.log('🔑 发现传统 token，尝试创建 Supabase 会话');
        
        // 尝试从传统认证获取用户信息
        const userInfo = await AuthSync.getUserFromToken(token);
        if (userInfo) {
          // 创建或更新 Supabase 用户
          await AuthSync.createSupabaseSession(userInfo);
          return userInfo;
        }
      }
      
      console.log('❌ 没有找到有效的认证信息');
      return null;
      
    } catch (error) {
      console.error('🚨 认证同步失败:', error);
      return null;
    }
  }
  
  /**
   * 将 Supabase 用户映射为应用用户
   */
  private static mapSupabaseUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      phone: supabaseUser.phone,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      company_name: supabaseUser.user_metadata?.company_name,
      role: supabaseUser.user_metadata?.role || 'user'
    };
  }
  
  /**
   * 从传统 token 获取用户信息
   */
  private static async getUserFromToken(token: string): Promise<User | null> {
    try {
      // 这里调用传统的用户信息 API
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log('✅ 从传统 API 获取用户信息成功:', data.data.email);
          return data.data;
        }
      }
      
      console.log('❌ 传统 API 获取用户信息失败');
      return null;
    } catch (error) {
      console.error('🚨 获取传统用户信息失败:', error);
      return null;
    }
  }
  
  /**
   * 为传统登录用户创建 Supabase 会话
   */
  private static async createSupabaseSession(user: User): Promise<void> {
    try {
      console.log('🔧 为用户创建 Supabase 会话:', user.email);
      
      // 检查用户是否已在 Supabase 中存在
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (!existingUser) {
        console.log('👤 创建 Supabase 用户记录');
        await supabase.from('users').insert([{
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          avatar_url: user.avatar_url,
          company_name: user.company_name,
          role: user.role || 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      }
      
      // 注意: 这里不能直接创建 Supabase Auth 会话，因为需要密码或其他认证方式
      // 但我们可以更新用户的元数据
      console.log('✅ Supabase 用户记录已同步');
      
    } catch (error) {
      console.error('🚨 创建 Supabase 会话失败:', error);
    }
  }
  
  /**
   * 手动设置管理员模式 - 临时解决方案
   */
  static setAdminMode(user: User): void {
    console.log('🔧 设置管理员模式:', user.email);
    
    const adminUser: User = {
      ...user,
      role: 'admin'
    };

    // 在 localStorage 中标记管理员模式
    localStorage.setItem('admin_mode', 'true');
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
  }
  
  /**
   * 检查是否为管理员模式
   */
  static isAdminMode(): { isAdmin: boolean; user?: User } {
    const adminMode = localStorage.getItem('admin_mode');
    const adminUserStr = localStorage.getItem('admin_user');
    
    if (adminMode === 'true' && adminUserStr) {
      try {
        const user = JSON.parse(adminUserStr) as User;
        if (!user.role) {
          user.role = 'admin';
          localStorage.setItem('admin_user', JSON.stringify(user));
        }
        return { isAdmin: true, user };
      } catch {
        return { isAdmin: false };
      }
    }
    
    return { isAdmin: false };
  }
  
  /**
   * 清除管理员模式
   */
  static clearAdminMode(): void {
    console.log('🧹 清除管理员模式');
    localStorage.removeItem('admin_mode');
    localStorage.removeItem('admin_user');
  }
}
