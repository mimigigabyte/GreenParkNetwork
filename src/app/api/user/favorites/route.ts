import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequestUser, serviceSupabase } from '../../_utils/auth'
import type { AdminTechnology } from '@/lib/types/admin'

interface FavoriteRow {
  id: string
  user_id: string | null
  custom_user_id?: string | null
  technology_id: string
  created_at: string
  technology?: Partial<AdminTechnology> | null
}

function getAdminClient() {
  if (serviceSupabase) {
    return serviceSupabase
  }
  throw new Error('Supabase service role client is not configured')
}

function mapFavorite(row: FavoriteRow) {
  return {
    favoriteId: row.id,
    userId: row.user_id || row.custom_user_id || '',
    technologyId: row.technology_id,
    favoritedAt: row.created_at,
    technology: row.technology ?? null,
  }
}

function normalizeFavoriteRow(raw: any): FavoriteRow {
  const techField = raw?.technology
  let technology: Partial<AdminTechnology> | null = null

  if (Array.isArray(techField)) {
    const first = techField[0]
    technology = first ? (first as unknown as Partial<AdminTechnology>) : null
  } else if (techField && typeof techField === 'object') {
    technology = techField as unknown as Partial<AdminTechnology>
  }

  return {
    id: String(raw?.id ?? ''),
    user_id: raw?.user_id ? String(raw.user_id) : null,
    custom_user_id: raw?.custom_user_id ? String(raw.custom_user_id) : null,
    technology_id: String(raw?.technology_id ?? ''),
    created_at: String(raw?.created_at ?? ''),
    technology,
  }
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequestUser(request)
    if (!user) {
      return NextResponse.json({ error: '未登录用户无法查看收藏' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const technologyId = searchParams.get('technologyId')
    const userIdParam = searchParams.get('userId')

    const targetUserId = userIdParam ?? user.id
    if (targetUserId !== user.id) {
      return NextResponse.json({ error: '无权限访问其它用户收藏' }, { status: 403 })
    }

    const adminClient = getAdminClient()
    const userColumn = user.authType === 'custom' ? 'custom_user_id' : 'user_id'

    if (technologyId) {
      const { data, error } = await adminClient
        .from('user_favorites')
        .select('id, user_id, custom_user_id, technology_id, created_at')
        .eq(userColumn, targetUserId)
        .eq('technology_id', technologyId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('检查收藏状态失败:', error)
        return NextResponse.json({ error: '检查收藏状态失败' }, { status: 500 })
      }

      if (!data) {
        return NextResponse.json({ isFavorited: false, favoriteId: null })
      }

      return NextResponse.json({
        isFavorited: true,
        favoriteId: data.id,
        favoritedAt: data.created_at,
        technologyId: data.technology_id
      })
    }

    const { data, error } = await adminClient
      .from('user_favorites')
      .select(`
        id,
        user_id,
        custom_user_id,
        technology_id,
        created_at,
        technology:admin_technologies(
          id,
          name_zh,
          name_en,
          description_zh,
          description_en,
          brief_zh,
          brief_en,
          image_url,
          custom_label,
          tech_source,
          company_id,
          company_name_zh,
          company_name_en,
          company_logo_url,
          attachment_urls,
          category:admin_categories(
            id,
            name_zh,
            name_en,
            slug
          ),
          subcategory:admin_subcategories(
            id,
            name_zh,
            name_en,
            slug
          ),
          company:admin_companies(
            id,
            name_zh,
            name_en,
            logo_url
          )
        )
      `)
      .eq(userColumn, targetUserId)
      .order('created_at', { ascending: false })

    let rows: FavoriteRow[] = (data || []).map(normalizeFavoriteRow)

    if (error) {
      console.error('获取收藏列表失败 (尝试降级):', error)

      const { data: fallbackRows, error: fallbackError } = await adminClient
        .from('user_favorites')
        .select('id, user_id, custom_user_id, technology_id, created_at')
        .eq(userColumn, targetUserId)
        .order('created_at', { ascending: false })

      if (fallbackError) {
        console.error('获取收藏列表降级失败:', fallbackError)
        return NextResponse.json({ error: '获取收藏列表失败' }, { status: 500 })
      }

      rows = (fallbackRows || []).map(normalizeFavoriteRow)
    }

    const favorites = rows.map(mapFavorite)
    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('收藏接口GET异常:', error)
    return NextResponse.json({ error: '获取收藏信息失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequestUser(request)
    if (!user) {
      return NextResponse.json({ error: '未登录用户无法收藏' }, { status: 401 })
    }

    const { technologyId } = await request.json().catch(() => ({ technologyId: null }))
    if (!technologyId || typeof technologyId !== 'string') {
      return NextResponse.json({ error: '缺少技术ID' }, { status: 400 })
    }

    const adminClient = getAdminClient()
    const userColumn = user.authType === 'custom' ? 'custom_user_id' : 'user_id'
    const conflictTarget = user.authType === 'custom' ? 'custom_user_id,technology_id' : 'user_id,technology_id'

    const payload: Record<string, string> = { technology_id: technologyId }
    payload[userColumn] = user.id

    const { data: upserted, error: upsertError } = await adminClient
      .from('user_favorites')
      .upsert(payload, { onConflict: conflictTarget })
      .select('id, user_id, custom_user_id, technology_id, created_at')
      .single()

    if (upsertError) {
      console.error('收藏失败:', upsertError)
      return NextResponse.json({ error: '收藏失败' }, { status: 500 })
    }

    const { data: detailed, error: detailError } = await adminClient
      .from('user_favorites')
      .select(`
        id,
        user_id,
        custom_user_id,
        technology_id,
        created_at,
        technology:admin_technologies(
          id,
          name_zh,
          name_en,
          description_zh,
          description_en,
          brief_zh,
          brief_en,
          image_url,
          custom_label,
          tech_source,
          company_id,
          company_name_zh,
          company_name_en,
          company_logo_url,
          attachment_urls,
          category:admin_categories(
            id,
            name_zh,
            name_en,
            slug
          ),
          subcategory:admin_subcategories(
            id,
            name_zh,
            name_en,
            slug
          ),
          company:admin_companies(
            id,
            name_zh,
            name_en,
            logo_url
          )
        )
      `)
      .eq('id', upserted.id)
      .maybeSingle()

    if (!detailError && detailed) {
      const normalized = normalizeFavoriteRow(detailed)
      return NextResponse.json({ favorite: mapFavorite(normalized) }, { status: 201 })
    }

    if (detailError) {
      console.error('获取收藏详情失败:', detailError)
    }

    const normalizedFallback = normalizeFavoriteRow(upserted)
    return NextResponse.json({ favorite: mapFavorite(normalizedFallback) }, { status: 201 })
  } catch (error) {
    console.error('收藏接口POST异常:', error)
    return NextResponse.json({ error: '收藏失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateRequestUser(request)
    if (!user) {
      return NextResponse.json({ error: '未登录用户无法取消收藏' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    let technologyId = searchParams.get('technologyId')

    if (!technologyId) {
      const body = await request.json().catch(() => null)
      if (body && typeof body.technologyId === 'string') {
        technologyId = body.technologyId
      }
    }

    if (!technologyId) {
      return NextResponse.json({ error: '缺少技术ID' }, { status: 400 })
    }

    const adminClient = getAdminClient()
    const userColumn = user.authType === 'custom' ? 'custom_user_id' : 'user_id'

    const { error } = await adminClient
      .from('user_favorites')
      .delete()
      .eq(userColumn, user.id)
      .eq('technology_id', technologyId)

    if (error) {
      console.error('取消收藏失败:', error)
      return NextResponse.json({ error: '取消收藏失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('收藏接口DELETE异常:', error)
    return NextResponse.json({ error: '取消收藏失败' }, { status: 500 })
  }
}
