"use client"

import { usePathname } from 'next/navigation'
import BasicInfo from '@/app/[locale]/profile/components/basic-info'

export default function MobileBasicInfoPage() {
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'
  return (
    <div className="px-3 py-3 pb-20" style={{ backgroundColor: '#edeef7' }}>
      <div className="rounded-2xl bg-white p-3 border border-gray-100">
        <BasicInfo locale={locale} />
      </div>
    </div>
  )
}

