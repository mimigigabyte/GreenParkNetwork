"use client"

import { usePathname } from 'next/navigation'
import AccountSecurity from '@/app/[locale]/profile/components/account-security'

export default function MobileSecurityPage() {
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'
  return (
    <div className="px-3 py-3 pb-20" style={{ backgroundColor: '#edeef7' }}>
      <div className="rounded-2xl bg-white p-3 border border-gray-100">
        <AccountSecurity locale={locale} />
      </div>
    </div>
  )
}

