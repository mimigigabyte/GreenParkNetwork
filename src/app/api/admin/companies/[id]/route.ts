import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥来绕过RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// PUT - 更新企业
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 检查企业名称是否与其他企业冲突
    const { data: existingCompany } = await supabase
      .from('admin_companies')
      .select('id')
      .eq('name_zh', name_zh)
      .neq('id', params.id)
      .single()

    if (existingCompany) {
      return NextResponse.json({ error: '企业名称已存在，请使用其他名称' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('admin_companies')
      .update({
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
        is_active: is_active ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        country:admin_countries(id, name_zh, name_en, code),
        province:admin_provinces(id, name_zh, name_en, code),
        development_zone:admin_development_zones(id, name_zh, name_en, code)
      `)
      .single()

    if (error) {
      console.error('更新企业失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: '企业不存在' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 删除企业
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 先检查企业是否存在
    const { data: company, error: fetchError } = await supabase
      .from('admin_companies')
      .select('name_zh')
      .eq('id', params.id)
      .single()

    if (fetchError || !company) {
      return NextResponse.json({ error: '企业不存在' }, { status: 404 })
    }

    // 检查是否有关联的技术或其他数据
    // TODO: 根据实际业务需求添加关联检查

    const { error } = await supabase
      .from('admin_companies')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('删除企业失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: '企业删除成功' })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}