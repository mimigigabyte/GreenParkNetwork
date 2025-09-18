import { handleApiResponse, safeDelete, safeGet, safePost } from '@/lib/safe-fetch'
import type { AdminTechnology } from '@/lib/types/admin'
import { getTechnologyById, type TechProduct } from '@/api/tech'

export interface FavoriteItem {
  favoriteId: string
  userId: string
  technologyId: string
  favoritedAt: string
  technology: Partial<AdminTechnology> | null
}

export interface FavoriteStatusResponse {
  isFavorited: boolean
  favoriteId: string | null
  favoritedAt?: string
  technologyId?: string
}

const buildQuery = (params: Record<string, string | undefined>) => {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      qs.append(key, value)
    }
  })
  const query = qs.toString()
  return query ? `?${query}` : ''
}

export async function getFavorites(userId?: string): Promise<FavoriteItem[]> {
  const resp = await safeGet(`/api/user/favorites${buildQuery({ userId })}`, true)
  const data = await handleApiResponse(resp)
  return (data?.favorites ?? []) as FavoriteItem[]
}

export async function addFavorite(technologyId: string): Promise<FavoriteItem | null> {
  const resp = await safePost('/api/user/favorites', { technologyId }, true)
  const data = await handleApiResponse(resp)
  return (data?.favorite ?? null) as FavoriteItem | null
}

export async function removeFavorite(technologyId: string): Promise<boolean> {
  const resp = await safeDelete(`/api/user/favorites${buildQuery({ technologyId })}`, true)
  const data = await handleApiResponse(resp)
  return !!data?.success
}

export async function getFavoriteStatus(technologyId: string): Promise<FavoriteStatusResponse> {
  const resp = await safeGet(`/api/user/favorites${buildQuery({ technologyId })}`, true)
  const data = await handleApiResponse(resp)
  return data as FavoriteStatusResponse
}

const uniqueById = <T extends { id?: string | null }>(items: T[]): T[] => {
  const seen = new Set<string>()
  const result: T[] = []
  for (const item of items) {
    const id = item.id ?? undefined
    if (!id) continue
    if (seen.has(id)) continue
    seen.add(id)
    result.push(item)
  }
  return result
}

export async function expandFavoriteTechnologies(favorites: FavoriteItem[]): Promise<TechProduct[]> {
  if (!favorites.length) return []

  const ids = favorites
    .map((item) => item.technologyId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)

  if (!ids.length) return []

  const results = await Promise.allSettled(
    ids.map(async (id) => {
      const detail = await getTechnologyById(id)
      if (detail.success && detail.data) {
        return detail.data as TechProduct
      }
      return null
    })
  )

  const technologies: TechProduct[] = []
  results.forEach((res) => {
    if (res.status === 'fulfilled' && res.value) {
      technologies.push(res.value)
    }
  })

  return uniqueById(technologies)
}

export async function getFavoriteTechnologies(userId?: string): Promise<TechProduct[]> {
  const favorites = await getFavorites(userId)
  return expandFavoriteTechnologies(favorites)
}
