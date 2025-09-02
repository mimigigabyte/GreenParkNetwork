
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '@/api/auth';
import { customAuthApi } from '@/api/customAuth';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';
import type { CustomUser } from '@/lib/custom-auth';

// 统一用户接口
interface UnifiedUser extends User {
  authType?: 'supabase' | 'custom'
}

export function useAuth() {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isCheckingUser = useRef(false);

  const checkUser = useCallback(async () => {
    // 防止重复检查
    if (isCheckingUser.current) {
      return;
    }
    isCheckingUser.current = true;

    try {
      console.log('🔍 检查用户认证状态...')

      // 1. 优先检查自定义认证
      const customToken = localStorage.getItem('custom_auth_token');
      if (customToken) {
        console.log('🔍 发现自定义认证Token，验证中...')
        try {
          const customResponse = await customAuthApi.getCurrentUser();
          if (customResponse.success && customResponse.data) {
            console.log('✅ 自定义认证验证成功')
            const customUser = customResponse.data;
            const mappedUser: UnifiedUser = {
              id: customUser.id,
              email: customUser.email || undefined,
              phone: customUser.phone || undefined,
              name: customUser.name || '用户',
              avatar_url: customUser.avatarUrl || undefined,
              company_name: customUser.userMetadata?.company_name || undefined,
              authType: 'custom'
            };
            setUser(mappedUser);
            setLoading(false);
            return;
          } else {
            console.log('❌ 自定义认证验证失败，清理Token')
            customAuthApi.logout();
          }
        } catch (customError) {
          console.error('❌ 自定义认证验证异常:', customError);
          customAuthApi.logout();
        }
      }

      // 2. 检查 Supabase 会话
      console.log('🔍 检查Supabase认证...')
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user && !error) {
        console.log('✅ Supabase认证验证成功')
        // 调用 getUser() 获取实时最新的用户信息，避免会话缓存导致的邮箱/手机号不同步
        const { data: freshUserData, error: freshUserError } = await supabase.auth.getUser();
        if (freshUserError) {
          console.warn('获取最新用户信息失败，回退使用会话中的用户:', freshUserError)
        }
        const supaUser = freshUserData?.user ?? session.user
        const mappedUser: UnifiedUser = {
          id: supaUser.id,
          email: supaUser.email,
          phone: supaUser.phone,
          name: supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'User',
          avatar_url: supaUser.user_metadata?.avatar_url,
          company_name: supaUser.user_metadata?.company_name,
          authType: 'supabase'
        };
        setUser(mappedUser);
        setLoading(false);
        return;
      }

      // 3. 检查传统的 token（兼容性）
      console.log('🔍 检查传统认证Token...')
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.success && 'data' in response && response.data) {
            console.log('✅ 传统认证验证成功')
            const mappedUser: UnifiedUser = {
              ...response.data,
              authType: 'supabase'
            };
            setUser(mappedUser);
            setLoading(false);
            return;
          } else {
            console.log('❌ 传统认证验证失败，清理Token')
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
        } catch (error) {
          console.error('❌ 传统认证验证异常:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }

      console.log('❌ 所有认证方式都失败，用户未登录')
      setUser(null);
    } catch (error) {
      console.error('❌ 检查用户认证失败:', error);
      setUser(null);
    } finally {
      setLoading(false);
      isCheckingUser.current = false;
    }
  }, []);

  useEffect(() => {
    checkUser();

    // 监听 Supabase 认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              // 只有在没有自定义认证时才使用Supabase认证
              const customToken = localStorage.getItem('custom_auth_token');
              if (!customToken) {
                const mappedUser: UnifiedUser = {
                  id: session.user.id,
                  email: session.user.email,
                  phone: session.user.phone,
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                  avatar_url: session.user.user_metadata?.avatar_url,
                  company_name: session.user.user_metadata?.company_name,
                  authType: 'supabase'
                };
                setUser(mappedUser);
                setLoading(false);
              }
            }
            break;

          case 'SIGNED_OUT':
            // 只有在没有自定义认证时才清空用户
            const customToken = localStorage.getItem('custom_auth_token');
            if (!customToken) {
              setUser(null);
              setLoading(false);
            }
            break;

          case 'TOKEN_REFRESHED':
            if (session?.user) {
              // 只有在没有自定义认证时才更新Supabase用户
              const customToken = localStorage.getItem('custom_auth_token');
              if (!customToken) {
                // TOKEN刷新后，同步获取一次最新用户信息
                const { data: freshUserData } = await supabase.auth.getUser();
                const supaUser = freshUserData?.user ?? session.user
                const mappedUser: UnifiedUser = {
                  id: supaUser.id,
                  email: supaUser.email,
                  phone: supaUser.phone,
                  name: supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'User',
                  avatar_url: supaUser.user_metadata?.avatar_url,
                  company_name: supaUser.user_metadata?.company_name,
                  authType: 'supabase'
                };
                setUser(mappedUser);
              }
            }
            break;
        }
      }
    );

    // 监听自定义认证状态变化
    const customAuthUnsubscribe = customAuthApi.onAuthStateChange((customUser) => {
      if (customUser) {
        const mappedUser: UnifiedUser = {
          id: customUser.id,
          email: customUser.email || undefined,
          phone: customUser.phone || undefined,
          name: customUser.name || '用户',
          avatar_url: customUser.avatarUrl || undefined,
          company_name: customUser.userMetadata?.company_name || undefined,
          authType: 'custom'
        };
        setUser(mappedUser);
      } else {
        // 自定义认证登出，检查是否有Supabase认证
        checkUser();
      }
    });

    return () => {
      subscription?.unsubscribe();
      customAuthUnsubscribe();
    };
  }, [checkUser]);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 执行登出操作...')
      
      // 根据当前用户的认证类型执行相应的登出
      if (user?.authType === 'custom') {
        console.log('🚪 自定义认证登出')
        customAuthApi.logout();
      } else {
        console.log('🚪 Supabase认证登出')
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase logout failed:', error);
        }
      }
      
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // 清理所有本地存储的认证信息
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('company_name');
      customAuthApi.logout(); // 确保自定义认证也被清理
      
      // 清理用户状态
      setUser(null);
      console.log('✅ 登出完成')
    }
  }, [user?.authType]);

  return { user, loading, logout, checkUser };
}
