'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Lightbulb, Home, Building2, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  label_zh: string
  label_en: string
  icon: React.ElementType
  href: string
}

interface I18nUserSidebarProps {
  locale: string
}

const menuItems: MenuItem[] = [
  {
    id: 'technologies',
    label_zh: '技术发布',
    label_en: 'Publish Technology',
    icon: Lightbulb,
    href: '/user/technologies'
  },
  {
    id: 'messages',
    label_zh: '消息中心',
    label_en: 'Message Center',
    icon: MessageSquare,
    href: '/user/messages'
  },
  {
    id: 'companies',
    label_zh: '企业信息',
    label_en: 'Company Info',
    icon: Building2,
    href: '/user/companies'
  }
]

export function I18nUserSidebar({ locale }: I18nUserSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    // 检查当前路径是否匹配，考虑到国际化路由
    const normalizedPath = pathname.replace(/^\/[a-z]{2}/, '') // 移除语言代码
    return normalizedPath.startsWith(href)
  }

  return (
    <div className="fixed top-0 bottom-0 left-0 z-30 w-64 bg-white border-r border-gray-200">
      {/* Logo区域 */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Link href={`/${locale}`} className="flex items-center">
          <Home className="w-8 h-8 text-green-600 mr-2" />
          <div>
            <div className={`font-bold text-gray-900 ${locale === 'en' ? 'text-sm' : 'text-lg'} whitespace-nowrap`}>
              {locale === 'en' ? 'Green Tech Platform' : '绿色技术平台'}
            </div>
            <div className="text-xs text-gray-500">
              {locale === 'en' ? 'User Console' : '用户控制台'}
            </div>
          </div>
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="px-3 py-6 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {menuItems.map(item => {
            const localizedHref = `/${locale}${item.href}`
            const isItemActive = isActive(item.href)
            
            return (
              <Link
                key={item.id}
                href={localizedHref}
                className={cn(
                  'flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isItemActive
                    ? 'bg-green-100 text-green-900 border-r-2 border-green-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <item.icon className={cn('w-5 h-5 mr-3', isItemActive ? 'text-green-600' : 'text-gray-400')} />
                {locale === 'en' ? item.label_en : item.label_zh}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* 底部信息 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p>{locale === 'en' ? 'Version v1.0.0' : '版本 v1.0.0'}</p>
          <p className="mt-1">
            {locale === 'en' ? '© 2025 Green Tech Platform' : '© 2025 绿色技术平台'}
          </p>
        </div>
      </div>
    </div>
  )
}