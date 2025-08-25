'use client'

import { useState, useEffect, useRef } from 'react'
import { User, LogOut, Settings } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAuthContext } from '@/components/auth/auth-provider'

interface UserMenuProps {
  className?: string
}

export function UserMenu({ className }: UserMenuProps) {
  const { user, loading, logout } = useAuthContext()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  
  // 检测当前语言
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'

  // 获取用户名（邮箱或手机号）
  const getUserName = () => {
    return user?.email || user?.phone || user?.name || 'User'
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

  if (loading) {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
  }

  if (!user) {
    return null
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
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
            <p className="text-xs text-gray-500">{user.email || user.phone || (locale === 'en' ? 'User' : '用户')}</p>
          </div>
          
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowUserMenu(false)
              window.location.href = `/${locale}/profile`
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            {locale === 'en' ? 'Profile' : '个人中心'}
          </button>
          
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {locale === 'en' ? 'Sign Out' : '退出登录'}
          </button>
        </div>
      )}
    </div>
  )
}