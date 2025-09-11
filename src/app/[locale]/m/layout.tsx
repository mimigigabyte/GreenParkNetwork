'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useMemo } from 'react'
import { useAuthContext } from '@/components/auth/auth-provider'

export default function MobileLayout({
  children,
  params: { locale },
}: {
  children: ReactNode
  params: { locale: string }
}) {
  const pathname = usePathname()
  const tabs = useMemo(
    () => [
      { key: 'home', labelZh: '首页', labelEn: 'Home', href: `/${locale}/m/home` },
      { key: 'console', labelZh: '控制台', labelEn: 'Console', href: `/${locale}/m/console` },
      { key: 'chat', labelZh: '对话', labelEn: 'Chat', href: `/${locale}/m/chat` },
      { key: 'me', labelZh: '我的', labelEn: 'Me', href: `/${locale}/m/me` },
    ],
    [locale],
  )
  const isActive = (href: string) => pathname?.startsWith(href)
  const isEn = locale === 'en'
  const { user } = useAuthContext()
  // Route groups like (auth) are not part of URL; detect auth pages explicitly
  const isAuthPage = !!(pathname && (pathname.startsWith(`/${locale}/m/login`) || pathname.startsWith(`/${locale}/m/forgot`)))
  // Only show bottom nav after login and not on auth pages
  const showNav = Boolean(user) && !isAuthPage

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <main className={`flex-1 overflow-y-auto ${showNav ? 'pb-16' : ''}`}>{children}</main>
      {showNav && (
      <nav className="fixed bottom-0 left-0 right-0 h-14 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto max-w-md h-full grid grid-cols-4">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={`flex items-center justify-center text-sm ${
                isActive(t.href) ? 'text-green-700 font-medium' : 'text-gray-600'
              }`}
            >
              {isEn ? t.labelEn : t.labelZh}
            </Link>
          ))}
        </div>
      </nav>
      )}
    </div>
  )
}
