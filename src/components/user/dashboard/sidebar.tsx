'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Lightbulb, Home, Building2, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  label: string
  icon: React.ElementType
  href: string
}

const menuItems: MenuItem[] = [
  {
    id: 'technologies',
    label: '技术发布',
    icon: Lightbulb,
    href: '/user/technologies'
  },
  {
    id: 'messages',
    label: '消息中心',
    icon: MessageSquare,
    href: '/user/messages'
  },
  {
    id: 'companies',
    label: '企业信息',
    icon: Building2,
    href: '/user/companies'
  }
]

export function UserSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname.startsWith(href)
  }

  return (
    <div className="fixed top-0 bottom-0 left-0 z-30 w-64 bg-white border-r border-gray-200">
      {/* Logo区域 */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center">
          <Home className="w-8 h-8 text-green-600 mr-2" />
          <div>
            <div className="text-lg font-bold text-gray-900">绿色技术平台</div>
            <div className="text-xs text-gray-500">用户控制台</div>
          </div>
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="px-3 py-6 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {menuItems.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive(item.href)
                  ? 'bg-green-100 text-green-900 border-r-2 border-green-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <item.icon className={cn('w-5 h-5 mr-3', isActive(item.href) ? 'text-green-600' : 'text-gray-400')} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* 底部信息 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p>版本 v1.0.0</p>
          <p className="mt-1">© 2025 绿色技术平台</p>
        </div>
      </div>
    </div>
  )
}
