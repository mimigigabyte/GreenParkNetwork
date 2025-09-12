"use client"

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Search, SlidersHorizontal, Clock, ArrowDownAZ, ArrowUpAZ, ChevronDown } from 'lucide-react'
import { ContactUsModal } from '@/components/contact/contact-us-modal'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { getPublicCarouselApi } from '@/lib/api/public-carousel'
import type { AdminCarouselImage } from '@/lib/types/admin'
import { searchTechProducts, type SearchParams, type TechProduct, type SortType } from '@/api/tech'
import { useFilterData, transformFilterDataForComponents } from '@/hooks/admin/use-filter-data'
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
  const modalLocale: 'en' | 'zh' = locale === 'en' ? 'en' : 'zh'

  // Carousel
  const [carousel, setCarousel] = useState<AdminCarouselImage[]>([])
  const [current, setCurrent] = useState(0)
  const [loadingCarousel, setLoadingCarousel] = useState(true)

  // Filters & search
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  // H5 filter extras aligned with Web: country / province / national development zone
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [q, setQ] = useState('')

  // Results
  const [items, setItems] = useState<TechProduct[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  const [searchLoading, setSearchLoading] = useState(false)
  const [companyCount, setCompanyCount] = useState<number>(0)
  const [currentSort, setCurrentSort] = useState<SortType>('updateTime')
  const [sortOpen, setSortOpen] = useState(false)
  // UI state
  const [showFilter, setShowFilter] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactTech, setContactTech] = useState<{ id: string; name: string; company?: string } | null>(null)
  // Filter list expand toggles (limit to 2 lines by default)
  const [expandCategory, setExpandCategory] = useState(false)
  const [expandSubcategory, setExpandSubcategory] = useState(false)
  const [expandCountry, setExpandCountry] = useState(false)
  const [expandProvince, setExpandProvince] = useState(false)
  const [expandZone, setExpandZone] = useState(false)

  // Shared Web filter data (categories/countries/provinces/zones)
  const { data: fd, isLoading: fdLoading, loadProvinces, loadDevelopmentZones } = useFilterData()
  const transformed = useMemo(() => transformFilterDataForComponents(fd, locale), [fd, locale])

  // Load carousel
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await getPublicCarouselApi()
        if (!mounted) return
        if (list && list.length) setCarousel(list as AdminCarouselImage[])
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

  const subcategories = useMemo(() => {
    const cat = (transformed.mainCategories || []).find((c) => c.id === selectedCategory)
    return cat?.subCategories || []
  }, [transformed.mainCategories, selectedCategory])

  const performSearch = async (resetPage = true) => {
    const nextPage = resetPage ? 1 : page + 1
    const params: SearchParams = {
      keyword: q.trim() || undefined,
      category: selectedCategory || undefined,
      subCategory: selectedSubcategory || undefined,
      sortBy: currentSort,
      page: nextPage,
      pageSize,
    }
    setSearchLoading(true)
    try {
      const r = await searchTechProducts(params)
      if (r.success && r.data) {
        const data = r.data as any
        setTotal(data.total)
        if (data.stats?.companyCount != null) setCompanyCount(data.stats.companyCount)
        setPage(nextPage)
        setItems((prev) => (resetPage ? data.products : [...prev, ...data.products]))
      }
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    // initial search when shared filter data is ready
    if (!fdLoading) performSearch(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fdLoading])

  const pageContent = (
    <section className="min-h-dvh" style={{ backgroundColor: '#edeef7' }}>
      {/* Header: title aligned with language switcher; header is sticky at top */}
      <div
        className="px-3 pt-4 pb-2 sticky z-50 bg-transparent"
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative w-8 h-8">
              <Image src="/images/logo/绿盟logo.png" alt="logo" fill className="object-contain" />
            </div>
            <h1 className="text-[14px] font-semibold text-gray-900 truncate">{tHome('heroTitle')}</h1>
          </div>
          <LanguageSwitcher className="text-[12px]" hideIcon />
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

      {/* Search bar (pill) with inline filter and divider */}
      <div className="px-3 mt-3">
        <div className="h-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center px-3">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e)=>{ if(e.key==='Enter') performSearch(true) }}
            placeholder={tHome('searchPlaceholder')}
            className="flex-1 bg-transparent outline-none text-[14px]"
          />
          <span className="mx-2 h-6 w-px bg-gray-200" />
          <button
            onClick={()=>setShowFilter(true)}
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50"
            aria-label={locale==='en'?'Filter':'筛选'}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {((selectedCategory?1:0)+(selectedSubcategory?1:0)+(selectedCountry?1:0)+(selectedProvince?1:0)+(selectedZone?1:0))>0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00b899] text-white text-[10px] flex items-center justify-center">
                {(selectedCategory?1:0)+(selectedSubcategory?1:0)+(selectedCountry?1:0)+(selectedProvince?1:0)+(selectedZone?1:0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Categories section removed for H5 — filtering only via search bar button */}

      {/* Results header: count + sort */}
      <div className="px-3 mt-3">
        <div className="flex items-center justify-between">
          <div className="text-[12px] text-gray-700">
            {locale==='en' ? (
              <>
                Results: <span className="text-blue-600 font-semibold">{companyCount}</span> companies, <span className="text-blue-600 font-semibold">{total}</span> technologies
              </>
            ) : (
              <>
                相关结果：来自 <span className="text-blue-600 font-semibold">{companyCount}</span> 家企业的 <span className="text-blue-600 font-semibold">{total}</span> 项技术
              </>
            )}
          </div>
          <div className="relative">
            <button
              className="h-8 rounded-xl px-3 border border-gray-200 bg-white text-[12px] text-gray-800 inline-flex items-center gap-1 shadow-sm"
              onClick={()=>setSortOpen(v=>!v)}
            >
              <Clock className="w-4 h-4" />
              <span>{locale==='en' ? 'Sort' : '排序方式'}：</span>
              <span className="font-semibold">
                {currentSort==='updateTime' ? (locale==='en'?'Updated':'更新时间') : currentSort==='nameAsc' ? (locale==='en'?'Name A-Z':'名称升序') : (locale==='en'?'Name Z-A':'名称降序')}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {sortOpen && (
              <>
                <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <button onClick={()=>{ setCurrentSort('updateTime'); setSortOpen(false); performSearch(true) }} className={`w-full px-3 h-9 text-left text-[12px] hover:bg-gray-50 inline-flex items-center gap-2 ${currentSort==='updateTime'?'text-[#00b899] font-semibold':''}`}>
                    <Clock className="w-4 h-4" />{locale==='en'?'Updated':'更新时间'}
                  </button>
                  <button onClick={()=>{ setCurrentSort('nameAsc'); setSortOpen(false); performSearch(true) }} className={`w-full px-3 h-9 text-left text-[12px] hover:bg-gray-50 inline-flex items-center gap-2 ${currentSort==='nameAsc'?'text-[#00b899] font-semibold':''}`}>
                    <ArrowUpAZ className="w-4 h-4" />{locale==='en'?'Name A-Z':'名称升序'}
                  </button>
                  <button onClick={()=>{ setCurrentSort('nameDesc'); setSortOpen(false); performSearch(true) }} className={`w-full px-3 h-9 text-left text-[12px] hover:bg-gray-50 inline-flex items-center gap-2 ${currentSort==='nameDesc'?'text-[#00b899] font-semibold':''}`}>
                    <ArrowDownAZ className="w-4 h-4" />{locale==='en'?'Name Z-A':'名称降序'}
                  </button>
                </div>
                <div className="fixed inset-0 z-40" onClick={()=>setSortOpen(false)} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Results list */}
      <div className="px-3 mt-3 pb-20">
        {items.length === 0 && !searchLoading && (
          <div className="text-center text-gray-500 text-[13px] py-10">{locale === 'en' ? 'No results' : '暂无相关技术'}</div>
        )}
        <div className="grid grid-cols-1 gap-3">
          {items.map((it) => {
            const tagItems: { text: string; kind?: 'country' | 'default'; flag?: string }[] = []
            const cat = locale === 'en' ? (it.categoryNameEn || it.category) : (it.categoryName || it.category)
            const sub = locale === 'en' ? (it.subCategoryNameEn || it.subCategory) : (it.subCategoryName || it.subCategory)
            const country = locale === 'en' ? (it.countryNameEn || it.country) : (it.countryName || it.country)
            const zone = locale === 'en' ? (it.developmentZoneNameEn || '') : (it.developmentZoneName || '')
            if (cat) tagItems.push({ text: cat })
            if (sub) tagItems.push({ text: sub })
            if (country) tagItems.push({ text: country, kind: 'country', flag: it.countryFlagUrl })
            if (zone) tagItems.push({ text: zone })
            return (
              <article key={it.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                {/* Title row */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex-1 min-w-0 text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2">
                    {locale === 'en' ? (it.solutionTitleEn || it.solutionTitle) : it.solutionTitle}
                  </h3>
                  <button className="shrink-0 px-2.5 h-6 rounded-full bg-[#00b899] text-white text-[11px] leading-none flex items-center">
                    {locale==='en' ? 'Details' : '查看详情'}
                  </button>
                </div>
                {/* Content row */}
                <div className="mt-2 flex gap-3">
                  <div className="w-[96px] h-[96px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${it.solutionThumbnail || it.solutionImage})` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-gray-900 leading-relaxed line-clamp-5">
                      {locale === 'en' ? (it.solutionDescriptionEn || it.shortDescriptionEn || '') : (it.solutionDescription || it.shortDescription || '')}
                    </p>
                  </div>
                </div>
                {/* Tags row */}
                {tagItems.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tagItems.map((tg, i) => (
                      <span key={i} className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-md border border-[#bfdbfe] text-[#2f6fde] bg-white text-[11px]">
                        {tg.kind==='country' && tg.flag && (
                          // flag icon (square or round small image)
                          <img src={tg.flag} alt="flag" className="w-3.5 h-3.5 rounded-sm object-cover" />
                        )}
                        <span className="truncate max-w-[140px]">{tg.text}</span>
                      </span>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
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
              <h3 className="text-[15px] font-semibold">{locale==='en'?'Filters':'技术筛选'}{((selectedCategory?1:0)+(selectedSubcategory?1:0)+(selectedCountry?1:0)+(selectedProvince?1:0)+(selectedZone?1:0))>0 && <span className="ml-1 text-[12px] text-gray-500">({(selectedCategory?1:0)+(selectedSubcategory?1:0)+(selectedCountry?1:0)+(selectedProvince?1:0)+(selectedZone?1:0)})</span>}</h3>
              <button onClick={()=>{ setSelectedCategory(''); setSelectedSubcategory(''); setSelectedCountry(''); setSelectedProvince(''); setSelectedZone(''); }} className="text-[12px] text-gray-500">{locale==='en'?'Reset':'重置'}</button>
            </div>
            {fdLoading ? (
              <div className="py-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-8 w-20 bg-gray-200 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
            <div className="mb-3">
              <div className="text-[13px] text-gray-700 mb-1">{locale==='en'?'Category':'主分类'}</div>
              <div className="relative">
                <div className={`flex flex-wrap gap-2 ${expandCategory ? '' : 'max-h-[72px] overflow-hidden'}`}>
                  {(transformed.mainCategories||[]).map(c => (
                    <button key={c.id} onClick={()=>{ setSelectedCategory(c.id); setSelectedSubcategory('') }} className={`px-3 h-8 rounded-full border text-[12px] ${selectedCategory===c.id?'bg-[#e6fffa] border-[#00b899] text-[#007f66]':'bg-white border-gray-200 text-gray-600'}`}>{c.name}</button>
                  ))}
                </div>
                {!expandCategory && (transformed.mainCategories||[]).length > 10 && (
                  <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
                )}
              </div>
              {(transformed.mainCategories||[]).length > 10 && (
                <div className="mt-2">
                  <button
                    onClick={()=>setExpandCategory(v=>!v)}
                    className="h-8 px-0 text-[12px] text-[#60A5FA] hover:underline"
                  >
                    {locale==='en' ? (expandCategory ? 'Show less' : 'Show all') : (expandCategory ? '收起' : '显示全部')}
                  </button>
                </div>
              )}
            </div>
            )}
            {subcategories.length>0 && (
              <div className="mb-3">
                <div className="text-[13px] text-gray-700 mb-1">{locale==='en'?'Subcategory':'子分类'}</div>
                <div className="relative">
                  <div className={`flex flex-wrap gap-2 ${expandSubcategory ? '' : 'max-h-[72px] overflow-hidden'}`}>
                    {subcategories.map((s: any) => (
                      <button key={s.id} onClick={()=>setSelectedSubcategory(s.id)} className={`px-3 h-8 rounded-full border text-[12px] ${selectedSubcategory===s.id?'bg-[#eef2ff] border-[#6b6ee2] text-[#4b50d4]':'bg-white border-gray-200 text-gray-600'}`}>{s.name}</button>
                    ))}
                  </div>
                  {!expandSubcategory && subcategories.length > 10 && (
                    <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
                  )}
                </div>
                {subcategories.length > 10 && (
                  <div className="mt-2">
                    <button
                      onClick={()=>setExpandSubcategory(v=>!v)}
                      className="h-8 px-0 text-[12px] text-[#60A5FA] hover:underline"
                    >
                      {locale==='en' ? (expandSubcategory ? 'Show less' : 'Show all') : (expandSubcategory ? '收起' : '显示全部')}
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Country */}
            <div className="mb-3">
              <div className="text-[13px] text-gray-700 mb-1">{locale==='en'?'Country / Region':'国家与地区'}</div>
              {fdLoading ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 w-24 bg-gray-200 rounded-full" />
                  ))}
                </div>
              ) : (
                <div className="relative">
                  <div className={`flex flex-wrap gap-2 ${expandCountry ? '' : 'max-h-[72px] overflow-hidden'}`}>
                    {transformed.countries.map(c => (
                      <button key={c.value} onClick={async()=>{ setSelectedCountry(c.value); setSelectedProvince(''); setSelectedZone(''); const id = (fd.countries||[]).find(x=>x.code===c.value)?.id; if (id) await loadProvinces(id); }} className={`px-3 h-8 rounded-full border text-[12px] ${selectedCountry===c.value?'bg-[#e6fffa] border-[#00b899] text-[#007f66]':'bg-white border-gray-200 text-gray-600'}`}>
                        <span className="inline-flex items-center gap-1">
                          {c.logo_url && <img src={c.logo_url} alt="flag" className="w-3.5 h-3.5 rounded-sm" />}
                          {c.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  {!expandCountry && transformed.countries.length > 12 && (
                    <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
                  )}
                  {transformed.countries.length > 12 && (
                    <div className="mt-2">
                      <button
                        onClick={()=>setExpandCountry(v=>!v)}
                        className="h-8 px-0 text-[12px] text-[#60A5FA] hover:underline"
                      >
                        {locale==='en' ? (expandCountry ? 'Show less' : 'Show all') : (expandCountry ? '收起' : '显示全部')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Province */}
            {selectedCountry && (
              <div className="mb-3">
                <div className="text-[13px] text-gray-700 mb-1">{locale==='en'?'Province / State':'省份'}</div>
                {fdLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-8 w-24 bg-gray-200 rounded-full" />
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    <div className={`flex flex-wrap gap-2 ${expandProvince ? '' : 'max-h-[72px] overflow-hidden'}`}>
                      {transformed.provinces.map(p => (
                        <button key={p.value} onClick={async()=>{ setSelectedProvince(p.value); setSelectedZone(''); const id = (fd.provinces||[]).find(x=>x.code===p.value)?.id; if (id) await loadDevelopmentZones(id); }} className={`px-3 h-8 rounded-full border text-[12px] ${selectedProvince===p.value?'bg-[#eef2ff] border-[#6b6ee2] text-[#4b50d4]':'bg-white border-gray-200 text-gray-600'}`}>{p.label}</button>
                      ))}
                    </div>
                    {!expandProvince && transformed.provinces.length > 12 && (
                      <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
                    )}
                    {transformed.provinces.length > 12 && (
                      <div className="mt-2">
                        <button
                          onClick={()=>setExpandProvince(v=>!v)}
                          className="h-8 px-0 text-[12px] text-[#60A5FA] hover:underline"
                        >
                          {locale==='en' ? (expandProvince ? 'Show less' : 'Show all') : (expandProvince ? '收起' : '显示全部')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Development Zone */}
            {selectedProvince && (
              <div className="mb-2">
                <div className="text-[13px] text-gray-700 mb-1">{locale==='en'?'National Development Zone':'国家级经开区'}</div>
                {fdLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-8 w-28 bg-gray-200 rounded-full" />
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    <div className={`flex flex-wrap gap-2 ${expandZone ? '' : 'max-h-[72px] overflow-hidden'}`}>
                      {transformed.developmentZones.map(z => (
                        <button key={z.value} onClick={()=> setSelectedZone(z.value)} className={`px-3 h-8 rounded-full border text-[12px] ${selectedZone===z.value?'bg-[#e6fffa] border-[#00b899] text-[#007f66]':'bg-white border-gray-200 text-gray-600'}`}>{z.label}</button>
                      ))}
                    </div>
                    {!expandZone && transformed.developmentZones.length > 12 && (
                      <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
                    )}
                    {transformed.developmentZones.length > 12 && (
                      <div className="mt-2">
                        <button
                          onClick={()=>setExpandZone(v=>!v)}
                          className="h-8 px-0 text-[12px] text-[#60A5FA] hover:underline"
                        >
                          {locale==='en' ? (expandZone ? 'Show less' : 'Show all') : (expandZone ? '收起' : '显示全部')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <button onClick={()=>{ setSelectedCategory(''); setSelectedSubcategory(''); setSelectedCountry(''); setSelectedProvince(''); setSelectedZone(''); setExpandCategory(false); setExpandSubcategory(false); setExpandCountry(false); setExpandProvince(false); setExpandZone(false); }} className="flex-1 h-10 rounded-xl border border-gray-200 text-[14px]">{locale==='en'?'Reset':'重置'}</button>
              <button onClick={()=>{ setShowFilter(false); performSearch(true) }} className="flex-1 h-10 rounded-xl bg-[#00b899] text-white text-[14px]">{locale==='en'?'Apply':'确定'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact modal */}
      <ContactUsModal isOpen={contactOpen} onClose={()=>setContactOpen(false)} technologyId={contactTech?.id||''} technologyName={contactTech?.name||''} companyName={contactTech?.company||''} locale={modalLocale} />
    </section>
  )

  return pageContent
}
