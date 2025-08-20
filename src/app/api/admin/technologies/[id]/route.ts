import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用service role key创建Supabase客户端
const supabaseUrl = 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// PUT - 更新技术
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const technologyData = await request.json()

    console.log('更新技术数据:', technologyData)
    
    // 准备要更新的数据，只包含数据库表中存在的字段
    const updateData = {
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
      company_development_zone_id: technologyData.company_development_zone_id
    }
    
    // 过滤掉undefined值，但保留null（用于清空字段）
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    )
    
    console.log('准备更新的数据:', filteredData)

    const { data, error } = await supabase
      .from('admin_technologies')
      .update(filteredData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('更新技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 删除技术
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { error } = await supabase.from('admin_technologies').delete().eq('id', id)

    if (error) {
      console.error('删除技术失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Technology deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 