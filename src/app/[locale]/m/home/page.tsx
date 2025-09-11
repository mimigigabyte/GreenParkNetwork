"use client"

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { getPublicCarouselApi } from '@/lib/api/public-carousel'
import { getFilterOptions, searchTechProducts, type FilterData, type SearchParams, type TechProduct } from '@/api/tech'

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
  const [filters, setFilters] = useState<FilterData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [q, setQ] = useState('')

  // Results
  const [items, setItems] = useState<TechProduct[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  const [searchLoading, setSearchLoading] = useState(false)

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
        setFilters(r.data)
        // pick first category by default
        const first = r.data.productCategories?.[0]?.id
        if (first) setSelectedCategory(first)
      }
    })()
    return () => { mounted = false }
  }, [])

  const subcategories = useMemo(() => {
    if (!filters) return []
    const cat = filters.productCategories?.find((c) => c.id === selectedCategory)
    return cat?.subcategories || []
  }, [filters, selectedCategory])

  const performSearch = async (resetPage = true) => {
    const nextPage = resetPage ? 1 : page + 1
    const params: SearchParams = {
      q: q.trim() || undefined,
      categoryId: selectedCategory || undefined,
      subcategoryId: selectedSubcategory || undefined,
      page: nextPage,
      pageSize,
      sort: 'recent',
    }
    setSearchLoading(true)
    try {
      const r = await searchTechProducts(params)
      if (r.success && r.data) {
        setTotal(r.data.total)
        setPage(nextPage)
        setItems((prev) => (resetPage ? r.data.products : [...prev, ...r.data.products]))
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
    <section className="min-h-dvh bg-white">
      {/* Carousel */}
      <div className="relative w-full h-[180px] overflow-hidden">
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
                {/* Use Image only when domain is allowed; fallback to bg */}
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
            {/* Dots */}
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

      {/* Search box */}
      <div className="px-3 mt-3">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tHome('searchPlaceholder')}
            className="flex-1 h-11 px-3 rounded-xl bg-gray-50 border border-transparent focus:border-[#00b899] outline-none text-[14px]"
          />
          <button
            onClick={() => performSearch(true)}
            className="h-11 px-4 rounded-xl bg-[#00b899] text-white text-[14px]"
          >
            {locale === 'en' ? 'Search' : '搜索'}
          </button>
        </div>
      </div>

      {/* Filters: category & subcategory chips */}
      <div className="px-3 mt-2">
        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 pb-1">
          {(filters?.productCategories || []).map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelectedCategory(c.id); setSelectedSubcategory(''); }}
              className={`whitespace-nowrap px-3 h-8 rounded-full border text-[12px] ${selectedCategory === c.id ? 'bg-[#e6fffa] border-[#00b899] text-[#007f66]' : 'bg-white border-gray-200 text-gray-600'}`}
            >
              {locale === 'en' ? c.name_en : c.name_zh}
            </button>
          ))}
        </div>
        {/* Subcategories */}
        {subcategories.length > 0 && (
          <div className="flex overflow-x-auto gap-2 mt-2 pb-1">
            {subcategories.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubcategory(s.id)}
                className={`whitespace-nowrap px-3 h-8 rounded-full border text-[12px] ${selectedSubcategory === s.id ? 'bg-[#eef2ff] border-[#6b6ee2] text-[#4b50d4]' : 'bg-white border-gray-200 text-gray-600'}`}
              >
                {locale === 'en' ? s.name_en : s.name_zh}
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
            <article key={it.id} className="rounded-xl border border-gray-100 bg-white p-3 flex gap-3">
              {/* Left square image */}
              <div className="w-[84px] h-[84px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${it.solutionThumbnail || it.solutionImage})` }} />
              </div>
              {/* Right content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-gray-900 line-clamp-2">
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
                <p className="mt-1 text-[12px] text-gray-600 line-clamp-2">
                  {locale === 'en' ? (it.shortDescriptionEn || it.solutionDescriptionEn || '') : (it.shortDescription || it.solutionDescription || '')}
                </p>
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
    </section>
  )
}
