'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from './auth-provider';

interface SupabaseAuthHandlerProps {
  onMagicLinkLogin?: () => void;
}

export function SupabaseAuthHandler({ onMagicLinkLogin }: SupabaseAuthHandlerProps) {
  const router = useRouter();
  const { checkUser } = useAuthContext();

  useEffect(() => {
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase auth event:', event, session?.user?.email);

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              console.log('用户登录成功:', session.user.email);
              
              // 更新认证上下文
              await checkUser();
              
              // 检查是否是魔法链接访问（URL包含access_token）
              const isMagicLink = window.location.hash.includes('access_token=');
              
              console.log('用户登录成功，准备跳转');
              console.log('Magic Link:', isMagicLink);
              console.log('User metadata:', session.user.user_metadata);
              console.log('Email confirmed:', session.user.email_confirmed_at);
              
              // 处理魔法链接登录
              if (isMagicLink && onMagicLinkLogin) {
                console.log('魔法链接登录，通知父组件');
                onMagicLinkLogin();
              } else {
                // 普通登录成功，清除URL参数
                console.log('普通登录成功，清除URL参数');
                
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  if (url.hash || url.search) {
                    url.search = ''; // 清除查询参数
                    url.hash = ''; // 清除哈希
                    window.history.replaceState({}, '', url.pathname);
                  }
                }
              }
            }
            break;

          case 'SIGNED_OUT':
            console.log('用户登出');
            break;

          case 'TOKEN_REFRESHED':
            console.log('Token 已刷新');
            await checkUser();
            break;

          case 'USER_UPDATED':
            console.log('用户信息已更新');
            await checkUser();
            break;

          case 'PASSWORD_RECOVERY':
            console.log('密码重置邮件已发送');
            break;
        }
      }
    );

    // 处理页面加载时的认证状态
    const handleInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('获取会话失败:', error.message);
          return;
        }

        if (session?.user) {
          console.log('页面加载时发现已登录用户:', session.user.email);
          await checkUser();
          
          // 如果URL包含魔法链接参数，说明是通过邮件链接访问的
          if (window.location.hash.includes('access_token=')) {
            if (onMagicLinkLogin) {
              onMagicLinkLogin();
            } else {
              // 清除魔法链接参数
              const url = new URL(window.location.href);
              url.hash = '';
              window.history.replaceState({}, '', url.pathname + url.search);
            }
          }
        }
      } catch (error) {
        console.error('处理初始会话时出错:', error);
      }
    };

    handleInitialSession();

    // 清理监听器
    return () => {
      subscription?.unsubscribe();
    };
  }, [router, checkUser, onMagicLinkLogin]);

  return null; // 这个组件不渲染任何内容
}