'use client'

import { Heart } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchResults } from '@/components/home/search-results'
import { useFavoritesData } from '@/hooks/useFavoritesData'

interface FavoritesProps {
  locale: string
}


export default function Favorites({ locale }: FavoritesProps) {
  const { userId, authLoading, favoriteTechnologies, isLoading, removeFavoriteLocally } = useFavoritesData()

  if (authLoading || isLoading) {
    return <FavoritesSkeleton />
  }

  if (!userId) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-4">
          {locale === 'en' ? 'My Favorites' : '我的收藏'}
        </h3>
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {locale === 'en' ? 'Please login to view favorites' : '请登录后查看收藏'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {locale === 'en'
              ? 'Log in to sync your saved technologies across devices.'
              : '登录后可同步您的技术收藏，随时随地轻松查看。'}
          </p>
        </div>
      </div>
    )
  }

  if (favoriteTechnologies.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-4">
          {locale === 'en' ? 'My Favorites' : '我的收藏'}
        </h3>
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {locale === 'en' ? 'No favorites yet' : '暂无收藏'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {locale === 'en' 
              ? 'Explore the technology marketplace to discover interesting technologies!' 
              : '快去技术市场逛逛，发现感兴趣的技术吧！'
            }
          </p>
        </div>
      </div>
    )
  }

  const companyCount = new Set(
    favoriteTechnologies.map((tech) => (locale === 'en' ? (tech.companyNameEn || tech.companyName) : tech.companyName)).filter(Boolean)
  ).size

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">
        {locale === 'en' ? `My Favorites (${favoriteTechnologies.length})` : `我的收藏 (${favoriteTechnologies.length})`}
      </h3>
      <SearchResults
        products={favoriteTechnologies}
        currentPage={1}
        totalPages={1}
        onPageChange={() => {}}
        totalResults={favoriteTechnologies.length}
        currentCategory=""
        companyCount={companyCount}
        technologyCount={favoriteTechnologies.length}
        pageSize={favoriteTechnologies.length || 20}
        onFavoriteRemoved={removeFavoriteLocally}
        showSummary={false}
        showSort={false}
        showPagination={false}
        locale={locale}
      />
    </div>
  )
}

function FavoritesSkeleton() {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4"><Skeleton className="h-6 w-32"/></h3>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
            <Skeleton className="w-32 h-24 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}
