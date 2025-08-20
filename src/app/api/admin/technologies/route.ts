import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用service role key创建Supabase客户端
const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - 获取所有技术或按条件筛选
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const userId = searchParams.get('userId')
    const reviewStatus = searchParams.get('reviewStatus')

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase.from('admin_technologies').select(
      `
      *,
      category:category_id(name_zh, name_en, slug),
      subcategory:subcategory_id(name_zh, name_en, slug)
    `,
      { count: 'exact' }
    )

    if (search) {
      query = query.or(
        `name_zh.ilike.%${search}%,name_en.ilike.%${search}%,description_zh.ilike.%${search}%`
      )
    }

    // 如果提供了用户ID，则只返回该用户创建的技术
    if (userId) {
      query = query.eq('created_by', userId)
    }

    // 根据审核状态筛选
    if (reviewStatus) {
      query = query.eq('review_status', reviewStatus)
    } else {
      // 如果没有指定审核状态，默认显示已发布的技术
      query = query.eq('review_status', 'published')
    }

    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to)

    if (error) {
      console.error('获取技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 手动查询相关的企业位置信息
    const enrichedData = await Promise.all(
      (data || []).map(async (tech) => {
        let company_country = null
        let company_province = null
        let company_development_zone = null

        // 查询国家信息
        if (tech.company_country_id) {
          const { data: countryData } = await supabase
            .from('admin_countries')
            .select('id, name_zh, name_en, logo_url')
            .eq('id', tech.company_country_id)
            .single()
          company_country = countryData
        }

        // 查询省份信息
        if (tech.company_province_id) {
          const { data: provinceData } = await supabase
            .from('admin_provinces')
            .select('id, name_zh, name_en, code')
            .eq('id', tech.company_province_id)
            .single()
          company_province = provinceData
        }

        // 查询经开区信息
        if (tech.company_development_zone_id) {
          const { data: zoneData } = await supabase
            .from('admin_development_zones')
            .select('id, name_zh, name_en, code')
            .eq('id', tech.company_development_zone_id)
            .single()
          company_development_zone = zoneData
        }

        return {
          ...tech,
          company_country,
          company_province,
          company_development_zone
        }
      })
    )

    return NextResponse.json({
      data: enrichedData,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建新技术
export async function POST(request: NextRequest) {
  try {
    const technologyData = await request.json()
    
    console.log('接收到的技术数据:', technologyData)
    
    // 准备要插入数据库的数据，只包含数据库表中存在的字段
    const insertData = {
      name_zh: technologyData.name_zh,
      name_en: technologyData.name_en,
      description_zh: technologyData.description_zh,
      description_en: technologyData.description_en,
      image_url: technologyData.image_url,
      tech_source: technologyData.tech_source,
      category_id: technologyData.category_id,
      subcategory_id: technologyData.subcategory_id,
      attachment_urls: technologyData.attachment_urls,
      attachments: technologyData.attachments,
      is_active: technologyData.is_active,
      
      // 企业关联字段
      company_id: technologyData.company_id,
      company_name_zh: technologyData.company_name_zh,
      company_name_en: technologyData.company_name_en,
      company_logo_url: technologyData.company_logo_url,
      company_country_id: technologyData.company_country_id,
      company_province_id: technologyData.company_province_id,
      company_development_zone_id: technologyData.company_development_zone_id,

      // 审核状态和创建者字段
      review_status: technologyData.review_status || 'published', // 管理员创建的技术默认为已发布
      ...(technologyData.created_by && { created_by: technologyData.created_by })
    }
    
    // 过滤掉undefined和null值
    const filteredData = Object.fromEntries(
      Object.entries(insertData).filter(([, value]) => value !== undefined && value !== null && value !== '')
    )
    
    console.log('准备插入的数据:', filteredData)
    
    const { data, error } = await supabase
      .from('admin_technologies')
      .insert(filteredData)
      .select()
      .single()

    if (error) {
      console.error('创建技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 