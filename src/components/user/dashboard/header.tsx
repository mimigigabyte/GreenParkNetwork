'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, User, LogOut, Settings, Globe, Home } from 'lucide-react'
import { useAuthContext } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils'
import { getUnreadInternalMessageCount } from '@/lib/supabase/contact-messages'

interface UserHeaderProps {
  className?: string
}

export function UserHeader({ className }: UserHeaderProps) {
  const { user, loading, logout } = useAuthContext()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en'>('zh')
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // 获取用户名（邮箱或手机号）
  const getUserName = () => {
    return user?.email || user?.phone || user?.name || 'User'
  }

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'zh' ? 'en' : 'zh')
  }

  const handleLogout = async () => {
    setShowUserMenu(false)
    try {
      await logout()
      // 退出登录后跳转到首页
      window.location.href = '/'
    } catch (error) {
      console.error('登出失败:', error)
      // 即使登出失败也跳转到首页
      window.location.href = '/'
    }
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

  // 点击外部区域关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  return (
    <header className={cn('h-16 bg-white border-b border-gray-200 fixed top-0 left-64 right-0 z-40', className)}>
      <div className="flex items-center justify-between h-full px-6">
        {/* 左侧 - 页面标题 */}
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900">
            欢迎您！{getUserName()}
          </h1>
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="返回平台首页"
          >
            <Home className="w-4 h-4 mr-1" />
            返回首页
          </button>
        </div>

        {/* 右侧 - 工具栏 */}
        <div className="flex items-center space-x-4">
          {/* 语言切换 */}
          <button
            onClick={toggleLanguage}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="切换语言"
          >
            <Globe className="w-4 h-4 mr-1" />
            {currentLanguage === 'zh' ? '中文' : 'EN'}
          </button>

          {/* 通知 */}
          <button
            onClick={() => window.location.href = '/user/messages'}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="消息中心"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* 用户菜单 */}
          {loading ? (
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium max-w-32 truncate">{getUserName()}</span>
              </button>

              {/* 用户下拉菜单 */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-[9999]">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{getUserName()}</p>
                    <p className="text-xs text-gray-500">{user.email || user.phone || '用户'}</p>
                  </div>
                  
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setShowUserMenu(false)
                      window.location.href = '/profile'
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    个人中心
                  </button>
                  
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}