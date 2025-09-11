"use client"

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Search, SlidersHorizontal } from 'lucide-react'
import { ContactUsModal } from '@/components/contact/contact-us-modal'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { getPublicCarouselApi } from '@/lib/api/public-carousel'
import { getFilterOptions, searchTechProducts, type SearchParams, type TechProduct } from '@/api/tech'
// Local type matching /api/tech/filter-options response
type H5FilterData = {
  categories: {
    value: string
    label: string
    labelEn: string
    subcategories: { value: string; label: string; labelEn: string }[]
  }[]
}

export default function MobileHomePage() {
  const pathname = usePathname()
  const router = useRouter()
  const tHome = useTranslations('home')
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'

  // Carousel
  const [carousel, setCarousel] = useState<Array<{ id: string; image_url: string; title_zh?: string; title_en?: string; link_url?: string }>>([])
  const [current, setCurrent] = useState(0)
  const [loadingCarousel, setLoadingCarousel] = useState(true)

  // Filters & search
  const [filters, setFilters] = useState<H5FilterData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [q, setQ] = useState('')

  // Results
  const [items, setItems] = useState<TechProduct[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  const [searchLoading, setSearchLoading] = useState(false)
  // UI state
  const [showFilter, setShowFilter] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactTech, setContactTech] = useState<{ id: string; name: string; company?: string } | null>(null)

  // Load carousel
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await getPublicCarouselApi()
        if (!mounted) return
        if (list && list.length) setCarousel(list as any)
        else setCarousel([])
      } catch {
        setCarousel([])
      } finally {
        setLoadingCarousel(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Auto-play
  useEffect(() => {
    if (!carousel.length) return
    const timer = setInterval(() => setCurrent((p) => (p + 1) % carousel.length), 6000)
    return () => clearInterval(timer)
  }, [carousel.length])

  // Load filter options
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const r = await getFilterOptions()
      if (!mounted) return
      if (r.success && r.data) {
        setFilters(r.data as unknown as H5FilterData)
        // pick first category by default (use slug value)
        const first = (r.data as any).categories?.[0]?.value
        if (first) setSelectedCategory(first)
      }
    })()
    return () => { mounted = false }
  }, [])

  const subcategories = useMemo(() => {
    if (!filters) return []
    const cat = filters.categories.find((c) => c.value === selectedCategory)
    return cat?.subcategories || []
  }, [filters, selectedCategory])

  const performSearch = async (resetPage = true) => {
    const nextPage = resetPage ? 1 : page + 1
    const params: SearchParams = {
      keyword: q.trim() || undefined,
      category: selectedCategory || undefined,
      subCategory: selectedSubcategory || undefined,
      page: nextPage,
      pageSize,
      sortBy: 'updateTime',
    }
    setSearchLoading(true)
    try {
      const r = await searchTechProducts(params)
      if (r.success && r.data) {
        const data = r.data as any
        setTotal(data.total)
        setPage(nextPage)
        setItems((prev) => (resetPage ? data.products : [...prev, ...data.products]))
      }
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    // initial search when filters prepared
    if (filters) performSearch(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, selectedCategory, selectedSubcategory])

  return (
    <section className="min-h-dvh" style={{ backgroundColor: '#edeef7' }}>
      {/* Top-right language switcher (iPhone safe area) */}
      <div
        className="fixed z-50"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
          right: 'calc(env(safe-area-inset-right, 0px) + 8px)'
        }}
      >
        <LanguageSwitcher className="text-[12px]" hideIcon />
      </div>
      {/* Header: logo + title */}
      <div className="px-3 pt-4 flex items-center gap-2">
        <div className="relative w-8 h-8">
          <Image src="/images/logo/绿盟logo.png" alt="logo" fill className="object-contain" />
        </div>
        <h1 className="text-[14px] font-semibold text-gray-900">{tHome('heroTitle')}</h1>
      </div>
      {/* Search bar with filter button */}
      <div className="px-3 mt-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-11 rounded-2xl bg-gray-50 border border-gray-200 flex items-center px-3">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter') performSearch(true) }}
              placeholder={tHome('searchPlaceholder')}
              className="flex-1 bg-transparent outline-none text-[14px]"
            />
          </div>
          <button onClick={()=>setShowFilter(true)} className="h-11 aspect-square rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Carousel (rounded) */}
      <div className="px-3 mt-3">
        <div className="relative w-full h-[180px] overflow-hidden rounded-2xl shadow-sm">
          {loadingCarousel ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
          ) : carousel.length ? (
            <>
              {carousel.map((c, idx) => (
                <div
                  key={c.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? 'opacity-100' : 'opacity-0'}`}
                  onClick={() => {
                    if (c.link_url) {
                      if (c.link_url.startsWith('http')) window.open(c.link_url, '_blank')
                      else router.push(c.link_url)
                    }
                  }}
                >
                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${c.image_url})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    {(locale === 'en' ? c.title_en : c.title_zh) && (
                      <h3 className="text-[14px] font-semibold leading-snug line-clamp-1">
                        {locale === 'en' ? c.title_en : c.title_zh}
                      </h3>
                    )}
                    {(locale === 'en' ? c.description_en : c.description_zh) && (
                      <p className="mt-0.5 text-[12px] leading-snug opacity-95 line-clamp-2">
                        {locale === 'en' ? c.description_en : c.description_zh}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {carousel.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)} className={`w-1.5 h-1.5 rounded-full ${i === current ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gray-100" />
          )}
        </div>
      </div>

      {/* Search bar with filter button */}
      <div className="px-3 mt-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-11 rounded-2xl bg-gray-50 border border-gray-200 flex items-center px-3">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter') performSearch(true) }}
              placeholder={tHome('searchPlaceholder')}
              className="flex-1 bg-transparent outline-none text-[14px]"
            />
          </div>
          <button onClick={()=>setShowFilter(true)} className="h-11 aspect-square rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Categories section */}
      <div className="px-3 mt-2">
        <div className="flex items-center justify-between px-0.5 mb-2">
          <h2 className="text-[15px] font-semibold text-gray-900">{locale==='en'?'Categories':'绿色低碳技术产品目录'}</h2>
          <button className="text-[12px] text-gray-500" onClick={()=>setShowFilter(true)}>{locale==='en'?'Filter':'筛选'}</button>
        </div>
        <div className="flex overflow-x-auto gap-3 pb-1">
          {(filters?.categories || []).map((c) => (
            <button
              key={c.value}
              onClick={() => { setSelectedCategory(c.value); setSelectedSubcategory(''); }}
              className={`shrink-0 w-16 h-16 rounded-full border flex items-center justify-center ${selectedCategory === c.value ? 'bg-[#e6fffa] border-[#00b899] text-[#007f66]' : 'bg-white border-gray-200 text-gray-600'}`}
            >
              <span className="text-[11px] leading-tight text-center px-1">{locale === 'en' ? c.labelEn : c.label}</span>
            </button>
          ))}
        </div>
        {/* Subcategories */}
        {subcategories.length > 0 && (
          <div className="flex overflow-x-auto gap-2 mt-2 pb-1">
            {subcategories.map((s) => (
              <button
                key={s.value}
                onClick={() => setSelectedSubcategory(s.value)}
                className={`whitespace-nowrap px-3 h-8 rounded-full border text-[12px] ${selectedSubcategory === s.value ? 'bg-[#eef2ff] border-[#6b6ee2] text-[#4b50d4]' : 'bg-white border-gray-200 text-gray-600'}`}
              >
                {locale === 'en' ? s.labelEn : s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results list */}
      <div className="px-3 mt-3 pb-20">
        {items.length === 0 && !searchLoading && (
          <div className="text-center text-gray-500 text-[13px] py-10">{locale === 'en' ? 'No results' : '暂无相关技术'}</div>
        )}
        <div className="grid grid-cols-1 gap-3">
          {items.map((it) => (
            <article key={it.id} className="rounded-xl border border-gray-100 bg-white p-3 flex gap-3 shadow-sm">
              {/* Left square image */}
              <div className="w-[84px] h-[84px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${it.solutionThumbnail || it.solutionImage})` }} />
              </div>
              {/* Right content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-[#00b899] line-clamp-2">
                  {locale === 'en' ? (it.solutionTitleEn || it.solutionTitle) : it.solutionTitle}
                </h3>
                {/* Tags: category + subcategory */}
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {(it.categoryName || it.categoryNameEn || it.category) && (
                    <span className="px-2 h-6 inline-flex items-center rounded-full bg-[#ecfdf5] text-[#007f66] border border-[#a7f3d0] text-[11px]">
                      {locale === 'en' ? (it.categoryNameEn || it.category) : (it.categoryName || it.category)}
                    </span>
                  )}
                  {(it.subCategoryName || it.subCategoryNameEn || it.subCategory) && (
                    <span className="px-2 h-6 inline-flex items-center rounded-full bg-[#eef2ff] text-[#4b50d4] border border-[#c7d2fe] text-[11px]">
                      {locale === 'en' ? (it.subCategoryNameEn || it.subCategory) : (it.subCategoryName || it.subCategory)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12px] text-gray-900 line-clamp-2">
                  {locale === 'en' ? (it.shortDescriptionEn || it.solutionDescriptionEn || '') : (it.shortDescription || it.solutionDescription || '')}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <button onClick={()=>{
                    // simple expand: navigate to desktop detail if exists or keep placeholder
                    // For now toggle to search page with keyword
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }} className="text-[12px] text-[#00b899]">{locale==='en'?'Read more':'展开更多'}</button>
                  <button onClick={()=>{ setContactTech({ id: it.id, name: locale==='en'?(it.solutionTitleEn||it.solutionTitle):it.solutionTitle, company: locale==='en'?(it.companyNameEn||it.companyName):it.companyName }); setContactOpen(true) }} className="px-3 h-8 rounded-full bg-[#00b899] text-white text-[12px]">{locale==='en'?'Contact':'联系我们'}</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {items.length < total && (
          <div className="mt-3">
            <button
              onClick={() => performSearch(false)}
              disabled={searchLoading}
              className={`w-full h-10 rounded-xl text-[14px] border ${searchLoading ? 'text-gray-400 border-gray-200 bg-gray-100' : 'text-[#00b899] border-[#a7f3d0] bg-[#ecfdf5]'}`}
            >
              {searchLoading ? (locale === 'en' ? 'Loading...' : '加载中...') : (locale === 'en' ? 'Load more' : '加载更多')}
            </button>
          </div>
        )}
      </div>
      {/* Filter Sheet */}
      {showFilter && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setShowFilter(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[15px] font-semibold">{locale==='en'?'Filters':'技术筛选'}</h3>
              <button onClick={()=>setShowFilter(false)} className="text-[12px] text-gray-500">{locale==='en'?'Close':'关闭'}</button>
            </div>
            <div className="mb-3">
              <div className="text-[13px] text-gray-700 mb-1">{locale==='en'?'Category':'主分类'}</div>
              <div className="flex flex-wrap gap-2">
                {(filters?.categories||[]).map(c => (
                  <button key={c.value} onClick={()=>{ setSelectedCategory(c.value); setSelectedSubcategory('') }} className={`px-3 h-8 rounded-full border text-[12px] ${selectedCategory===c.value?'bg-[#e6fffa] border-[#00b899] text-[#007f66]':'bg-white border-gray-200 text-gray-600'}`}>{locale==='en'?c.labelEn:c.label}</button>
                ))}
              </div>
            </div>
            {subcategories.length>0 && (
              <div className="mb-3">
                <div className="text-[13px] text-gray-700 mb-1">{locale==='en'?'Subcategory':'子分类'}</div>
                <div className="flex flex-wrap gap-2">
                  {subcategories.map(s => (
                    <button key={s.value} onClick={()=>setSelectedSubcategory(s.value)} className={`px-3 h-8 rounded-full border text-[12px] ${selectedSubcategory===s.value?'bg-[#eef2ff] border-[#6b6ee2] text-[#4b50d4]':'bg-white border-gray-200 text-gray-600'}`}>{locale==='en'?s.labelEn:s.label}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <button onClick={()=>{ setSelectedCategory(''); setSelectedSubcategory(''); }} className="flex-1 h-10 rounded-xl border border-gray-200 text-[14px]">{locale==='en'?'Reset':'重置'}</button>
              <button onClick={()=>{ setShowFilter(false); performSearch(true) }} className="flex-1 h-10 rounded-xl bg-[#00b899] text-white text-[14px]">{locale==='en'?'Apply':'确定'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact modal */}
      <ContactUsModal isOpen={contactOpen} onClose={()=>setContactOpen(false)} technologyId={contactTech?.id||''} technologyName={contactTech?.name||''} companyName={contactTech?.company||''} locale={locale as any} />

    </section>
  )
}
