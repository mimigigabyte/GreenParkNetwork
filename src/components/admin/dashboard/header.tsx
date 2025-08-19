'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, User, LogOut, Settings, Globe, Home, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminStats } from '@/hooks/use-admin-stats'

interface AdminHeaderProps {
  className?: string
}

export function AdminHeader({ className }: AdminHeaderProps) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en'>('zh')
  const { stats } = useAdminStats()
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'zh' ? 'en' : 'zh')
  }

  const handleLogout = () => {
    // 清除管理员认证信息
    localStorage.removeItem('admin_authenticated')
    localStorage.removeItem('admin_auth_time')
    
    // 清除cookie
    document.cookie = 'admin_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'admin_auth_time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    
    // 跳转到首页
    router.push('/')
  }

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className={cn('h-16 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40', className)}>
      <div className="flex items-center justify-between h-full px-6 ml-64">
        {/* 左侧 - 面包屑或页面标题 */}
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900">
            管理员控制台
          </h1>
          <button
            onClick={() => router.push('/')}
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
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="通知"
            >
              <Bell className="w-5 h-5" />
              {/* 通知数量徽章 */}
              {stats.totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px]">
                  {stats.totalNotifications > 99 ? '99+' : stats.totalNotifications}
                </span>
              )}
            </button>

            {/* 通知下拉菜单 */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">通知中心</h3>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {/* 待处理联系消息 */}
                  {stats.pendingContacts > 0 && (
                    <button
                      onClick={() => {
                        router.push('/admin/messages')
                        setShowNotifications(false)
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Bell className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">待处理联系消息</p>
                        <p className="text-xs text-gray-500">有 {stats.pendingContacts} 条新的用户联系消息</p>
                      </div>
                      <span className="flex-shrink-0 bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                        {stats.pendingContacts}
                      </span>
                    </button>
                  )}
                  
                  {/* 待审核技术 */}
                  {stats.pendingTechnologies > 0 && (
                    <button
                      onClick={() => {
                        router.push('/admin/technologies')
                        setShowNotifications(false)
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <Lightbulb className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">待审核技术</p>
                        <p className="text-xs text-gray-500">有 {stats.pendingTechnologies} 个技术等待审核</p>
                      </div>
                      <span className="flex-shrink-0 bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                        {stats.pendingTechnologies}
                      </span>
                    </button>
                  )}
                  
                  {/* 无通知时的状态 */}
                  {stats.totalNotifications === 0 && (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">暂无新通知</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 用户菜单 */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-medium">管理员</span>
            </button>

            {/* 用户下拉菜单 */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">管理员</p>
                  <p className="text-xs text-gray-500">admin@greentech.com</p>
                </div>
                
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  账户设置
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
        </div>
      </div>
    </header>
  )
}