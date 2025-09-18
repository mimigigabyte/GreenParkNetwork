"use client"

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, Loader2 } from 'lucide-react'
import { useFavoritesData } from '@/hooks/useFavoritesData'
import { removeFavorite } from '@/api/favorites'
import type { TechProduct } from '@/api/tech'

export default function MobileFavoritesPage() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = pathname.startsWith('/en') ? 'en' : 'zh'
  return (
    <div className="px-3 py-3 pb-20" style={{ backgroundColor: '#edeef7' }}>
      <div className="rounded-2xl bg-white p-3 border border-gray-100">
        <div className="mb-3 flex items-center gap-2">
          <button onClick={()=>router.back()} aria-label={locale==='en'?'Back':'返回'} className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 inline-flex items-center justify-center active:scale-95">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-[16px] font-semibold text-gray-900">{locale==='en'?'My Favorites':'我的收藏'}</h2>
        </div>
        <MobileFavoritesList locale={locale} />
      </div>
    </div>
  )
}

function MobileFavoritesList({ locale }: { locale: string }) {
  const router = useRouter()
  const { userId, authLoading, favoriteTechnologies, isLoading, removeFavoriteLocally } = useFavoritesData()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const handleUnfavorite = async (tech: TechProduct) => {
    if (!userId) {
      alert(locale === 'en' ? 'Please login first' : '请先登录')
      return
    }
    if (pendingId) return
    setPendingId(tech.id)
    try {
      const success = await removeFavorite(tech.id)
      if (success) {
        removeFavoriteLocally(tech.id)
      } else {
        alert(locale === 'en' ? 'Failed to remove favorite, please try again later' : '取消收藏失败，请稍后重试')
      }
    } catch (error) {
      console.error('取消收藏失败:', error)
      alert(locale === 'en' ? 'Failed to update favorite, please try again later' : '收藏操作失败，请稍后重试')
    } finally {
      setPendingId(null)
    }
  }

  if (authLoading || isLoading) {
    return <MobileFavoritesSkeleton />
  }

  if (!userId) {
    return (
      <div className="text-center py-12">
        <Heart className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2 text-[14px] text-gray-700 font-medium">{locale==='en'?'Please login to view favorites':'请登录后查看收藏列表'}</p>
        <p className="mt-1 text-[12px] text-gray-500">{locale==='en'?'Log in to sync your saved technologies across devices.':'登录后可同步收藏技术，随时查看。'}</p>
      </div>
    )
  }

  if (favoriteTechnologies.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2 text-[14px] text-gray-700 font-medium">{locale==='en'?'No favorites yet':'暂无收藏'}</p>
        <p className="mt-1 text-[12px] text-gray-500">{locale==='en'?'Browse the marketplace and add interesting technologies to your favorites.':'快去技术市场逛逛，收藏感兴趣的技术吧。'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {favoriteTechnologies.map((it) => {
        const tags = buildMobileTags(it, locale)

        return (
          <article key={it.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <h3 className="flex-1 min-w-0 text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2">
                {locale === 'en' ? (it.solutionTitleEn || it.solutionTitle) : it.solutionTitle}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={()=> router.push(`${locale==='en'?'/en':'/zh'}/m/tech/${it.id}?from=favorites`)}
                  className="shrink-0 px-2.5 h-7 rounded-full bg-[#00b899] text-white text-[11px] leading-none flex items-center"
                >
                  {locale==='en' ? 'Details' : '查看详情'}
                </button>
                <button
                  onClick={() => handleUnfavorite(it)}
                  className={`h-7 w-7 rounded-full border flex items-center justify-center ${pendingId === it.id ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100'}`}
                  aria-label={locale==='en'?'Unfavorite':'取消收藏'}
                  disabled={pendingId === it.id}
                >
                  {pendingId === it.id ? (<Loader2 className="w-4 h-4 animate-spin" />) : (<Heart className="w-4 h-4 fill-current" />)}
                </button>
              </div>
            </div>
            <div className="mt-2 flex gap-3">
              <div className="w-[96px] h-[96px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                {it.solutionThumbnail || it.solutionImage ? (
                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${it.solutionThumbnail || it.solutionImage})` }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400">{locale==='en'?'No Image':'暂无图片'}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-900 leading-relaxed line-clamp-5">
                  {locale === 'en' ? (it.solutionDescriptionEn || it.shortDescriptionEn || '') : (it.solutionDescription || it.shortDescription || '')}
                </p>
              </div>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={`${it.id}-${index}`} className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-md border border-[#bfdbfe] text-[#2f6fde] bg-white text-[11px]">
                    {tag.kind === 'country' && tag.flag && (
                      <img src={tag.flag} alt="flag" className="w-3.5 h-3.5 rounded-sm object-cover" />
                    )}
                    <span className="truncate max-w-[140px]">{tag.text}</span>
                  </span>
                ))}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

function MobileFavoritesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm animate-pulse">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="flex gap-3">
            <div className="w-[96px] h-[96px] bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function buildMobileTags(product: TechProduct, locale: string) {
  const list: { text: string; kind?: 'country'; flag?: string }[] = []
  const category = locale === 'en' ? (product.categoryNameEn || product.category) : (product.categoryName || product.category)
  const subcategory = locale === 'en' ? (product.subCategoryNameEn || product.subCategory) : (product.subCategoryName || product.subCategory)
  const country = locale === 'en' ? (product.countryNameEn || product.country) : (product.countryName || product.country)
  const zone = locale === 'en' ? (product.developmentZoneNameEn || '') : (product.developmentZoneName || '')
  if (category) list.push({ text: category })
  if (subcategory) list.push({ text: subcategory })
  if (country) list.push({ text: country, kind: 'country', flag: product.countryFlagUrl })
  if (zone) list.push({ text: zone })
  return list
}
