import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// 强制动态渲染，避免缓存
export const dynamic = 'force-dynamic'

// GET - 获取用户创建的技术
export async function GET(request: NextRequest) {
  try {
    const db = supabaseAdmin ?? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID不能为空' },
        { status: 400 }
      )
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = db.from('admin_technologies').select(
      `
      *,
      category:category_id(name_zh, name_en, slug),
      subcategory:subcategory_id(name_zh, name_en, slug)
    `,
      { count: 'exact' }
    )

    // 只返回该用户创建的技术
    query = query.eq('created_by', userId)

    if (search) {
      query = query.or(
        `name_zh.ilike.%${search}%,name_en.ilike.%${search}%,description_zh.ilike.%${search}%`
      )
    }

    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to)

    if (error) {
      console.error('获取用户技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    })
  } catch (error) {
    console.error('用户技术API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 用户创建新技术
export async function POST(request: NextRequest) {
  try {
    const db = supabaseAdmin ?? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const technologyData = await request.json()
    
    console.log('用户创建技术数据:', technologyData)

    // 校验：子分类必填
    if (!technologyData?.subcategory_id) {
      return NextResponse.json({ error: '技术子分类不能为空' }, { status: 400 })
    }
    
    // 如果没有技术图片且指定了子分类，获取子分类的默认技术图片
    let finalImageUrl = technologyData.image_url
    if (!finalImageUrl && technologyData.subcategory_id) {
      try {
        const { data: subcategory } = await supabaseAdmin
          .from('admin_subcategories')
          .select('default_tech_image_url')
          .eq('id', technologyData.subcategory_id)
          .single()
        
        if (subcategory?.default_tech_image_url) {
          finalImageUrl = subcategory.default_tech_image_url
          console.log('使用子分类默认技术图片:', finalImageUrl)
        }
      } catch (error) {
        console.warn('获取子分类默认图片失败:', error)
      }
    }
    
    // 获取用户的企业信息
    let companyData: {
      company_id?: string;
      company_name_zh?: string;
      company_name_en?: string;
      company_logo_url?: string;
      company_country_id?: string;
      company_province_id?: string;
      company_development_zone_id?: string;
    } = {}
    if (technologyData.company_id) {
      const { data: company, error: companyError } = await db
        .from('admin_companies')
        .select('id, name_zh, name_en, logo_url, country_id, province_id, development_zone_id')
        .eq('id', technologyData.company_id)
        .single()
      
      if (!companyError && company) {
        companyData = {
          company_id: company.id,
          company_name_zh: company.name_zh,
          company_name_en: company.name_en,
          company_logo_url: company.logo_url,
          company_country_id: company.country_id,
          company_province_id: company.province_id,
          company_development_zone_id: company.development_zone_id
        }
      }
    }
    
    // 准备要插入数据库的数据 - 只包含基本字段
    const insertData = {
      name_zh: technologyData.name_zh,
      name_en: technologyData.name_en,
      description_zh: technologyData.description_zh,
      description_en: technologyData.description_en,
      image_url: finalImageUrl,
      tech_source: technologyData.tech_source,
      acquisition_method: technologyData.acquisition_method, // 添加技术获取方式字段
      category_id: technologyData.category_id,
      subcategory_id: technologyData.subcategory_id,
      custom_label: technologyData.custom_label, // 自定义标签
      // 处理附件数据：支持新旧格式
      attachment_urls: (() => {
        // 如果有新的attachments数组，提取URL
        if (technologyData.attachments && Array.isArray(technologyData.attachments)) {
          return technologyData.attachments.map((att: any) => att.url)
        }
        // 否则使用旧的attachment_urls
        return technologyData.attachment_urls || []
      })(),
      
      // 同时保存完整的附件信息（如果数据库支持）
      attachments: technologyData.attachments,
      is_active: technologyData.is_active,
      
      // 审核状态和创建者字段
      review_status: 'pending_review', // 用户创建的技术默认为待审核
      ...(technologyData.userId && { created_by: technologyData.userId })
    }

    // 尝试添加企业关联字段（如果数据库支持的话）
    try {
      if (companyData.company_id) {
        Object.assign(insertData, {
          company_id: companyData.company_id,
          company_name_zh: companyData.company_name_zh,
          company_name_en: companyData.company_name_en,
          company_logo_url: companyData.company_logo_url,
          company_country_id: companyData.company_country_id,
          company_province_id: companyData.company_province_id,
          company_development_zone_id: companyData.company_development_zone_id
        })
      }
    } catch (error) {
      console.log('企业字段暂不可用:', error)
    }
    
    // 过滤掉undefined和null值
    const filteredData = Object.fromEntries(
      Object.entries(insertData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    )
    
    console.log('用户技术插入数据:', filteredData)
    
    const { data, error } = await db
      .from('admin_technologies')
      .insert(filteredData)
      .select()
      .single()

    if (error) {
      console.error('用户创建技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 通知管理员有新技术需要审核
    try {
      await notifyAdminNewTechnology(data)
    } catch (notificationError) {
      console.error('发送管理员通知失败:', notificationError)
      // 不影响主要流程，只记录错误
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('用户技术API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 通知管理员有新技术需要审核的辅助函数
async function notifyAdminNewTechnology(technology: any) {
  const { supabaseAdmin } = await import('@/lib/supabase')
  
  if (!supabaseAdmin) {
    console.error('Supabase管理员客户端未配置')
    return
  }

  // 查找所有管理员（这里可以根据需要调整管理员查找逻辑）
  const { data: admins, error: adminError } = await supabaseAdmin
    .from('auth.users')
    .select('id')
    .limit(10) // 暂时获取前10个用户作为管理员

  if (adminError || !admins || admins.length === 0) {
    console.warn('没有找到管理员用户')
    return
  }

  // 为每个管理员创建通知消息
  const notifications = admins.map(admin => ({
    from_user_id: technology.created_by,
    to_user_id: admin.id,
    title: '新技术提交审核',
    content: `用户提交了新技术"${technology.name_zh}"，请及时审核。`,
    category: '发布审核',
    is_read: false,
    created_at: new Date().toISOString()
  }))

  // 批量插入通知消息
  const { error } = await supabaseAdmin
    .from('internal_messages')
    .insert(notifications)

  if (error) {
    throw error
  }
}
