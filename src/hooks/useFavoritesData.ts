import { useCallback, useEffect, useState } from 'react'
import { useAuthContext } from '@/components/auth/auth-provider'
import { getFavorites, expandFavoriteTechnologies, type FavoriteItem } from '@/api/favorites'
import type { TechProduct } from '@/api/tech'

interface UseFavoritesDataResult {
  userId: string | null
  authLoading: boolean
  favorites: FavoriteItem[]
  favoriteTechnologies: TechProduct[]
  isLoading: boolean
  refresh: () => Promise<void>
  removeFavoriteLocally: (technologyId: string) => void
}

export function useFavoritesData(): UseFavoritesDataResult {
  const { user, loading: authLoading } = useAuthContext()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [favoriteTechnologies, setFavoriteTechnologies] = useState<TechProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const userId = user?.id ?? null

  const refresh = useCallback(async () => {
    if (!userId) {
      setFavorites([])
      setFavoriteTechnologies([])
      return
    }

    setIsLoading(true)
    try {
      const records = await getFavorites(userId)
      setFavorites(records)
      const techs = await expandFavoriteTechnologies(records)
      setFavoriteTechnologies(techs)
    } catch (error) {
      console.error('加载收藏数据失败:', error)
      setFavoriteTechnologies([])
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setFavorites([])
      setFavoriteTechnologies([])
      setIsLoading(false)
      return
    }
    refresh()
  }, [userId, refresh])

  const removeFavoriteLocally = useCallback((technologyId: string) => {
    if (!technologyId) return
    setFavorites((prev) => prev.filter((item) => item.technologyId !== technologyId))
    setFavoriteTechnologies((prev) => prev.filter((item) => item.id !== technologyId))
  }, [])

  return {
    userId,
    authLoading,
    favorites,
    favoriteTechnologies,
    isLoading,
    refresh,
    removeFavoriteLocally,
  }
}
