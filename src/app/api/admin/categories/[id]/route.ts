import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥来绕过RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpeanozckghazlzzhrni.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZWFub3pja2doYXpsenpocm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4NTg1MCwiZXhwIjoyMDY5ODYxODUwfQ.wE2j1kNbMKkQgZSkzLR7z6WFft6v90VfWkSd5SBi2P8'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// PUT - 更新分类
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { name_zh, name_en, slug, sort_order, is_active } = await request.json()

    // 基本验证
    if (!name_zh || !name_en || !slug) {
      return NextResponse.json({ error: '分类名称和标识符不能为空' }, { status: 400 })
    }

    // 检查slug是否唯一（排除当前记录）
    const { data: existingCategory } = await supabase
      .from('admin_categories')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single()

    if (existingCategory) {
      return NextResponse.json({ error: '标识符已存在，请使用其他标识符' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('admin_categories')
      .update({
        name_zh,
        name_en,
        slug,
        sort_order: sort_order || 0,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('更新分类失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: '分类不存在' }, { status: 404 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 删除分类
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 首先检查是否有子分类
    const { data: subcategories } = await supabase
      .from('admin_subcategories')
      .select('id')
      .eq('category_id', id)

    if (subcategories && subcategories.length > 0) {
      return NextResponse.json({ 
        error: '该分类下还有子分类，请先删除所有子分类' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('admin_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除分类失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}