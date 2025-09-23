import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequestUser, serviceSupabase } from '@/app/api/_utils/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const db = serviceSupabase
  ?? supabaseAdmin
  ?? (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : null)

function requireDb() {
  if (!db) {
    throw new Error('Supabase service client is not configured')
  }
  return db
}

export async function GET(request: NextRequest) {
  try {
    const client = requireDb()
    const user = await authenticateRequestUser(request)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const requestedUserId = searchParams.get('userId') || user.id

    if (requestedUserId !== user.id) {
      return NextResponse.json({ error: '无权限查看其他用户技术列表' }, { status: 403 })
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = client
      .from('admin_technologies')
      .select(`
        *,
        category:category_id(name_zh, name_en, slug),
        subcategory:subcategory_id(name_zh, name_en, slug)
      `, { count: 'exact' })
      .eq('created_by', requestedUserId)

    if (search) {
      query = query.or(`name_zh.ilike.%${search}%,name_en.ilike.%${search}%,description_zh.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .order('featured_weight', { ascending: false })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to)

    if (error) {
      console.error('获取用户技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    })
  } catch (error) {
    console.error('用户技术 API 错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = requireDb()
    const user = await authenticateRequestUser(request)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    if (!body?.subcategory_id) {
      return NextResponse.json({ error: '技术子分类不能为空' }, { status: 400 })
    }

    let finalImageUrl = body.image_url
    if (!finalImageUrl && body.subcategory_id) {
      try {
        const { data: subcategory } = await client
          .from('admin_subcategories')
          .select('default_tech_image_url')
          .eq('id', body.subcategory_id)
          .maybeSingle()
        if (subcategory?.default_tech_image_url) {
          finalImageUrl = subcategory.default_tech_image_url
        }
      } catch (err) {
        console.warn('获取子分类默认图片失败:', err)
      }
    }

    let companyData: Record<string, string | undefined> = {}
    if (body.company_id) {
      const { data: company } = await client
        .from('admin_companies')
        .select('id, name_zh, name_en, logo_url, country_id, province_id, development_zone_id')
        .eq('id', body.company_id)
        .eq('is_active', true)
        .maybeSingle()
      if (company) {
        companyData = {
          company_id: company.id,
          company_name_zh: company.name_zh || undefined,
          company_name_en: company.name_en || undefined,
          company_logo_url: company.logo_url || undefined,
          company_country_id: company.country_id || undefined,
          company_province_id: company.province_id || undefined,
          company_development_zone_id: company.development_zone_id || undefined,
        }
      }
    } else {
      const companyColumn = user.authType === 'custom' ? 'custom_user_id' : 'user_id'
      const { data: ownedCompany } = await client
        .from('admin_companies')
        .select('id, name_zh, name_en, logo_url, country_id, province_id, development_zone_id')
        .eq(companyColumn, user.id)
        .eq('is_active', true)
        .maybeSingle()
      if (ownedCompany) {
        companyData = {
          company_id: ownedCompany.id,
          company_name_zh: ownedCompany.name_zh || undefined,
          company_name_en: ownedCompany.name_en || undefined,
          company_logo_url: ownedCompany.logo_url || undefined,
          company_country_id: ownedCompany.country_id || undefined,
          company_province_id: ownedCompany.province_id || undefined,
          company_development_zone_id: ownedCompany.development_zone_id || undefined,
        }
      }
    }

    const normalizedWebsite = body.website_url?.trim()
      ? (/^https?:\/\//i.test(body.website_url.trim()) ? body.website_url.trim() : `https://${body.website_url.trim()}`)
      : undefined

    const insertData = Object.fromEntries(
      Object.entries({
        name_zh: body.name_zh,
        name_en: body.name_en,
        description_zh: body.description_zh,
        description_en: body.description_en,
        website_url: normalizedWebsite,
        image_url: finalImageUrl,
        tech_source: body.tech_source,
        acquisition_method: body.acquisition_method,
        category_id: body.category_id,
        subcategory_id: body.subcategory_id,
        custom_label: body.custom_label,
        attachment_urls: Array.isArray(body.attachments)
          ? body.attachments.map((att: any) => att.url)
          : body.attachment_urls || [],
        attachments: body.attachments,
        is_active: body.is_active ?? true,
        review_status: 'pending_review',
        created_by: user.id,
        ...companyData,
      }).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    )

    const { data, error } = await client
      .from('admin_technologies')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('创建用户技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      await notifyAdminNewTechnology(client, data)
    } catch (notifyError) {
      console.error('发送管理员通知失败:', notifyError)
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('用户技术创建 API 错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function notifyAdminNewTechnology(client: any, technology: any) {
  try {
    const adminIds: string[] = []

    if (supabaseAdmin) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 })
      if (list?.users?.length) {
        for (const user of list.users) {
          const metaRole = (user.user_metadata as any)?.role
          if (metaRole === 'admin') {
            adminIds.push(user.id)
          }
        }
      }
    }

    if (adminIds.length === 0) return

    const now = new Date().toISOString()
    const notifications = adminIds.map((adminId) => ({
      from_user_id: technology.created_by,
      to_user_id: adminId,
      title: '新技术提交审核',
      content: `用户提交了新技术“${technology.name_zh || technology.name_en || ''}”，请及时审核。`,
      category: '发布审核',
      is_read: false,
      created_at: now,
      updated_at: now,
    }))

    await client.from('internal_messages').insert(notifications)
  } catch (error) {
    console.error('通知管理员新技术失败:', error)
  }
}
