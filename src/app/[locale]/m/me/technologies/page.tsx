"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/auth/auth-provider'
import { getUserTechnologiesApi } from '@/lib/api/user-technologies'
import type { AdminTechnology, TechReviewStatus } from '@/lib/types/admin'
import { TECH_REVIEW_STATUS_OPTIONS } from '@/lib/types/admin'
import { Search, Plus, ChevronRight } from 'lucide-react'
import { UserTechnologyForm } from '@/app/[locale]/user/technologies/components/user-technology-form'

export default function MobileMyTechnologiesPage() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthContext()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'

  const [q, setQ] = useState('')
  const [items, setItems] = useState<AdminTechnology[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (user?.id) performSearch(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const performSearch = async (reset: boolean) => {
    if (!user?.id || loading) return
    setLoading(true)
    try {
      const nextPage = reset ? 1 : page + 1
      const res = await getUserTechnologiesApi({
        userId: user.id,
        page: nextPage,
        pageSize,
        search: q.trim() || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
      setTotal(res.pagination.total)
      setPage(nextPage)
      setItems(prev => reset ? res.data : [...prev, ...res.data])
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center text-center px-6" style={{ backgroundColor: '#edeef7' }}>
        <p className="text-gray-600 mb-4">{locale==='en'?'Please login to manage your technologies':'请登录后管理您的技术'}</p>
        <button onClick={()=>router.push(`${locale==='en'?'/en':'/zh'}/m/login`)} className="h-11 px-5 rounded-xl bg-[#00b899] text-white">{locale==='en'?'Go to Login':'前往登录'}</button>
      </div>
    )
  }

  const getStatusLabel = (status?: TechReviewStatus) => {
    const option = TECH_REVIEW_STATUS_OPTIONS.find(o=>o.value===status)
    return locale==='en' ? (option?.label_en || 'Unknown') : (option?.label_zh || '未知')
  }
  const getStatusClass = (status?: TechReviewStatus) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'pending_review': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <section className="min-h-dvh pb-20" style={{ backgroundColor: '#edeef7' }}>
      {/* Header */}
      <div className="px-3 pt-4">
        <h1 className="text-[16px] font-semibold text-gray-900">{locale==='en'?'My Technologies':'技术发布'}</h1>
      </div>

      {/* Search + Publish button */}
      <div className="px-3 mt-3">
        <div className="h-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center px-3">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            onKeyDown={(e)=>{ if(e.key==='Enter') performSearch(true) }}
            placeholder={locale==='en'?'Search technology name, description...':'搜索技术名称、描述关键词...'}
            className="flex-1 bg-transparent outline-none text-[14px]"
          />
          <span className="mx-2 h-6 w-px bg-gray-200" />
          <button
            onClick={()=>setShowCreate(true)}
            className="inline-flex items-center gap-1 px-3 h-9 rounded-full bg-[#00b899] text-white text-[12px]"
          >
            <Plus className="w-4 h-4" />{locale==='en'?'Publish':'发布技术'}
          </button>
        </div>
        <div className="mt-2 text-[12px] text-gray-600">
          {locale==='en' ? `Total ${total}` : `共 ${total} 项`}
        </div>
      </div>

      {/* List */}
      <div className="px-3 mt-3">
        {items.length === 0 && !loading && (
          <div className="text-center text-gray-500 text-[13px] py-10">{locale==='en'?'No technologies yet':'暂无技术'}</div>
        )}
        <div className="grid grid-cols-1 gap-3">
          {items.map((it) => {
            const title = locale==='en' ? (it.name_en || it.name_zh) : it.name_zh
            const desc = locale==='en' ? (it.description_en || it.description_zh || '') : (it.description_zh || it.description_en || '')
            const cat = locale==='en' ? (it.category?.name_en || it.category?.name_zh || '') : (it.category?.name_zh || '')
            const sub = locale==='en' ? (it.subcategory?.name_en || it.subcategory?.name_zh || '') : (it.subcategory?.name_zh || '')
            const tagItems = [cat, sub].filter(Boolean) as string[]
            return (
              <article key={it.id} className="relative rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="flex-1 min-w-0 text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2">{title}</h3>
                  <span className={`shrink-0 inline-flex px-2 py-1 text-[11px] font-semibold rounded-full ${getStatusClass(it.review_status)}`}>
                    {getStatusLabel(it.review_status)}
                  </span>
                </div>
                {/* Content row */}
                <div className="mt-2 flex gap-3">
                  <div className="w-[96px] h-[96px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${it.image_url || ''})` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-gray-900 leading-relaxed line-clamp-5">{desc}</p>
                  </div>
                </div>
                {/* Tags row */}
                {tagItems.length>0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tagItems.map((tg, i) => (
                      <span key={i} className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-md border border-[#bfdbfe] text-[#2f6fde] bg-white text-[11px]">
                        <span className="truncate max-w-[160px]">{tg}</span>
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={()=> router.push(`${locale==='en'?'/en':'/zh'}/m/me/technologies/${it.id}`)}
                  aria-label={locale==='en'?'Enter':'进入'}
                  className="absolute right-3 bottom-3 w-9 h-9 rounded-full bg-[#00b899] text-white inline-flex items-center justify-center shadow"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Review status moved to header (right aligned) */}
              </article>
            )
          })}
        </div>

        {items.length < total && (
          <div className="mt-3">
            <button
              onClick={()=>performSearch(false)}
              disabled={loading}
              className={`w-full h-10 rounded-xl text-[14px] border ${loading ? 'text-gray-400 border-gray-200 bg-gray-100' : 'text-[#00b899] border-[#a7f3d0] bg-[#ecfdf5]'}`}
            >
              {loading ? (locale==='en'?'Loading...':'加载中...') : (locale==='en'?'Load more':'加载更多')}
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit overlay (reuse Web form component and logic) */}
      {showCreate && (
        <UserTechnologyForm
          technology={null}
          onSuccess={()=>{ setShowCreate(false); performSearch(true) }}
          onCancel={()=>setShowCreate(false)}
        />
      )}
    </section>
  )
}
