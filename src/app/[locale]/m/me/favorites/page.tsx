"use client"

import { usePathname, useRouter } from 'next/navigation'
import Favorites from '@/app/[locale]/profile/components/favorites'
import { ArrowLeft } from 'lucide-react'

export default function MobileFavoritesPage() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'
  return (
    <div className="px-3 py-3 pb-20" style={{ backgroundColor: '#edeef7' }}>
      <div className="rounded-2xl bg-white p-3 border border-gray-100">
        <div className="mb-2 flex items-center gap-2">
          <button onClick={()=>router.back()} aria-label={locale==='en'?'Back':'返回'} className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 inline-flex items-center justify-center active:scale-95">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-[16px] font-semibold text-gray-900">{locale==='en'?'My Favorites':'我的收藏'}</h2>
        </div>
        <Favorites locale={locale} />
      </div>
    </div>
  )
}
