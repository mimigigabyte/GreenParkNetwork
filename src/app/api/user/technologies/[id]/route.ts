import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PUT - 用户更新技术
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase管理员客户端未配置' },
        { status: 500 }
      )
    }

    const { id } = params
    const technologyData = await request.json()
    
    // 首先检查技术是否存在且是否属于该用户
    const { data: existingTech, error: checkError } = await supabaseAdmin
      .from('admin_technologies')
      .select('id, created_by')
      .eq('id', id)
      .single()
    
    if (checkError || !existingTech) {
      return NextResponse.json({ error: '技术不存在' }, { status: 404 })
    }
    
    // 检查权限：只有创建者才能更新
    if (technologyData.userId && existingTech.created_by !== technologyData.userId) {
      return NextResponse.json({ error: '无权限更新此技术' }, { status: 403 })
    }
    
    // 准备更新数据
    const updateData = {
      name_zh: technologyData.name_zh,
      name_en: technologyData.name_en,
      description_zh: technologyData.description_zh,
      description_en: technologyData.description_en,
      image_url: technologyData.image_url,
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
      
      // 企业关联字段
      company_id: technologyData.company_id,
      company_name_zh: technologyData.company_name_zh,
      company_name_en: technologyData.company_name_en,
      company_logo_url: technologyData.company_logo_url,
      company_country_id: technologyData.company_country_id,
      company_province_id: technologyData.company_province_id,
      company_development_zone_id: technologyData.company_development_zone_id,
      
      // 审核状态更新支持
      review_status: technologyData.review_status,
      
      updated_at: new Date().toISOString()
    }
    
    // 过滤掉undefined和null值
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    )
    
    const { data, error } = await supabaseAdmin
      .from('admin_technologies')
      .update(filteredData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('更新用户技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('用户技术更新API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 用户删除技术
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase管理员客户端未配置' },
        { status: 500 }
      )
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // 首先检查技术是否存在且是否属于该用户
    const { data: existingTech, error: checkError } = await supabaseAdmin
      .from('admin_technologies')
      .select('id, created_by')
      .eq('id', id)
      .single()
    
    if (checkError || !existingTech) {
      return NextResponse.json({ error: '技术不存在' }, { status: 404 })
    }
    
    // 检查权限：只有创建者才能删除
    if (userId && existingTech.created_by !== userId) {
      return NextResponse.json({ error: '无权限删除此技术' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('admin_technologies')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除用户技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('用户技术删除API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}