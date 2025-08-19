
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '@/api/auth';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isCheckingUser = useRef(false);

  const checkUser = useCallback(async () => {
    // 防止重复检查
    if (isCheckingUser.current) {
      return;
    }
    isCheckingUser.current = true;

    try {
      // 首先检查 Supabase 会话
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session?.user && !error) {
        const mappedUser: User = {
          id: session.user.id,
          email: session.user.email,
          phone: session.user.phone,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatar_url: session.user.user_metadata?.avatar_url,
          company_name: session.user.user_metadata?.company_name,
        };
        setUser(mappedUser);
        setLoading(false);
        return;
      }

      // 如果没有 Supabase 会话，检查传统的 token
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.success && 'data' in response && response.data) {
            setUser(response.data);
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
          }
        } catch (error) {
          console.error('Authentication error:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('检查 Supabase 会话失败:', error);
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
              const mappedUser: User = {
                id: session.user.id,
                email: session.user.email,
                phone: session.user.phone,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                avatar_url: session.user.user_metadata?.avatar_url,
                company_name: session.user.user_metadata?.company_name,
              };
              setUser(mappedUser);
              setLoading(false);
            }
            break;

          case 'SIGNED_OUT':
            setUser(null);
            setLoading(false);
            break;

          case 'TOKEN_REFRESHED':
            if (session?.user) {
              const mappedUser: User = {
                id: session.user.id,
                email: session.user.email,
                phone: session.user.phone,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                avatar_url: session.user.user_metadata?.avatar_url,
                company_name: session.user.user_metadata?.company_name,
              };
              setUser(mappedUser);
            }
            break;
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [checkUser]);

  const logout = useCallback(async () => {
    try {
      // 首先尝试 Supabase 登出
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase logout failed:', error);
      }
      
      // 调用API端点注销（如果有的话）
      // await authApi.logout(); 
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // 清理所有本地存储的认证信息
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('company_name');
      // 清理用户状态
      setUser(null);
    }
  }, []);

  return { user, loading, logout, checkUser };
}
