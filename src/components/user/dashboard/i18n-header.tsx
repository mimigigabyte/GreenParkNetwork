'use client'

import { useState, useEffect } from 'react'
import { Bell, Home } from 'lucide-react'
import { useAuthContext } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils'
import { getUnreadInternalMessageCount } from '@/lib/supabase/contact-messages'
import { UserMenu } from '@/components/user/user-menu'
import { LanguageSwitcher } from '@/components/common/language-switcher'

interface I18nUserHeaderProps {
  className?: string
  locale: string
}

export function I18nUserHeader({ className, locale }: I18nUserHeaderProps) {
  const { user, loading } = useAuthContext()
  const [unreadCount, setUnreadCount] = useState(0)

  // 获取用户名（邮箱或手机号）
  const getUserName = () => {
    return user?.email || user?.phone || user?.name || (locale === 'en' ? 'User' : '用户')
  }

  // 加载未读消息数量
  useEffect(() => {
    if (user) {
      const loadUnreadCount = async () => {
        try {
          const count = await getUnreadInternalMessageCount();
          setUnreadCount(count);
        } catch (error) {
          console.error('加载未读消息数量失败:', error);
        }
      };
      
      loadUnreadCount();
      
      // 设置定时刷新未读消息数量
      const interval = setInterval(loadUnreadCount, 30000); // 每30秒刷新一次
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <header className={cn('h-16 bg-white border-b border-gray-200 fixed top-0 left-64 right-0 z-40', className)}>
      <div className="flex items-center justify-between h-full px-6">
        {/* 左侧 - 页面标题 */}
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900">
            {locale === 'en' ? `Welcome! ${getUserName()}` : `欢迎您！${getUserName()}`}
          </h1>
          <button
            onClick={() => window.location.href = `/${locale}`}
            className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title={locale === 'en' ? 'Return to platform homepage' : '返回平台首页'}
          >
            <Home className="w-4 h-4 mr-1" />
            {locale === 'en' ? 'Home' : '返回首页'}
          </button>
        </div>

        {/* 右侧 - 工具栏 */}
        <div className="flex items-center space-x-4">
          {/* 语言切换 */}
          <LanguageSwitcher />

          {/* 通知 */}
          <button
            onClick={() => window.location.href = `/${locale}/user/messages`}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title={locale === 'en' ? 'Message Center' : '消息中心'}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* 用户菜单 */}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}