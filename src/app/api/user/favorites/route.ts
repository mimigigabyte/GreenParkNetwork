import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequestUser, serviceSupabase } from '../../_utils/auth'
import type { AdminTechnology } from '@/lib/types/admin'

interface FavoriteRow {
  id: string
  user_id: string
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
    userId: row.user_id,
    technologyId: row.technology_id,
    favoritedAt: row.created_at,
    technology: row.technology ?? null
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

    if (technologyId) {
      const { data, error } = await adminClient
        .from('user_favorites')
        .select('id, technology_id, created_at')
        .eq('user_id', targetUserId)
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
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    let rows: FavoriteRow[] = data || []

    if (error) {
      console.error('获取收藏列表失败 (尝试降级):', error)

      const { data: fallbackRows, error: fallbackError } = await adminClient
        .from('user_favorites')
        .select('id, user_id, technology_id, created_at')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      if (fallbackError) {
        console.error('获取收藏列表降级失败:', fallbackError)
        return NextResponse.json({ error: '获取收藏列表失败' }, { status: 500 })
      }

      rows = (fallbackRows || []).map((item) => ({
        id: item.id,
        user_id: item.user_id,
        technology_id: item.technology_id,
        created_at: item.created_at,
        technology: null
      }))
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

    const { data: upserted, error: upsertError } = await adminClient
      .from('user_favorites')
      .upsert(
        { user_id: user.id, technology_id: technologyId },
        { onConflict: 'user_id,technology_id' }
      )
      .select('id, user_id, technology_id, created_at')
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
      return NextResponse.json({ favorite: mapFavorite(detailed) }, { status: 201 })
    }

    if (detailError) {
      console.error('获取收藏详情失败:', detailError)
    }

    const fallback: FavoriteRow = {
      id: upserted.id,
      user_id: upserted.user_id,
      technology_id: upserted.technology_id,
      created_at: upserted.created_at,
      technology: null
    }

    return NextResponse.json({ favorite: mapFavorite(fallback) }, { status: 201 })
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

    const { error } = await adminClient
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
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
