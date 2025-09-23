import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequestUser, serviceSupabase } from '@/app/api/_utils/auth'
import { supabaseAdmin } from '@/lib/supabase'

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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = requireDb()
    const user = await authenticateRequestUser(request)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { data, error } = await client
      .from('admin_technologies')
      .select(`
        *,
        category:category_id(*),
        subcategory:subcategory_id(*)
      `)
      .eq('id', params.id)
      .maybeSingle()

    if (error) {
      console.error('获取技术详情失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: '技术不存在' }, { status: 404 })
    }

    const ownerMatches = data.custom_created_by
      ? data.custom_created_by === user.id
      : data.created_by === user.id

    if (!ownerMatches) {
      return NextResponse.json({ error: '无权限查看该技术' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('用户技术详情 API 错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = requireDb()
    const user = await authenticateRequestUser(request)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()

    const { data: existingTech, error: fetchError } = await client
      .from('admin_technologies')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (fetchError) {
      console.error('查询技术失败:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!existingTech) {
      return NextResponse.json({ error: '技术不存在' }, { status: 404 })
    }

    const ownerMatches = existingTech.custom_created_by
      ? existingTech.custom_created_by === user.id
      : existingTech.created_by === user.id

    if (!ownerMatches) {
      return NextResponse.json({ error: '无权限更新此技术' }, { status: 403 })
    }

    const finalSubcategoryId = body.subcategory_id ?? existingTech.subcategory_id
    if (!finalSubcategoryId) {
      return NextResponse.json({ error: '技术子分类不能为空' }, { status: 400 })
    }

    const updateData = Object.fromEntries(
      Object.entries({
        name_zh: body.name_zh,
        name_en: body.name_en,
        description_zh: body.description_zh,
        description_en: body.description_en,
        website_url: body.website_url,
        image_url: body.image_url,
        tech_source: body.tech_source,
        acquisition_method: body.acquisition_method,
        category_id: body.category_id,
        subcategory_id: finalSubcategoryId,
        custom_label: body.custom_label,
        attachment_urls: Array.isArray(body.attachments)
          ? body.attachments.map((att: any) => att.url)
          : body.attachment_urls || [],
        attachments: body.attachments,
        is_active: body.is_active,
        company_id: body.company_id,
        company_name_zh: body.company_name_zh,
        company_name_en: body.company_name_en,
        company_logo_url: body.company_logo_url,
        company_country_id: body.company_country_id,
        company_province_id: body.company_province_id,
        company_development_zone_id: body.company_development_zone_id,
        review_status: body.review_status ?? existingTech.review_status,
        updated_at: new Date().toISOString(),
      }).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    )

    const { data, error } = await client
      .from('admin_technologies')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('更新用户技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('用户技术更新 API 错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = requireDb()
    const user = await authenticateRequestUser(request)
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { data: existingTech, error: fetchError } = await client
      .from('admin_technologies')
      .select('id, created_by, custom_created_by')
      .eq('id', params.id)
      .maybeSingle()

    if (fetchError) {
      console.error('查询技术失败:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!existingTech) {
      return NextResponse.json({ error: '技术不存在' }, { status: 404 })
    }

    const ownerMatches = existingTech.custom_created_by
      ? existingTech.custom_created_by === user.id
      : existingTech.created_by === user.id

    if (!ownerMatches) {
      return NextResponse.json({ error: '无权限删除此技术' }, { status: 403 })
    }

    const { error } = await client
      .from('admin_technologies')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('删除用户技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('用户技术删除 API 错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
