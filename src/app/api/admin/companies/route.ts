import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥来绕过RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - 获取企业列表（分页）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let query = supabase
      .from('admin_companies')
      .select(`
        *,
        country:admin_countries(id, name_zh, name_en, code),
        province:admin_provinces(id, name_zh, name_en, code),
        development_zone:admin_development_zones(id, name_zh, name_en, code)
      `)

    // 搜索过滤
    if (search) {
      query = query.or(`name_zh.ilike.%${search}%,name_en.ilike.%${search}%,contact_person.ilike.%${search}%,industry_code.ilike.%${search}%`)
    }

    // 排序
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // 分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('获取企业列表失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建新企业
export async function POST(request: NextRequest) {
  try {
    const {
      name_zh,
      name_en,
      logo_url,
      address_zh,
      address_en,
      company_type,
      country_id,
      province_id,
      development_zone_id,
      industry_code,
      annual_output_value,
      contact_person,
      contact_phone,
      contact_email,
      is_active
    } = await request.json()

    // 基本验证
    if (!name_zh) {
      return NextResponse.json({ error: '企业中文名称不能为空' }, { status: 400 })
    }

    // 检查企业名称是否已存在
    const { data: existingCompany } = await supabase
      .from('admin_companies')
      .select('id')
      .eq('name_zh', name_zh)
      .single()

    if (existingCompany) {
      return NextResponse.json({ error: '企业名称已存在，请使用其他名称' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('admin_companies')
      .insert({
        name_zh,
        name_en,
        logo_url,
        address_zh,
        address_en,
        company_type,
        country_id,
        province_id,
        development_zone_id,
        industry_code,
        annual_output_value: annual_output_value ? parseFloat(annual_output_value) : null,
        contact_person,
        contact_phone,
        contact_email,
        is_active: is_active ?? true
      })
      .select(`
        *,
        country:admin_countries(id, name_zh, name_en, code),
        province:admin_provinces(id, name_zh, name_en, code),
        development_zone:admin_development_zones(id, name_zh, name_en, code)
      `)
      .single()

    if (error) {
      console.error('创建企业失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}