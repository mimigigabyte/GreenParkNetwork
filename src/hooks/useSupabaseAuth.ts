'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@/types';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      phone: supabaseUser.phone,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      avatar_url: supabaseUser.user_metadata?.avatar_url,
      company_name: supabaseUser.user_metadata?.company_name,
    };
  };

  const checkUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('获取用户会话失败:', error);
        setUser(null);
      } else if (session?.user) {
        console.log('发现已登录用户:', session.user.email);
        setUser(mapSupabaseUser(session.user));
      } else {
        console.log('用户未登录');
        setUser(null);
      }
    } catch (error) {
      console.error('检查用户状态时出错:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 初始检查用户状态
    checkUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase auth state change:', event, session?.user?.email);

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              console.log('用户登录，更新状态:', session.user.email);
              const mappedUser = mapSupabaseUser(session.user);
              console.log('映射后的用户数据:', mappedUser);
              setUser(mappedUser);
            }
            setLoading(false);
            break;

          case 'SIGNED_OUT':
            console.log('用户登出，清除状态');
            setUser(null);
            setLoading(false);
            break;

          case 'TOKEN_REFRESHED':
            if (session?.user) {
              console.log('Token刷新，更新用户状态');
              setUser(mapSupabaseUser(session.user));
            }
            break;

          case 'USER_UPDATED':
            if (session?.user) {
              console.log('用户信息更新');
              setUser(mapSupabaseUser(session.user));
            }
            break;

          default:
            console.log('其他认证事件:', event);
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
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('登出失败:', error);
      }
    } catch (error) {
      console.error('登出时出错:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, []);

  return { user, loading, logout, checkUser };
}